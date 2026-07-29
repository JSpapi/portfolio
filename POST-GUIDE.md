# How to Write a Blog Post for Axror's Portfolio

> **Who this is for:** anyone writing a post for the blog on **jspapi.dev**, even
> with no access to the admin panel and no coding knowledge.
>
> **How to use it:** write your post following the structure and rules below,
> fill in the template in §7, and hand it back. It can then be pasted straight
> into the admin. Everything you need to know is in this one document.

---

## 1. What a post is made of

Every post has these parts. Provide **all of them**, and provide the text ones in
**3 languages** (see §6).

| Field | What it is | Rules |
|---|---|---|
| **Slug** | The post's web address (URL) | Lowercase English only, words joined by hyphens, e.g. `warehouse-automation`. No spaces, no punctuation, no dots, no capital letters. One per post; it never changes. |
| **Type** | The category label shown on the post | Pick **one**: `weekly`, `daily`, `deep-dive`, or `til` (see §2). |
| **Title** | The headline | One line. Do **not** put a `#` in front. Keep under ~70 characters. |
| **Summary** | 1–2 sentence teaser | Shown on the blog list and in link previews. Plain sentences, no formatting. |
| **Body** | The full article | Written in **Markdown** (see §3). This is the main content. |
| **Tags** | Topic labels | 3–6 short words, comma-separated. Technical terms, kept in English (e.g. `React, Node, maps`). Same for all languages — do **not** translate tags. |
| **Publish date** | *(optional)* | Leave blank = publishes today. Or give a past date if the post should be dated to when the work actually happened. |

---

## 2. Post types (pick one)

- **`deep-dive`** — a detailed story about a project or feature (most posts). Badge: "DEEP DIVE".
- **`weekly`** — a regular weekly work log. Badge: "WEEKLY".
- **`daily`** — a short daily note. Badge: "DAILY".
- **`til`** — "Today I Learned", a small tip or lesson. Badge: "TIL".

If unsure, use **`deep-dive`**.

---

## 3. How to write the Body (Markdown rules)

The body uses **Markdown** — a simple way to format text with plain symbols.
Here is everything that's supported:

```markdown
## A section heading

A normal paragraph. Make words **bold** with double asterisks, or *italic* with
single asterisks. Add a [link like this](https://example.com).

### A smaller sub-heading

- A bullet point
- Another bullet point

1. A numbered step
2. The next step

> A quote or a key takeaway, indented like this.

`inline code` for a short technical term.
```

**Rules for the body:**

1. **Break it into sections with `##` headings.** A good post has 3–5 sections.
   This is what makes it readable — never write one long wall of text.
2. **Start with a short intro paragraph** (no heading) that hooks the reader —
   2–3 sentences on the problem or what the post is about.
3. **Use `**bold**`** to emphasize the 3–4 most important phrases. Don't over-bold.
4. **Use bullet lists or numbered steps** when listing things — they read far
   better than long sentences.
5. **Keep paragraphs short** — 2–4 sentences each.
6. **Do NOT put the title inside the body** — the title is a separate field.
7. **Do NOT use `#` (single hash)** for headings in the body — start at `##`.

---

## 4. Images

- **You do not write image code.** Images are uploaded separately in the admin
  and inserted automatically.
- **In your draft, just mark where an image should go** with a note like:
  `[IMAGE: screenshot of the dashboard here]`
- The **first image** in a post automatically becomes the **cover image**, shown
  at the top just under the summary, at a moderate size. So the most important or
  representative image should be the first one.
- One image is enough for most posts. More is fine.
- If you have the actual image file, provide it alongside the text.

---

## 5. Tone & style (important — this is a portfolio blog)

The audience is **recruiters, hiring managers, and non-technical people**, plus
some engineers. So:

- **Write plainly. No jargon.** Explain things the way you'd explain them to a
  smart friend who doesn't code. (e.g. say "it works out the driving route", not
  "it calls the ORS routing API".)
- **Lead with the problem and the human impact**, not the technology.
- **It's fine to sound proud** — say what was clever or hard, but in plain words.
- **First person** ("I built…", "I wanted…").
- Keep the **whole post readable in 3–4 minutes**. Shorter is better than longer.

---

## 6. The three languages (required)

Every post must be provided in **three languages**:

1. **English (EN)** — write this first; it is the fallback.
2. **Russian (RU)**
3. **Uzbek (UZ)**

**Translate:** the **title**, the **summary**, and the **full body**.
**Do NOT translate:** the slug, the tags, or the type — those stay the same for
all three languages.

**Critical rule when translating the body:** keep the **exact same Markdown
structure** in every language — the same `##` headings (translate the heading
*text*, but keep the `##`), the same bullet/number lists, and the same
`**bold**` markers. If the structure isn't kept, the translated versions will
look plain and broken compared to the English one.

> If a translation isn't ready yet, you can hand back English only — the post
> will still work, and the missing languages simply show the English text until
> they're added later. But the goal is all three.

---

## 7. The template to fill in

Copy this, fill it out completely, and hand it back. This is the exact format
expected:

```
SLUG: your-post-slug-in-english
TYPE: deep-dive
TAGS: Tag1, Tag2, Tag3
PUBLISH DATE: (leave blank for today, or e.g. 2024-08-15)

=========== ENGLISH ===========
TITLE: <English title>
SUMMARY: <English summary, 1-2 sentences>
BODY:
<English body in Markdown - intro paragraph, then ## sections>

[IMAGE: describe where the main image goes]

=========== RUSSIAN ===========
TITLE: <Russian title>
SUMMARY: <Russian summary>
BODY:
<Russian body - SAME ## structure as English>

=========== UZBEK ===========
TITLE: <Uzbek title>
SUMMARY: <Uzbek summary>
BODY:
<Uzbek body - SAME ## structure as English>
```

---

## 8. A filled-in example (so the structure is clear)

```
SLUG: shared-link-load-tracking
TYPE: deep-dive
TAGS: React, Node, maps, notifications
PUBLISH DATE:

=========== ENGLISH ===========
TITLE: Warning dispatchers before a truck runs late

SUMMARY: A trucking dashboard feature that watches every load on the road, works
out whether it'll hit its deadline, and pings the office the moment one starts
running late - so a problem becomes a call you make, not one you receive.

BODY:
In trucking, a late delivery costs money and trust. The hard part: nobody knows
a load is going to be late until it already *is* - too late to fix it.

I built a feature that changes that. It watches every truck carrying a load and
warns the dispatch office *before* the delivery goes wrong.

## The problem, in plain terms

Every load has a promise: **deliver here, by this time.** But the office usually
finds out it was broken only when the customer calls to complain.

## How it works

Every few minutes, the system checks each active load:

1. **Where's the truck now?** It reads the live location.
2. **Where's it going, and by when?** From the load's paperwork.
3. **Will it make it?** It maps a realistic route and estimates arrival.

## Why I'm proud of it

The clever part was **reusing what we already had** - I extended the existing
system instead of building a new one.

[IMAGE: screenshot of the load-tracking dashboard]

=========== RUSSIAN ===========
TITLE: Предупреждение диспетчеров до того, как грузовик начнёт опаздывать
SUMMARY: <Russian summary...>
BODY:
<same structure: intro paragraph, then:
## Проблема простыми словами
## Как это работает   (with the 1-2-3 numbered steps)
## Почему я горжусь этим>

=========== UZBEK ===========
TITLE: Yuk mashinasi kechikishidan oldin dispetcherlarni ogohlantirish
SUMMARY: <Uzbek summary...>
BODY:
<same structure: intro paragraph, then:
## Muammo oddiy qilib aytganda
## Qanday ishlaydi   (with the 1-2-3 numbered steps)
## Nega bu bilan faxrlanaman>
```

---

## 9. Quick checklist before handing back

- [ ] Slug is lowercase-with-hyphens, English only
- [ ] One type chosen (`deep-dive` / `weekly` / `daily` / `til`)
- [ ] Title, summary, and body all provided in **EN, RU, and UZ**
- [ ] Body has an intro paragraph + `##` sections
- [ ] Same `##` structure kept across all three languages
- [ ] Written plainly, no jargon, ~3–4 minute read
- [ ] Tags chosen (English, not translated)
- [ ] Image location marked with `[IMAGE: ...]`

---

*That's everything. A post written to this guide can be published as-is.*
