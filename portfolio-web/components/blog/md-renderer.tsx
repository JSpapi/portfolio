"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const components: Components = {
  // Plain <img> (not next/image) so arbitrary R2 hosts work without config;
  // ISR pages still ship them lazily.
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={typeof src === "string" ? src : ""}
      alt={alt ?? ""}
      loading="lazy"
      className="my-8 w-full rounded-lg border border-border"
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
