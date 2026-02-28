"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface RealtimeUpdate {
  summary_notes?: any;
  recommendations?: any;
  audio_script?: string;
  quiz?: any;
  flashcards?: any;
}

export function useLearningSpaceRealtime(learningSpaceId: string) {
  const [lastUpdate, setLastUpdate] = useState<RealtimeUpdate | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    const client = createClient();
    const channelName = `ls-updates:${learningSpaceId}`;

    console.log(`🔌 Initializing Realtime channel: ${channelName}`);

    const channel = client
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "learning_space",
          filter: `id=eq.${learningSpaceId}`,
        },
        (payload) => {
          console.log("⚡ Realtime payload received:", payload);
          setLastUpdate(payload.new as RealtimeUpdate);
        }
      )
      .subscribe((status, err) => {
        console.log(`📡 Subscription status for ${channelName}:`, status);
        
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected");
          setErrorDetails(null);
        } else if (status === "CHANNEL_ERROR") {
          setConnectionStatus("error");
          setErrorDetails(err?.message || "Channel subscription failed. Check RLS and Replication settings.");
          console.error(`❌ Realtime error on ${channelName}:`, err);
        } else if (status === "TIMED_OUT") {
          setConnectionStatus("error");
          setErrorDetails("Connection timed out. Retrying...");
        }
      });

    return () => {
      console.log(`🔌 Unsubscribing from channel: ${channelName}`);
      channel.unsubscribe();
    };
  }, [learningSpaceId]);

  return { lastUpdate, connectionStatus, errorDetails };
}
