"use client";
import { useEffect, useState } from "react";
import type { Opportunity, Profile } from "./types";
import { DEFAULT_PROFILE } from "./profile";

function useLocal<T>(key: string, init: T) {
  const [v, setV] = useState<T>(init);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const s = localStorage.getItem(key); if (s) setV(JSON.parse(s)); } catch {}
    setReady(true);
  }, [key]);
  useEffect(() => { if (ready) localStorage.setItem(key, JSON.stringify(v)); }, [key, v, ready]);
  return [v, setV, ready] as const;
}
export const useBoard = () => useLocal<Opportunity[]>("og.board.v1", []);
export const useProfile = () => useLocal<Profile>("og.profile.v1", DEFAULT_PROFILE);
