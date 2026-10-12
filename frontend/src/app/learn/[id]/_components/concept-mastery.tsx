"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Flame,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";

interface ConceptRecord {
  id?: string;
  concept_name: string;
  mastery_score: number;
  attempts_count: number;
  correct_count: number;
  status: "struggling" | "developing" | "mastered";
  misconceptions: string[];
  interval_days: number;
  next_review_at: string;
}

interface MasteryBreakdown {
  concepts: ConceptRecord[];
  overall_score: number;
  struggling_count: number;
  developing_count: number;
  mastered_count: number;
  needs_review_count: number;
}

interface ConceptMasteryProps {
  learningSpaceId: string;
  userId: string;
}

export default function ConceptMastery({
  learningSpaceId,
  userId,
}: ConceptMasteryProps) {
  const [data, setData] = useState<MasteryBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMastery = async () => {
    try {
      setIsLoading(true);
      const agentApi =
        process.env.NEXT_PUBLIC_AGENT_API || "http://localhost:8000";
      const res = await fetch(
        `${agentApi}/api/mastery/breakdown/${learningSpaceId}/${userId}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch concept mastery breakdown:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMastery();
  }, [learningSpaceId, userId]);

  const percentage = Math.round((data?.overall_score ?? 0.5) * 100);

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <span className="text-foreground text-base">
                Concept Mastery & Misconceptions
              </span>
              <p className="text-xs text-muted-foreground font-normal">
                Cognitive tracking & adaptive spaced repetition (SM-2)
              </p>
            </div>
          </CardTitle>

          <button
            onClick={fetchMastery}
            disabled={isLoading}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh mastery breakdown"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Readiness Overview Banner */}
        <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Workspace Mastery Score</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {percentage}%
              </span>
              <span className="text-xs text-muted-foreground">
                {percentage >= 80
                  ? "Exam Ready 🎉"
                  : percentage >= 50
                  ? "Developing Knowledge"
                  : "Needs Initial Review"}
              </span>
            </div>
          </div>

          {/* Mini Stats Badges */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex flex-col items-center px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
              <span className="font-bold">{data?.mastered_count ?? 0}</span>
              <span className="text-[10px]">Mastered</span>
            </div>
            <div className="flex flex-col items-center px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600">
              <span className="font-bold">{data?.developing_count ?? 0}</span>
              <span className="text-[10px]">Developing</span>
            </div>
            <div className="flex flex-col items-center px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600">
              <span className="font-bold">{data?.struggling_count ?? 0}</span>
              <span className="text-[10px]">Focus</span>
            </div>
          </div>
        </div>

        {/* Concept Cards List */}
        {isLoading && !data ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            Analyzing student knowledge telemetry...
          </div>
        ) : !data || data.concepts.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">
              No concept data recorded yet
            </p>
            <p className="text-[11px] text-muted-foreground">
              Take the Quiz or study Flashcards to map your strengths and
              diagnose misconceptions.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {data.concepts.map((concept, idx) => {
              const scorePct = Math.round(concept.mastery_score * 100);
              const isDue =
                new Date(concept.next_review_at) <= new Date();

              return (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-border bg-card/50 hover:bg-muted/30 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {concept.concept_name}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            concept.status === "mastered"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : concept.status === "struggling"
                              ? "bg-rose-500/10 text-rose-600"
                              : "bg-amber-500/10 text-amber-600"
                          }`}
                        >
                          {concept.status === "mastered"
                            ? "Mastered"
                            : concept.status === "struggling"
                            ? "Needs Attention"
                            : "Developing"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span>Score: {scorePct}%</span>
                        <span>•</span>
                        <span>
                          {concept.correct_count}/{concept.attempts_count} correct
                        </span>
                        {isDue && (
                          <>
                            <span>•</span>
                            <span className="text-amber-500 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Due for SRS review
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="w-16 text-right">
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            scorePct >= 80
                              ? "bg-emerald-500"
                              : scorePct >= 50
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${scorePct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Diagnosed Misconception Notice */}
                  {concept.misconceptions && concept.misconceptions.length > 0 && (
                    <div className="p-2 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Diagnosed Misconception: </span>
                        <span>{concept.misconceptions[concept.misconceptions.length - 1]}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
