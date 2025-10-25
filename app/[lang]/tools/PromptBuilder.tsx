"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import Field from "./Field"
import PromptPreview from "./PromptPreview"
import { PromptData } from "./types"

export default function PromptBuilder() {
  const [form, setForm] = useState<PromptData>({
    role: "",
    objective: "",
    outcomeType: "",
    targetAudience: "",
    context: "",
    tone: "",
    style: "",
    constraints: "",
    extraNotes: "",
  })

  const handleChange = (key: keyof PromptData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const prompt = useMemo(() => {
    return `
You are ${form.role || "[your role]"}.
Your main objective is: ${form.objective || "[describe objective]"}.
The desired outcome type is: ${form.outcomeType || "[type of response]"}.
Your target audience is: ${form.targetAudience || "[audience type]"}.
Context: ${form.context || "[context or background]"}.
Maintain a ${form.tone || "[tone]"} tone and ${form.style || "[style]"} writing style.
Constraints: ${form.constraints || "[limitations or format]"}.
Additional Notes: ${form.extraNotes || "[extra guidance]"}.
    `.trim()
  }, [form])

  const handleClear = () =>
    setForm({
      role: "",
      objective: "",
      outcomeType: "",
      targetAudience: "",
      context: "",
      tone: "",
      style: "",
      constraints: "",
      extraNotes: "",
    })

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card bg-base-100 shadow-xl w-full max-w-4xl mx-auto p-8 space-y-6"
    >
      <h2 className="text-2xl font-bold text-center mb-4 text-gradient">
        🧠 LLM Prompt Builder
      </h2>
      <p className="text-center text-gray-500 mb-8">
        Create powerful, structured prompts for ChatGPT, Claude, Gemini, and other AI assistants.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Agent Role" placeholder="Data Scientist, Teacher, Writer..." value={form.role} onChange={(v) => handleChange("role", v)} />
        <Field label="Objective" placeholder="Summarize a document, explain a topic..." value={form.objective} onChange={(v) => handleChange("objective", v)} />
        <Field label="Outcome Type" placeholder="Report, explanation, plan..." value={form.outcomeType} onChange={(v) => handleChange("outcomeType", v)} />
        <Field label="Target Audience" placeholder="Students, developers, beginners..." value={form.targetAudience} onChange={(v) => handleChange("targetAudience", v)} />
        <Field label="Tone" placeholder="Formal, friendly, persuasive..." value={form.tone} onChange={(v) => handleChange("tone", v)} />
        <Field label="Style" placeholder="Concise, detailed, narrative..." value={form.style} onChange={(v) => handleChange("style", v)} />
      </div>

      <Field textarea label="Context" placeholder="Add relevant background information..." value={form.context} onChange={(v) => handleChange("context", v)} />
      <Field textarea label="Constraints" placeholder="Word limits, avoid jargon, etc..." value={form.constraints} onChange={(v) => handleChange("constraints", v)} />
      <Field textarea label="Additional Notes" placeholder="Examples, special instructions..." value={form.extraNotes} onChange={(v) => handleChange("extraNotes", v)} />

      <div className="flex justify-center gap-4">
        <button className="btn btn-primary" onClick={() => navigator.clipboard.writeText(prompt)}>📋 Copy Prompt</button>
        <button className="btn btn-secondary" onClick={handleClear}>🧹 Clear</button>
      </div>

      <PromptPreview prompt={prompt} />
    </motion.div>
  )
}
