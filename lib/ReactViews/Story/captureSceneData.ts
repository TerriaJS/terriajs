import {
  SceneContext,
  WorkbenchItemInfo,
  DatasetLegend,
  DatasetMetadata
} from "../../Core/ClaudeApi";
import Terria from "../../Models/Terria";
import isDefined from "../../Core/isDefined";
import { getName } from "../../ModelMixins/CatalogMemberMixin";
import hasTraits from "../../Models/Definition/hasTraits";
import LegendOwnerTraits from "../../Traits/TraitsClasses/LegendOwnerTraits";
import CatalogMemberTraits from "../../Traits/TraitsClasses/CatalogMemberTraits";
import proxyCatalogItemUrl from "../../Models/Catalog/proxyCatalogItemUrl";
import Model from "../../Models/Definition/Model";
import LegendTraits from "../../Traits/TraitsClasses/LegendTraits";

/**
 * Data captured from the current map scene, ready for AI processing
 */
export interface CapturedSceneData {
  screenshot: string;
  context: SceneContext;
}

/**
 * Captures all relevant data about the current map scene for AI summary generation
 *
 * @param terria - The Terria instance
 * @returns Promise resolving to captured scene data including screenshot and context
 */
export default async function captureSceneData(
  terria: Terria
): Promise<CapturedSceneData> {
  // 1. Capture screenshot
  const screenshot = await terria.currentViewer.captureScreenshot();

  // 2. Collect workbench items (active data layers) with legends and metadata
  const workbenchItems: WorkbenchItemInfo[] = terria.workbench.items
    .map((item) => {
      // Get the name of each workbench item using getName helper
      const name = getName(item) || item.uniqueId;
      if (!name) return null;

      const itemInfo: WorkbenchItemInfo = { name };

      // Extract legend information
      if (hasTraits(item, LegendOwnerTraits, "legends")) {
        const legends = item.legends;
        if (legends && legends.length > 0) {
          const legend: DatasetLegend = {};

          // Get the first legend (most items only have one)
          const firstLegend = legends[0] as Model<LegendTraits>;

          if (firstLegend.title) {
            legend.title = firstLegend.title;
          }

          // Check if it's an image legend
          if (firstLegend.url) {
            // Make the URL absolute and proxied
            const proxiedUrl = proxyCatalogItemUrl(item, firstLegend.url);
            if (proxiedUrl) {
              legend.imageUrl = String(proxiedUrl);
              legend.imageMimeType = firstLegend.urlMimeType || "image/png";
            }
          }
          // Check if it's a structured legend with items
          else if (firstLegend.items && firstLegend.items.length > 0) {
            legend.items = firstLegend.items.map((legendItem) => ({
              title: legendItem.title,
              color: legendItem.color,
              imageUrl: legendItem.imageUrl
            }));
          }

          if (legend.imageUrl || legend.items) {
            itemInfo.legend = legend;
          }
        }
      }

      // Extract metadata information
      if (hasTraits(item, CatalogMemberTraits, "description")) {
        const metadata: DatasetMetadata = {};

        // Get description
        if (item.description) {
          metadata.description = item.description;
        }

        // Get custodian
        if (
          hasTraits(item, CatalogMemberTraits, "dataCustodian") &&
          item.dataCustodian
        ) {
          metadata.custodian = item.dataCustodian;
        }

        // Get info sections
        if (
          hasTraits(item, CatalogMemberTraits, "info") &&
          item.info &&
          item.info.length > 0
        ) {
          metadata.infoSections = item.info
            .filter((section) => section.name && section.content)
            .map((section) => ({
              name: section.name,
              content: section.content || undefined
            }));
        }

        if (
          metadata.description ||
          metadata.custodian ||
          (metadata.infoSections && metadata.infoSections.length > 0)
        ) {
          itemInfo.metadata = metadata;
        }
      }

      return itemInfo;
    })
    .filter(isDefined);

  // 3. Get selected feature (if any)
  let selectedFeature: string | undefined;

  console.log("Checking selected feature:", {
    hasSelectedFeature: !!terria.selectedFeature,
    selectedFeature: terria.selectedFeature,
    pickedFeatures: terria.pickedFeatures
  });

  if (terria.selectedFeature) {
    const feature = terria.selectedFeature;
    const featureParts: string[] = [];

    // Get feature name
    const featureName = feature.name;
    const nameStr =
      typeof featureName === "string"
        ? featureName
        : (featureName as any)?.getValue?.(terria.timelineClock.currentTime);

    // Get feature description
    const featureDesc = feature.description;
    const descStr =
      typeof featureDesc === "string"
        ? featureDesc
        : (featureDesc as any)?.getValue?.(terria.timelineClock.currentTime);

    if (nameStr) {
      featureParts.push(`Name: ${nameStr}`);
    }
    if (descStr) {
      featureParts.push(`Description: ${descStr}`);
    }

    // Extract all properties from the PropertyBag
    if (feature.properties) {
      const props = feature.properties;
      const propertyNames = (props as any)._propertyNames || [];

      console.log("Feature property names:", propertyNames);

      const properties: Record<string, any> = {};

      for (const propName of propertyNames) {
        try {
          const prop = (props as any)[propName];
          let value;

          // Handle ConstantProperty
          if (prop && typeof prop === "object" && "_value" in prop) {
            value = prop._value;
          }
          // Handle Property with getValue
          else if (prop && typeof prop.getValue === "function") {
            value = prop.getValue(terria.timelineClock.currentTime);
          }
          // Plain value
          else {
            value = prop;
          }

          // Only include non-empty values
          if (value !== null && value !== undefined && value !== "") {
            properties[propName] = value;
          }
        } catch (err) {
          console.warn(`Could not extract property ${propName}:`, err);
        }
      }

      console.log("Extracted properties:", properties);

      // Build a formatted property list
      if (Object.keys(properties).length > 0) {
        featureParts.push("\nProperties:");
        for (const [key, value] of Object.entries(properties)) {
          // Format property name (remove underscores, capitalize)
          const formattedKey = key
            .replace(/^_|_$/g, "") // Remove leading/trailing underscores
            .replace(/_/g, " ") // Replace underscores with spaces
            .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize words

          featureParts.push(`  ${formattedKey}: ${value}`);
        }
      }
    }

    selectedFeature =
      featureParts.length > 0
        ? featureParts.join("\n")
        : "Selected feature (no details available)";

    console.log("Final selected feature string:", selectedFeature);
  }

  // 4. Get camera view / viewport extent
  const cameraView = terria.currentViewer.getCurrentCameraView();
  const cameraJson = cameraView.toJson();

  // Extract the rectangle bounds
  const rectangle = cameraView.rectangle;
  const CesiumMath = require("terriajs-cesium/Source/Core/Math").default;

  const context: SceneContext = {
    workbenchItems,
    selectedFeature,
    cameraView: {
      west: CesiumMath.toDegrees(rectangle.west),
      south: CesiumMath.toDegrees(rectangle.south),
      east: CesiumMath.toDegrees(rectangle.east),
      north: CesiumMath.toDegrees(rectangle.north)
    }
  };

  return {
    screenshot,
    context
  };
}
