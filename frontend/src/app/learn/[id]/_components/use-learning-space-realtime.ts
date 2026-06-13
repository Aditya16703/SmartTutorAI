"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

interface RealtimeUpdate {
  summary_notes?: unknown;
  recommendations?: unknown;
  audio_script?: string;
  quiz?: unknown;
  flashcards?: unknown;
}

export function useLearningSpaceRealtime(learningSpaceId: string) {
  const [lastUpdate, setLastUpdate] = useState<RealtimeUpdate | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "error"
  >("connecting");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Track reconnect attempt count for exponential back-off UI feedback
  const reconnectCount = useRef(0);
  // Ref to current channel so reconnect() can unsubscribe & resubscribe
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);
  // Ref to the "connecting" timeout — cleared if we connect in time
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Maximum silent auto-retry attempts before surfacing error to user
  const MAX_AUTO_RETRIES = 3;
  const autoRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const subscribe = useCallback(() => {
    const client = createClient();
    const channelName = `ls-updates:${learningSpaceId}`;

    console.log(
      `🔌 [Realtime] Subscribing to channel: ${channelName} (attempt ${reconnectCount.current + 1})`
    );
    setConnectionStatus("connecting");
    setErrorDetails(null);

    // Mark as error if we haven't connected within 15 seconds (slightly more lenient for cold starts)
    connectTimeoutRef.current = setTimeout(() => {
      if (channelRef.current && connectionStatus === "connecting") {
        console.warn(
          `[Realtime] ⏱️ Connection timeout for ${channelName}. Current Status: ${channelRef.current.state}`
        );
        // Only surface to the user after exhausting auto-retries
        if (reconnectCount.current >= MAX_AUTO_RETRIES) {
          setConnectionStatus("error");
          setErrorDetails(
            "Connection timed out. If this persists, please ensure Database Replication is enabled in Supabase for the 'learning_space' table."
          );
        } else {
          // Silent auto-retry with exponential back-off
          const delay = Math.min(2000 * 2 ** reconnectCount.current, 10000);
          console.warn(`[Realtime] Auto-retrying in ${delay}ms...`);
          autoRetryTimerRef.current = setTimeout(() => {
            reconnectCount.current += 1;
            if (channelRef.current) {
              channelRef.current.unsubscribe();
              channelRef.current = null;
            }
            subscribe();
          }, delay);
        }
      }
    }, 15_000);

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
          console.log("⚡ [Realtime] Payload received:", payload);
          setLastUpdate(payload.new as RealtimeUpdate);
        }
      )
      .subscribe((status, err) => {
        console.log(`📡 [Realtime] Status for ${channelName}:`, status);

        if (status === "SUBSCRIBED") {
          // Clear the connection timeout — we're live
          if (connectTimeoutRef.current) {
            clearTimeout(connectTimeoutRef.current);
            connectTimeoutRef.current = null;
          }
          setConnectionStatus("connected");
          setErrorDetails(null);
          reconnectCount.current = 0; // reset back-off counter on success
        } else if (status === "CHANNEL_ERROR") {
          if (connectTimeoutRef.current) {
            clearTimeout(connectTimeoutRef.current);
            connectTimeoutRef.current = null;
          }

          const errorMessage = err?.message || err?.toString?.() || "Unknown subscription error";
          console.warn(`⚠️ [Realtime] Channel error on ${channelName}:`, errorMessage);

          // Auto-retry silently if we haven't exceeded max attempts
          if (reconnectCount.current < MAX_AUTO_RETRIES) {
            const delay = Math.min(2000 * 2 ** reconnectCount.current, 10000);
            console.warn(`[Realtime] Auto-retrying in ${delay}ms (attempt ${reconnectCount.current + 1}/${MAX_AUTO_RETRIES})...`);
            autoRetryTimerRef.current = setTimeout(() => {
              reconnectCount.current += 1;
              if (channelRef.current) {
                channelRef.current.unsubscribe();
                channelRef.current = null;
              }
              subscribe();
            }, delay);
            return;
          }

          setConnectionStatus("error");
          if (errorMessage.includes("permissions") || errorMessage.includes("policy")) {
             setErrorDetails("Realtime Error: Access Denied. Please ensure RLS policies allow SELECT for the 'anon' role.");
          } else {
             setErrorDetails(`Subscription Error: ${errorMessage}`);
          }
        } else if (status === "TIMED_OUT") {
          if (connectTimeoutRef.current) {
            clearTimeout(connectTimeoutRef.current);
            connectTimeoutRef.current = null;
          }
          setConnectionStatus("error");
          setErrorDetails("Connection timed out — click Reconnect to try again.");
        } else if (status === "CLOSED") {
          // Channel closed unexpectedly (network drop, tab backgrounded, etc.)
          // This is common and usually transient — don't alarm the user
          console.warn(`⚠️ [Realtime] Channel ${channelName} closed.`);
          if (reconnectCount.current < MAX_AUTO_RETRIES) {
            const delay = Math.min(2000 * 2 ** reconnectCount.current, 10000);
            autoRetryTimerRef.current = setTimeout(() => {
              reconnectCount.current += 1;
              if (channelRef.current) {
                channelRef.current.unsubscribe();
                channelRef.current = null;
              }
              subscribe();
            }, delay);
          } else {
            setConnectionStatus("error");
            setErrorDetails("Connection closed — click Reconnect to try again.");
          }
        }
      });

    channelRef.current = channel;
    return channel;
  }, [learningSpaceId]);

  // Exposed reconnect helper — resets back-off, tears down old channel & resubscribes
  const reconnect = useCallback(() => {
    reconnectCount.current = 0; // reset so auto-retries start fresh
    console.log(
      `🔄 [Realtime] Manual reconnect triggered`
    );
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    if (autoRetryTimerRef.current) {
      clearTimeout(autoRetryTimerRef.current);
      autoRetryTimerRef.current = null;
    }
    subscribe();
  }, [subscribe]);

  useEffect(() => {
    const channel = subscribe();

    return () => {
      console.log(
        `🔌 [Realtime] Unsubscribing from channel: ls-updates:${learningSpaceId}`
      );
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
      }
      if (autoRetryTimerRef.current) {
        clearTimeout(autoRetryTimerRef.current);
      }
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [learningSpaceId, subscribe]);

  return { lastUpdate, connectionStatus, errorDetails, reconnect };
}
