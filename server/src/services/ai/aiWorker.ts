import { createClient } from "@supabase/supabase-js";
import SegmentationService from "./segmentationService.js";

export type AiJobRow = {
  id: string;
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  aoi: any;
  params: any;
  result?: any | null;
  error?: string | null;
  created_at: string;
};

export function startAiWorker(): () => void {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    // No Supabase configured; disable worker
    return () => {};
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const svc = new SegmentationService();
  let timer: NodeJS.Timeout | null = null;
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const { data: jobs } = await supabase
        .from("ai_jobs")
        .select("*")
        .eq("status", "queued")
        .order("created_at", { ascending: true })
        .limit(2);

      for (const job of (jobs as AiJobRow[] | null) || []) {
        try {
          await supabase.from("ai_jobs").update({ status: "running" }).eq("id", job.id);

          const aoi = job.aoi as { north: number; south: number; east: number; west: number; zoom?: number };
          const params = job.params || {};
          const result = await svc.segmentAsphalt({ aoi, model: params.model });

          await supabase
            .from("ai_jobs")
            .update({ status: "succeeded", result })
            .eq("id", job.id);
        } catch (err: any) {
          await supabase
            .from("ai_jobs")
            .update({ status: "failed", error: String(err?.message || err) })
            .eq("id", job.id);
        }
      }
    } finally {
      running = false;
    }
  };

  timer = setInterval(tick, 3000);
  return () => { if (timer) clearInterval(timer); };
}

