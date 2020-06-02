import ModelFactory from "./ModelFactory";
import Terria from "./Terria";
import StubCatalogItem from "./StubCatalogItem";
import { uniqueId } from "lodash-es";
import { BaseModel } from "./Model";
import CatalogMemberFactory from "./CatalogMemberFactory";

export const getUniqueStubName = (terria: Terria) => {
  const stubName = "[StubCatalogItem]";
  let uniqueId = stubName;
  let idIncrement = 1;
  while (terria.getModelById(BaseModel, uniqueId) !== undefined) {
    uniqueId = stubName + " (" + idIncrement + ")";
    idIncrement++;
  }
  return uniqueId;
};

export default function createStubCatalogItem(
  terria: Terria,
  uniqueId?: string
): StubCatalogItem {
  const idToUse = uniqueId || getUniqueStubName(terria);
  const stub = new StubCatalogItem(idToUse, terria);

  stub.setTrait("underride", "name", stub.uniqueId);
  terria.addModel(stub);
  return stub;
}
