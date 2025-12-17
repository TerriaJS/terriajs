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
 * Legend data for a dataset (can be image URL or structured items)
 */
export interface DatasetLegend {
  title?: string;
  // Image URL if legend is an image
  imageUrl?: string;
  imageMimeType?: string;
  // Structured legend items (color swatches, etc.)
  items?: Array<{
    title?: string;
    color?: string;
    imageUrl?: string;
  }>;
}

/**
 * Metadata for a dataset
 */
export interface DatasetMetadata {
  description?: string;
  custodian?: string;
  infoSections?: Array<{
    name?: string;
    content?: string;
  }>;
}

/**
 * Information about a workbench item (dataset on the map)
 */
export interface WorkbenchItemInfo {
  name: string;
  legend?: DatasetLegend;
  metadata?: DatasetMetadata;
}

/**
 * Context data about the current map scene
 */
export interface SceneContext {
  workbenchItems: WorkbenchItemInfo[];
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
  // Use Haiku by default for cost efficiency (90% cheaper than Sonnet)
  // Users can override with claudeModel config parameter
  private static readonly MODEL = "claude-3-5-haiku-latest";
  private static readonly ANTHROPIC_VERSION = "2023-06-01";
  private static readonly MAX_TOKENS = 1024;

  // Cost optimization settings
  private static readonly MAX_SCREENSHOT_DIMENSION = 1024; // Resize large screenshots
  private static readonly MAX_LEGEND_IMAGES = 3; // Limit legend images to reduce cost
  private static readonly IMAGE_QUALITY = 0.85; // JPEG quality for compression

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

    // Log original image size
    const originalSizeKB = Math.round((base64Match[2].length * 0.75) / 1024);
    console.log(`Original screenshot size: ${originalSizeKB} KB`);

    // Compress the screenshot to reduce API costs
    let compressedImageUrl = imageDataUrl;
    try {
      compressedImageUrl = await this.compressImage(
        imageDataUrl,
        this.MAX_SCREENSHOT_DIMENSION,
        this.IMAGE_QUALITY
      );
      const compressedSizeKB = Math.round(
        (compressedImageUrl.length * 0.75) / 1024
      );
      const savings = Math.round(
        ((originalSizeKB - compressedSizeKB) / originalSizeKB) * 100
      );
      console.log(
        `Compressed screenshot to ${compressedSizeKB} KB (${savings}% reduction)`
      );
    } catch (err) {
      console.warn("Failed to compress screenshot, using original:", err);
    }

    // Extract base64 data from compressed image
    const finalBase64Match = compressedImageUrl.match(
      /^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/
    );
    if (!finalBase64Match) {
      throw new TerriaError({
        title: "Invalid Image",
        message: "Compressed image format is invalid."
      });
    }
    const mediaType =
      finalBase64Match[1] === "jpg" ? "jpeg" : finalBase64Match[1];
    const base64Data = finalBase64Match[2];

    // Build context description
    const contextDescription = this.buildContextDescription(context);

    // Collect legend images from workbench items (limit to reduce cost)
    const legendImages: ClaudeImageContent[] = [];
    if (context.workbenchItems) {
      let legendCount = 0;
      for (const item of context.workbenchItems) {
        if (item.legend?.imageUrl && legendCount < this.MAX_LEGEND_IMAGES) {
          try {
            // Fetch and convert legend image to base64
            const legendData = await this.fetchImageAsBase64(
              item.legend.imageUrl
            );
            if (legendData) {
              legendImages.push({
                type: "image",
                source: {
                  type: "base64",
                  media_type: legendData.mimeType as any,
                  data: legendData.base64
                }
              });
              legendCount++;
            }
          } catch (err) {
            console.warn(`Failed to fetch legend image for ${item.name}:`, err);
            // Continue without this legend image
          }
        }
      }

      if (
        context.workbenchItems.filter((item) => item.legend?.imageUrl).length >
        this.MAX_LEGEND_IMAGES
      ) {
        console.log(
          `Limited to ${this.MAX_LEGEND_IMAGES} legend images for cost optimization`
        );
      }
    }

    // Build the prompt (with emphasis on selected feature if present)
    const hasSelectedFeature = !!context.selectedFeature;
    const hasLegendImages = legendImages.length > 0;
    const prompt = this.buildPrompt(
      contextDescription,
      hasSelectedFeature,
      hasLegendImages
    );

    // Build content array: screenshot, then legend images, then text prompt
    const contentParts: ClaudeContent[] = [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: `image/${mediaType}` as any,
          data: base64Data
        }
      }
    ];

    // Add legend images
    contentParts.push(...legendImages);

    // Add text prompt
    contentParts.push({
      type: "text",
      text: prompt
    });

    // Construct the API request
    const request: ClaudeApiRequest = {
      model: model || this.MODEL, // Use provided model or fall back to default
      max_tokens: this.MAX_TOKENS,
      messages: [
        {
          role: "user",
          content: contentParts
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

      // Log usage and estimated cost
      if (data.usage) {
        const totalTokens = data.usage.input_tokens + data.usage.output_tokens;
        console.log("API Usage:", {
          model: data.model,
          input_tokens: data.usage.input_tokens,
          output_tokens: data.usage.output_tokens,
          total_tokens: totalTokens
        });

        // Estimate cost based on model pricing (as of 2024)
        // Haiku: $0.25 per MTok input, $1.25 per MTok output
        // Sonnet: $3 per MTok input, $15 per MTok output
        let estimatedCost = 0;
        if (data.model.includes("haiku")) {
          estimatedCost =
            (data.usage.input_tokens / 1_000_000) * 0.25 +
            (data.usage.output_tokens / 1_000_000) * 1.25;
        } else if (data.model.includes("sonnet")) {
          estimatedCost =
            (data.usage.input_tokens / 1_000_000) * 3.0 +
            (data.usage.output_tokens / 1_000_000) * 15.0;
        }
        console.log(
          `Estimated cost: $${estimatedCost.toFixed(4)} (using ${data.model})`
        );
      }

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
   * Compresses and resizes an image data URL to reduce API costs
   * @param dataUrl - The original image data URL
   * @param maxDimension - Maximum width or height
   * @param quality - JPEG quality (0-1)
   * @returns Compressed image data URL
   */
  private static async compressImage(
    dataUrl: string,
    maxDimension: number,
    quality: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        // Create canvas and resize
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG for better compression
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = dataUrl;
    });
  }

  /**
   * Fetches an image URL and converts it to base64
   */
  private static async fetchImageAsBase64(
    imageUrl: string
  ): Promise<{ base64: string; mimeType: string } | null> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.warn(`Failed to fetch legend image: ${response.status}`);
        return null;
      }

      const blob = await response.blob();
      const mimeType = blob.type || "image/png";

      // Check if it's a supported image type
      const supportedTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/gif",
        "image/webp"
      ];
      if (!supportedTypes.includes(mimeType)) {
        console.warn(`Unsupported legend image type: ${mimeType}`);
        return null;
      }

      // Convert blob to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          const base64Match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
          if (base64Match) {
            resolve({
              base64: base64Match[1],
              mimeType: mimeType === "image/jpg" ? "image/jpeg" : mimeType
            });
          } else {
            reject(new Error("Failed to extract base64 data"));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn("Error fetching legend image:", error);
      return null;
    }
  }

  /**
   * Builds a description of the scene context from the provided data
   */
  private static buildContextDescription(context: SceneContext): string {
    console.log("LLM context", context);
    const parts: string[] = [];

    // Workbench items with metadata and legend info
    if (context.workbenchItems && context.workbenchItems.length > 0) {
      parts.push(`Active data layers (${context.workbenchItems.length}):`);

      context.workbenchItems.forEach((item, i) => {
        const itemParts: string[] = [`${i + 1}. ${item.name}`];

        // Add metadata description if available
        if (item.metadata?.description) {
          // Strip HTML tags and limit length
          const cleanDesc = item.metadata.description
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          const shortDesc =
            cleanDesc.length > 200
              ? cleanDesc.substring(0, 197) + "..."
              : cleanDesc;
          itemParts.push(`   Description: ${shortDesc}`);
        }

        // Add custodian if available
        if (item.metadata?.custodian) {
          itemParts.push(`   Custodian: ${item.metadata.custodian}`);
        }

        // Add legend information
        if (item.legend) {
          if (item.legend.items && item.legend.items.length > 0) {
            itemParts.push(
              `   Legend (${item.legend.items.length} categories):`
            );
            // Include up to 10 legend items to avoid overwhelming the context
            const itemsToShow = item.legend.items.slice(0, 10);
            itemsToShow.forEach((legendItem) => {
              if (legendItem.title && legendItem.color) {
                itemParts.push(
                  `     - ${legendItem.title}: ${legendItem.color}`
                );
              } else if (legendItem.title) {
                itemParts.push(`     - ${legendItem.title}`);
              }
            });
            if (item.legend.items.length > 10) {
              itemParts.push(
                `     ... and ${item.legend.items.length - 10} more`
              );
            }
          } else if (item.legend.imageUrl) {
            itemParts.push(`   Legend: See legend image (Image ${i + 1})`);
          }
        }

        // Add relevant info sections (limit to key ones)
        if (
          item.metadata?.infoSections &&
          item.metadata.infoSections.length > 0
        ) {
          const relevantSections = item.metadata.infoSections
            .filter((section) => section.name && section.content)
            .slice(0, 2); // Only include first 2 info sections

          relevantSections.forEach((section) => {
            const cleanContent = section
              .content!.replace(/<[^>]*>/g, " ")
              .replace(/\s+/g, " ")
              .trim();
            const shortContent =
              cleanContent.length > 150
                ? cleanContent.substring(0, 147) + "..."
                : cleanContent;
            itemParts.push(`   ${section.name}: ${shortContent}`);
          });
        }

        parts.push(itemParts.join("\n"));
      });
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
    hasSelectedFeature: boolean,
    hasLegendImages: boolean
  ): string {
    const focusInstruction = hasSelectedFeature
      ? "\n\n**IMPORTANT: A specific feature is currently selected on the map. Your title and description should focus primarily on describing this selected feature, its properties, and its significance. The data layers provide context, but the selected feature should be the main subject.**"
      : "";

    const legendInstruction = hasLegendImages
      ? "\n\n**Note: Additional images show the legends for the data layers. Use these legends to understand what the colors and symbols in the map represent. Reference the legend information to provide more meaningful descriptions of the data (e.g., instead of just saying 'colored regions', explain what those colors mean based on the legend).**"
      : "";

    return `You are helping to generate a title and description for a map scene in a geospatial data explorer application.

Here is the current map state:

${contextDescription}${focusInstruction}${legendInstruction}

Please analyze the screenshot${
      hasLegendImages ? " and legend images" : ""
    } to generate:
1. A concise, descriptive title (5-10 words) that captures the essence of what this scene shows${
      hasSelectedFeature ? " (focus on the selected feature)" : ""
    }
2. A brief description (2-3 sentences) that provides insights about the scene. Go beyond just describing what's visible - identify patterns, relationships, trends, notable features, or significant observations that can be gleaned from the data${
      hasSelectedFeature
        ? " (emphasize the selected feature and its context)"
        : ""
    }${
      hasLegendImages
        ? ". Use the legend information to interpret the data meaningfully."
        : ""
    }

**Analysis Guidelines:**
- If you see spatial patterns (clustering, gradients, hotspots), mention them
- If data shows variations across geography, describe the pattern
- If comparing multiple layers, note relationships or correlations
- If values are extreme or notable, point that out
- Reference the legend to interpret what the visual patterns mean in real-world terms
- Consider the geographic context and location when relevant

Format your response EXACTLY as follows (use these exact labels):

TITLE: [your title here]

DESCRIPTION: [your description here]

Keep the language clear and professional. Provide actionable insights that help users understand the significance of what they're seeing, not just what colors or shapes are present.`;
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
