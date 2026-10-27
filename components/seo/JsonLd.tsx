import type { JsonLdObject } from '@/lib/seo/json-ld'

interface JsonLdProps {
  data: JsonLdObject | JsonLdObject[]
}

/**
 * Renders a JSON-LD block.
 *
 * Content-derived strings are escaped before serialisation: `<` becomes
 * `\u003c`, which prevents a lesson title containing `</script>` from
 * breaking out of the tag. JSON-LD itself is inert — it is data, not code —
 * but the tag it lives in is not.
 */
export function serializeJsonLd(data: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // The value is JSON with `<` escaped, not HTML.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
