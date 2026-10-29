"use client";
import { useEffect, useMemo, useState } from "react";
import { useBoard, useProfile } from "@/lib/store";
import { SAMPLE_INPUT } from "@/lib/demo";
import type { Opportunity, OppType } from "@/lib/types";

type Status = { nebius: boolean; tavily: boolean; fast: string; reason: string } | null;
const TYPES: ("all" | OppType)[] = ["all", "fellowship", "grant", "hackathon", "accelerator", "other"];
const URG: Record<string, string> = { overdue: "Overdue", "this-week": "This week", "this-month": "This month", later: "Later", unknown: "No date" };

function daysLeft(d: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}
function scoreColor(s: number) { return s >= 70 ? "text-accent" : s >= 45 ? "text-amber-300" : "text-rose-300"; }

export default function Board() {
  const [board, setBoard, ready] = useBoard();
  const [profile] = useProfile();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [type, setType] = useState<(typeof TYPES)[number]>("all");
  const [sort, setSort] = useState<"score" | "deadline">("score");
  const [minScore, setMinScore] = useState(0);
  const [within, setWithin] = useState<"any" | "7" | "31">("any");
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => { fetch("/api/status").then(r => r.json()).then(setStatus).catch(() => {}); }, []);
  const live = status?.nebius;

  async function run(text: string) {
    setBusy(true); setNote("");
    try {
      const r = await fetch("/api/triage", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text, profile, existing: board.map(b => ({ title: b.title, org: b.org })) }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      const added: Opportunity[] = []; let dup = 0, err = 0;
      for (const x of d.results) { if (x.opp) added.push(x.opp); else if (x.duplicate) dup++; else err++; }
      setBoard(b => [...added, ...b]);
      setNote(`${added.length} added, ${dup} duplicate${dup === 1 ? "" : "s"} skipped${err ? `, ${err} failed` : ""}.`);
      if (added[0]) setSel(added[0].id);
      setInput("");
    } catch (e) { setNote(`Error: ${(e as Error).message}`); }
    setBusy(false);
  }

  const rows = useMemo(() => board
    .filter(o => type === "all" || o.type === type)
    .filter(o => o.assessment.score >= minScore)
    .filter(o => { if (within === "any") return true; const d = daysLeft(o.deadline); return d !== null && d >= 0 && d <= +within; })
    .sort((a, b) => sort === "score" ? b.assessment.score - a.assessment.score
      : (a.deadline ? +new Date(a.deadline) : 9e15) - (b.deadline ? +new Date(b.deadline) : 9e15)),
    [board, type, sort, minScore, within]);
  const current = board.find(o => o.id === sel) ?? null;

  return (
    <main className="mx-auto max-w-7xl px-5 pt-10">
      <section className="grid lg:grid-cols-[1.1fr_1fr] gap-8 items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[.2em] text-muted">Personal AI · opportunity triage</p>
          <h1 className="font-serif text-5xl md:text-7xl leading-[.95] mt-3">Every open door,<br /><em className="text-accent">ranked for you.</em></h1>
          <p className="mt-5 text-muted max-w-xl">Paste the fellowships, grants and hackathons that land in your inbox. Nemotron extracts and dedupes them, Tavily checks the sources, and a reasoning model scores fit against your profile and drafts an answer pack.</p>
        </div>
        <div className={`rounded-xl border p-4 text-sm ${live ? "border-accent/40 bg-accent/5" : "border-amber-300/30 bg-amber-300/5"}`}>
          {status === null ? "Checking engine…" : live ? (
            <><b className="text-accent">Live mode.</b> Extraction: <code>{status.fast}</code> · Reasoning: <code>{status.reason}</code> · Research: {status.tavily ? "Tavily" : "off (no TAVILY_API_KEY)"}</>
          ) : (
            <><b className="text-amber-300">Demo mode.</b> No NEBIUS_API_KEY set, so rule-based stand-ins replace the model calls and Tavily research is off. Results are illustrative, not model output. Sample items are fictional examples.</>
          )}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-line bg-panel/80 p-4">
        <textarea value={input} onChange={e => setInput(e.target.value)} rows={5}
          placeholder={"Paste URLs (one per line), listing text, or an email export. Separate items with a line of ---"}
          className="w-full bg-transparent outline-none resize-y font-mono text-sm placeholder:text-muted/70" />
        <div className="flex flex-wrap gap-3 items-center mt-3">
          <button disabled={busy || !input.trim()} onClick={() => run(input)}
            className="rounded-full bg-accent text-ink font-medium px-5 py-2 disabled:opacity-40">{busy ? "Triaging…" : "Triage"}</button>
          <button disabled={busy} onClick={() => run(SAMPLE_INPUT)} className="rounded-full border border-line px-4 py-2 text-sm hover:border-accent">Load labelled examples</button>
          {board.length > 0 && <button onClick={() => { if (confirm("Clear the board?")) { setBoard([]); setSel(null); } }} className="text-sm text-muted hover:text-white">Clear board</button>}
          <span className="text-sm text-muted">{note}</span>
        </div>
      </section>

      <section className="mt-6 flex flex-wrap gap-2 items-center text-sm">
        {TYPES.map(t => (
          <button key={t} onClick={() => setType(t)} className={`rounded-full px-3 py-1 border capitalize ${type === t ? "border-accent text-accent" : "border-line text-muted"}`}>{t}</button>
        ))}
        <span className="mx-2 h-5 w-px bg-line" />
        <select value={within} onChange={e => setWithin(e.target.value as typeof within)} className="bg-panel border border-line rounded-full px-3 py-1">
          <option value="any">Any deadline</option><option value="7">Due in 7 days</option><option value="31">Due in 31 days</option>
        </select>
        <label className="flex items-center gap-2 text-muted">Min score <input type="range" min={0} max={90} step={10} value={minScore} onChange={e => setMinScore(+e.target.value)} className="accent-[#c6f432]" />{minScore}</label>
        <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} className="ml-auto bg-panel border border-line rounded-full px-3 py-1">
          <option value="score">Sort: fit score</option><option value="deadline">Sort: deadline</option>
        </select>
      </section>

      <section className="mt-4 grid lg:grid-cols-[1fr_1.15fr] gap-5">
        <div className="space-y-2">
          {ready && rows.length === 0 && <div className="rounded-xl border border-dashed border-line p-10 text-center text-muted">Board is empty. Paste something above, or load the labelled examples.</div>}
          {rows.map(o => {
            const d = daysLeft(o.deadline);
            return (
              <button key={o.id} onClick={() => setSel(o.id)}
                className={`w-full text-left rounded-xl border p-4 transition ${sel === o.id ? "border-accent bg-accent/5" : "border-line bg-panel/60 hover:border-muted"}`}>
                <div className="flex gap-4 items-start">
                  <div className={`font-serif text-4xl w-14 shrink-0 ${scoreColor(o.assessment.score)}`}>{o.assessment.score}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{o.title}</div>
                    <div className="text-sm text-muted truncate">{o.org}</div>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs font-mono">
                      <span className="rounded bg-white/5 px-2 py-0.5 capitalize">{o.type}</span>
                      <span className={`rounded px-2 py-0.5 ${o.assessment.urgency === "this-week" ? "bg-rose-400/15 text-rose-200" : "bg-white/5"}`}>{o.deadline ? `${o.deadline} · ${d! < 0 ? "closed" : `${d}d left`}` : URG.unknown}</span>
                      {o.example && <span className="rounded bg-amber-300/15 text-amber-200 px-2 py-0.5">Example</span>}
                      {o.mode === "demo" && <span className="rounded bg-white/5 text-muted px-2 py-0.5">demo scoring</span>}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="lg:sticky lg:top-20 self-start">
          {current ? <Detail o={current} onRemove={() => { setBoard(b => b.filter(x => x.id !== current.id)); setSel(null); }} /> :
            <div className="rounded-2xl border border-line p-8 text-muted">Select an opportunity to see the reasoning, sources and answer pack.</div>}
        </div>
      </section>
    </main>
  );
}

function Detail({ o, onRemove }: { o: Opportunity; onRemove: () => void }) {
  const a = o.assessment;
  const copy = () => navigator.clipboard.writeText([a.pack.pitch, "", ...a.pack.answers.flatMap(x => [x.q, ...x.a.map(s => `- ${s}`), ""]), "Checklist:", ...a.pack.checklist.map(c => `[ ] ${c}`)].join("\n"));
  return (
    <article className="rounded-2xl border border-line bg-panel p-6 lg:max-h-[calc(100vh-6rem)] lg:overflow-auto">
      <div className="flex justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">{o.type} · {o.location}</p>
          <h2 className="font-serif text-3xl mt-1 leading-tight">{o.title}</h2>
          <p className="text-muted">{o.org}{o.amount ? ` · ${o.amount}` : ""}</p>
        </div>
        <div className="text-right">
          <div className={`font-serif text-6xl ${scoreColor(a.score)}`}>{a.score}</div>
          <div className="text-xs text-muted">fit / 100</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-5 text-sm">
        <Stat k="Deadline" v={o.deadline ?? "Not found"} /><Stat k="Urgency" v={URG[a.urgency]} /><Stat k="Effort" v={a.effort} />
      </div>
      <H>Why it fits</H><ul className="list-disc pl-5 space-y-1 text-sm">{a.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
      {a.risks.length > 0 && <><H>Eligibility risks</H><ul className="list-disc pl-5 space-y-1 text-sm text-rose-200/90">{a.risks.map((r, i) => <li key={i}>{r}</li>)}</ul></>}
      {o.materials.length > 0 && <><H>Required materials</H><p className="text-sm">{o.materials.join(" · ")}</p></>}
      <div className="flex items-center justify-between mt-6"><H className="mt-0">Answer pack <span className="text-muted normal-case tracking-normal">(first draft, review before use)</span></H>
        <button onClick={copy} className="text-xs border border-line rounded-full px-3 py-1 hover:border-accent">Copy</button></div>
      <p className="font-serif text-xl italic leading-snug">{a.pack.pitch}</p>
      {a.pack.answers.map((x, i) => <div key={i} className="mt-3 text-sm"><div className="font-medium">{x.q}</div><ul className="list-disc pl-5 text-muted">{x.a.map((s, j) => <li key={j}>{s}</li>)}</ul></div>)}
      <H>Checklist</H><ul className="text-sm space-y-1">{a.pack.checklist.map((c, i) => <li key={i} className="flex gap-2"><input type="checkbox" className="accent-[#c6f432]" />{c}</li>)}</ul>
      <H>Sources</H>
      {o.sources.length ? <ul className="text-sm space-y-2">{o.sources.map((s, i) => <li key={i}><a href={s.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">{s.title}</a><div className="text-muted text-xs">{s.snippet}</div></li>)}</ul>
        : <p className="text-sm text-muted">No sources. Tavily research runs when TAVILY_API_KEY is set.</p>}
      <p className="mt-6 font-mono text-[11px] text-muted">extract: {o.models.extract} · reason: {o.models.reason} · research: {o.models.research}</p>
      <button onClick={onRemove} className="mt-3 text-xs text-muted hover:text-rose-300">Remove from board</button>
    </article>
  );
}
const Stat = ({ k, v }: { k: string; v: string }) => <div className="rounded-lg bg-white/5 p-3"><div className="text-xs text-muted">{k}</div><div className="capitalize">{v}</div></div>;
const H = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <h3 className={`font-mono text-xs uppercase tracking-[.18em] text-muted mt-6 mb-2 ${className}`}>{children}</h3>;
