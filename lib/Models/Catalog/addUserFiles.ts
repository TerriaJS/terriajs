import getDataType from "../../Core/getDataType";
import isDefined from "../../Core/isDefined";
import readJson from "../../Core/readJson";
import TerriaError from "../../Core/TerriaError";
import TimeVarying from "../../ModelMixins/TimeVarying";
import ViewState from "../../ReactViewModels/ViewState";
import CommonStrata from "../Definition/CommonStrata";
import { BaseModel } from "../Definition/Model";
import Terria from "../Terria";
import addUserCatalogMember from "./addUserCatalogMember";
import createCatalogItemFromFileOrUrl from "./createCatalogItemFromFileOrUrl";
import ResultPendingCatalogItem from "./ResultPendingCatalogItem";

interface FileType {
  value: string;
}

export default async function addUserFiles(
  files: FileList,
  terria: Terria,
  viewState: ViewState,
  fileType?: FileType | undefined
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
        dataType.value
      );
      return addUserCatalogMember(terria, item);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  function loadInitData(initData: { catalog: any }) {
    terria.catalog.group
      .addMembersFromJson(CommonStrata.user, initData.catalog)
      .raiseError(terria, "Failed to load catalog from file");
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

    let loadPromise: Promise<BaseModel | undefined>;
    if (file.name.toUpperCase().indexOf(".JSON") !== -1) {
      const promise = readJson(file).then((json: any) => {
        if (isDefined(json.catalog) || isDefined(json.stories)) {
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
      loadPromise = promise.catch((e) => {
        terria.raiseErrorToUser(e);
        return undefined;
      });
      promises.push();
    } else {
      loadPromise = loadCatalogItemFromFile(file);
      promises.push(loadPromise);
    }

    tempCatalogItem.loadPromise = loadPromise;
    terria.workbench.add(tempCatalogItem);
    tempCatalogItemList.push(tempCatalogItem);
  }

  const addedItems = await Promise.all(promises);
  // if addedItem has only undefined item, means init files
  // have been uploaded
  if (addedItems.every((item) => item === undefined)) {
    viewState.openAddData();
  } else {
    const items = addedItems.filter(
      (item) => isDefined(item) && !(item instanceof TerriaError)
    ) as BaseModel[];
    tempCatalogItemList.forEach((item) => {
      terria.catalog.userAddedDataGroup.remove(CommonStrata.user, item);
      terria.workbench.remove(item);
    });
    items.forEach(
      (item) => TimeVarying.is(item) && terria.timelineStack.addToTop(item)
    );
    return items;
  }
}
