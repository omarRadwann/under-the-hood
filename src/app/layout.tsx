import type { Metadata } from "next";
import { lessons } from "@/content";
import { jsPathSlugs } from "@/content/javascript-path";
import "./globals.css";
import "./playground.css";
import "./javascript.css";
import "./training.css";
import "./interview.css";

export const metadata: Metadata = {
  title: "Under the Hood — The engineering behind the interface",
  description: `JavaScript from first principles to expert execution, plus React, Next.js, architecture, and systems. Explore ${lessons.length} lessons, a ${jsPathSlugs.length}-chapter JavaScript path, editable experiments, and behavioral training.`,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
