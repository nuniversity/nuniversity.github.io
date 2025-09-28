import fs from "fs";
import path from "path";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { duotoneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";

// Directory for course markdown files
const COURSES_PATH = path.join(process.cwd(), "courses");

export async function generateStaticParams() {
  const files = fs.readdirSync(COURSES_PATH);
  return files.map((file) => ({
    slug: file.replace(/\.md$/, ""),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  return {
    title: `${params.slug.replace(/-/g, " ")} | NUniversity`,
    description: `Course: ${params.slug.replace(/-/g, " ")}`,
  };
}

async function getCourse(slug: string) {
  const fullPath = path.join(COURSES_PATH, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, "utf8");
}

export default async function CoursePage({
  params,
}: {
  params: { slug: string };
}) {
  const markdown = await getCourse(params.slug);
  if (!markdown) return notFound();

  return (
    <article className="prose prose-lg max-w-4xl mx-auto p-6 dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className || "");
            return match ? (
              <SyntaxHighlighter
                language={match[1]}
                PreTag="div"
                style={duotoneLight}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code className="bg-gray-200 px-1 py-0.5 rounded text-sm">
                {children}
              </code>
            );
          },
          img({ src, alt }) {
            return (
              <img
                src={src ?? ""}
                alt={alt ?? ""}
                className="rounded-lg shadow-md mx-auto my-4"
              />
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  );
}
