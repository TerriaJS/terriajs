import { computed, runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import DataCatalog from "../../DataCatalog/DataCatalog";
import DataPreview from "../../Preview/DataPreview";
import SearchBox, { DEBOUNCE_INTERVAL } from "../../Search/SearchBox.jsx";
import Styles from "./data-catalog-tab.scss";
import Box from "../../../Styled/Box"

// The DataCatalog Tab
@observer
class DataCatalogTab extends React.Component {
  static propTypes = {
    terria: PropTypes.object,
    viewState: PropTypes.object,
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
    console.log(this.props.theme);
    const terria = this.props.terria;
    const searchState = this.props.viewState.searchState;
    return (
      <div className={Styles.root}>
        <div
          className={Styles.dataExplorer}
          css={`
            height: calc(100% - 32px);
          `}
        >
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
                  ? searchState.catalogSearchProvider.debounceDurationOnceLoaded
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
        </div>
        <DataPreview
          terria={terria}
          viewState={this.props.viewState}
          previewed={this.props.viewState.previewedItem}
        />
        {searchState.catalogSearchText.length > 0 && (
          <Box
            styledHeight={"32px"}
            bgColor={this.props.theme.greyLighter}
          >

          </Box>
        )}
      </div>
    );
  }
}

module.exports = withTranslation()(withTheme(DataCatalogTab));
