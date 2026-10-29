export type OppType = "fellowship" | "grant" | "hackathon" | "accelerator" | "other";

export interface Extracted {
  title: string;
  org: string;
  type: OppType;
  deadline: string | null; // ISO date
  amount: string | null;
  eligibility: string[];
  location: string;
  materials: string[];
  url: string | null;
}

export interface Source { title: string; url: string; snippet: string }

export interface AnswerPack {
  pitch: string;
  answers: { q: string; a: string[] }[];
  checklist: string[];
}

export interface Assessment {
  score: number;
  reasons: string[];
  risks: string[];
  effort: "low" | "medium" | "high";
  urgency: "overdue" | "this-week" | "this-month" | "later" | "unknown";
  pack: AnswerPack;
}

export interface Opportunity extends Extracted {
  id: string;
  sources: Source[];
  assessment: Assessment;
  mode: "live" | "demo";
  example?: boolean;
  createdAt: string;
  models: { extract: string; reason: string; research: string };
}

export interface Profile {
  name: string;
  location: string;
  summary: string;
  roles: string[];
  skills: string[];
  focus: string[];
  values: string;
  avoid: string;
}
