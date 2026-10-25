import type { Cv } from "./types";

export const en: Cv = {
  role: "Full-stack developer",
  location: "Tashkent, Uzbekistan",
  summary: [
    "Full-stack developer with **4 years of professional frontend experience** and production experience across frontend, backend, databases, and integrations.",
    "My core stack is **React, Next.js, TypeScript, Node.js, Vue/Nuxt, and PHP**. I specialize in joining existing production applications, understanding complex business logic, debugging difficult issues, and delivering features end-to-end across frontend and backend.",
  ],
  domainsIntro: "I've worked on two very different production domains:",
  domains: [
    {
      name: "Insurance / fintech",
      text: "customer-facing insurance platforms, policy management, complex workflows, identity verification, APIs, Telegram bots and analytics — Vue/Nuxt, React, TypeScript, PHP/Yii2 and PostgreSQL.",
    },
    {
      name: "Fleet / telematics",
      text: "a multi-tenant ELD and fleet-compliance SaaS platform with live truck tracking, real-time telemetry, maps, event processing, reporting, document automation, third-party integrations, PostgreSQL/TimescaleDB and Kubernetes/GCP.",
    },
  ],
  summaryOutro:
    "I'm comfortable working on both **new features and existing codebases**, from UI and API development through database logic, integrations, testing, and deployment.",
  help: [
    "React / Next.js application development",
    "Vue / Nuxt application development and maintenance",
    "Node.js / Express API development",
    "PHP / Yii2 backend development",
    "Full-stack feature development",
    "Bug fixing and production debugging",
    "REST / RPC API integrations",
    "Authentication, JWT, 2FA and RBAC",
    "PostgreSQL and SQL development",
    "Multi-tenant applications",
    "Real-time dashboards and data",
    "Maps, GPS and geospatial applications",
    "Fleet / telematics systems",
    "Event-based systems and reporting",
    "PDF/document automation",
    "AI/OCR integrations",
    "Telegram bots and integrations",
    "Web analytics and conversion tracking",
    "Docker, Kubernetes and GCP deployment",
    "Testing and CI/CD",
  ],
  skills: [
    {
      group: "Frontend",
      items:
        "React · Next.js · TypeScript · Vue.js · Nuxt.js · Vite · Ant Design · Tailwind CSS · Emotion · MapLibre GL · Recharts",
    },
    {
      group: "Backend",
      items:
        "Node.js · Express · PHP · Yii2 · Go · PostgREST · REST APIs · RPC APIs · JWT · 2FA · RBAC",
    },
    {
      group: "Database & Data",
      items:
        "PostgreSQL · SQL · PL/pgSQL · TimescaleDB · Redis · Row-Level Security · dbmate",
    },
    {
      group: "Integrations",
      items:
        "REST · SOAP · mTLS · S/MIME · Webhooks · Authorize.Net · Gemini AI/OCR · MyID · Telegram Bot API · Yandex Metrica",
    },
    {
      group: "Cloud & DevOps",
      items: "Docker · Kubernetes · GKE · GCP · GitHub Actions · CI/CD",
    },
    {
      group: "Testing",
      items: "Cypress · Vitest · Playwright · Testing Library",
    },
    {
      group: "Architecture & Practices",
      items:
        "Multi-tenant architecture · Security & compliance · Audit logging · Event-driven services · Git · Agile",
    },
  ],
  jobs: [
    {
      title: "Full-Stack Developer",
      company: "Gross Insurance JSC",
      dates: "Jul 2026 – Present",
      place: "Tashkent",
      intro:
        "Building and maintaining customer-facing software for a large insurance/fintech company across frontend, backend, and third-party integrations.",
      work: [
        "Develop a customer insurance cabinet for policy management and business-critical workflows.",
        "Build complex multi-step forms and customer-facing workflows.",
        "Implement authentication and identity verification using **MyID**.",
        "Work across **Vue/Nuxt and React** frontends in **TypeScript**.",
        "Develop and integrate backend services using **PHP/Yii2** and **PostgreSQL**.",
        "Build **Telegram bots** and Telegram integrations in PHP.",
        "Set up **Yandex Metrica** analytics and conversion tracking.",
        "Build and consume REST APIs across multiple services.",
        "Debug and improve an existing production codebase.",
        "Deliver new features across frontend, backend, and integrations.",
        "Work with business rules and insurance-specific workflows.",
      ],
      stack:
        "Vue, Nuxt, React, TypeScript, PHP/Yii2, PostgreSQL, REST APIs, MyID, Telegram Bot API, Yandex Metrica",
    },
    {
      title: "Full-Stack Engineer",
      company: "Primex-Services LLC",
      dates: "Jun 2024 – Jul 2026",
      place: "Tashkent",
      intro:
        "Worked on a production **multi-tenant ELD / fleet-compliance SaaS platform** covering electronic logging, Hours-of-Service compliance, fleet management, live vehicle tracking, telemetry, reporting, regulatory integrations, and document automation.",
      work: [
        "Built and maintained a **55+ page React/TypeScript fleet dashboard**.",
        "Implemented **live truck tracking and real-time fleet visualization** with MapLibre GL.",
        "Worked with GPS and vehicle telemetry data, including event processing and reporting.",
        "Designed a multi-tenant PostgreSQL backend with **database-enforced tenant isolation using Row-Level Security**.",
        "Implemented RBAC across multiple roles and JWT/2FA authentication.",
        "Authored **250+ PostgreSQL stored procedures/RPCs and 25+ database views**.",
        "Worked with **TimescaleDB** for telemetry data.",
        "Built asynchronous document-generation pipelines using **Playwright and Redis job queues**.",
        "Implemented AI/OCR document extraction using Google Gemini.",
        "Integrated regulatory systems using **SOAP, mTLS and S/MIME**.",
        "Built event-driven services using PostgreSQL **LISTEN/NOTIFY**.",
        "Integrated GPS data from third-party services and implemented proximity/FCM notifications.",
        "Built reporting functionality including client-side PDF/Excel processing with Web Workers.",
        "Implemented payments and multiple third-party APIs.",
        "Designed immutable audit trails and data-integrity safeguards for regulated records.",
        "Handled timezone-sensitive logic for US states, GPS timestamps, driver logs and Hours-of-Service calculations.",
        "Deployed services using **Docker, Kubernetes/GKE and GCP**.",
        "Maintained CI/CD pipelines with GitHub Actions.",
        "Created automated API test suites with Cypress.",
      ],
      stack:
        "React, TypeScript, Vite, Next.js, Node.js, Express, PostgreSQL, PostgREST, TimescaleDB, Redis, MapLibre GL, Docker, Kubernetes, GCP, GitHub Actions",
    },
  ],
  projects: [
    {
      name: "Fleet & Telematics SaaS Platform",
      role: "Full-Stack Engineer · Primex-Services LLC",
      intro:
        "A production multi-tenant ELD and fleet-compliance platform for electronic logging, Hours-of-Service compliance, fleet management and real-time vehicle monitoring.",
      rows: [
        {
          label: "Frontend & Maps",
          text: "React + TypeScript dashboard · 55+ pages · Live truck tracking · MapLibre GL · Real-time vehicle data · Fleet monitoring · Event visualization · PDF/Excel reporting",
        },
        {
          label: "Backend & Data",
          text: "PostgreSQL + PostgREST · Row-Level Security for tenant isolation · Multi-tenant architecture · RBAC · JWT/2FA · 250+ stored procedures/RPCs · 25+ database views · TimescaleDB telemetry",
        },
        {
          label: "Services & Integrations",
          text: "Node.js / Express · Event-driven GPS ingestion · PostgreSQL LISTEN/NOTIFY · Redis job queues · Playwright PDF generation · Gemini AI/OCR · SOAP + mTLS · S/MIME · Firebase notifications · Third-party APIs · Payment integration",
        },
        {
          label: "Infrastructure",
          text: "Docker · Kubernetes / GKE · GCP · GitHub Actions CI/CD",
        },
      ],
      note: {
        label: "What makes this project relevant:",
        text: "This project required much more than building UI screens. I worked across the frontend, backend, database, real-time data, integrations, infrastructure, and business rules of a production fleet platform.",
      },
    },
    {
      name: "Insurance Customer Cabinet",
      role: "Full-Stack Developer · Gross Insurance JSC",
      intro:
        "A customer-facing insurance platform for managing policies and completing business-critical insurance workflows.",
      rows: [
        {
          label: "Frontend",
          text: "Vue / Nuxt · React · TypeScript · Complex multi-step forms · Customer-facing policy management",
        },
        {
          label: "Backend",
          text: "PHP / Yii2 · PostgreSQL · REST APIs · Existing production services",
        },
        {
          label: "Authentication & Integration",
          text: "MyID identity verification · Telegram bots · Yandex Metrica analytics · API integrations · Authentication workflows",
        },
        {
          label: "Engineering Work",
          text: "New feature development · Production debugging · Frontend/backend integration · Business-rule implementation · Working across an existing enterprise codebase",
        },
      ],
      stack:
        "Vue, Nuxt, React, TypeScript, PHP/Yii2, PostgreSQL, MyID, Telegram Bot API, Yandex Metrica",
    },
  ],
  extra: [
    {
      title: "IT Trainer / Teacher-Intern",
      company: "IT-Academy LLC",
      dates: "May 2023 – Oct 2023",
      place: "Tashkent",
      intro:
        "Delivered practical programming and IT instruction and mentored students through hands-on coursework.",
    },
  ],
  languages: [
    { name: "Uzbek", level: "Native" },
    { name: "Russian", level: "Fluent" },
    { name: "English", level: "Professional working proficiency" },
  ],
  labels: {
    kicker: "cv",
    metaTitle: "CV",
    metaDescription:
      "Akhrorjon Kurbanov — full-stack developer. Experience, projects, skills, and a downloadable resume.",
    portfolio: "Portfolio",
    video: "Project walkthrough",
    download: "Download resume (PDF)",
    alsoIn: "also in",
    profile: "Profile",
    help: "What I can help with",
    skills: "Core skills",
    experience: "Professional experience",
    keyWork: "Key work",
    stack: "Stack",
    projects: "Selected projects",
    additional: "Additional experience",
    languages: "Languages",
    contact: "Contact",
    contactBody: "The fastest way to reach me is email.",
  },
};
