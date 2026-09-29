"use client";

import { useEffect } from "react";

// Remembers the last site language for /private, which picks the resume by it.
// Set in the browser, not by the server, so public pages stay cacheable.
export function LocaleCookie({ locale }: { locale: string }) {
  useEffect(() => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; samesite=lax`;
  }, [locale]);
  return null;
}
