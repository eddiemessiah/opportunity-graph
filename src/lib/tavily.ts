import type { Source } from "./types";
export const hasTavily = () => Boolean(process.env.TAVILY_API_KEY);

async function search(query: string, max = 4): Promise<Source[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.TAVILY_API_KEY}` },
    body: JSON.stringify({ query, max_results: max, search_depth: "basic" }),
  });
  if (!res.ok) throw new Error(`Tavily ${res.status}`);
  const data = await res.json();
  return (data.results ?? []).map((r: { title: string; url: string; content: string }) => ({
    title: r.title, url: r.url, snippet: (r.content || "").slice(0, 300),
  }));
}

export async function extractUrl(url: string): Promise<string> {
  const res = await fetch("https://api.tavily.com/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.TAVILY_API_KEY}` },
    body: JSON.stringify({ urls: [url] }),
  });
  if (!res.ok) return url;
  const data = await res.json();
  return (data.results?.[0]?.raw_content || url).slice(0, 12000);
}

// Three research angles: official page, past winners, legitimacy signals.
export async function research(title: string, org: string): Promise<Source[]> {
  const qs = [
    `${title} ${org} official application page deadline`,
    `${title} ${org} past winners recipients`,
    `${org} ${title} scam OR legit OR review`,
  ];
  const all = (await Promise.allSettled(qs.map(q => search(q, 3))))
    .flatMap(r => (r.status === "fulfilled" ? r.value : []));
  const seen = new Set<string>();
  return all.filter(s => (seen.has(s.url) ? false : (seen.add(s.url), true))).slice(0, 8);
}
