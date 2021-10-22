import { computed, runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import URI from "urijs";

import { BaseModel } from "../../../Models/Definition/Model";
import { withRouter } from "react-router-dom";
import DataCatalog from "../../DataCatalog/DataCatalog.jsx";
import DataPreview from "../../Preview/DataPreview.jsx";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import SearchBox, { DEBOUNCE_INTERVAL } from "../../Search/SearchBox.jsx";
import Styles from "./data-catalog-tab.scss";
import Breadcrumbs from "../../Search/Breadcrumbs";
import Box from "../../../Styled/Box";

// The DataCatalog Tab
@observer
class DataCatalogTab extends React.Component {
  static propTypes = {
    terria: PropTypes.object,
    viewState: PropTypes.object,
    match: PropTypes.object,
    items: PropTypes.array,
    searchPlaceholder: PropTypes.string,
    overrideState: PropTypes.string,
    onActionButtonClicked: PropTypes.func,
    theme: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  @computed
  get searchPlaceholder() {
    const { t } = this.props;
    return this.props.searchPlaceholder || t("addData.searchPlaceholder");
  }

  changeSearchText(newText) {
    runInAction(() => {
      this.props.viewState.searchState.catalogSearchText = newText;
    });
  }

  search() {
    this.props.viewState.searchState.searchCatalog();
  }

  render() {
    const terria = this.props.terria;
    const searchState = this.props.viewState.searchState;
    const showBreadcrumbs = this.props.viewState.breadcrumbsShown;

    const idToDecode =
      this.props.match.params && this.props.match.params.catalogMemberId;
    const cleanPath = URI.decode(idToDecode);
    // TODO
    // Below are two older methods of grabbing previewed item, we may want to
    // tweak this later when we tackle the problem of nested IDs/routes

    // const previewed = this.props.viewState.previewedItem;
    // const previewedItem = this.props.terria.catalog.shareKeyIndex?.[cleanPath];

    /**
     * We do a lookup on the ID via the route, rather than
     * `viewState.previewItem` as the URL is the source of truth for current
     * previewed ID
     */
    const previewedItem = this.props.terria.getModelById(BaseModel, cleanPath);

    return (
      <div className={Styles.root}>
        <Box fullHeight column>
          <Box fullHeight overflow="hidden">
            <Box className={Styles.dataExplorer} styledWidth="40%">
              {/* ~TODO: Put this back once we add a MobX DataCatalogSearch Provider~ */}
              {/* TODO2: Implement a more generic MobX DataCatalogSearch */}
              {searchState.catalogSearchProvider && (
                <SearchBox
                  searchText={searchState.catalogSearchText}
                  onSearchTextChanged={val => this.changeSearchText(val)}
                  onDoSearch={() => this.search()}
                  placeholder={this.searchPlaceholder}
                  debounceDuration={
                    terria.catalogReferencesLoaded &&
                    searchState.catalogSearchProvider
                      ? searchState.catalogSearchProvider
                          .debounceDurationOnceLoaded
                      : DEBOUNCE_INTERVAL
                  }
                />
              )}
              <DataCatalog
                terria={this.props.terria}
                viewState={this.props.viewState}
                overrideState={this.props.overrideState}
                onActionButtonClicked={this.props.onActionButtonClicked}
                items={this.props.items}
              />
            </Box>
            <Box styledWidth="60%">
              <DataPreview
                terria={terria}
                viewState={this.props.viewState}
                previewed={previewedItem}
              />
            </Box>
          </Box>

          {showBreadcrumbs && (
            <Breadcrumbs
              terria={this.props.terria}
              viewState={this.props.viewState}
              previewed={previewedItem}
            />
          )}
        </Box>
      </div>
    );
  }
}

export default withRouter(withTranslation()(withTheme(DataCatalogTab)));
