/**
 * Single template interpolation helper shared by every tool.
 *
 * Replaces `{name}` placeholders with values from `vars`. Unknown placeholders
 * are left untouched so a partially-translated dictionary cannot erase text.
 * Unlike a per-call `new RegExp`, this is safe for keys containing regex
 * metacharacters and does not recompile a pattern on every replacement.
 */
export function interpolate(
  template: string,
  vars?: Record<string, string | number>
): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match
  )
}

/** Backwards-compatible alias used by the existing tool components. */
export const tpl = interpolate
