import { NextResponse } from "next/server";
import { triageOne } from "@/lib/pipeline";
import { splitInputs, normKey } from "@/lib/util";
import type { Profile } from "@/lib/types";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { input, profile, existing } = (await req.json()) as { input: string; profile: Profile; existing: { title: string; org: string }[] };
  if (!input?.trim()) return NextResponse.json({ error: "Nothing to triage" }, { status: 400 });
  const seen = new Set((existing ?? []).map(e => normKey(e.title, e.org)));
  const today = new Date().toISOString().slice(0, 10);
  const items = splitInputs(input);
  const results = [];
  for (let i = 0; i < items.length; i += 4) {
    const batch = await Promise.allSettled(items.slice(i, i + 4).map(t => triageOne(t, profile, seen, today)));
    for (const r of batch) {
      if (r.status === "fulfilled") {
        const v = r.value;
        if (!v.duplicate && seen.has(v.key)) results.push({ duplicate: true, title: v.opp.title, key: v.key });
        else { seen.add(v.key); results.push(v); }
      }
      else results.push({ error: String(r.reason?.message ?? r.reason).replace(/Bearer\s+\S+/g, "") });
    }
  }
  return NextResponse.json({ results });
}
