import React from "react";
import { observer } from "mobx-react";

import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";

import DataCatalog from "../../DataCatalog/DataCatalog";
import DataPreview from "../../Preview/DataPreview";

import Styles from "./data-catalog-tab.scss";
import { runInAction, computed } from "mobx";

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
    return (
      <div className={Styles.root}>
        <div className={Styles.dataExplorer}>
          {/* TODO: Put this back once we add a MobX DataCatalogSearch Provider */}
          {/* <SearchBox
              searchText={this.props.viewState.searchState.catalogSearchText}
              onSearchTextChanged={this.changeSearchText}
              onDoSearch={this.search}
              placeholder={this.searchPlaceholder}
            /> */}
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
      </div>
    );
  }
}

module.exports = withTranslation()(DataCatalogTab);
