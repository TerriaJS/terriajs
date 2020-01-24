import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import classNames from "classnames";

import DataCatalogTab from "./Tabs/DataCatalogTab.jsx";
import MyDataTab from "./Tabs/MyDataTab/MyDataTab.jsx";
import ObserveModelMixin from "../ObserveModelMixin";
import defined from "terriajs-cesium/Source/Core/defined";
import { withTranslation } from "react-i18next";

import Styles from "./tabs.scss";

const Tabs = createReactClass({
  displayName: "Tabs",
  mixins: [ObserveModelMixin],

  propTypes: {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    tabs: PropTypes.array,
    t: PropTypes.func.isRequired
  },

  getTabs() {
    const { t } = this.props;
    // This can be passed in as prop
    if (this.props.tabs) {
      return this.props.tabs;
    }

    const myDataTab = {
      title: "my-data",
      name: t("addData.myData"),
      category: "my-data",
      panel: (
        <MyDataTab
          terria={this.props.terria}
          viewState={this.props.viewState}
        />
      )
    };

    if (this.props.terria.configParameters.tabbedCatalog) {
      return [].concat(
        this.props.terria.catalog.group.items
          .filter(
            member => member !== this.props.terria.catalog.userAddedDataGroup
          )
          .map((member, i) => ({
            name: member.nameInCatalog,
            title: `data-catalog-${member.name}`,
            category: "data-catalog",
            idInCategory: member.name,
            panel: (
              <DataCatalogTab
                terria={this.props.terria}
                viewState={this.props.viewState}
                items={member.items || [member]}
                searchPlaceholder={t("addData.searchPlaceholderWhole")}
              />
            )
          })),
        [myDataTab]
      );
    } else {
      return [
        {
          name: t("addData.dataCatalogue"),
          title: "data-catalog",
          category: "data-catalog",
          panel: (
            <DataCatalogTab
              terria={this.props.terria}
              viewState={this.props.viewState}
              items={this.props.terria.catalog.group.items}
              searchPlaceholder={t("addData.searchPlaceholder")}
            />
          )
        },
        myDataTab
      ];
    }
  },

  activateTab(category, idInCategory) {
    this.props.viewState.activeTabCategory = category;
    if (this.props.terria.configParameters.tabbedCatalog) {
      this.props.viewState.activeTabIdInCategory = idInCategory;
      if (category === "data-catalog") {
        const member = this.props.terria.catalog.group.items.filter(
          m => m.name === idInCategory
        )[0];
        // If member was found and member can be opened, open it (causes CkanCatalogGroups to fetch etc.)
        if (defined(member)) {
          if (member.toggleOpen) {
            member.isOpen = true;
          }
          this.props.viewState.previewedItem = member;
        }
      }
    }
  },

  render() {
    const tabs = this.getTabs();
    const sameCategory = tabs.filter(
      t => t.category === this.props.viewState.activeTabCategory
    );
    const currentTab =
      sameCategory.filter(
        t => t.idInCategory === this.props.viewState.activeTabIdInCategory
      )[0] ||
      sameCategory[0] ||
      tabs[0];

    return (
      <div className={Styles.tabs}>
        <ul className={Styles.tabList} role="tablist">
          <For each="item" index="i" of={tabs}>
            <li
              key={i}
              id={"tablist--" + item.title}
              className={Styles.tabListItem}
              role="tab"
              aria-controls={"panel--" + item.title}
              aria-selected={item === currentTab}
            >
              <button
                type="button"
                onClick={this.activateTab.bind(
                  this,
                  item.category,
                  item.idInCategory
                )}
                className={classNames(Styles.btnTab, {
                  [Styles.btnSelected]: item === currentTab
                })}
              >
                {item.name}
              </button>
            </li>
          </For>
        </ul>

        <section
          key={currentTab.title}
          id={"panel--" + currentTab.title}
          className={classNames(Styles.tabPanel, Styles.isActive)}
          aria-labelledby={"tablist--" + currentTab.title}
          role="tabpanel"
          tabIndex="0"
        >
          <div className={Styles.panelContent}>{currentTab.panel}</div>
        </section>
      </div>
    );
  }
});

module.exports = withTranslation()(Tabs);
