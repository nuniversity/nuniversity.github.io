/**
 * Extracts `question` fenced blocks from lesson markdown.
 * Shared by the build-time index script and its tests.
 * Invalid fences are skipped here; the course-writer validator reports them.
 */
export function extractQuestionFences(markdown) {
  const results = []
  const re = /```question\r?\n([\s\S]*?)\r?\n```/g
  let match
  let index = 0
  while ((match = re.exec(markdown)) !== null) {
    index += 1
    try {
      const data = JSON.parse(match[1])
      if (
        data &&
        typeof data.question === 'string' &&
        Array.isArray(data.options) &&
        Number.isInteger(data.correct)
      ) {
        results.push({ index, data })
      }
    } catch {
      // skip unparseable fence; the lesson validator reports it separately
    }
  }
  return results
}
