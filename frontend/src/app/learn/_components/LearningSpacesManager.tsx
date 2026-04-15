"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CreateSpaceButton from "./CreateSpaceButton";
import LearningSpacesList from "./LearningSpacesList";
import {
  createLearningSpaceAction,
  uploadSourceFileAction,
  updateLearningSpaceWithPdfAction,
  invokeAgentWorkflow,
  deleteLearningSpaceAction,
} from '../actions/learning-space';
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LearningSpace {
  id: string;
  topic: string;
  description?: string;
  created_at: string;
  user_id: string;
  language?: string;
}

interface LearningSpacesManagerProps {
  userId: string;
  initialSpaces: LearningSpace[];
  studentProfile?: { language?: string } | null;
}


export default function LearningSpacesManager({
  userId,
  initialSpaces,
  studentProfile,
}: LearningSpacesManagerProps) {

  const [spaces, setSpaces] = useState<LearningSpace[]>(initialSpaces);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleCreateSpace = async (spaceData: {
    topic: string;
    pdfFile?: File | null;
    audioFile?: File | null;
    language: string;
  }) => {
    try {
      console.log("🎯 Starting space creation process...", spaceData);

      // Step 1: First create the learning space to get an ID
      const spaceResponse = await createLearningSpaceAction(
        spaceData.topic,
        userId,
        null, // pdfSource - will be updated later if file exists
        null, // audioSource
        spaceData.language
      );

      if (spaceResponse.error || !spaceResponse.data) {
        throw new Error(spaceResponse.error || "Failed to create learning space");
      }

      const spaceId = spaceResponse.data.id;
      console.log("✅ Learning space created with ID:", spaceId);

      let pdfSource: string | null = null;

      // Step 2: If PDF file exists, upload it using the spaceId
      if (spaceData.pdfFile && spaceData.pdfFile.size > 0) {
        console.log("📄 Uploading PDF file...");
        const uploadResponse = await uploadSourceFileAction(
          spaceData.pdfFile,
          userId,
          spaceData.topic,
          spaceId
        );

        if (uploadResponse.error) {
          console.error("PDF upload failed, but space was created");
          // Continue without the PDF - space is already created
        } else {
          pdfSource = uploadResponse.publicUrl || null;
          console.log("✅ PDF uploaded successfully:", pdfSource);

          // Step 3: Update the learning space with the PDF source URL
          if (pdfSource) {
            const updateResponse = await updateLearningSpaceWithPdfAction(spaceId, pdfSource);
            if (updateResponse.error) {
              console.warn("⚠️ Could not update space with PDF URL");
            }
          }
        }
      }

      // Step 4: Update local state with the new space
      setSpaces((prev) => [spaceResponse.data, ...prev]);

      // Step 5: Invoke agent workflow
      console.log("🤖 Invoking agent workflow with language:", spaceData.language);
      const agentResponse = await invokeAgentWorkflow(spaceId, userId, spaceData.language);
      if (agentResponse.error) {
        console.error("Error invoking agent workflow:", agentResponse.error);
        // Continue anyway - the space was created successfully
      } else {
        console.log("✅ Agent workflow invoked successfully:", agentResponse.data);
      }

      // Step 6: Redirect to the newly created space
      console.log("🔄 Redirecting to space:", spaceId);
      window.location.href = `/learn/${spaceId}`;

    } catch (error) {
      console.error("❌ Error creating learning space:", error);
      // Show error to user
      alert(error instanceof Error ? error.message : "An unexpected error occurred");
    }
  };

  const handleSpaceClick = (spaceId: string) => {
    console.log("🔄 Clicked on existing space, navigating to:", spaceId);
    router.push(`/learn/${spaceId}`);
  };

  const handleDeleteSpace = async (spaceId: string) => {
    try {
      console.log("🗑️ Deleting learning space:", spaceId);
      const result = await deleteLearningSpaceAction(spaceId, userId);

      if (result.error) {
        alert("Failed to delete: " + result.error);
        return;
      }

      // Remove from local state
      setSpaces((prev) => prev.filter((s) => s.id !== spaceId));
      console.log("✅ Learning space deleted successfully");
    } catch (error) {
      console.error("❌ Error deleting learning space:", error);
      alert("An unexpected error occurred while deleting.");
    }
  };

  const filteredSpaces = spaces.filter(space => 
    space.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    space.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative overflow-hidden w-full">
       {/* Clean Background */}

      <div className="max-w-7xl mx-auto pb-12 px-4 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              My Learning Spaces
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your courses and track your AI-powered learning journey.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 w-full md:w-auto"
          >
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search topics..." 
                className="pl-9 bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/50 transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <CreateSpaceButton 
              onCreateSpace={handleCreateSpace}
              initialLanguage={studentProfile?.language || "English"}
            />

          </motion.div>
        </div>

        {/* Learning Spaces List */}
        <LearningSpacesList 
          spaces={filteredSpaces} 
          onSpaceClick={handleSpaceClick} 
          onDeleteSpace={handleDeleteSpace} 
        />
      </div>
    </div>
  );
}