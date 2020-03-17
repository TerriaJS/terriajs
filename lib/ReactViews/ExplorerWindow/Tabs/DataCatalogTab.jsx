import React from "react";
import URI from "urijs";
import createReactClass from "create-react-class";

import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import DataCatalog from "../../DataCatalog/DataCatalog.jsx";
import DataPreview from "../../Preview/DataPreview.jsx";
import ObserveModelMixin from "../../ObserveModelMixin";
import SearchBox from "../../Search/SearchBox.jsx";
import { withTranslation } from "react-i18next";

import Styles from "./data-catalog-tab.scss";

// The DataCatalog Tab
const DataCatalogTab = createReactClass({
  displayName: "DataCatalogTab",
  mixins: [ObserveModelMixin],

  propTypes: {
    terria: PropTypes.object,
    viewState: PropTypes.object,
    match: PropTypes.object,
    items: PropTypes.array,
    t: PropTypes.func.isRequired
  },

  changeSearchText(newText) {
    this.props.viewState.searchState.catalogSearchText = newText;
  },

  search() {
    this.props.viewState.searchState.searchCatalog();
  },

  render() {
    const { t } = this.props;
    const terria = this.props.terria;
    const idToDecode =
      this.props.match.params && this.props.match.params.catalogMemberId;
    const cleanPath = URI.decode(idToDecode);
    const previewedItem = this.props.terria.catalog.shareKeyIndex[cleanPath];

    return (
      <div className={Styles.root}>
        <div className={Styles.dataExplorer}>
          <SearchBox
            searchText={this.props.viewState.searchState.catalogSearchText}
            onSearchTextChanged={this.changeSearchText}
            onDoSearch={this.search}
            placeholder={t("addData.searchPlaceholder")}
          />
          <DataCatalog
            terria={this.props.terria}
            viewState={this.props.viewState}
            items={this.props.items}
          />
        </div>
        <DataPreview
          terria={terria}
          viewState={this.props.viewState}
          // previewed={this.props.viewState.previewedItem}
          previewed={previewedItem}
        />
      </div>
    );
  }
});

module.exports = withRouter(withTranslation()(DataCatalogTab));
