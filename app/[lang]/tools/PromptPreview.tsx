"use client"
import { motion } from "framer-motion"

export default function PromptPreview({ prompt }: { prompt: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-base-200 border border-base-300 rounded-xl p-6 mt-8"
    >
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        ✨ Generated Prompt
      </h3>
      <pre className="whitespace-pre-wrap bg-base-100 p-4 rounded-lg text-sm leading-relaxed text-left shadow-inner">
        {prompt}
      </pre>
    </motion.div>
  )
}
