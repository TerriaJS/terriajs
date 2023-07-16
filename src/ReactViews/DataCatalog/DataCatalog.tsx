import React from "react";
import { observer } from "mobx-react";

import { useTranslation } from "react-i18next";

import { defined } from "cesium";

import DataCatalogMember from "./DataCatalogMember";
import SearchHeader from "../Search/SearchHeader";

import Styles from "./data-catalog.scss";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";
import { BaseModel } from "../../Models/Definition/Model";
import SearchProvider from "../../Models/SearchProviders/SearchProvider";

interface PropsType {
  terria: Terria;
  viewState: ViewState;
  items: BaseModel[];
  onActionButtonClicked?: () => void;
  removable: boolean;
}

interface ItemRenderDetails {
  isSearching: boolean;
  catalogSearchProvider: SearchProvider | undefined;
}

function renderItem(
  props: PropsType,
  details: ItemRenderDetails,
  item: BaseModel | undefined
) {
  if (!item || item === props.terria.catalog.userAddedDataGroup)
    return undefined;

  return (
    <DataCatalogMember
      viewState={props.viewState}
      member={item}
      // manage group `isOpen` flag locally if searching through models dynamically (i.e. not using catalog index)
      // This must be false if resultsAreReferences - so group references open correctly in the search
      manageIsOpenLocally={
        details.isSearching &&
        !details.catalogSearchProvider?.resultsAreReferences
      }
      key={item.uniqueId}
      onActionButtonClicked={props.onActionButtonClicked}
      removable={props.removable}
      terria={props.terria}
      isTopLevel={true}
    />
  );
}

// Displays the data catalog.

const DataCatalog: React.FC<PropsType> = observer((props: PropsType) => {
  const searchState = props.viewState.searchState;
  const isSearching = searchState.catalogSearchText.length > 0;
  const catalogSearchProvider = searchState.catalogSearchProvider;
  const unfilteredItems =
    isSearching &&
    catalogSearchProvider &&
    searchState.catalogSearchResults?.results
      ? searchState.catalogSearchResults.results.map(
          (result) => result.catalogItem
        )
      : props.items;
  const items = (unfilteredItems || []).filter(defined);

  const { t } = useTranslation();

  return (
    <ul className={Styles.dataCatalog}>
      {isSearching && catalogSearchProvider
        ? [
            <label className={Styles.label}>{t("search.resultsLabel")}</label>,
            <SearchHeader
              searchResults={catalogSearchProvider}
              isWaitingForSearchToStart={
                searchState.isWaitingToStartCatalogSearch
              }
            />
          ]
        : undefined}
      {items.map((item) =>
        renderItem(props, { isSearching, catalogSearchProvider }, item)
      )}
    </ul>
  );
});

export default DataCatalog;
