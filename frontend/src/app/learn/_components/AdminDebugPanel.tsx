"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Activity, ShieldAlert, Zap, Clock, ShieldCheck } from "lucide-react";

export default function AdminDebugPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Check for ?debug=true in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get("debug") === "true") {
      setIsVisible(true);
      fetchLogs();
      const interval = setInterval(fetchLogs, 5000); // Poll every 5s
      return () => clearInterval(interval);
    }
  }, []);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("ai_provider_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setLogs(data);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-96 bg-card/95 backdrop-blur-md border-2 border-primary/20 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
      <div className="bg-primary/10 p-4 border-b border-primary/10 flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <Activity className="w-3 h-3" />
            Provider Health Telemetry
        </h3>
        <span className="text-[10px] font-bold text-muted-foreground animate-pulse">Live</span>
      </div>

      <div className="p-4 max-h-[400px] overflow-y-auto space-y-3">
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground font-medium">No recent telemetry logs found.</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="p-3 bg-muted/50 rounded-xl border border-border flex items-start justify-between gap-3 group hover:border-primary/30 transition-colors">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${log.success ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-red-500 shadow-[0_0_5px_#ef4444]'}`} />
                  <span className="text-[10px] font-black uppercase tracking-tighter text-foreground truncate">{log.provider}</span>
                  <span className="text-[10px] font-bold text-muted-foreground">/</span>
                  <span className="text-[10px] font-medium text-muted-foreground truncate">{log.task}</span>
                </div>
                {log.error_message && (
                  <p className="text-[9px] text-red-500 font-medium leading-tight mb-2 line-clamp-2">
                    {log.error_message}
                  </p>
                )}
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {log.latency.toFixed(2)}s
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                {log.success ? (
                   <ShieldCheck className="w-4 h-4 text-emerald-500/50" />
                ) : (
                   <ShieldAlert className="w-4 h-4 text-red-500/50" />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 bg-muted/30 text-[9px] font-bold text-muted-foreground border-t border-border flex justify-between">
          <span>AI Orchestrator v2.4</span>
          <button onClick={() => setIsVisible(false)} className="hover:text-primary transition-colors">Dismiss</button>
      </div>
    </div>
  );
}
