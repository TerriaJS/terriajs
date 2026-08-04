import { observable } from "mobx";

import { DataCatalog } from "../DataCatalog/DataCatalog";
import { DataCatalogSearch } from "../DataCatalog/DataCatalogSearch";
import ExplorerWindow from "./ExplorerWindow";

export const ExplorerWindowComponents = observable({
  DataCatalog: DataCatalog,
  DataCatalogSearch: DataCatalogSearch,
  ExplorerWindow: ExplorerWindow
});
