import { en } from "./en";
import { ru } from "./ru";
import { uz } from "./uz";
import type { Cv } from "./types";

export { cvContact, CV_LANGS, CV_LANG_NAMES, resumePdf } from "./contact";
export type { Cv, CvJob } from "./types";

const cvs: Record<string, Cv> = { en, ru, uz };

export function getCv(locale: string): Cv {
  return cvs[locale] ?? en;
}
