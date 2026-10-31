import * as Babel from "@babel/standalone";
import type { PluginObject, InputOptions } from "@babel/core";
import type { NodePath } from "@babel/traverse";
import type * as AST from "@babel/types";
import { MAX_SOURCE_LENGTH, type PlaygroundMode } from "./types";

/** Instrument user-visible boundaries without replacing native Promise/await semantics. */
export function compileExample(source: string, mode: PlaygroundMode): string {
  if (source.length > MAX_SOURCE_LENGTH)
    throw new Error(`Keep examples below ${MAX_SOURCE_LENGTH.toLocaleString()} characters.`);
  function instrumentation({ types: t }: { types: typeof Babel.packages.types }): PluginObject {
    const call = (method: string, args: AST.Expression[] = []) =>
      t.callExpression(t.memberExpression(t.identifier("__trace"), t.identifier(method)), args);
    const marker = (method: string, line: number) =>
      t.expressionStatement(call(method, [t.numericLiteral(line)]));
    function importModule(path: NodePath<AST.ImportDeclaration>) {
      if (mode !== "react" || path.node.source.value !== "react")
        throw path.buildCodeFrameError(
          "This sandbox supports imports from 'react' in React mode only. Use the provided globals in worker modes.",
        );
      if (path.node.importKind === "type") {
        path.remove();
        return;
      }
      const declarations = path.node.specifiers
        .filter((s) => !(t.isImportSpecifier(s) && s.importKind === "type"))
        .map((spec) => {
          const value = t.isImportSpecifier(spec)
            ? t.memberExpression(
                t.identifier("React"),
                t.isIdentifier(spec.imported)
                  ? t.identifier(spec.imported.name)
                  : t.stringLiteral(spec.imported.value),
                t.isStringLiteral(spec.imported),
              )
            : t.identifier("React");
          // React itself is supplied as a global; avoid const React = React.
          if (spec.local.name === "React" && !t.isImportSpecifier(spec)) return null;
          return t.variableDeclarator(t.identifier(spec.local.name), value);
        })
        .filter((node): node is AST.VariableDeclarator => node !== null);
      if (declarations.length) path.replaceWith(t.variableDeclaration("const", declarations));
      else path.remove();
    }
    return {
      visitor: {
        Identifier(path) {
          if (path.node.loc && /^__uth|^__trace$/.test(path.node.name))
            throw path.buildCodeFrameError(
              "Names beginning __uth and __trace are reserved by the instrumentation.",
            );
        },
        ImportDeclaration: importModule,
        ExportDefaultDeclaration(path) {
          if (mode !== "react")
            throw path.buildCodeFrameError(
              "Worker examples are scripts. Remove export; top-level await is supported.",
            );
          const node = path.node.declaration;
          if (t.isFunctionDeclaration(node) || t.isClassDeclaration(node)) {
            node.id ??= t.identifier("App");
            path.replaceWithMultiple([
              node,
              t.expressionStatement(
                t.assignmentExpression("=", t.identifier("__uthApp"), t.identifier(node.id.name)),
              ),
            ]);
          } else
            path.replaceWith(
              t.expressionStatement(
                t.assignmentExpression("=", t.identifier("__uthApp"), node as AST.Expression),
              ),
            );
        },
        ExportNamedDeclaration(path) {
          if (path.node.source)
            throw path.buildCodeFrameError("Re-exports are not supported in the sandbox.");
          if (path.node.declaration) path.replaceWith(path.node.declaration);
          else path.remove();
        },
        CallExpression(path) {
          if (t.isImport(path.node.callee))
            throw path.buildCodeFrameError("Dynamic imports are disabled in this offline sandbox.");
        },
        ImportExpression(path) {
          throw path.buildCodeFrameError("Dynamic imports are disabled in this offline sandbox.");
        },
        Function: {
          enter(path) {
            if (!path.node.loc || path.node.generator) return;
            path.setData("frame", path.scope.generateUidIdentifier("uthFrame"));
          },
          exit(path) {
            if (!path.node.loc || path.node.generator) return;
            const line = path.node.loc.start.line;
            let name = "callback@" + line;
            if ("id" in path.node && path.node.id) name = path.node.id.name;
            else if (
              path.parentPath.isVariableDeclarator() &&
              t.isIdentifier(path.parentPath.node.id)
            )
              name = path.parentPath.node.id.name;
            else if (
              (path.isObjectMethod() || path.isClassMethod()) &&
              t.isIdentifier(path.node.key)
            )
              name = path.node.key.name;
            const frame = path.getData("frame") as AST.Identifier;
            if (!frame) return;
            const body = t.isBlockStatement(path.node.body)
              ? path.node.body
              : t.blockStatement([t.returnStatement(path.node.body)]);
            const statements = body.body;
            body.body = [
              t.variableDeclaration("const", [
                t.variableDeclarator(
                  frame,
                  call("enter", [
                    t.stringLiteral(name),
                    t.numericLiteral(line),
                    t.booleanLiteral(mode === "react" && /^[A-Z]/.test(name)),
                  ]),
                ),
              ]),
              t.tryStatement(
                t.blockStatement(statements),
                null,
                t.blockStatement([t.expressionStatement(call("exit", [t.cloneNode(frame)]))]),
              ),
            ];
            path.node.body = body;
          },
        },
        AwaitExpression: {
          exit(path) {
            if (!path.node.loc) return;
            const parent = path.getFunctionParent();
            if (mode === "react" && !parent)
              throw path.buildCodeFrameError(
                "React sandbox entry is synchronous. Put await in an async event handler or effect helper; worker modes support top-level await.",
              );
            const frame = parent?.getData("frame") as AST.Identifier | undefined;
            const ref = () => (frame ? t.cloneNode(frame) : t.nullLiteral());
            const line = path.node.loc.start.line;
            const awaitNode = t.awaitExpression(
              call("beforeAwait", [path.node.argument, t.numericLiteral(line), ref()]),
            );
            path.replaceWith(call("afterAwait", [awaitNode, t.numericLiteral(line), ref()]));
            path.skip();
          },
        },
        Loop(path) {
          if (!path.node.loc) return;
          if (
            mode === "react" &&
            path.isForOfStatement() &&
            path.node.await &&
            !path.getFunctionParent()
          )
            throw path.buildCodeFrameError(
              "React sandbox entry is synchronous. Put for-await in an async function; worker modes support top-level await.",
            );
          const body = path.node.body;
          path.node.body = t.isBlockStatement(body) ? body : t.blockStatement([body]);
          path.node.body.body.unshift(marker("guard", path.node.loc.start.line));
        },
        Statement(path) {
          if (
            !path.node.loc ||
            !path.inList ||
            path.isFunctionDeclaration() ||
            path.isImportDeclaration() ||
            path.isExportDeclaration() ||
            path.isBlockStatement() ||
            path.isEmptyStatement()
          )
            return;
          if (!path.parentPath.isProgram() && !path.parentPath.isBlockStatement()) return;
          const frame = path.getFunctionParent()?.getData("frame") as AST.Identifier | undefined;
          path.insertBefore(
            t.expressionStatement(
              call("line", [
                t.numericLiteral(path.node.loc.start.line),
                frame ? t.cloneNode(frame) : t.nullLiteral(),
              ]),
            ),
          );
        },
      },
    };
  }
  const presetList: InputOptions["presets"] = ["typescript"];
  if (mode === "react") presetList.push(["react", { runtime: "classic" }]);
  const result = Babel.transform(source, {
    filename: mode === "react" ? "example.tsx" : "example.ts",
    sourceType: "module",
    parserOpts: { allowAwaitOutsideFunction: true },
    presets: presetList,
    plugins: [instrumentation],
    retainLines: true,
  });
  if (!result || typeof result.code !== "string")
    throw new Error("The compiler did not produce executable code.");
  return result.code;
}
