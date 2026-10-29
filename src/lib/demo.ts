// Demo mode: runs with no API keys. Rule-based stand-ins for the model calls,
// clearly labelled in the UI. Sample inputs are FICTIONAL examples.
import type { Extracted, Assessment, Profile, OppType } from "./types";
import { urgencyOf } from "./util";

export const SAMPLE_INPUT = `EXAMPLE (fictional): Pan-African Climate Builders Fellowship 2026
Organizer: Example Climate Fund (fictional)
A 6-month fellowship for software builders in Africa working on climate and SDG tools. Open to residents of any African country. Remote.
Deadline: 2026-11-20. Stipend: example amount only.
Required: CV, 500-word essay, link to a shipped project, one reference letter.

---

EXAMPLE (fictional): Open Agents Hackathon
Organizer: Example Dev Collective (fictional)
Global online hackathon for AI agents built with open models. Teams of 1-4. Remote.
Deadline: 2026-11-03. Prizes: example amounts only.
Required: public repo, demo video under 3 minutes, README.

---

EXAMPLE (fictional): Northern Europe Deep Tech Grant
Organizer: Example Innovation Agency (fictional)
Grant for registered companies located in the Nordic region only. Must have 3 years of audited accounts.
Deadline: 2026-12-15. Funding: example amount only.
Required: company registration, financial statements, 20-page technical plan.`;

const TYPE_WORDS: [OppType, RegExp][] = [
  ["hackathon", /hackathon|buildathon/i],
  ["fellowship", /fellowship|fellow\b/i],
  ["grant", /grant|funding/i],
  ["accelerator", /accelerator|incubator/i],
];

export function heuristicExtract(text: string): Extracted {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const url = text.match(/https?:\/\/\S+/)?.[0] ?? null;
  const title = (lines.find(l => !/^https?:/.test(l)) || url || "Untitled opportunity").replace(/^EXAMPLE \(fictional\):\s*/i, "Example: ").slice(0, 120);
  const org = text.match(/(?:organi[sz]er|by|host)[:\s]+([^\n]+)/i)?.[1]?.trim() ?? (url ? new URL(url).hostname : "Unknown");
  const type = TYPE_WORDS.find(([, re]) => re.test(text))?.[0] ?? "other";
  const deadline = text.match(/(20\d\d-\d\d-\d\d)/)?.[1] ?? null;
  const amount = text.match(/(?:stipend|prize|prizes|funding|award)[:\s]+([^\n.]+)/i)?.[1]?.trim() ?? null;
  const materials = (text.match(/required[:\s]+([^\n]+)/i)?.[1] ?? "").split(/,\s*/).map(s => s.replace(/\.$/, "")).filter(Boolean);
  const location = /remote|online/i.test(text) ? "Remote" : text.match(/located in ([^\n.]+)/i)?.[1] ?? "Not stated";
  const eligibility = lines.filter(l => /open to|must|only|eligib|residents/i.test(l)).slice(0, 3);
  return { title, org, type, deadline, amount, eligibility, location, materials, url };
}

export function heuristicAssess(x: Extracted, p: Profile, raw: string): Assessment {
  const hay = (raw + " " + x.title).toLowerCase();
  let score = 40;
  const reasons: string[] = [];
  const risks: string[] = [];
  const hits = [...p.focus, ...p.skills].filter(k => hay.includes(k.toLowerCase().split(/[ /]/)[0]));
  if (hits.length) { score += Math.min(30, hits.length * 8); reasons.push(`Matches profile focus: ${hits.join(", ")}.`); }
  if (/africa|african|nigeria|global|any country|remote|online/i.test(raw)) { score += 15; reasons.push("Open to builders based in Nigeria / Africa or fully remote."); }
  if (/ai|agent|model/i.test(raw)) { score += 8; reasons.push("AI building is a core strength in the profile."); }
  if (/(?:located|residents|citizens|companies)[^.\n]*\bonly\b|registered compan|audited/i.test(raw)) { score -= 35; risks.push("Eligibility restriction likely excludes the profile (region or company requirements)."); }
  const urgency = urgencyOf(x.deadline);
  if (urgency === "overdue") { score -= 30; risks.push("Deadline has passed."); }
  if (!x.deadline) risks.push("No deadline found; confirm on the official page.");
  score = Math.max(0, Math.min(100, score));
  const effort = x.materials.length >= 4 ? "high" : x.materials.length >= 2 ? "medium" : "low";
  return {
    score, reasons, risks, effort, urgency,
    pack: {
      pitch: `${p.name} is ${p.summary.charAt(0).toLowerCase() + p.summary.slice(1)} Based in ${p.location}, he would bring ${p.skills.slice(0, 3).join(", ")} to ${x.title}, with a focus on ${p.focus.slice(0, 3).join(", ")}.`,
      answers: [
        { q: "Why are you a fit?", a: p.roles.slice(0, 3).map(r => `Currently: ${r}.`) },
        { q: "What will you build or do?", a: ["[Fill in: the specific project for this opportunity]", "Ship a public, open-source deliverable", `Frame it around ${p.focus[0] ?? "the core focus"}`] },
        { q: "How does this create impact?", a: ["[Fill in: who benefits and how you will measure it]", p.values] },
      ],
      checklist: [...x.materials.map(m => `Prepare: ${m}`), "Confirm eligibility on the official page", "Add deadline to calendar"],
    },
  };
}
