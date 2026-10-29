"use client";
import { useProfile } from "@/lib/store";
import { DEFAULT_PROFILE } from "@/lib/profile";
import type { Profile } from "@/lib/types";

const LIST: (keyof Profile)[] = ["roles", "skills", "focus"];
export default function ProfilePage() {
  const [p, setP] = useProfile();
  const set = (k: keyof Profile, v: string) => setP({ ...p, [k]: LIST.includes(k) ? v.split("\n").filter(Boolean) : v });
  const field = (k: keyof Profile, label: string, rows = 1) => (
    <label className="block">
      <span className="font-mono text-xs uppercase tracking-[.18em] text-muted">{label}</span>
      <textarea rows={rows} value={Array.isArray(p[k]) ? (p[k] as string[]).join("\n") : (p[k] as string)} onChange={e => set(k, e.target.value)}
        className="mt-1 w-full rounded-lg border border-line bg-panel p-3 outline-none focus:border-accent" />
    </label>
  );
  return (
    <main className="mx-auto max-w-3xl px-5 pt-10 space-y-5">
      <h1 className="font-serif text-5xl">Your <em className="text-accent">profile</em></h1>
      <p className="text-muted">Every score is reasoned against this. It is saved in this browser only. Add only true facts; the model is told not to invent any.</p>
      {field("name", "Name")}{field("location", "Location")}{field("summary", "Summary", 3)}
      {field("roles", "Roles (one per line)", 4)}{field("skills", "Skills (one per line)", 5)}{field("focus", "Focus areas (one per line)", 5)}
      {field("values", "Values / framing", 2)}{field("avoid", "Avoid (deal-breakers)", 2)}
      <button onClick={() => confirm("Reset to the seeded profile?") && setP(DEFAULT_PROFILE)} className="text-sm text-muted hover:text-white">Reset to seed</button>
    </main>
  );
}
