/**
 * Focus mode hides every top-level `##` section except the opening hook
 * section and the Key Takeaways section. This is progressive disclosure
 * (segmenting + coherence): the learner sees the same lesson in a shorter,
 * self-paced form without a second copy of the content.
 */
export function collectFocusSections(root: HTMLElement): HTMLElement[][] {
  const headings = Array.from(root.querySelectorAll<HTMLElement>(':scope > h2'))
  const groups: HTMLElement[][] = []
  for (const heading of headings) {
    const group: HTMLElement[] = [heading]
    let node = heading.nextElementSibling
    while (node && !(node instanceof HTMLElement && node.tagName === 'H2')) {
      if (node instanceof HTMLElement) group.push(node)
      node = node.nextElementSibling
    }
    groups.push(group)
  }
  return groups
}

/** Applies or removes focus mode. Always safe to call repeatedly. */
export function applyFocusMode(root: HTMLElement, enabled: boolean): void {
  const groups = collectFocusSections(root)
  groups.forEach((group, index) => {
    const heading = group[0].textContent ?? ''
    const keep = index === 0 || /Key Takeaways/i.test(heading)
    for (const element of group) {
      if (enabled && !keep) {
        if (element.dataset.focusOriginalDisplay === undefined) {
          element.dataset.focusOriginalDisplay = element.style.display
        }
        element.style.display = 'none'
        element.dataset.focusHidden = 'true'
      } else {
        if (element.dataset.focusOriginalDisplay !== undefined) {
          element.style.display = element.dataset.focusOriginalDisplay
          delete element.dataset.focusOriginalDisplay
        }
        delete element.dataset.focusHidden
      }
    }
  })
}
