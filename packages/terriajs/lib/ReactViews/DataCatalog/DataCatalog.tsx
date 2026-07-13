import { useTranslation, withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import { BaseModel } from "../../Models/Definition/Model";
import { useViewState } from "../Context";
import SearchHeader from "../Search/SearchHeader";
import Styles from "./data-catalog.scss";
import DataCatalogMember from "./DataCatalogMember";
import { observer } from "mobx-react";
import Loader from "../Loader";

interface DataCatalogProps {
  items?: readonly BaseModel[];
  hideActionButton?: boolean;
  onActionButtonClicked?: (item: CatalogMemberMixin.Instance) => void;
  removable?: boolean;
  isLoading?: boolean;
}

export const DataCatalog = observer(
  ({
    items,
    hideActionButton,
    onActionButtonClicked,
    removable,
    isLoading
  }: DataCatalogProps) => {
    const viewState = useViewState();
    const { t } = useTranslation();

    const { terria } = viewState;
    const searchState = viewState.searchState;
    const isSearching = searchState.catalogSearchText.length > 0;
    const catalogSearchProvider = searchState.catalogSearchProvider;
    const unfilteredItems =
      isSearching &&
      catalogSearchProvider &&
      searchState.catalogSearchProvider?.searchResult.results
        ? searchState.catalogSearchProvider.searchResult.results.map(
            (result) => result.catalogItem
          )
        : items;

    const filteredItems = (unfilteredItems || []).filter(defined);
    return (
      <ul className={Styles.dataCatalog}>
        {isSearching && catalogSearchProvider && (
          <>
            <label className={Styles.label}>
              {t(($) => $.search.resultsLabel)}
            </label>
            <SearchHeader searchResult={catalogSearchProvider.searchResult} />
          </>
        )}
        {isLoading && (
          <li key="loader">
            <Loader />
          </li>
        )}
        {filteredItems.map(
          (item) =>
            item !== terria.catalog.userAddedDataGroup && (
              <DataCatalogMember
                viewState={viewState}
                member={item}
                // manage group `isOpen` flag locally if searching through models dynamically (i.e. not using catalog index)
                // This must be false if resultsAreReferences - so group references open correctly in the search
                manageIsOpenLocally={
                  isSearching && !catalogSearchProvider?.resultsAreReferences
                }
                key={item.uniqueId}
                hideActionButton={hideActionButton}
                onActionButtonClicked={onActionButtonClicked}
                removable={removable}
                terria={terria}
                isTopLevel
              />
            )
        )}
      </ul>
    );
  }
);

export default withTranslation()(DataCatalog);
