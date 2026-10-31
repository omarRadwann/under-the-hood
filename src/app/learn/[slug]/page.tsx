import { notFound } from "next/navigation";
import { LearningApp } from "@/components/learning-app";
import { getLesson, lessons } from "@/content";

export const dynamicParams = false;
export function generateStaticParams() {
  return lessons.map((l) => ({ slug: l.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = getLesson(slug);
  return {
    title: l ? `${l.title} — Under the Hood` : "Lesson not found",
    description: l?.description,
  };
}
export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getLesson(slug)) notFound();
  return <LearningApp view="lesson" slug={slug} />;
}
