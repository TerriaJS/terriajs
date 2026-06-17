import CommonStrata from "../Definition/CommonStrata";
import { BaseModel } from "../Definition/Model";
import StubCatalogItem from "./CatalogItems/StubCatalogItem";
import Terria from "../Terria";

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

  stub.setTrait(CommonStrata.definition, "name", stub.uniqueId);
  terria.addModel(stub);
  return stub;
}
