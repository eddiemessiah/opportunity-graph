// Nebius Token Factory, OpenAI-compatible API.
// Base URL and model IDs verified against docs.tokenfactory.nebius.com and the
// public model catalog (tokenfactory.nebius.com/model-catalog.md) on 2026-10-29.
export const NEBIUS_BASE_URL = process.env.NEBIUS_BASE_URL || "https://api.tokenfactory.nebius.com/v1";
export const MODEL_FAST = process.env.NEMOTRON_FAST_MODEL || "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B";
export const MODEL_REASON = process.env.NEMOTRON_REASON_MODEL || "nvidia/Nemotron-3-Ultra-550b-a55b";
export const MODEL_REASON_FALLBACK = "nvidia/nemotron-3-super-120b-a12b";

export const hasNebius = () => Boolean(process.env.NEBIUS_API_KEY);

function parseJson<T>(text: string): T {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/```(?:json)?/g, "");
  const start = cleaned.search(/[\[{]/);
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

export async function chatJson<T>(model: string, system: string, user: string, maxTokens = 2000): Promise<T> {
  const call = async (m: string) => {
    const res = await fetch(`${NEBIUS_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.NEBIUS_API_KEY}` },
      body: JSON.stringify({
        model: m,
        temperature: 0.2,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system + "\nRespond with a single JSON value only. No prose." },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Nebius ${m} ${res.status}`);
    const data = await res.json();
    return parseJson<T>(data.choices?.[0]?.message?.content ?? "");
  };
  try {
    return await call(model);
  } catch (e) {
    if (model === MODEL_REASON) return call(MODEL_REASON_FALLBACK);
    throw e;
  }
}
