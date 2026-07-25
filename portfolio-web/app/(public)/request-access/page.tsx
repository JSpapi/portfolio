import type { Metadata } from "next";
import { RequestForm } from "@/components/access/request-form";

export const metadata: Metadata = {
  title: "Request access",
  description:
    "Request access to the detailed private profile — full CV, project breakdowns, and references.",
};

export default function RequestAccessPage() {
  return (
    <div className="wrap max-w-xl pt-14 sm:pt-20">
      <p className="kicker">private profile</p>
      <h1 className="mt-4 font-serif text-4xl leading-[1.08] tracking-tightest text-paper sm:text-5xl sm:leading-[1.05]">
        Request access
      </h1>
      <p className="mt-5 text-base leading-relaxed text-paper-dim sm:text-lg">
        The private page has my full career history, in-depth project case
        studies, availability, and references. It&apos;s meant for recruiters
        and people I know. Tell me a little about you and I&apos;ll approve it
        by hand.
      </p>

      <ul className="mt-6 space-y-2 font-mono text-sm text-paper-faint">
        <li>
          <span className="text-amber">01</span> you submit this form
        </li>
        <li>
          <span className="text-amber">02</span> I get a notification and review
          it
        </li>
        <li>
          <span className="text-amber">03</span> on approval, you get a private
          link by email
        </li>
      </ul>

      <div className="mt-10">
        <RequestForm />
      </div>
    </div>
  );
}
