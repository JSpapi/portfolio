// One CV per language. Feeds both the /cv page and the PDF script.
// Text may use **bold**.

export interface CvJob {
  title: string;
  company: string;
  dates: string;
  place: string;
  intro: string;
  work?: string[];
  stack?: string;
}

export interface CvProject {
  name: string;
  role: string;
  intro: string;
  rows: { label: string; text: string }[];
  note?: { label: string; text: string };
  stack?: string;
}

export interface Cv {
  role: string;
  location: string;
  summary: string[];
  domainsIntro: string;
  domains: { name: string; text: string }[];
  summaryOutro: string;
  help: string[];
  skills: { group: string; items: string }[];
  jobs: CvJob[];
  projects: CvProject[];
  extra: CvJob[];
  languages: { name: string; level: string }[];
  labels: {
    kicker: string;
    metaTitle: string;
    metaDescription: string;
    portfolio: string;
    video: string;
    download: string;
    alsoIn: string;
    profile: string;
    help: string;
    skills: string;
    experience: string;
    keyWork: string;
    stack: string;
    projects: string;
    additional: string;
    languages: string;
    contact: string;
    contactBody: string;
  };
}
