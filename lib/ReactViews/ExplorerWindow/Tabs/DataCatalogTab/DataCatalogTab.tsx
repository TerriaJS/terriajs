import React, { FC } from "react";

import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import { runInAction } from "mobx";

import Terria from "../../../../Models/Terria";
import ViewState from "../../../../ReactViewModels/ViewState";
import Box from "../../../../Styled/Box";
import SearchBox, { DEBOUNCE_INTERVAL } from "../../../Search/SearchBox";
import { DataCatalog } from "../../../DataCatalog/DataCatalog";
import Breadcrumbs from "../../../Search/Breadcrumbs";
import DataPreview from "../../../Preview/DataPreview.jsx";
import { BaseModel } from "../../../../Models/Definition/Model";
import { observer } from "mobx-react";

interface IDataCatalogTabProps {
  viewState: ViewState;
  terria: Terria;
  items: readonly BaseModel[];
  searchPlaceholder: string;
  onActionButtonClicked?: (item: any) => void;
}

export const DataCatalogTab: FC<IDataCatalogTabProps> = observer(
  ({ viewState, terria, items, searchPlaceholder, onActionButtonClicked }) => {
    const { t } = useTranslation();
    const theme = useTheme();

    const changeSearchText = (newText: string) => {
      runInAction(() => {
        viewState.searchState.catalogSearchText = newText;
      });
    };

    const search = () => {
      viewState.searchState.searchCatalog();
    };

    const {
      searchState,
      previewedItem: previewed,
      breadcrumbsShown: showBreadcrumbs
    } = viewState;

    return (
      <Box fullHeight column flex="1">
        <Box fullHeight overflow="hidden">
          <Box
            styledWidth="40%"
            column
            backgroundColor={theme.modalSecondaryBg}
            paddedHorizontally
          >
            {searchState.catalogSearchProvider && (
              <Box css={{ margin: "10px 0" }}>
                <SearchBox
                  searchText={searchState.catalogSearchText}
                  onSearchTextChanged={changeSearchText}
                  onDoSearch={search}
                  placeholder={
                    searchPlaceholder || t("addData.searchPlaceholder")
                  }
                  debounceDuration={
                    terria.catalogReferencesLoaded &&
                    searchState.catalogSearchProvider
                      ? searchState.catalogSearchProvider
                          .debounceDurationOnceLoaded
                      : DEBOUNCE_INTERVAL
                  }
                />
              </Box>
            )}
            <DataCatalog
              terria={terria}
              viewState={viewState}
              onActionButtonClicked={onActionButtonClicked}
              items={items}
              removable={false}
            />
          </Box>
          <Box styledWidth="60%">
            <DataPreview
              terria={terria}
              viewState={viewState}
              previewed={previewed}
            />
          </Box>
        </Box>

        {showBreadcrumbs && (
          <Breadcrumbs
            terria={terria}
            viewState={viewState}
            previewed={previewed}
          />
        )}
      </Box>
    );
  }
);
