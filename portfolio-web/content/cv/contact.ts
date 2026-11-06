// Same in every language. No imports here: the PDF script loads this file too.

export const cvContact = {
  name: "Axrorjon Kurbanov",
  headline: "React · Next.js · TypeScript · Node.js · Vue · Nuxt · PHP",
  email: "axror.kurban@gmail.com",
  linkedin: "https://www.linkedin.com/in/axror-kurbanov-react-ts/",
  github: "https://github.com/JSpapi",
  site: "https://jspapi.dev",
  // Walkthrough of the Gross insurance platform.
  videoUrl: "https://youtu.be/pY3EaMI0u-Q",
};

export const CV_LANGS = ["en", "ru", "uz"] as const;

export const CV_LANG_NAMES: Record<string, string> = {
  en: "English",
  ru: "Русский",
  uz: "O'zbekcha",
};

/** Public path of the resume PDF (built by scripts/resume-pdf.mjs). */
export function resumePdf(lang: string): string {
  return `/resume/Axrorjon-Kurbanov-Resume-${lang.toUpperCase()}.pdf`;
}
