import { action } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { useViewState } from "../../ReactViews/Context";
import ModalPopup from "../ExplorerWindow/ModalPopup";
import Styles from "./query-window.scss";
import classNames from "classnames";
import QueryTabAggregation from "./QueryTabAggregation";
import QueryTabTable from "./QueryTabTable";
import styled from "styled-components";
import { Button } from "../../Styled/Button";
import QueryableCatalogItemMixin from "../../ModelMixins/QueryableCatalogItemMixin";
import Terria from "../../Models/Terria";
import { useTranslation } from "react-i18next";

export interface TabPropsType {
  item: QueryableCatalogItemMixin.Instance;
  terria: Terria;
}

const Tabs: {
  [key: string]: { title: string; component: React.FC<TabPropsType> };
} = {
  chartView: {
    title: "queryTab.charts",
    component: QueryTabAggregation
  },

  tableView: {
    title: "queryTab.table",
    component: QueryTabTable
  }
};

export const QueryWindowElementName = "QueryData";

export default observer<React.FC>(function QueryWindow() {
  const { t } = useTranslation();
  const viewState = useViewState();

  const [currentTab, setCurrentTab] = React.useState<string>("chartView");

  const onClose = action(() => {
    viewState.closeQuery();
    viewState.switchMobileView("nowViewing");
  });

  const onStartAnimatingIn = action(() => {
    viewState.explorerPanelAnimating = true;
  });

  const onDoneAnimatingIn = action(() => {
    viewState.explorerPanelAnimating = false;
  });

  const isVisible =
    !viewState.useSmallScreenInterface &&
    !viewState.hideMapUi &&
    viewState.queryPanelIsVisible;

  if (!viewState.terria.itemToQuery) return null;

  const CurrentComponent = Tabs[currentTab].component;

  return (
    <ModalPopup
      viewState={viewState}
      isVisible={isVisible}
      isTopElement={viewState.topElement === QueryWindowElementName}
      onClose={onClose}
      onStartAnimatingIn={onStartAnimatingIn}
      onDoneAnimatingIn={onDoneAnimatingIn}
    >
      <div>
        <ul className={Styles.tabList} role="tablist">
          {Object.keys(Tabs).map((keyTab) => (
            <li key={keyTab} className={Styles.tabListItem} role="tab">
              <div
                style={{
                  marginTop: "17px",
                  marginLeft: "10px",
                  color: "white"
                }}
              >
                <ButtonTab
                  type="button"
                  key={keyTab}
                  onClick={() => {
                    setCurrentTab(keyTab);
                  }}
                  isCurrent={currentTab === keyTab}
                >
                  {t(Tabs[keyTab].title)}
                </ButtonTab>
              </div>
            </li>
          ))}
        </ul>
        <section className={classNames(Styles.tabPanel)}>
          <div className={Styles.panelContent}>
            {viewState.terria.itemToQuery &&
              QueryableCatalogItemMixin.isMixedInto(
                viewState.terria.itemToQuery
              ) && (
                <CurrentComponent
                  item={viewState.terria.itemToQuery}
                  terria={viewState.terria}
                />
              )}
          </div>
        </section>
      </div>
    </ModalPopup>
  );
});

const ButtonTab = styled(Button)<{ isCurrent: boolean }>`
  ${(props) => `
    background: transparent;
    font-size: $font-size-mid-small;
    padding: $padding-small;
    margin: $padding;
    height: 3vh;
    min-height: 3vh;
    border-radius: 3px;
    color: ${props.theme.textLight};
    &:hover,
    &:focus {
      background: ${props.theme.textLight};
      color: ${props.theme.colorPrimary};
    }
    ${
      props.isCurrent &&
      `
      background: ${props.theme.textLight};
      color: ${props.theme.colorPrimary};
    `
    }
  `}
`;
