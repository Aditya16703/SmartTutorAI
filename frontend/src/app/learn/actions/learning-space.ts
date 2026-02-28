"use server";

import { createClient } from '@supabase/supabase-js';

// Service role client for database operations that need RLS bypass
const createServiceClient = () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  );
};

export async function createLearningSpaceAction(
  topic: string,
  userId: string,
  pdfSource?: string | null,
  audioSource?: string | null,
  language?: string
) {
  // Use service role client to bypass RLS
  const supabase = createServiceClient();

  console.log("🎯 Creating learning space with service role:", { topic, userId });

  const { data, error } = await supabase
    .from("learning_space")
    .insert({
      topic,
      user_id: userId,
      pdf_source: pdfSource || null,
      audio_source: audioSource || null,
      language: language || 'English',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating learning space:", error);
    return {
      error: "Failed to create learning space: " + error.message,
    };
  }

  console.log("✅ Learning space created with service role:", data.id);
  return { data, success: true };
}

export async function uploadSourceFileAction(
  file: File,
  userId: string,
  topic: string,
  spaceId: string
) {
  // Use service role client for storage operations too
  const supabase = createServiceClient();

  console.log("📤 Uploading file:", { fileName: file.name, spaceId });

  const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const assetName = `sources/${userId}/${spaceId}/${safeFileName}`;

  try {
    const { data, error } = await supabase.storage
      .from("learning-sources")
      .upload(assetName, file);

    if (error) {
      console.error("Error uploading source file:", error);
      return {
        error: "Failed to upload source file: " + error.message,
      };
    }

    const { data: publicUrlData } = supabase.storage
      .from("learning-sources")
      .getPublicUrl(assetName);

    console.log("✅ File uploaded, public URL:", publicUrlData.publicUrl);

    return {
      data,
      success: true,
      assetName: data.path,
      publicUrl: publicUrlData.publicUrl,
    };
  } catch (error) {
    console.error("Unexpected upload error:", error);
    return {
      error: "Unexpected error during file upload",
    };
  }
}

export async function updateLearningSpaceAction(
  spaceId: string,
  updates: Record<string, any>
) {
  // Use service role client for updates
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("learning_space")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", spaceId)
    .select()
    .single();

  if (error) {
    console.error("Error updating learning space:", error);
    return {
      error: "Failed to update learning space: " + error.message,
    };
  }

  return { data, success: true };
}

export async function updateLearningSpaceWithPdfAction(
  spaceId: string,
  pdfSource: string
) {
  return updateLearningSpaceAction(spaceId, { pdf_source: pdfSource });
}

export async function clearLearningSpaceContentAction(spaceId: string) {
  console.log("🧹 Clearing learning space content:", spaceId);
  return updateLearningSpaceAction(spaceId, {
    summary_notes: null,
    quiz: null,
    flashcards: null,
    recommendations: null,
    audio_script: null,
    audio_overview: null,
  });
}

export async function invokeAgentWorkflow(
  learningSpaceId: string,
  userId: string,
  language?: string
) {
  console.log("🤖 Invoking agent workflow:", { learningSpaceId, userId, language });

  try {
    if (!process.env.NEXT_PUBLIC_AGENT_API) {
      throw new Error("Agent API URL not configured");
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_AGENT_API}/api/workflows/invoke`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          learning_space_id: learningSpaceId,
          user_id: userId,
          language: language,
        }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error invoking agent workflow:", res.status, errorText);
      return {
        error: `Failed to invoke agent workflow: ${res.status} ${res.statusText}`,
      };
    }

    const data = await res.json();
    console.log("✅ Agent workflow invoked successfully");
    return {
      data,
      success: true,
    };
  } catch (error) {
    console.error("Network error invoking agent workflow:", error);
    return {
      error: "Network error while invoking agent workflow",
    };
  }
}

export async function generateAudioAction(
  learningSpaceId: string,
  userId: string,
  language?: string
) {
  console.log("🔊 Generating audio:", { learningSpaceId, userId });

  try {
    if (!process.env.NEXT_PUBLIC_AGENT_API) {
      throw new Error("Agent API URL not configured");
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_AGENT_API}/api/workflows/audio-summary`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          learning_space_id: learningSpaceId,
          user_id: userId,
          language: language,
        }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error generating audio:", res.status, errorText);
      return {
        error: `Failed to generate audio: ${res.status} ${res.statusText}`,
      };
    }

    const data = await res.json();

    if (data.success) {
      console.log("Audio generated successfully:", data);
      return {
        success: true,
        audio_url: data.audio_url,
      };
    }
    console.error("Error generating audio:", data.error || data.message);
    return {
      error: data.error || data.message || "Failed to generate audio",
    };
  } catch (error) {
    console.error("Network error generating audio:", error);
    return {
      error: "Network error while generating audio",
    };
  }
}

export async function deleteLearningSpaceAction(
  spaceId: string,
  userId: string
) {
  console.log("🗑️ Deleting learning space:", { spaceId, userId });

  try {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from("learning_space")
      .delete()
      .eq("id", spaceId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting learning space:", error);
      return {
        error: "Failed to delete learning space: " + error.message,
      };
    }

    // Also notify the backend API (best-effort)
    try {
      const agentApi = process.env.NEXT_PUBLIC_AGENT_API;
      if (agentApi) {
        await fetch(
          `${agentApi}/api/learning-spaces/${spaceId}?user_id=${userId}`,
          { method: "DELETE" }
        );
      }
    } catch {
      // Backend cleanup is best-effort, don't fail the action
      console.warn("⚠️ Backend DELETE call failed (non-critical)");
    }

    console.log("✅ Learning space deleted successfully:", spaceId);
    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting learning space:", error);
    return {
      error: "Unexpected error while deleting learning space",
    };
  }
}

// ---- On-demand section generation actions ----

export async function generateQuizAction(
  learningSpaceId: string,
  userId: string,
  language: string = "English"
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_AGENT_API}/api/workflows/generate-quiz`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learning_space_id: learningSpaceId, user_id: userId, language }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      return { error: `Failed to generate quiz: ${res.status} ${errorText}` };
    }

    const data = await res.json();
    if (data.success) {
      return { success: true, quiz: data.quiz };
    }
    return { error: data.error || data.message || "Failed to generate quiz" };
  } catch (error) {
    console.error("Network error generating quiz:", error);
    return { error: "Network error while generating quiz" };
  }
}

export async function generateFlashcardsAction(
  learningSpaceId: string,
  userId: string,
  language: string = "English"
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_AGENT_API}/api/workflows/generate-flashcards`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learning_space_id: learningSpaceId, user_id: userId, language }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      return { error: `Failed to generate flashcards: ${res.status} ${errorText}` };
    }

    const data = await res.json();
    if (data.success) {
      return { success: true, flashcards: data.flashcards };
    }
    return { error: data.error || data.message || "Failed to generate flashcards" };
  } catch (error) {
    console.error("Network error generating flashcards:", error);
    return { error: "Network error while generating flashcards" };
  }
}

export async function generateRecommendationsAction(
  learningSpaceId: string,
  userId: string,
  language: string = "English"
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_AGENT_API}/api/workflows/generate-recommendations`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learning_space_id: learningSpaceId, user_id: userId, language }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      return { error: `Failed to generate recommendations: ${res.status} ${errorText}` };
    }

    const data = await res.json();
    if (data.success) {
      return { success: true, recommendations: data.recommendations };
    }
    return { error: data.error || data.message || "Failed to generate recommendations" };
  } catch (error) {
    console.error("Network error generating recommendations:", error);
    return { error: "Network error while generating recommendations" };
  }
}