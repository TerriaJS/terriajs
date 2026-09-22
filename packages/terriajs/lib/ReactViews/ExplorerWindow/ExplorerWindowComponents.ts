import { observable } from "mobx";
import { DataCatalog } from "../DataCatalog/DataCatalog";
import { DataCatalogSearch } from "../DataCatalog/DataCatalogSearch";
import ExplorerWindow from "./ExplorerWindow";

export const ExplorerWindowComponents = observable.object(
  {
    DataCatalog: DataCatalog,
    DataCatalogSearch: DataCatalogSearch,
    ExplorerWindow: ExplorerWindow
  },
  undefined,
  // Avoid observing the components deeply as is it results in console warnings
  // when react-dev-tools extension tries to access the component's displayName
  // and other attribtues.
  { deep: false }
);
