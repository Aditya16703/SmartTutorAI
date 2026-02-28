"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function BackToLearnButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      className="mb-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      onClick={() => {
        router.replace("/learn");
      }}
    >
      <svg
        className="w-4 h-4 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M15 19l-7-7 7-7"
        />
      </svg>
      Back to Learning Spaces
    </Button>
  );
}
