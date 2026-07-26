import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware Link, useRouter, usePathname, redirect — use these instead of
// the next/link / next/navigation equivalents inside localized (public) pages
// so URLs keep the correct locale prefix automatically.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
