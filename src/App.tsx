import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { OfflineQueueService } from "@/services/OfflineQueueService";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AnalyticsDashboard = lazy(() => import("@/components/Analytics/AnalyticsDashboard"));
const Billing = lazy(() => import("@/pages/Billing"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading component
const LoadingSpinner = () => (
  <div className="h-screen w-full flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center animate-pulse">
        <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 01.553-.894L9 4l6 3 5.447-2.724A1 1 0 0121 5.176v8.764a1 1 0 01-.553.894L15 17l-6-3z" />
        </svg>
      </div>
      <p className="text-sm text-muted-foreground">Loading Patrick County GIS Pro...</p>
    </div>
  </div>
);

if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, tracesSampleRate: 0.2 });
}

const App = () => {
  useEffect(() => {
    const stop = OfflineQueueService.init({
      ai_job_insert: async (payload) => {
        const { aoi, params, created_by } = payload as any;
        // try inserting again when online
        const { supabase } = await import('@/integrations/supabase/client');
        const { error } = await supabase.from('ai_jobs').insert({ aoi, params, created_by }).select('id').single();
        if (error) throw error;
      },
      export_log_insert: async (payload) => {
        const { export_type, options, status, error: err, user_id } = payload as any;
        const { supabase } = await import('@/integrations/supabase/client');
        const { error } = await supabase.from('export_logs').insert({ export_type, options, status, error: err, user_id }).select('id').single();
        if (error) throw error;
      },
      workspace_upsert: async (payload) => {
        const { name, payload: wsPayload, updated_at } = payload as any;
        const { supabase } = await import('@/integrations/supabase/client');
        const { error } = await supabase.from('workspaces').upsert({ name, payload: wsPayload, updated_at }).select('name').single();
        if (error) throw error;
      }
    });
    return stop;
  }, []);

  useEffect(() => {
    const { startAiWorker } = require('@/services/AiWorkerClient');
    const stop = startAiWorker();
    return stop;
  }, []);

  useEffect(() => {
    const { startExportWorker } = require('@/services/ExportWorkerClient');
    const stop = startExportWorker();
    return stop;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/analytics" element={<AnalyticsDashboard properties={[]} measurements={[]} />} />
                <Route path="/billing" element={<Billing />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
