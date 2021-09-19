"use strict";

import URI from "urijs";
import i18next from "i18next";
import { runInAction } from "mobx";
import loadBlob from "../../../Core/loadBlob";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import RequestErrorEvent from "terriajs-cesium/Source/Core/RequestErrorEvent";
import CommonStrata from "../../Definition/CommonStrata";
import createStratumInstance from "../../Definition/createStratumInstance";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import ResultPendingCatalogItem from "../ResultPendingCatalogItem";
import UserDrawing from "../../UserDrawing";
import WebMapServiceCatalogItem, {
  formatDimensionsForOws
} from "./WebMapServiceCatalogItem";
import isDefined from "../../../Core/isDefined";
import makeRealPromise from "../../../Core/makeRealPromise";
import TerriaError from "../../../Core/TerriaError";
import { InfoSectionTraits } from "../../../Traits/TraitsClasses/CatalogMemberTraits";

var sprintf = require("terriajs-cesium/Source/ThirdParty/sprintf").default;

export const callWebCoverageService = function(
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
      onCleanUp: () => {
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
};

async function launch(
  wmsCatalogItem: WebMapServiceCatalogItem,
  bbox: Rectangle
): Promise<{ name: string; file: Blob }> {
  bbox.west = CesiumMath.toDegrees(bbox.west);
  bbox.south = CesiumMath.toDegrees(bbox.south);
  bbox.east = CesiumMath.toDegrees(bbox.east);
  bbox.north = CesiumMath.toDegrees(bbox.north);

  const query: any = {
    service: "WCS",
    request: "GetCoverage",
    version: "1.0.0",
    format: "GeoTIFF",
    crs: "EPSG:4326",
    width: 1024,
    height: Math.round((1024 * bbox.height) / bbox.width),
    coverage: wmsCatalogItem.linkedWcsCoverage,
    bbox: `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`,
    ...formatDimensionsForOws(wmsCatalogItem.dimensions),
    time: wmsCatalogItem.currentDiscreteTimeTag,
    styles: wmsCatalogItem.styles
  };

  var uri = new URI(wmsCatalogItem.linkedWcsUrl).query(query);

  var url = proxyCatalogItemUrl(wmsCatalogItem, uri.toString());

  var now = new Date();
  var timestamp = sprintf(
    "%04d-%02d-%02dT%02d:%02d:%02d",
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds()
  );

  const asyncResult = new ResultPendingCatalogItem(
    `WCS: ${wmsCatalogItem.name} ${timestamp}`,
    wmsCatalogItem.terria
  );

  runInAction(() => {
    asyncResult.setTrait(
      CommonStrata.user,
      "shortReport",
      i18next.t("models.wcs.asyncPendingDescription", {
        name: wmsCatalogItem.name,
        timestamp: timestamp
      })
    );

    const info = createStratumInstance(InfoSectionTraits, {
      name: "Inputs",
      content:
        '<table class="cesium-infoBox-defaultTable">' +
        [
          { name: "Bounding box", value: query.bbox },
          { name: "Format", value: query.format }
        ].reduce(function(previousValue, parameter) {
          return (
            previousValue +
            "<tr>" +
            '<td style="vertical-align: middle">' +
            parameter.name +
            "</td>" +
            "<td>" +
            parameter.value +
            "</td>" +
            "</tr>"
          );
        }, "") +
        "</table>"
    });

    asyncResult.setTrait(CommonStrata.user, "info", [info]);

    asyncResult.terria.workbench.add(asyncResult);
  });

  try {
    const blob = await makeRealPromise<Blob>(loadBlob(url));

    runInAction(() => asyncResult.terria.workbench.remove(asyncResult));

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

        if (xml.documentElement.localName === "ServiceExceptionReport") {
          const message = xml.getElementsByTagName("ServiceException")?.[0]
            .innerHTML;
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
    runInAction(() => asyncResult.terria.workbench.remove(asyncResult));
  }
}
