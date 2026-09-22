"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const components: Components = {
  // Links to other sites open in a new tab, so the reader keeps this page.
  // rel is required with target="_blank" — without it the new tab can
  // rewrite this one. Relative, anchor and mailto links stay put.
  a: ({ href, children, node, ...props }) => {
    void node; // react-markdown passes the AST node; keep it out of the DOM
    const url = typeof href === "string" ? href : "";
    const external = /^https?:\/\//i.test(url);
    return (
      <a
        href={url}
        {...(external && { target: "_blank", rel: "noopener noreferrer" })}
        {...props}
      >
        {children}
      </a>
    );
  },

  // Plain <img> (not next/image) so arbitrary R2 hosts work without config;
  // ISR pages still ship them lazily.
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={typeof src === "string" ? src : ""}
      alt={alt ?? ""}
      loading="lazy"
      className="mx-auto my-8 max-h-[420px] w-full max-w-[640px] rounded-lg border border-border object-contain"
    />
  ),

  // Native video for mp4 — controls, metadata-only preload, never autoplay.
  video: (props) => (
    <video
      controls
      preload="metadata"
      className="my-8 max-h-[480px] w-full rounded-lg border border-border"
      {...(props as React.VideoHTMLAttributes<HTMLVideoElement>)}
    />
  ),

  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const isBlock = Boolean(match);
    if (!isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <SyntaxHighlighter
        language={match![1]}
        style={oneDark}
        customStyle={{
          margin: 0,
          background: "transparent",
          fontSize: "0.86rem",
        }}
        codeTagProps={{ style: { fontFamily: "var(--font-mono)" } }}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    );
  },
};

export function MDRenderer({ body }: { body: string }) {
  return (
    <div className="prose-editorial">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
