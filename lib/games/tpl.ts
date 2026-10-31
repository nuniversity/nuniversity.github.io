/**
 * Minimal `{var}` template interpolation for localized strings.
 *
 * Game clients previously duplicated this helper under different names with
 * subtly different regexes; every client now imports this single version.
 */
export type TplVars = Record<string, string | number>

export function tpl(template: string, vars?: TplVars): string {
  if (!vars) return template
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    // Replace every placeholder occurrence; literal `{key}` braces that do not
    // correspond to a variable are left untouched.
    result = result.split(`{${key}}`).join(String(value))
  }
  return result
}
