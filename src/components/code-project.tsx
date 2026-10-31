"use client";
import { useId, useRef, useState } from "react";
import { CodeBlock } from "./code-block";

export function CodeProject({
  files,
}: {
  files: { name: string; language: string; code: string }[];
}) {
  const [selected, setSelected] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const active = files[selected] ?? files[0];
  return (
    <div className="code-project">
      <div className="code-file-tabs" role="tablist" aria-label="Example files">
        {files.map((file, index) => (
          <button
            type="button"
            key={file.name}
            ref={(node) => {
              buttons.current[index] = node;
            }}
            role="tab"
            id={id + "-tab-" + index}
            aria-selected={index === selected}
            aria-controls={id + "-panel"}
            tabIndex={index === selected ? 0 : -1}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => {
              let next: number | undefined;
              if (event.key === "ArrowRight") next = (index + 1) % files.length;
              if (event.key === "ArrowLeft") next = (index + files.length - 1) % files.length;
              if (event.key === "Home") next = 0;
              if (event.key === "End") next = files.length - 1;
              if (next !== undefined) {
                event.preventDefault();
                setSelected(next);
                buttons.current[next]?.focus();
              }
            }}
          >
            {file.name}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={id + "-panel"}
        aria-labelledby={id + "-tab-" + selected}
        tabIndex={0}
      >
        <CodeBlock
          key={active.name}
          code={active.code}
          language={active.language}
          title={active.name}
        />
      </div>
      <p className="example-note">
        Separate files in one example project. Copy each named file; these are not declarations to
        paste into a single script.
      </p>
    </div>
  );
}
