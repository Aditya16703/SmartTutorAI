"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, Play, Pause, RefreshCw } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { generateAudioAction } from "../../actions/learning-space";
import GenerationTimer from "./generation-timer";
import { toast } from "sonner";

export default function AudioOverview({
  learningSpaceId,
  userId,
  audio_overview,
  language = "English",
}: {
  learningSpaceId: string;
  userId: string;
  audio_overview: string | null;
  language?: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const hasAudio = !!audio_overview;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !hasAudio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [hasAudio]);

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAudio = async () => {
    try {
      setIsGenerating(true);
      const res = await generateAudioAction(learningSpaceId, userId, language);
      if (res.error) {
        toast.error("Audio Generation Failed", {
          description: res.error,
        });
        setIsGenerating(false);
      } else if (res.success) {
        toast.success("Audio generated successfully!");
        // Reload the page to show the new audio
        window.location.reload();
      }
    } catch (err) {
      toast.error("Audio generation failed", {
        description: "An unexpected error occurred. Please try again.",
      });
      setIsGenerating(false);
    }
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio || !hasAudio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration || !hasAudio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-900 shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
              <Volume2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-900 dark:text-orange-100">Audio Overview</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasAudio ? (
          <>
            {/* Hidden Audio Element */}
            <audio ref={audioRef} src={audio_overview || undefined} preload="metadata" />

            {/* Audio Player Section */}
            <div className="bg-white dark:bg-orange-950/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-4">
                <Button
                  onClick={togglePlayback}
                  disabled={isLoading}
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-full w-12 h-12 p-0 border-0 shadow-md"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </Button>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-orange-200">
                      Learning Overview Audio
                    </span>
                    <span className="text-xs text-gray-500 dark:text-orange-300/70">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div
                    className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 cursor-pointer"
                    onClick={handleProgressClick}
                  >
                    <div
                      className="bg-gradient-to-r from-orange-500 to-amber-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width:
                          duration > 0
                            ? `${(currentTime / duration) * 100}%`
                            : "0%",
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Audio Info */}
            <div className="bg-white dark:bg-orange-950/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
              <p className="text-sm text-gray-600 dark:text-orange-200/80">
                🎯 AI-generated audio summary covering key concepts, important
                points, and learning objectives from your materials.
              </p>
            </div>

            {/* Regenerate Button */}
            <Button
              onClick={handleGenerateAudio}
              disabled={isGenerating}
              variant="outline"
              className="w-full border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Regenerating Audio...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate Audio
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            {/* No Audio State */}
            <div className="text-center py-8 bg-white dark:bg-orange-950/10 rounded-lg border border-dashed border-orange-200 dark:border-orange-800">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <Volume2 className="w-8 h-8 text-orange-500 dark:text-orange-400" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-orange-100 mb-2">
                No Audio Overview Yet
              </h3>

              <p className="text-gray-600 dark:text-orange-200/80 mb-6 max-w-sm mx-auto">
                Generate an AI-powered audio summary of your learning materials
                to listen on the go.
              </p>

              <Button
                onClick={handleGenerateAudio}
                disabled={isGenerating}
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg border-0"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating Audio...
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 mr-2" />
                    Generate Audio Overview
                  </>
                )}
              </Button>
              {isGenerating && <GenerationTimer />}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
