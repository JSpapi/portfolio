import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Layouts and pages render in parallel, so this one must set the locale
  // too. Without it the Footer reads it from headers(), which made every
  // public page dynamic and uncacheable.
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh]">{children}</main>
      <Footer />
      {/* Fixed bottom tab bar on phones; the padding reserves space for it. */}
      <div className="h-16 lg:hidden" aria-hidden="true" />
      <MobileNav />
    </>
  );
}
