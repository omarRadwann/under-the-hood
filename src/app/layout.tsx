import type { Metadata } from "next";
import "./globals.css";
import "./playground.css";
import "./javascript.css";

export const metadata: Metadata = {
  title: "Under the Hood — The engineering behind the interface",
  description:
    "JavaScript from first principles to expert execution, plus React, Next.js, architecture, and systems. Explore 148 lessons, a 64-chapter JavaScript path, and editable code experiments.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
