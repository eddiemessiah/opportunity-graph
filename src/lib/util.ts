import type { Assessment } from "./types";
export function urgencyOf(deadline: string | null): Assessment["urgency"] {
  if (!deadline) return "unknown";
  const d = (new Date(deadline).getTime() - Date.now()) / 86400000;
  if (isNaN(d)) return "unknown";
  if (d < 0) return "overdue";
  if (d <= 7) return "this-week";
  if (d <= 31) return "this-month";
  return "later";
}
export function normKey(title: string, org: string) {
  return (title + "|" + org).toLowerCase().replace(/[^a-z0-9|]/g, "");
}
export function uid() { return Math.random().toString(36).slice(2, 10); }
export function splitInputs(raw: string): string[] {
  const blocks = raw.split(/\n\s*(?:-{3,}|={3,})\s*\n|\n{3,}/).map(s => s.trim()).filter(Boolean);
  const out: string[] = [];
  for (const b of blocks) {
    const lines = b.split(/\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length > 1 && lines.every(l => /^https?:\/\/\S+$/.test(l))) out.push(...lines);
    else out.push(b);
  }
  return out.slice(0, 50);
}
