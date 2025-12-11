import TerriaError from "./TerriaError";

/**
 * Claude API message content types
 */
interface ClaudeImageContent {
  type: "image";
  source: {
    type: "base64";
    media_type: "image/png" | "image/jpeg" | "image/gif" | "image/webp";
    data: string;
  };
}

interface ClaudeTextContent {
  type: "text";
  text: string;
}

type ClaudeContent = ClaudeImageContent | ClaudeTextContent;

/**
 * Claude API request structure
 */
interface ClaudeApiRequest {
  model: string;
  max_tokens: number;
  messages: Array<{
    role: "user" | "assistant";
    content: ClaudeContent | ClaudeContent[];
  }>;
}

/**
 * Claude API response structure
 */
interface ClaudeApiResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: Array<{
    type: "text";
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Structured response for scene summary
 */
export interface SceneSummary {
  title: string;
  description: string;
}

/**
 * Context data about the current map scene
 */
export interface SceneContext {
  workbenchItems: string[];
  selectedFeature?: string;
  cameraView: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
}

/**
 * Service for interacting with the Anthropic Claude API
 */
export default class ClaudeApi {
  private static readonly API_ENDPOINT =
    "https://api.anthropic.com/v1/messages";
  // Try different model naming formats
  // If 404 errors persist, check console.anthropic.com for available models
  private static readonly MODEL = "claude-3-5-sonnet-latest";
  private static readonly ANTHROPIC_VERSION = "2023-06-01";
  private static readonly MAX_TOKENS = 1024;

  /**
   * Generates a scene summary using Claude's vision API
   *
   * @param apiKey - The Anthropic API key
   * @param model - The Claude model to use (e.g., "claude-3-opus-20240229")
   * @param imageDataUrl - The screenshot as a data URL (e.g., "data:image/png;base64,...")
   * @param context - Context about the current scene (workbench items, selected feature, camera view)
   * @returns Promise resolving to a SceneSummary with title and description
   * @throws TerriaError if the API call fails or the response is invalid
   */
  static async generateSceneSummary(
    apiKey: string,
    model: string,
    imageDataUrl: string,
    context: SceneContext
  ): Promise<SceneSummary> {
    if (!apiKey) {
      throw new TerriaError({
        title: "API Key Missing",
        message:
          "Claude API key is not configured. Please add your API key to the configuration file."
      });
    }

    // Extract base64 data from data URL
    const base64Match = imageDataUrl.match(
      /^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/
    );
    if (!base64Match) {
      throw new TerriaError({
        title: "Invalid Image",
        message: "Screenshot format is invalid. Expected a base64 data URL."
      });
    }

    const mediaType = base64Match[1] === "jpg" ? "jpeg" : base64Match[1];
    const base64Data = base64Match[2];

    // Log image size for debugging
    const imageSizeKB = Math.round((base64Data.length * 0.75) / 1024);
    console.log(`Image size: ${imageSizeKB} KB, Media type: ${mediaType}`);

    // Build context description
    const contextDescription = this.buildContextDescription(context);

    // Build the prompt (with emphasis on selected feature if present)
    const hasSelectedFeature = !!context.selectedFeature;
    const prompt = this.buildPrompt(contextDescription, hasSelectedFeature);

    // Construct the API request
    const request: ClaudeApiRequest = {
      model: model || this.MODEL, // Use provided model or fall back to default
      max_tokens: this.MAX_TOKENS,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: `image/${mediaType}` as any,
                data: base64Data
              }
            },
            {
              type: "text",
              text: prompt
            }
          ]
        }
      ]
    };

    try {
      // Make direct request to Claude API (with special CORS header)
      console.log("Sending request directly to Claude API");
      const content = request.messages[0].content;
      console.log("Request structure:", {
        model: request.model,
        max_tokens: request.max_tokens,
        messageCount: request.messages.length,
        contentTypes: Array.isArray(content)
          ? content.map((c: any) => c.type)
          : [content.type]
      });

      // Use fetch API for better control over the request
      const response = await fetch(this.API_ENDPOINT, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": this.ANTHROPIC_VERSION,
          "anthropic-dangerous-direct-browser-access": "true",
          "content-type": "application/json"
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Claude API error response:", errorData);
        console.error("Attempted model:", this.MODEL);
        console.error("API version:", this.ANTHROPIC_VERSION);
        console.error("If model not found, try:");
        console.error("  - claude-3-opus-20240229");
        console.error("  - claude-3-sonnet-20240229");
        console.error("  - claude-3-haiku-20240307");
        console.error(
          "Check https://console.anthropic.com/ for available models"
        );
        throw new Error(
          errorData.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = (await response.json()) as ClaudeApiResponse;

      // Extract and parse the response
      return this.parseResponse(data);
    } catch (error: any) {
      // Log detailed error for debugging
      console.error("Claude API error details:", error);

      // Try to extract error message from API response
      let errorMessage =
        "Failed to generate scene summary. Please check your API key and try again.";
      if (error.response) {
        console.error("API response:", error.response);
        errorMessage =
          error.response.error?.message ||
          error.response.message ||
          errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Handle API errors
      throw new TerriaError({
        title: "AI Generation Failed",
        message: errorMessage,
        originalError: error
      });
    }
  }

  /**
   * Builds a description of the scene context from the provided data
   */
  private static buildContextDescription(context: SceneContext): string {
    console.log("LLM context", context);
    const parts: string[] = [];

    // Workbench items
    if (context.workbenchItems && context.workbenchItems.length > 0) {
      parts.push(
        `Active data layers (${
          context.workbenchItems.length
        }):\n${context.workbenchItems
          .map((item, i) => `${i + 1}. ${item}`)
          .join("\n")}`
      );
    } else {
      parts.push("No active data layers on the map.");
    }

    // Selected feature
    if (context.selectedFeature) {
      parts.push(`\nSelected feature: ${context.selectedFeature}`);
    }

    // Camera view (approximate location)
    const { west, south, east, north } = context.cameraView;
    const centerLat = ((south + north) / 2).toFixed(2);
    const centerLng = ((west + east) / 2).toFixed(2);
    parts.push(
      `\nMap view centered approximately at: ${centerLat}°, ${centerLng}°`
    );

    return parts.join("\n");
  }

  /**
   * Builds the prompt for Claude
   */
  private static buildPrompt(
    contextDescription: string,
    hasSelectedFeature: boolean
  ): string {
    const focusInstruction = hasSelectedFeature
      ? "\n\n**IMPORTANT: A specific feature is currently selected on the map. Your title and description should focus primarily on describing this selected feature, its properties, and its significance. The data layers provide context, but the selected feature should be the main subject.**"
      : "";

    return `You are helping to generate a title and description for a map scene in a geospatial data explorer application.

Here is the current map state:

${contextDescription}${focusInstruction}

Please analyze the screenshot and generate:
1. A concise, descriptive title (5-10 words) that summarizes what this scene is showing${
      hasSelectedFeature ? " (focus on the selected feature)" : ""
    }
2. A brief description (2-3 sentences) that explains the key features, data layers, or geographic area visible in the scene${
      hasSelectedFeature
        ? " (emphasize the selected feature and its context)"
        : ""
    }

Format your response EXACTLY as follows (use these exact labels):

TITLE: [your title here]

DESCRIPTION: [your description here]

Keep the language clear and professional. Focus on what's visible and relevant in the scene.`;
  }

  /**
   * Parses the Claude API response to extract title and description
   */
  private static parseResponse(response: ClaudeApiResponse): SceneSummary {
    if (
      !response.content ||
      response.content.length === 0 ||
      !response.content[0].text
    ) {
      throw new TerriaError({
        title: "Invalid Response",
        message: "The AI service returned an empty or invalid response."
      });
    }

    const text = response.content[0].text;

    // Parse the structured response
    const titleMatch = text.match(/TITLE:\s*(.+)/i);
    const descriptionMatch = text.match(/DESCRIPTION:\s*(.+)/is);

    if (!titleMatch || !descriptionMatch) {
      throw new TerriaError({
        title: "Parsing Error",
        message: "Could not parse the AI response. The format was unexpected."
      });
    }

    // Clean up the extracted text
    const title = titleMatch[1].trim();
    const description = descriptionMatch[1].trim();

    return {
      title,
      description
    };
  }
}
