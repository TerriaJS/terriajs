"use strict";

import addUserCatalogMember from "./../Models/addUserCatalogMember";
import createCatalogItemFromFileOrUrl from "./../Models/createCatalogItemFromFileOrUrl";
import ResultPendingCatalogItem from "./../Models/ResultPendingCatalogItem";
import defined from "terriajs-cesium/Source/Core/defined";
import getDataType from "../Core/getDataType";
import raiseErrorOnRejectedPromise from "./raiseErrorOnRejectedPromise";
import readJson from "../Core/readJson";
import TerriaError from "./../Core/TerriaError";
import when from "terriajs-cesium/Source/ThirdParty/when";
var i18next = require("i18next").default;

function addUserFiles(files, terria, viewState, fileType) {
  const dataType = fileType || getDataType().localDataType[0];
  if (!defined(files)) {
    terria.error.raiseEvent(
      new TerriaError({
        title: i18next.t("models.userData.fileApiNotSupportedTitle"),
        message: i18next.t("models.userData.fileApiNotSupportedTitle", {
          appName: terria.appName,
          internetExplorer:
            '<a href="http://www.microsoft.com/ie" target="_blank">' +
            i18next.t("models.userData.internetExplorer") +
            "</a>",
          chrome:
            '<a href="http://www.google.com/chrome" target="_blank">' +
            i18next.t("models.userData.chrome") +
            "</a>",
          firefox:
            '<a href="http://www.mozilla.org/firefox" target="_blank">' +
            i18next.t("models.userData.firefox") +
            "</a>"
        })
      })
    );
  }

  const promises = [];
  const tempCatalogItemList = [];

  for (let i = 0; i < files.length; ++i) {
    const file = files[i];
    const tempCatalogItem = new ResultPendingCatalogItem(terria);
    tempCatalogItem.name = file.name;
    tempCatalogItem.description = "Loading file...";
    terria.catalog.userAddedDataGroup.add(tempCatalogItem);
    terria.catalog.userAddedDataGroup.isOpen = true;

    terria.analytics.logEvent("uploadFile", "browse", file.name);

    let loadPromise;
    if (file.name.toUpperCase().indexOf(".JSON") !== -1) {
      const promise = readJson(file).then(json => {
        if (json.catalog || json.services || json.stories) {
          // This is an init file.
          return terria.addInitSource(json).then(() => {
            tempCatalogItem.isEnabled = false;
            tempCatalogItemList.splice(
              tempCatalogItemList.indexOf(tempCatalogItem),
              1
            );
            terria.catalog.userAddedDataGroup.remove(tempCatalogItem);
          });
        }
        loadPromise = addUserCatalogMember(
          terria,
          createCatalogItemFromFileOrUrl(
            terria,
            viewState,
            file,
            dataType.value,
            true
          )
        );
        // If a geojson file is dropped with the extension .json
        // we don't want to add it to the workbench twice
        tempCatalogItem.isEnabled = false;
        terria.catalog.userAddedDataGroup.remove(tempCatalogItem);
      });
      loadPromise = raiseErrorOnRejectedPromise(terria, promise);
      promises.push(loadPromise);
    } else {
      loadPromise = addUserCatalogMember(
        terria,
        createCatalogItemFromFileOrUrl(
          terria,
          viewState,
          file,
          dataType.value,
          true
        )
      );
      loadPromise.tempCatalogItem = tempCatalogItem;
      promises.push(loadPromise);
    }
    tempCatalogItem.loadPromise = loadPromise;
    tempCatalogItem.isEnabled = true;
    tempCatalogItemList.push(tempCatalogItem);
  }

  return when.all(promises, addedItems => {
    // if addedItem has only undefined item, means init files
    // have been uploaded or an unsupported format
    if (addedItems.every(item => item === undefined)) {
      viewState.openAddData();

      // Removes unsupported formats from the workbench and catalog
      promises.forEach(function(addedItem) {
        terria.catalog.userAddedDataGroup.remove(addedItem.tempCatalogItem);
        addedItem.tempCatalogItem.isEnabled = false;
      });
    } else {
      const items = addedItems.filter(
        item => item && !(item instanceof TerriaError)
      );
      tempCatalogItemList.forEach(function(value) {
        terria.catalog.userAddedDataGroup.remove(value);
      });
      return items;
    }
  });
}

module.exports = addUserFiles;
