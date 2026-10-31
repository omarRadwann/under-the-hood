"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CodeBlock({
  code,
  language = "typescript",
  title = "Example",
  activeLine,
}: {
  code: string;
  language?: string;
  title?: string;
  activeLine?: number;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="code-block">
      <div className="code-heading">
        <span>
          <span className="code-dot" />
          {title}
        </span>
        <div>
          <span className="mono muted">{language}</span>
          <button onClick={copy} className="icon-button" aria-label="Copy code">
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>
      <pre>
        <code>
          {code.split("\n").map((line, i) => (
            <span className={`code-line ${activeLine === i ? "highlight-line" : ""}`} key={i}>
              <span className="line-number" aria-hidden="true">
                {i + 1}
              </span>
              <span>{colorLine(line)}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

function colorLine(line: string) {
  if (line.trimStart().startsWith("//") || line.trimStart().startsWith("#"))
    return <span className="syntax-comment">{line}</span>;
  const parts = line.split(
    /('[^']*'|"[^"]*"|\b(?:const|let|function|return|async|await|export|import|from|if|throw|new|type|interface|class|for)\b|\b\d+\b)/g,
  );
  return parts.map((part, i) => (
    <span
      key={i}
      className={
        /^['"]/.test(part)
          ? "syntax-string"
          : /^(const|let|function|return|async|await|export|import|from|if|throw|new|type|interface|class|for)$/.test(
                part,
              )
            ? "syntax-keyword"
            : /^\d+$/.test(part)
              ? "syntax-number"
              : undefined
      }
    >
      {part}
    </span>
  ));
}
