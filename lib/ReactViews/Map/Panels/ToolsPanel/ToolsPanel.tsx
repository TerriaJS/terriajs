"use strict";

import { observer } from "mobx-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import MenuPanel from "../../../StandardUserInterface/customizable/MenuPanel";
import { useViewState } from "../../../Context";
import DropdownStyles from "../panel.scss";
import CountDatasets from "./CountDatasets";
import Styles from "./tools-panel.scss";

const ToolsPanel = observer(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [resultsMessage, setResultsMessage] = useState("");
  const dropdownTheme = {
    // @ts-expect-error TS(2339): Property 'btnShare' does not exist on type 'ITools... Remove this comment to see the full error message
    btn: Styles.btnShare,
    // @ts-expect-error TS(2551): Property 'ToolsPanel' does not exist on type 'IToo... Remove this comment to see the full error message
    outer: Styles.ToolsPanel,
    inner: Styles.dropdownInner,
    icon: "settings"
  };
  const { t } = useTranslation();
  const viewState = useViewState();
  return (
    // @ts-expect-error TS(2322): Type '{ children: (false | Element)[]; theme: { bt... Remove this comment to see the full error message
    <MenuPanel
      theme={dropdownTheme}
      btnText={t("toolsPanel.btnText")}
      viewState={viewState}
      btnTitle={t("toolsPanel.btnTitle")}
      onOpenChanged={setIsOpen}
      isOpen={isOpen}
      smallScreen={viewState.useSmallScreenInterface}
    >
      {isOpen && (
        <div className={DropdownStyles.section}>
          // @ts-expect-error TS(2339): Property 'this' does not exist on type
          'IToolsPane... Remove this comment to see the full error message
          <div className={Styles.this}>
            <CountDatasets updateResults={setResultsMessage} />
          </div>
        </div>
      )}
      <div className={Styles.results}>
        {/* eslint-disable-next-line react/no-danger */}
        <div dangerouslySetInnerHTML={{ __html: resultsMessage }} />
      </div>
    </MenuPanel>
  );
});

export default ToolsPanel;
