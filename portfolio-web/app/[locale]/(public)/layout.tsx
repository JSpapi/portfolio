import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
