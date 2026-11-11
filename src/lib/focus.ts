/** Moves keyboard and screen-reader focus to an element and scrolls it into view. */
export function focusById(id: string) {
  const element = document.getElementById(id);
  if (!element) return;
  element.focus({ preventScroll: true });
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView?.({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
}
