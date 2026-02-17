import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "./supabase/server";
import { NextResponse } from "next/server";

/**
 * Validates that the current user owns the specified project
 * @param projectId - The project ID to validate ownership for
 * @returns Object with isValid boolean and error response if invalid
 */
export async function validateProjectOwnership(projectId: string): Promise<{
  isValid: boolean;
  userId?: string;
  project?: any;
  errorResponse?: NextResponse;
}> {
  try {
    // Get current user
    const { userId } = await auth();
    if (!userId) {
      return {
        isValid: false,
        errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      };
    }

    // Get project using server client (bypasses RLS)
    const supabase = createSupabaseServerClient();
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error || !project) {
      return {
        isValid: false,
        errorResponse: NextResponse.json({ error: "Project not found" }, { status: 404 })
      };
    }

    // Check ownership
    if (project.user_id && project.user_id !== userId) {
      return {
        isValid: false,
        errorResponse: NextResponse.json({ error: "Forbidden: You don't have access to this project" }, { status: 403 })
      };
    }

    return {
      isValid: true,
      userId,
      project
    };
  } catch (error) {
    console.error('Error validating project ownership:', error);
    return {
      isValid: false,
      errorResponse: NextResponse.json({ error: "Internal server error" }, { status: 500 })
    };
  }
}

/**
 * Middleware to validate API request has valid auth token
 */
export async function requireAuth(): Promise<{
  isValid: boolean;
  userId?: string;
  errorResponse?: NextResponse;
}> {
  const { userId } = await auth();
  
  if (!userId) {
    return {
      isValid: false,
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    };
  }

  return {
    isValid: true,
    userId
  };
}