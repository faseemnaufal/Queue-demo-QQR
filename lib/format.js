export function formatToken(n) {
  if (n === null || n === undefined) return "—";
  return "A-" + String(n).padStart(3, "0");
}
