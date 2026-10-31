"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="not-found">
      <span className="eyebrow accent">A LOCAL FAILURE</span>
      <h1>We could not render this view.</h1>
      <p>Your saved notes remain in browser storage. Try loading this view again.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
