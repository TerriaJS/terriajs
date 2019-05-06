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

function addUserFiles(files, terria, viewState, fileType) {
  const dataType = fileType || getDataType().localDataType[0];
  if (!defined(files)) {
    terria.error.raiseEvent(
      new TerriaError({
        title: "File API not supported",
        message:
          "\
Sorry, your web browser does not support the File API, which " +
          terria.appName +
          ' requires in order to \
add data from a file on your system.  Please upgrade your web browser.  For the best experience, we recommend \
<a href="http://www.microsoft.com/ie" target="_blank">Internet Explorer 11</a> or the latest version of \
<a href="http://www.google.com/chrome" target="_blank">Google Chrome</a> or \
<a href="http://www.mozilla.org/firefox" target="_blank">Mozilla Firefox</a>.'
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
      promises.push(loadPromise);
    }
    tempCatalogItem.loadPromise = loadPromise;
    tempCatalogItem.isEnabled = true;
    tempCatalogItemList.push(tempCatalogItem);
  }

  return when.all(promises, addedItems => {
    // if addedItem has only undefined item, means init files
    // have been uploaded
    if (addedItems.every(item => item === undefined)) {
      viewState.openAddData();
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
