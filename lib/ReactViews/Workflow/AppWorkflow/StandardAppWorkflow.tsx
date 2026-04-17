import { action } from "mobx";
import { observer } from "mobx-react";
import { FC, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import AppWorkflow from "../../../Models/Workflows/AppWorkflows/AppWorkflow";
import Button from "../../../Styled/Button";
import { StyledIcon } from "../../../Styled/Icon";
import { Text } from "../../../Styled/Text";
import { useViewState } from "../../Context";
import SelectableDimension from "../../SelectableDimensions/SelectableDimension";
import { Panel as _GroupPanel } from "../Panel";
import triggerResize from "../../../Core/triggerResize";

interface PropsType {
  appWorkflow: AppWorkflow;
}

const StandardAppWorkflow: FC<PropsType> = observer(({ appWorkflow }) => {
  const terria = useViewState().terria;
  const [t] = useTranslation();
  const appWorkflowId = useMemo(() => createGuid(), [appWorkflow]);

  const dismissWorkflow = action(() => {
    terria.appWorkflow = undefined;
  });

  useEffect(() => {
    return () => {
      appWorkflow.onClose?.();
      // required to force leaflet to resize
      triggerResize();
    };
  }, [appWorkflow]);

  return (
    <MainPanel>
      <TitleBar>
        {appWorkflow.icon && <TitleIcon glyph={appWorkflow.icon} />}
        <Title>{appWorkflow.name}</Title>
        <CloseTextButton onClick={dismissWorkflow}>
          {t("appWorkflow.close")}
        </CloseTextButton>
      </TitleBar>

      <Content>
        {appWorkflow.inputs?.map((inputDim, _i) => {
          if (inputDim.disable) return null;

          return inputDim.type === "group" ? (
            <GroupPanel
              title={inputDim.name ?? inputDim.id}
              key={inputDim.id}
              isOpen={inputDim.isOpen ?? true}
              onToggle={inputDim.onToggle}
              collapsible
            >
              {inputDim.description && (
                <Description>{inputDim.description}</Description>
              )}
              {inputDim.selectableDimensions.map((childDim) => (
                <GroupItem key={childDim.id}>
                  <SelectableDimension
                    id={`${appWorkflowId}-${childDim.id}`}
                    dim={childDim}
                  />
                </GroupItem>
              ))}
            </GroupPanel>
          ) : (
            <SelectableDimension
              key={inputDim.id}
              id={`${appWorkflowId}-${inputDim.id}`}
              dim={inputDim}
            ></SelectableDimension>
          );
        })}
      </Content>
      <Footer>
        {appWorkflow.footer?.map((dim) => {
          if (dim.disable) return null;
          return (
            <SelectableDimension
              key={dim.id}
              id={`${appWorkflowId}-footer-${dim.id}`}
              dim={dim}
            ></SelectableDimension>
          );
        })}
      </Footer>
    </MainPanel>
  );
});

const MainPanel = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;

  width: ${(p) => p.theme.workbenchWidth}px;
  background-color: ${(p) => p.theme.dark};

  .workflowPanelTitleBar {
    padding: 15px;
  }

  .rc-slider-with-marks {
    // Because rc-slider uses absolute positioning, ensure enough spacing at bottom when slider marks are shown
    margin-bottom: 10px;
  }

  .rc-slider-mark-text-active {
    color: ${(p) => p.theme.textLight};
  }
`;

const Content = styled.div`
  flex: 1; // expand to fill remaining space
  overflow-y: auto; // Scroll if content overflows panel height
  overflow-x: hidden;

  display: flex;
  flex-direction: column;
  padding: 7px;
  gap: 15px;
`;

const Footer = styled.div`
  padding: 7px;
  flex-shrink: 0;
  margin-bottom: 20px;
  gap: 15px;
`;

const GroupPanel = styled(_GroupPanel)`
  border: 1px solid ${(p) => p.theme.darkLighter};

  padding: 0px;
  margin: 0px;

  .selectableDimensionGroup {
    padding: 0;
    background: none;
  }

  .selectableDimensionGroupItems {
    padding-left: 0;
    padding-right: 0;
  }

  .selectableDimensionGroupItems > .selectableDimension {
    padding-bottom: 10px;
  }
`;

const GroupItem = styled.div`
  border-bottom: 1px solid ${(p) => p.theme.darkLighter};
  padding: 15px;
`;

const TitleBar = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0.7em;
  border-bottom: 1px solid ${(p) => p.theme.darkLighter};
`;

const Title = styled(Text).attrs({
  textLight: true,
  extraExtraLarge: true
})`
  flex-grow: 1;
  padding: 0 1em;
`;

const TitleIcon = styled(StyledIcon).attrs({
  styledWidth: "24px",
  styledHeight: "24px",
  light: true
})``;

const CloseTextButton = styled(Button).attrs({
  primary: true
})`
  font-size: 14px;
`;

const Description = styled(Text).attrs({
  textLightDimmed: true,
  small: true
})`
  padding: 5px 15px;
`;

export default StandardAppWorkflow;
