import { foundations } from "./foundations";
import { dataLanguage } from "./data";
import { objectModel } from "./objects";
import { runtimeLanguage } from "./runtime";
import { asyncCourse } from "./async";
export const javascriptCourse = [
  ...foundations,
  ...dataLanguage,
  ...objectModel,
  ...runtimeLanguage,
  ...asyncCourse,
];
