"use strict";

import i18next from "i18next";
import { runInAction } from "mobx";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import RequestErrorEvent from "terriajs-cesium/Source/Core/RequestErrorEvent";
import URI from "urijs";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import flattenNested from "../../../Core/flattenNested";
import isDefined from "../../../Core/isDefined";
import loadBlob from "../../../Core/loadBlob";
import Result from "../../../Core/Result";
import TerriaError from "../../../Core/TerriaError";
import { InfoSectionTraits } from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import CommonStrata from "../../Definition/CommonStrata";
import createStratumInstance from "../../Definition/createStratumInstance";
import UserDrawing from "../../UserDrawing";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import ResultPendingCatalogItem from "../ResultPendingCatalogItem";
import WebMapServiceCatalogItem from "./WebMapServiceCatalogItem";

const sprintf = require("terriajs-cesium/Source/ThirdParty/sprintf").default;

export function callWebCoverageService(
  wmsCatalogItem: WebMapServiceCatalogItem
): Promise<undefined | { name: string; file: Blob }> {
  return new Promise((resolve, reject) => {
    const terria = wmsCatalogItem.terria;
    runInAction(() => (terria.pickedFeatures = undefined));

    let rectangle: Rectangle | undefined;

    const userDrawing = new UserDrawing({
      terria: wmsCatalogItem.terria,
      messageHeader: "Click two points to draw a retangle extent.",
      buttonText: "Download Extent",
      onPointClicked: () => {
        if (userDrawing.pointEntities.entities.values.length >= 2) {
          rectangle = userDrawing?.otherEntities?.entities
            ?.getById("rectangle")
            ?.rectangle?.coordinates?.getValue(
              wmsCatalogItem.terria.timelineClock.currentTime
            );
        }
      },
      onCleanUp: async () => {
        if (isDefined(rectangle)) {
          launch(wmsCatalogItem, rectangle)
            .then(resolve)
            .catch(reject);
        } else {
          reject("Invalid drawn extent.");
        }
      },
      allowPolygon: false,
      drawRectangle: true
    });

    userDrawing.enterDrawMode();
  });
}

async function launch(
  wmsCatalogItem: WebMapServiceCatalogItem,
  bbox: Rectangle
) {
  if (!wmsCatalogItem.linkedWcsUrl || !wmsCatalogItem.linkedWcsCoverage) return;

  const url = getCoverageUrl(wmsCatalogItem, bbox).raiseError(
    wmsCatalogItem.terria,
    `Error occurred while generating WCS GetCoverage URL`
  );

  if (url) {
    return callUrl(wmsCatalogItem, url);
  }
}

function getCoverageUrl(
  wmsCatalogItem: WebMapServiceCatalogItem,
  bbox: Rectangle
): Result<string | undefined> {
  try {
    let error: TerriaError | undefined = undefined;

    // Get dimensionSubsets
    const dimensionSubsets: string[] = [];
    if (wmsCatalogItem.dimensions) {
      Object.entries(wmsCatalogItem.dimensions).forEach(([key, values]) => {
        if (isDefined(values)) {
          // If we have multiple values for a particular dimension, they will be comma separated
          // WCS only supports a single value per dimension - so we take the first value
          const valuesArray = values.split(",");
          const value = valuesArray[0];

          if (valuesArray.length > 1) {
            error = new TerriaError({
              title: "Warning: export may not reflect displayed data",
              message: `WebCoverageService (WCS) only supports one value per dimension.\n\n  Multiple dimension values have been set for \`${key}\`. WCS GetCoverage request will use the first value (\`${key} = "${value}"\`).`,
              importance: 1
            });
          }

          // Wrap string values in double quotes
          dimensionSubsets.push(
            `${key}(${typeof value === "string" ? `"${value}"` : value})`
          );
        }
      });
    }

    // Make query parameter object

    const query = {
      service: "WCS",
      request: "GetCoverage",
      version: "2.0.0",
      coverageId: wmsCatalogItem.linkedWcsCoverage,
      format: wmsCatalogItem.linkedWcsParameters.outputFormat,

      // Add subsets for bbox, time and dimensions
      subset: filterOutUndefined(
        flattenNested([
          `Long(${CesiumMath.toDegrees(bbox.west)},${CesiumMath.toDegrees(
            bbox.east
          )})`,
          `Lat(${CesiumMath.toDegrees(bbox.south)},${CesiumMath.toDegrees(
            bbox.north
          )})`,
          // Add time dimension
          wmsCatalogItem.currentDiscreteTimeTag
            ? `Time("${wmsCatalogItem.currentDiscreteTimeTag}")`
            : undefined,
          // Add other dimensions
          ...dimensionSubsets
        ])
      ),

      subsettingCrs: "EPSG:4326",
      outputCrs: wmsCatalogItem.linkedWcsParameters.outputCrs,
      styles: wmsCatalogItem.styles
    };

    return new Result(
      new URI(wmsCatalogItem.linkedWcsUrl).query(query).toString(),
      error
    );
  } catch (e) {
    return Result.error(e);
  }
}

async function callUrl(
  wmsCatalogItem: WebMapServiceCatalogItem,
  url: string
): Promise<{ name: string; file: Blob }> {
  const now = new Date();
  const timestamp = sprintf(
    "%04d-%02d-%02dT%02d:%02d:%02d",
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds()
  );

  const pendingWorkbenchItem = new ResultPendingCatalogItem(
    `WCS: ${wmsCatalogItem.name} ${timestamp}`,
    wmsCatalogItem.terria
  );

  runInAction(() => {
    pendingWorkbenchItem.setTrait(
      CommonStrata.user,
      "shortReport",
      i18next.t("models.wcs.asyncPendingDescription", {
        name: wmsCatalogItem.name,
        timestamp: timestamp
      })
    );

    // Create info section from URL query parameters
    const info = createStratumInstance(InfoSectionTraits, {
      name: "Inputs",
      content: `<table class="cesium-infoBox-defaultTable">${Object.entries(
        new URI(url).query(true)
      ).reduce<string>(
        (previousValue, [key, value]) =>
          `${previousValue}<tr><td style="vertical-align: middle">${key}</td><td>${value}</td></tr>`,
        ""
      )}</table>`
    });

    pendingWorkbenchItem.setTrait(CommonStrata.user, "info", [info]);
  });

  pendingWorkbenchItem.terria.workbench.add(pendingWorkbenchItem);
  try {
    const blob = await loadBlob(proxyCatalogItemUrl(wmsCatalogItem, url));

    runInAction(() =>
      pendingWorkbenchItem.terria.workbench.remove(pendingWorkbenchItem)
    );

    return { name: `${wmsCatalogItem.name} clip.tiff`, file: blob };
  } catch (error) {
    if (error instanceof TerriaError) {
      throw error;
    }

    // Attempt to get error message out of XML response
    if (
      error instanceof RequestErrorEvent &&
      isDefined(error?.response?.type) &&
      error.response.type?.indexOf("xml") !== -1
    ) {
      try {
        const xml = new DOMParser().parseFromString(
          await error.response.text(),
          "text/xml"
        );

        if (
          xml.documentElement.localName === "ServiceExceptionReport" ||
          xml.documentElement.localName === "ExceptionReport"
        ) {
          const message =
            xml.getElementsByTagName("ServiceException")?.[0]?.innerHTML ??
            xml.getElementsByTagName("ows:ExceptionText")?.[0]?.innerHTML;
          if (isDefined(message)) {
            error = message;
          }
        }
      } catch (xmlParseError) {
        console.log("Failed to parse WCS response");
        console.log(xmlParseError);
      }
    }

    throw new TerriaError({
      sender: wmsCatalogItem,
      title: i18next.t("models.wcs.exportFailedTitle"),
      message: i18next.t("models.wcs.exportFailedMessageII", {
        error
      })
    });
  } finally {
    runInAction(() =>
      pendingWorkbenchItem.terria.workbench.remove(pendingWorkbenchItem)
    );
  }
}
