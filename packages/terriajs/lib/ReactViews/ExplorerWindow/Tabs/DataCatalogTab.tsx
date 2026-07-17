import { runInAction } from "mobx";
import { observer } from "mobx-react";
import { useTranslation } from "react-i18next";
import type CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import { BaseModel } from "../../../Models/Definition/Model";
import Box from "../../../Styled/Box";
import { useViewState } from "../../Context";
import DataPreview from "../../Preview/DataPreview";
import Breadcrumbs from "../../Search/Breadcrumbs";
import { ExplorerWindowComponents } from "../ExplorerWindowComponents";
import Styles from "./data-catalog-tab.scss";

interface DataCatalogTabProps {
  items?: readonly BaseModel[];
  searchPlaceholder?: string;
  onActionButtonClicked?: (item: CatalogMemberMixin.Instance) => void;
  /** Override the default toggleItemOnMap behavior (when "add/remove from map" button is clicked in the data preview panel) */
  onToggleItemOnMap?: (item: MappableMixin.Instance) => void;
  hideToggleItemOnMap?: boolean;
  hideSearch?: boolean;
  hideActionButton?: boolean;
  hideBreadcrumbs?: boolean;
  isLoadingTab?: boolean;
}

const DataCatalogTab = observer(function DataCatalogTab(
  props: DataCatalogTabProps
) {
  const viewState = useViewState();
  const { t } = useTranslation();

  const {
    searchState,
    previewedItem: previewed,
    breadcrumbsShown: viewStateBreadcrumbsShown,
    terria
  } = viewState;

  const searchPlaceholder: string =
    props.searchPlaceholder || t(($) => $.addData.searchPlaceholder);

  const changeSearchText = (newText: string) => {
    runInAction(() => {
      viewState.searchState.catalogSearchText = newText;
    });
  };

  const search = () => {
    viewState.searchState.searchCatalog();
  };

  return (
    <div className={Styles.root}>
      <Box fullHeight column>
        <Box fullHeight overflow="hidden">
          <Box className={Styles.dataExplorer} styledWidth="40%">
            {!props.hideSearch && searchState.catalogSearchProvider && (
              <ExplorerWindowComponents.DataCatalogSearch
                searchText={searchState.catalogSearchText}
                onSearchTextChanged={changeSearchText}
                onDoSearch={search}
                searchPlaceholder={searchPlaceholder}
              />
            )}
            <ExplorerWindowComponents.DataCatalog
              hideActionButton={props.hideActionButton}
              onActionButtonClicked={props.onActionButtonClicked}
              items={props.items}
              isLoading={props.isLoadingTab}
            />
          </Box>
          <Box styledWidth="60%">
            <DataPreview
              terria={terria}
              viewState={viewState}
              previewed={previewed}
              onToggleItemOnMap={props.onToggleItemOnMap}
              hideToggleItemOnMap={props.hideToggleItemOnMap}
            />
          </Box>
        </Box>

        {!props.hideBreadcrumbs && viewStateBreadcrumbsShown && (
          <Breadcrumbs
            terria={terria}
            viewState={viewState}
            previewed={previewed}
          />
        )}
      </Box>
    </div>
  );
});

export default DataCatalogTab;
