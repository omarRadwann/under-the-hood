import { notFound } from "next/navigation";
import { LearningApp } from "@/components/learning-app";

const sections = [
  "library",
  "javascript",
  "labs",
  "playground",
  "practice",
  "interview",
  "architecture",
  "saved",
  "progress",
  "glossary",
] as const;
type Section = (typeof sections)[number];
export const dynamicParams = false;
export function generateStaticParams() {
  return sections.map((section) => ({ section }));
}
export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section as Section)) notFound();
  return <LearningApp view={section as Section} />;
}
