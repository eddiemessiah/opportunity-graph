import { NextResponse } from "next/server";
import { hasNebius, MODEL_FAST, MODEL_REASON, NEBIUS_BASE_URL } from "@/lib/nebius";
import { hasTavily } from "@/lib/tavily";
export const dynamic = "force-dynamic";
export function GET() {
  return NextResponse.json({ nebius: hasNebius(), tavily: hasTavily(), baseUrl: NEBIUS_BASE_URL, fast: MODEL_FAST, reason: MODEL_REASON });
}
