import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RequestForm } from "@/components/access/request-form";

export const metadata: Metadata = {
  title: "Profile",
  description:
    "My detailed profile — full CV, in-depth project stories, availability, and references. Private; request access and I'll approve it personally.",
};

export default async function RequestAccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("requestAccess");
  return (
    <div className="wrap max-w-xl pt-14 sm:pt-20">
      <p className="kicker">{t("kicker")}</p>
      <h1 className="mt-4 font-serif text-4xl leading-[1.08] tracking-tightest text-foreground sm:text-5xl sm:leading-[1.05]">
        {t("title")}
      </h1>
      <p className="mt-5 text-base leading-relaxed text-foreground-dim sm:text-lg">
        {t("intro1")}
      </p>
      <p className="mt-4 text-base leading-relaxed text-foreground-dim sm:text-lg">
        {t("intro2")}
      </p>

      <ul className="mt-6 space-y-2 font-mono text-sm text-foreground-faint">
        <li>
          <span className="text-accent">01</span> {t("step1")}
        </li>
        <li>
          <span className="text-accent">02</span> {t("step2")}
        </li>
        <li>
          <span className="text-accent">03</span> {t("step3")}
        </li>
      </ul>

      <div className="mt-10">
        <RequestForm />
      </div>
    </div>
  );
}
