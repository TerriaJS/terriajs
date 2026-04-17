import { observer } from "mobx-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import MenuPanel from "../../../StandardUserInterface/customizable/MenuPanel";
import { useViewState } from "../../../Context";
import CountDatasets from "./CountDatasets";
import EditCesiumSettings from "./EditCesiumSettings";
import Styles from "./tools-panel.scss";
import styled from "styled-components";

const DevToolsPanel = observer(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [resultsMessage, setResultsMessage] = useState("");
  const dropdownTheme = {
    btn: Styles.btnShare,
    outer: Styles.ToolsPanel,
    inner: Styles.dropdownInner,
    icon: "settings"
  };
  const { t } = useTranslation();
  const viewState = useViewState();
  return (
    <MenuPanel
      theme={dropdownTheme}
      btnText={t("toolsPanel.btnText")}
      viewState={viewState}
      btnTitle={t("toolsPanel.btnTitle")}
      onOpenChanged={setIsOpen}
      isOpen={isOpen}
      smallScreen={viewState.useSmallScreenInterface}
    >
      <MenuItems>
        {isOpen && <EditCesiumSettings closePanel={() => setIsOpen(false)} />}
        {isOpen && <CountDatasets updateResults={setResultsMessage} />}
        <div className={Styles.results}>
          {/* eslint-disable-next-line react/no-danger */}
          <div dangerouslySetInnerHTML={{ __html: resultsMessage }} />
        </div>
      </MenuItems>
    </MenuPanel>
  );
});

const MenuItems = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 20px;
`;

export default DevToolsPanel;
