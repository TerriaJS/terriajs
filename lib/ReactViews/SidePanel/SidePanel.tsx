import { observer } from "mobx-react";
import React from "react";
import { useTranslation, withTranslation } from "react-i18next";
import styled, { DefaultTheme, withTheme } from "styled-components";
import ViewState from "../../ReactViewModels/ViewState";
import Box from "../../Styled/Box";
import Button from "../../Styled/Button";
import Icon, { StyledIcon } from "../../Styled/Icon";
import Spacing from "../../Styled/Spacing";
import Text from "../../Styled/Text";
import { ExplorerWindowElementName } from "../ExplorerWindow/ExplorerWindow";
import { useRefForTerria } from "../Hooks/useRefForTerria";
import SearchBoxAndResults from "../Search/SearchBoxAndResults";
import { withViewState } from "../Context";
import Workbench from "../Workbench/Workbench";
import { applyTranslationIfExists } from "../../Language/languageHelpers";
import { Ul } from "../../Styled/List";

const BoxHelpfulHints = styled(Box)``;

const ResponsiveSpacing = styled(Box)`
  height: 110px;
  height: 110px;
  // Hardcoded px value, TODO: make it not hardcoded
  @media (max-height: 700px) {
    height: 3vh;
  }
  @media (max-height: 700px) {
    height: 3vh;
  }
`;

const HelpfulHintsIcon = () => {
  return (
    <StyledIcon
      glyph={Icon.GLYPHS.bulb}
      styledWidth={"14px"}
      styledHeight={"14px"}
      light
      css={`
        padding: 2px 1px;
      `}
    />
  );
};

interface EmptyWorkbenchProps {
  theme: DefaultTheme;
}

const StyledUl = styled(Ul)`
  margin-top: 5px;
  li {
    &:first-child {
      margin-top: 0;
    }
  }
`;

const EmptyWorkbench: React.FC<EmptyWorkbenchProps> = (props) => {
  const { t } = useTranslation();
  return (
    <StyledUl
      overflowY="auto"
      overflowX="hidden"
      scroll
      fullWidth
      fullHeight
      column
    >
      <Text large textLight>
        <Box column fullWidth justifySpaceBetween>
          <Box centered column>
            <ResponsiveSpacing />
            <Text large color={props.theme.textLightDimmed}>
              {t("emptyWorkbench.emptyArea")}
            </Text>
            <ResponsiveSpacing />
          </Box>
          <BoxHelpfulHints column paddedRatio={3} overflowY="auto" scroll>
            <Box left>
              <Text extraLarge bold>
                {t("emptyWorkbench.helpfulHints")}
              </Text>
            </Box>
            <Spacing bottom={4} />
            <Box>
              <HelpfulHintsIcon />
              <Spacing right={1} />
              <Text medium light>
                {t("emptyWorkbench.helpfulHintsOne")}
              </Text>
            </Box>
            <Spacing bottom={3} />
            <Box>
              <HelpfulHintsIcon />
              <Spacing right={1} />
              <Text medium light>
                {t("emptyWorkbench.helpfulHintsTwo")}
              </Text>
            </Box>
            <Spacing bottom={3} />
            <Box>
              <HelpfulHintsIcon />
              <Spacing right={1} />
              <Text medium light>
                {t("emptyWorkbench.helpfulHintsThree")}
              </Text>
            </Box>
            <ResponsiveSpacing />
          </BoxHelpfulHints>
        </Box>
      </Text>
    </StyledUl>
  );
};

type SidePanelButtonProps = {
  btnText?: string;
} & React.ComponentPropsWithoutRef<typeof Button>;

const SidePanelButton = React.forwardRef<
  HTMLButtonElement,
  SidePanelButtonProps
>(function SidePanelButton(props, ref) {
  const { btnText, ...rest } = props;
  return (
    <Button
      primary
      ref={ref}
      renderIcon={props.children && (() => props.children)}
      textProps={{
        large: true
      }}
      {...rest}
    >
      {btnText ? btnText : ""}
    </Button>
  );
});

export const EXPLORE_MAP_DATA_NAME = "ExploreMapDataButton";
export const SIDE_PANEL_UPLOAD_BUTTON_NAME = "SidePanelUploadButton";

interface SidePanelProps {
  viewState: ViewState;
  refForExploreMapData: React.Ref<HTMLButtonElement>;
  refForUploadData: React.Ref<HTMLButtonElement>;
  theme: DefaultTheme;
}

const SidePanel = observer<React.FC<SidePanelProps>>(
  ({ viewState, theme, refForExploreMapData, refForUploadData }) => {
    const terria = viewState.terria;
    const { t, i18n } = useTranslation();
    const onAddDataClicked: React.MouseEventHandler<HTMLButtonElement> = (
      e
    ) => {
      e.stopPropagation();
      viewState.setTopElement(ExplorerWindowElementName);
      viewState.openAddData();
    };

    const onAddLocalDataClicked: React.MouseEventHandler<HTMLButtonElement> = (
      e
    ) => {
      e.stopPropagation();
      viewState.setTopElement(ExplorerWindowElementName);
      viewState.openUserData();
    };

    const addData = t("addData.addDataBtnText");
    const uploadText = t("models.catalog.upload");
    return (
      <Box column styledMinHeight={"0"} flex={1}>
        <div
          css={`
            padding: 0 5px;
          `}
        >
          <SearchBoxAndResults
            viewState={viewState}
            terria={terria}
            placeholder={applyTranslationIfExists(
              terria.searchBarModel.placeholder,
              i18n
            )}
          />
          <Spacing bottom={2} />
          <Box justifySpaceBetween>
            <SidePanelButton
              ref={refForExploreMapData}
              onClick={onAddDataClicked}
              title={addData}
              btnText={addData}
              styledWidth={"200px"}
            >
              <StyledIcon glyph={Icon.GLYPHS.add} light styledWidth={"20px"} />
            </SidePanelButton>
            <SidePanelButton
              ref={refForUploadData}
              onClick={onAddLocalDataClicked}
              title={t("addData.load")}
              btnText={uploadText}
              styledWidth={"130px"}
            >
              <StyledIcon
                glyph={Icon.GLYPHS.uploadThin}
                light
                styledWidth={"20px"}
              />
            </SidePanelButton>
          </Box>
          <Spacing bottom={1} />
        </div>
        <Box
          styledMinHeight={"0"}
          flex={1}
          css={`
            overflow: hidden;
          `}
        >
          {terria.workbench.items && terria.workbench.items.length > 0 ? (
            <Workbench viewState={viewState} terria={terria} />
          ) : (
            <EmptyWorkbench theme={theme} />
          )}
        </Box>
      </Box>
    );
  }
);

// Used to create two refs for <SidePanel /> to consume, rather than
// using the withTerriaRef() HOC twice, designed for a single ref
const SidePanelWithRefs: React.FC<
  Omit<SidePanelProps, "refForExploreMapData" | "refForUploadData">
> = (props) => {
  const refForExploreMapData = useRefForTerria(
    EXPLORE_MAP_DATA_NAME,
    props.viewState
  );
  const refForUploadData = useRefForTerria(
    SIDE_PANEL_UPLOAD_BUTTON_NAME,
    props.viewState
  );
  return (
    <SidePanel
      {...props}
      refForExploreMapData={
        refForExploreMapData as React.Ref<HTMLButtonElement>
      }
      refForUploadData={refForUploadData as React.Ref<HTMLButtonElement>}
    />
  );
};

export default withTranslation()(withViewState(withTheme(SidePanelWithRefs)));
