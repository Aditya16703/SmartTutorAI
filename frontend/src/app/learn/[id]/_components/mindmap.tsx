/* eslint-disable */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import GenerationTimer from "./generation-timer";
import { generateMindmapAction } from "../../actions/learning-space";
import { toast } from "sonner";

export default function Mindmap({
  learningSpaceId,
  userId,
  initialMindmapUrl,
  language = "English",
}: {
  learningSpaceId: string;
  userId: string;
  initialMindmapUrl: string | null;
  language?: string;
}) {
  const [mindmapUrl, setMindmapUrl] = useState<string | null>(initialMindmapUrl);
  const [zoom, setZoom] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<'normal' | 'long' | 'retry'>('normal');
  const [timerKey, setTimerKey] = useState(0);

  useEffect(() => {
    setMindmapUrl(initialMindmapUrl);
  }, [initialMindmapUrl]);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setGenerationStatus('normal');
      setTimerKey(prev => prev + 1);
      const res = await generateMindmapAction(learningSpaceId, userId, language);
      if (res.error) {
        toast.error("Mind Map Generation Failed", { description: res.error });
        setIsGenerating(false);
      } else if (res.success) {
        toast.success("Mind map generated successfully!");
        window.location.reload();
      }
    } catch (err) {
      toast.error("Mind map generation failed", {
        description: "An unexpected error occurred. Please try again.",
      });
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (mindmapUrl) {
      window.open(mindmapUrl, "_blank");
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-900 shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <span className="text-gray-900 dark:text-purple-100">Concept Mind Map</span>
          </div>
          {mindmapUrl && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mindmapUrl ? (
          <>
            {/* Mindmap Image Display */}
            <Dialog>
              <DialogTrigger asChild>
                <div className="bg-white dark:bg-purple-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800 cursor-zoom-in relative group transition-all hover:border-purple-300 dark:hover:border-purple-700">
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 z-10">
                    <div className="bg-white/90 dark:bg-gray-900/90 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      <Maximize2 className="w-3 h-3" />
                      Click to expand
                    </div>
                  </div>
                  <img
                    src={mindmapUrl}
                    alt="Concept Mind Map"
                    className="w-full h-auto rounded-lg shadow-sm"
                    onError={(e) => {
                      console.error("Failed to load mindmap image:", mindmapUrl);
                    }}
                  />
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 bg-white dark:bg-gray-950 border-none overflow-hidden flex flex-col">
                <DialogHeader className="p-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 flex flex-row items-center justify-between">
                  <DialogTitle className="text-gray-900 dark:text-gray-100">Concept Mind Map</DialogTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                      className="h-8 w-8 p-0"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm w-12 text-center tabular-nums text-gray-700 dark:text-gray-300">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                      className="h-8 w-8 p-0"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-2" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      className="gap-2 h-8"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  </div>
                </DialogHeader>
                <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900/50 p-4 flex items-center justify-center">
                  <div
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: "center",
                      transition: "transform 0.2s ease-out"
                    }}
                    className="flex items-center justify-center min-w-full min-h-full"
                  >
                    <img
                      src={mindmapUrl}
                      alt="Concept Mind Map - Full Size"
                      className="max-w-none shadow-lg rounded bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Mindmap Info */}
            <div className="bg-white dark:bg-purple-950/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-gray-600 dark:text-purple-200">
                🧠 AI-generated visual mind map showing the relationships
                between key concepts and topics from your learning materials. Click the image to view full size.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Generate / Loading State */}
            <div className="bg-white dark:bg-purple-900/10 rounded-lg p-6 min-h-[200px] border border-dashed border-purple-200 dark:border-purple-800">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  {isGenerating ? (
                    <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
                  ) : (
                    <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-purple-100 mb-2">
                  {isGenerating ? "Generating Mind Map..." : "Concept Mind Map"}
                </h3>

                <p className="text-gray-600 dark:text-purple-300 mb-6 max-w-md mx-auto text-sm">
                  {isGenerating
                    ? "AI is creating a visual mind map showing the relationships between key concepts."
                    : "Generate an AI-powered visual mind map of your learning materials."}
                </p>

                {isGenerating ? (
                  <div className="flex flex-col items-center gap-4">
                    <GenerationTimer 
                      key={timerKey}
                      onStatusChange={(s: 'normal' | 'long' | 'retry') => setGenerationStatus(s)} 
                    />
                    {generationStatus === 'retry' && (
                      <Button 
                        onClick={handleGenerate}
                        variant="outline"
                        size="sm"
                        className="bg-white dark:bg-purple-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry Generation
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={handleGenerate}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg border-0"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Generate Mind Map
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}