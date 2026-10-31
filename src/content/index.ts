import { javascript } from "./javascript";
import { asyncLessons } from "./async";
import { react } from "./react";
import { nextjs } from "./nextjs";
import { network } from "./network";
import { security } from "./security";
import { data } from "./data";
import { engineering } from "./engineering";
import { architecture } from "./architecture";
import { patterns } from "./patterns";
import { advanced } from "./advanced";
import { javascriptCourse } from "./js-course";
import { jsPathSlugs } from "./javascript-path";
import type { TrackId } from "@/lib/types";

const catalog = [
  ...javascript,
  ...asyncLessons,
  ...react,
  ...nextjs,
  ...network,
  ...security,
  ...data,
  ...engineering,
  ...architecture,
  ...patterns,
  ...advanced,
  ...javascriptCourse,
];
// Make the language-first course the primary reading sequence; persisted progress uses stable slugs.
export const lessons = [
  ...jsPathSlugs.map((slug) => catalog.find((item) => item.slug === slug)!),
  ...catalog.filter((item) => !jsPathSlugs.includes(item.slug)),
];
export const getLesson = (slug: string) => lessons.find((lesson) => lesson.slug === slug);
export const getTrackLessons = (track: TrackId) =>
  lessons.filter((lesson) => lesson.track === track);
export const totalMinutes = lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
