"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

interface CreateSpaceButtonProps {
  initialLanguage?: string;
  onCreateSpace: (spaceData: {
    topic: string;
    pdfFile?: File;
    audioFile?: File;
    language: string;
  }) => void;
}

export default function CreateSpaceButton({
  initialLanguage = "English",
  onCreateSpace,
}: CreateSpaceButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [topicName, setTopicName] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [language, setLanguage] = useState(initialLanguage);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topicName.trim()) return;

    setIsLoading(true);
    try {
      await onCreateSpace({
        topic: topicName.trim(),
        pdfFile: pdfFile || undefined,
        audioFile: audioFile || undefined,
        language: language,
      });

      // Reset form and close dialog
      setTopicName("");
      setPdfFile(null);
      setAudioFile(null);
      setIsOpen(false);
    } catch (error) {
      console.error("Error creating space:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if it's a PDF file
      if (file.type !== "application/pdf") {
        alert("Please upload a PDF file");
        return;
      }

      // Check file size (10MB limit as mentioned in your UI)
      if (file.size > 10 * 1024 * 1024) {
        alert("PDF file size must be less than 10MB");
        return;
      }

      setPdfFile(file);
    }
  };

  const removePdfFile = () => setPdfFile(null);

  // Reset form when dialog closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when dialog closes
      setTopicName("");
      setPdfFile(null);
      setAudioFile(null);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Create New Learning Space
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Create Learning Space
            </DialogTitle>
            <DialogDescription>
              Start a new learning journey by creating a dedicated space for
              your topic.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="topic-name" className="text-sm font-medium">
                Topic Name *
              </Label>
              <Input
                id="topic-name"
                placeholder="e.g., Advanced Mathematics, Python Programming..."
                value={topicName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTopicName(e.target.value)
                }
                required
                className="w-full"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language" className="text-sm font-medium">
                Preferred Language
              </Label>
              <Select
                value={language}
                onValueChange={setLanguage}
                disabled={isLoading}
              >
                <SelectTrigger id="language" className="w-full bg-background/50">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    <SelectValue placeholder="Select Language" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Hindi">हिन्दी (Hindi)</SelectItem>
                  <SelectItem value="Tamil">தமிழ் (Tamil)</SelectItem>
                  <SelectItem value="Telugu">తెలుగు (Telugu)</SelectItem>
                  <SelectItem value="Marathi">मराठी (Marathi)</SelectItem>
                  <SelectItem value="Bengali">বাংলা (Bengali)</SelectItem>
                  <SelectItem value="Kannada">ಕನ್ನಡ (Kannada)</SelectItem>
                  <SelectItem value="Gujarati">ગુજરાતી (Gujarati)</SelectItem>
                  <SelectItem value="Malayalam">മലയാളം (Malayalam)</SelectItem>
                  <SelectItem value="Punjabi">ਪੰਜਾਬੀ (Punjabi)</SelectItem>
                  <SelectItem value="Odia">ଓଡ଼ିଆ (Odia)</SelectItem>
                  <SelectItem value="Assamese">অসমীয়া (Assamese)</SelectItem>
                  <SelectItem value="Urdu">اردو (Urdu)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground italic">
                AI content will be generated in this language.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Upload PDF (Optional)
              </Label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
                {pdfFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-5 h-5 text-red-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {pdfFile.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({(pdfFile.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removePdfFile}
                      className="text-red-500 hover:text-red-700"
                      title="Remove PDF"
                      aria-label="Remove PDF"
                      disabled={isLoading}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className={`cursor-pointer flex flex-col items-center space-y-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <svg
                      className="w-8 h-8 text-gray-400 dark:text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <div className="text-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Click to upload PDF file
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PDF files up to 10MB
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                      disabled={isLoading}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!topicName.trim() || isLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating...
                </>
              ) : (
                "Create Space"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}