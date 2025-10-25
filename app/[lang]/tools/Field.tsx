"use client"
import { motion } from "framer-motion"

interface FieldProps {
  label: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  textarea?: boolean
}

export default function Field({ label, placeholder, value, onChange, textarea }: FieldProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="form-control"
    >
      <label className="label font-medium text-gray-700">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="textarea textarea-bordered w-full h-24"
        />
      ) : (
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="input input-bordered w-full"
        />
      )}
    </motion.div>
  )
}
