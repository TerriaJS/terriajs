import Terria from "./Terria";
import ViewState from "../ReactViewModels/ViewState";
import ResultPendingCatalogItem from "./ResultPendingCatalogItem";
import CommonStrata from "./CommonStrata";
import readJson from "../Core/readJson";
import getDataType from "../Core/getDataType";
import raiseErrorOnRejectedPromise from "./raiseErrorOnRejectedPromise";
import createCatalogItemFromFileOrUrl from "./createCatalogItemFromFileOrUrl";
import addUserCatalogMember from "./addUserCatalogMember";
import TerriaError from "../Core/TerriaError";
import updateModelFromJson from "./updateModelFromJson";
import isDefined from "../Core/isDefined";

interface FileType {
  value: String;
}

export default function addUserFiles(
  files: File[],
  terria: Terria,
  viewState: ViewState,
  fileType: FileType
) {
  const dataType = fileType || getDataType().localDataType[0];
  const tempCatalogItemList: ResultPendingCatalogItem[] = [];
  const promises = [];

  function loadCatalogItemFromFile(file: File) {
    try {
      const item = createCatalogItemFromFileOrUrl(
        terria,
        viewState,
        file,
        dataType.value,
        true
      );
      return addUserCatalogMember(terria, item);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  function loadInitData(initData: { catalog: any }) {
    updateModelFromJson(terria.catalog.group, CommonStrata.user, {
      members: initData.catalog
    });
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const tempCatalogItem = new ResultPendingCatalogItem(file.name, terria);
    tempCatalogItem.setTrait(CommonStrata.user, "name", file.name);
    tempCatalogItem.setTrait(
      CommonStrata.user,
      "description",
      "Loading file..."
    );
    terria.catalog.userAddedDataGroup.add(CommonStrata.user, tempCatalogItem);

    let loadPromise;
    if (file.name.toUpperCase().indexOf(".JSON") !== -1) {
      const promise = readJson(file).then((json: any) => {
        if (isDefined(json.catalog)) {
          // This is an init file.
          try {
            loadInitData(json);
          } finally {
            tempCatalogItemList.splice(
              tempCatalogItemList.indexOf(tempCatalogItem),
              1
            );
            terria.workbench.remove(tempCatalogItem);
            terria.catalog.userAddedDataGroup.remove(
              CommonStrata.user,
              tempCatalogItem
            );
          }
        } else {
          return loadCatalogItemFromFile(file);
        }
      });
      loadPromise = raiseErrorOnRejectedPromise(terria, promise);
      promises.push(loadPromise);
    } else {
      loadPromise = loadCatalogItemFromFile(file);
      promises.push(loadPromise);
    }

    tempCatalogItem.loadPromise = loadPromise;
    terria.workbench.add(tempCatalogItem);
    tempCatalogItemList.push(tempCatalogItem);
  }

  return Promise.all(promises).then(addedItems => {
    // if addedItem has only undefined item, means init files
    // have been uploaded
    if (addedItems.every(item => item === undefined)) {
      viewState.openAddData();
    } else {
      const items = addedItems.filter(
        item => item && !(item instanceof TerriaError)
      );

      tempCatalogItemList.forEach(item => {
        terria.catalog.userAddedDataGroup.remove(CommonStrata.user, item);
        terria.workbench.remove(item);
      });
      return items;
    }
  });
}
