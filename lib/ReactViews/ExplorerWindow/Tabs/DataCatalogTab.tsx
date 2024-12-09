import { computed, runInAction, makeObservable } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import DataCatalog from "../../DataCatalog/DataCatalog";
import DataPreview from "../../Preview/DataPreview";
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
    items: PropTypes.array,
    searchPlaceholder: PropTypes.string,
    onActionButtonClicked: PropTypes.func,
    theme: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  constructor(props: any) {
    super(props);
    makeObservable(this);
  }

  @computed
  get searchPlaceholder() {
    // @ts-expect-error TS(2339): Property 't' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
    const { t } = this.props;
    // @ts-expect-error TS(2339): Property 'searchPlaceholder' does not exist on typ... Remove this comment to see the full error message
    return this.props.searchPlaceholder || t("addData.searchPlaceholder");
  }

  changeSearchText(newText: any) {
    runInAction(() => {
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.searchState.catalogSearchText = newText;
    });
  }

  search() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.viewState.searchState.searchCatalog();
  }

  render() {
    // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
    const terria = this.props.terria;
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    const searchState = this.props.viewState.searchState;
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    const previewed = this.props.viewState.previewedItem;
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    const showBreadcrumbs = this.props.viewState.breadcrumbsShown;
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
                  onSearchTextChanged={(val: any) => this.changeSearchText(val)}
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
                // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
                terria={this.props.terria}
                // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                viewState={this.props.viewState}
                // @ts-expect-error TS(2339): Property 'onActionButtonClicked' does not exist on... Remove this comment to see the full error message
                onActionButtonClicked={this.props.onActionButtonClicked}
                // @ts-expect-error TS(2339): Property 'items' does not exist on type 'Readonly<... Remove this comment to see the full error message
                items={this.props.items}
              />
            </Box>
            <Box styledWidth="60%">
              <DataPreview
                terria={terria}
                // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                viewState={this.props.viewState}
                previewed={previewed}
              />
            </Box>
          </Box>

          {showBreadcrumbs && (
            <Breadcrumbs
              // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
              terria={this.props.terria}
              // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
              viewState={this.props.viewState}
              previewed={previewed}
            />
          )}
        </Box>
      </div>
    );
  }
}

export default withTranslation()(withTheme(DataCatalogTab));
