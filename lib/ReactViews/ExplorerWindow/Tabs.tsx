import classNames from "classnames";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import styled from "styled-components";
import defined from "terriajs-cesium/Source/Core/defined";
import MappableMixin from "../../ModelMixins/MappableMixin";
import Styles from "./tabs.scss";
import DataCatalogTab from "./Tabs/DataCatalogTab";
import MyDataTab from "./Tabs/MyDataTab/MyDataTab";

@observer
class Tabs extends React.Component {
  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    tabs: PropTypes.array,
    t: PropTypes.func.isRequired
  };

  async onFileAddFinished(files: any) {
    const file = files.find((f: any) => MappableMixin.isMixedInto(f));
    if (file) {
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      const result = await this.props.viewState.viewCatalogMember(file);
      if (result.error) {
        // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
        result.raiseError(this.props.terria);
      } else {
        if (!file.disableZoomTo) {
          // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
          this.props.terria.currentViewer.zoomTo(file, 1);
        }
      }
    }
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.viewState.myDataIsUploadView = false;
  }

  async onUrlAddFinished() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.viewState.openAddData();
  }

  getTabs() {
    // @ts-expect-error TS(2339): Property 't' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
    const { t } = this.props;
    // This can be passed in as prop
    // @ts-expect-error TS(2339): Property 'tabs' does not exist on type 'Readonly<{... Remove this comment to see the full error message
    if (this.props.tabs) {
      // @ts-expect-error TS(2339): Property 'tabs' does not exist on type 'Readonly<{... Remove this comment to see the full error message
      return this.props.tabs;
    }

    const myDataTab = {
      title: "my-data",
      name: t("addData.myData"),
      category: "my-data",
      panel: (
        <MyDataTab
          // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
          terria={this.props.terria}
          // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
          viewState={this.props.viewState}
          onFileAddFinished={(files: any) => this.onFileAddFinished(files)}
          onUrlAddFinished={() => this.onUrlAddFinished()}
        />
      )
    };

    // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
    if (this.props.terria.configParameters.tabbedCatalog) {
      return [].concat(
        // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
        this.props.terria.catalog.group.memberModels
          .filter(
            (member: any) =>
              member !== this.props.terria.catalog.userAddedDataGroup
          )
          // @ts-expect-error TS(7006): Parameter 'member' implicitly has an 'any' type.
          .map((member, _i) => ({
            name: member.nameInCatalog,
            title: `data-catalog-${member.name}`,
            category: "data-catalog",
            idInCategory: member.uniqueId,

            panel: (
              <DataCatalogTab
                // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
                terria={this.props.terria}
                // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                viewState={this.props.viewState}
                items={member.memberModels || [member]}
                searchPlaceholder={t("addData.searchPlaceholderWhole")}
              />
            )
          })),
        // @ts-expect-error TS(2769): No overload matches this call.
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
              // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
              terria={this.props.terria}
              // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
              viewState={this.props.viewState}
              // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
              items={this.props.terria.catalog.group.memberModels}
              searchPlaceholder={t("addData.searchPlaceholder")}
            />
          )
        },
        myDataTab
      ];
    }
  }

  async activateTab(category: any, idInCategory: any) {
    runInAction(() => {
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.activeTabCategory = category;
      // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
      if (this.props.terria.configParameters.tabbedCatalog) {
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        this.props.viewState.activeTabIdInCategory = idInCategory;
        if (category === "data-catalog") {
          // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
          const member = this.props.terria.catalog.group.memberModels.filter(
            (m: any) => m.uniqueId === idInCategory
          )[0];
          // If member was found and member can be opened, open it (causes CkanCatalogGroups to fetch etc.)
          if (defined(member)) {
            // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
            this.props.viewState
              .viewCatalogMember(member)
              .then((result: any) =>
                result.raiseError(this.props.viewState.terria)
              );
          }
        }
      }
    });
  }

  render() {
    const tabs = this.getTabs();
    const sameCategory = tabs.filter(
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      (t: any) => t.category === this.props.viewState.activeTabCategory
    );
    const currentTab =
      sameCategory.filter(
        (t: any) =>
          t.idInCategory === this.props.viewState.activeTabIdInCategory
      )[0] ||
      sameCategory[0] ||
      tabs[0];

    return (
      <div className={Styles.tabs}>
        <ul
          className={Styles.tabList}
          role="tablist"
          css={`
            background-color: ${(p: any) => p.theme.colorPrimary};
          `}
        >
          {tabs.map((item: any, i: any) => (
            <li
              key={i}
              id={"tablist--" + item.title}
              className={Styles.tabListItem}
              role="tab"
              aria-controls={"panel--" + item.title}
              aria-selected={item === currentTab}
            >
              <ButtonTab
                type="button"
                onClick={this.activateTab.bind(
                  this,
                  item.category,
                  item.idInCategory
                )}
                className={classNames(Styles.btnTab, {
                  // @ts-expect-error TS(2339): Property 'btnSelected' does not exist on type 'ITa... Remove this comment to see the full error message
                  [Styles.btnSelected]: item === currentTab
                })}
                // @ts-expect-error TS(2769): No overload matches this call.
                isCurrent={item === currentTab}
              >
                {item.name}
              </ButtonTab>
            </li>
          ))}
        </ul>

        <section
          key={currentTab.title}
          id={"panel--" + currentTab.title}
          // @ts-expect-error TS(2339): Property 'isActive' does not exist on type 'ITabsS... Remove this comment to see the full error message
          className={classNames(Styles.tabPanel, Styles.isActive)}
          aria-labelledby={"tablist--" + currentTab.title}
          role="tabpanel"
          // @ts-expect-error TS(2322): Type 'string' is not assignable to type 'number'.
          tabIndex="0"
        >
          <div className={Styles.panelContent}>{currentTab.panel}</div>
        </section>
      </div>
    );
  }
}

const ButtonTab = styled.button`
  ${(props) => `
    background: transparent;
    color: ${props.theme.textLight};
    &:hover,
    &:focus {
      background: ${props.theme.textLight};
      color: ${props.theme.colorPrimary};
    }
    ${
      // @ts-expect-error TS(2339): Property 'isCurrent' does not exist on type 'Theme... Remove this comment to see the full error message
      props.isCurrent &&
      `
      background: ${props.theme.textLight};
      color: ${props.theme.colorPrimary};
    `
    }

  `}
`;

export default withTranslation()(Tabs);
