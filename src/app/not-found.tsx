import Link from "next/link";
export default function NotFound() {
  return (
    <main className="not-found">
      <span className="eyebrow accent">404 / OUTSIDE THE MAP</span>
      <h1>This layer does not exist.</h1>
      <p>Return to the curriculum to keep exploring.</p>
      <Link className="button primary" href="/library">
        Open the knowledge map →
      </Link>
    </main>
  );
}
