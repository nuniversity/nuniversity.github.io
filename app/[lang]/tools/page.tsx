// content/tools/llm-prompt-builder/page.tsx
import PromptBuilder from "./PromptBuilder"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "LLM Prompt Builder | NUniversity Tools",
  description: "Generate professional, structured prompts for any Large Language Model (LLM).",
}

export default function LLMPromptBuilderPage() {
  return (
    <main className="min-h-screen py-20 px-4 bg-gradient-to-b from-base-200 to-base-300">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-extrabold mb-3 text-gradient">
          🧠 LLM Prompt Builder
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Design crystal-clear prompts that help AI understand your goals and deliver precise, high-quality results.
        </p>
      </section>
      <PromptBuilder />
    </main>
  )
}
