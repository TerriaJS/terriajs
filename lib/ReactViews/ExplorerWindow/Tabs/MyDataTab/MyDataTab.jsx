import React from "react";
import classNames from "classnames";
import createReactClass from "create-react-class";
import Icon from "../../../Icon.jsx";
import PropTypes from "prop-types";

import DataCatalog from "../../../DataCatalog/DataCatalog.jsx";
import DataPreview from "../../../Preview/DataPreview.jsx";
import AddData from "./AddData.jsx";
import ObserveModelMixin from "../../../ObserveModelMixin";
import { withTranslation, Trans } from "react-i18next";

import Styles from "./my-data-tab.scss";

// My data tab include Add data section and preview section
const MyDataTab = createReactClass({
  displayName: "MyDataTab",
  mixins: [ObserveModelMixin],

  propTypes: {
    terria: PropTypes.object,
    viewState: PropTypes.object,
    t: PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      activeTab: null
    };
  },

  hasUserAddedData() {
    return this.props.terria.catalog.userAddedDataGroup.items.length > 0;
  },

  changeTab(active) {
    this.setState({
      activeTab: active
    });
  },

  resetTab() {
    this.setState({
      activeTab: null
    });
  },

  renderTabs() {
    const { t } = this.props;
    const tabs = [
      {
        id: "local",
        caption: t("addData.localTitle")
      },
      {
        id: "web",
        caption: t("addData.webTitle")
      }
    ];
    return (
      <ul className={Styles.tabList}>
        <For each="tab" of={tabs}>
          <li className={Styles.tabListItem} key={tab.id}>
            <button
              type="button"
              onClick={this.changeTab.bind(null, tab.id)}
              title={tab.caption}
              className={classNames(Styles.tabListBtn, {
                [Styles.isActive]: this.state.activeTab === tab.id
              })}
            >
              <Icon glyph={Icon.GLYPHS[tab.id]} />
              {tab.caption}
            </button>
          </li>
        </For>
      </ul>
    );
  },

  renderPromptBox() {
    if (this.hasUserAddedData()) {
      const { t } = this.props;
      return (
        <div className={Styles.dataTypeTab}>
          <div className={Styles.dndBox}>
            <Icon glyph={Icon.GLYPHS.upload} />
            {t("addData.dragDrop")}
          </div>
        </div>
      );
    }

    return (
      <div className={Styles.dataTypeTab}>
        <div className={Styles.dndBoxInfo}>
          <Trans i18nKey="addData.infoText">
            <div>Drag and drop a file here to view it locally on the map</div>
            <div>(it won’t be saved or uploaded to the internet)</div>
          </Trans>
          <div className={Styles.tabCenter}>{this.renderTabs()}</div>
        </div>
        <div className={Styles.dndBox}>
          <Icon glyph={Icon.GLYPHS.upload} />
        </div>
      </div>
    );
  },

  render() {
    const showTwoColumn = this.hasUserAddedData() & !this.state.activeTab;
    const { t } = this.props;
    return (
      <div className={Styles.root}>
        <div
          className={classNames({
            [Styles.leftCol]: showTwoColumn,
            [Styles.oneCol]: !showTwoColumn
          })}
        >
          <If condition={this.state.activeTab}>
            <button
              type="button"
              onClick={this.resetTab}
              className={Styles.btnBackToMyData}
            >
              <Icon glyph={Icon.GLYPHS.left} />
              {t("addData.back")}
            </button>
            <AddData
              terria={this.props.terria}
              viewState={this.props.viewState}
              activeTab={this.state.activeTab}
              resetTab={this.resetTab}
            />
          </If>
          <If condition={showTwoColumn}>
            <div className={Styles.addedData}>
              <p className={Styles.explanation}>
                <Trans i18nKey="addData.note">
                  <strong>Note: </strong>Data added in this way is not saved or
                  made visible to others.
                </Trans>
              </p>
              <div className={Styles.tabLeft}>{this.renderTabs()}</div>

              <ul className={Styles.dataCatalog}>
                <DataCatalog
                  items={this.props.terria.catalog.userAddedDataGroup.items}
                  removable={true}
                  viewState={this.props.viewState}
                  terria={this.props.terria}
                />
              </ul>
            </div>
          </If>
          <If condition={!this.state.activeTab}>{this.renderPromptBox()}</If>
        </div>
        <If condition={showTwoColumn}>
          <DataPreview
            terria={this.props.terria}
            viewState={this.props.viewState}
            previewed={this.props.viewState.userDataPreviewedItem}
          />
        </If>
      </div>
    );
  }
});

module.exports = withTranslation()(MyDataTab);
