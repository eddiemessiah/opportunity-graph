import type { Extracted, Assessment, Opportunity, Profile, Source } from "./types";
import { chatJson, hasNebius, MODEL_FAST, MODEL_REASON } from "./nebius";
import { hasTavily, research, extractUrl } from "./tavily";
import { heuristicExtract, heuristicAssess } from "./demo";
import { normKey, uid, urgencyOf } from "./util";

const EXTRACT_SYS = `You extract opportunity listings (fellowships, grants, hackathons, accelerators).
Return JSON: {"title":str,"org":str,"type":"fellowship"|"grant"|"hackathon"|"accelerator"|"other","deadline":"YYYY-MM-DD"|null,"amount":str|null,"eligibility":[str],"location":str,"materials":[str],"url":str|null}.
Never invent values; use null or [] when the text does not say.`;

const ASSESS_SYS = `You are a careful, honest opportunity advisor. Judge fit between an applicant profile and an opportunity.
Use only facts in the profile, the listing and the sources. Flag uncertainty. Never invent achievements or numbers;
use [Fill in: ...] placeholders where the applicant must supply facts.
Return JSON: {"score":0-100,"reasons":[str],"risks":[str],"effort":"low"|"medium"|"high",
"pack":{"pitch":str,"answers":[{"q":str,"a":[str]}],"checklist":[str]}}`;

export async function triageOne(raw: string, profile: Profile, existing: Set<string>, today: string) {
  const live = hasNebius();
  let text = raw;
  if (/^https?:\/\/\S+$/.test(raw.trim()) && hasTavily()) text = `${raw}\n\n${await extractUrl(raw.trim())}`;

  // Step 1: Nemotron Nano extraction (fast model)
  const ex: Extracted = live
    ? { ...heuristicExtract(raw), ...(await chatJson<Extracted>(MODEL_FAST, EXTRACT_SYS, `Today is ${today}.\n\n${text.slice(0, 12000)}`, 800)) }
    : heuristicExtract(text);

  // Dedupe against the board
  const key = normKey(ex.title, ex.org);
  if (existing.has(key)) return { duplicate: true as const, title: ex.title, key };

  // Step 2: Tavily research
  let sources: Source[] = [];
  if (hasTavily()) { try { sources = await research(ex.title, ex.org); } catch { sources = []; } }
  if (ex.url && !sources.some(s => s.url === ex.url)) sources.unshift({ title: "Link from input", url: ex.url, snippet: "" });

  // Step 3: Nemotron Ultra fit reasoning + answer pack
  let assessment: Assessment;
  if (live) {
    const a = await chatJson<Omit<Assessment, "urgency">>(MODEL_REASON, ASSESS_SYS,
      `Today: ${today}\nPROFILE:\n${JSON.stringify(profile)}\n\nOPPORTUNITY:\n${JSON.stringify(ex)}\n\nSOURCES:\n${JSON.stringify(sources)}`, 3000);
    assessment = { ...a, score: Math.max(0, Math.min(100, Math.round(a.score))), urgency: urgencyOf(ex.deadline) };
  } else {
    assessment = heuristicAssess(ex, profile, text);
  }

  const opp: Opportunity = {
    ...ex, id: uid(), sources, assessment,
    mode: live ? "live" : "demo",
    example: /EXAMPLE \(fictional\)/i.test(raw),
    createdAt: new Date().toISOString(),
    models: {
      extract: live ? MODEL_FAST : "demo heuristic",
      reason: live ? MODEL_REASON : "demo heuristic",
      research: hasTavily() ? "tavily" : "none (demo)",
    },
  };
  return { duplicate: false as const, opp, key };
}
