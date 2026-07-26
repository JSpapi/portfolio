/**
 * Pull the first Markdown image out of a post body so the page can render it as
 * a cover image (right below the summary) instead of showing it full-width and
 * out of place inline. The matched line is removed from the returned body so the
 * image isn't rendered twice.
 *
 * Only plain Markdown images (`![alt](url)`) are treated as covers — a `<video>`
 * or an HTML `<img>` is left inline. If there's no leading image, `coverUrl` is
 * null and the body is returned unchanged.
 */
export interface CoverExtract {
  coverUrl: string | null;
  coverAlt: string;
  body: string;
}

// ![alt](url) — url may contain query strings but not spaces/parens.
const MD_IMAGE = /!\[([^\]]*)\]\((\S+?)\)/;

export function extractCover(body: string): CoverExtract {
  if (!body) return { coverUrl: null, coverAlt: "", body: body ?? "" };
  const m = MD_IMAGE.exec(body);
  if (!m) return { coverUrl: null, coverAlt: "", body };

  const [match, alt, url] = m;
  // Remove the matched image; if it sat alone on a line, drop the blank line too.
  let next = body.replace(match, "");
  next = next.replace(/^[ \t]*\n/, ""); // trim a leading blank line if one is left
  next = next.replace(/\n[ \t]*\n[ \t]*\n+/g, "\n\n"); // collapse 3+ blank lines
  return { coverUrl: url, coverAlt: alt ?? "", body: next.trimStart() };
}
