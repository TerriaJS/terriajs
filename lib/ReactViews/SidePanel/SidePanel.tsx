import { observer } from "mobx-react";
import {
  FC,
  ComponentPropsWithoutRef,
  Ref,
  MouseEventHandler,
  forwardRef
} from "react";
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
import { useViewState, withViewState } from "../Context";
import Workbench from "../Workbench/Workbench";
import { applyTranslationIfExists } from "../../Language/languageHelpers";
import { Category, HelpAction } from "../../Core/AnalyticEvents/analyticEvents";
import { runInAction } from "mobx";

const BoxHelpfulHints = styled(Box)`
  align-self: flex-end;
  margin-top: auto;
  color: ${(p) => p.theme.greyLighter};
`;

interface EmptyWorkbenchProps {
  theme: DefaultTheme;
}

type TransContent = {
  heading?: string;
  body?: string;
  list?: string[];
}[];

const EmptyWorkbench: FC<EmptyWorkbenchProps> = observer(() => {
  const { t } = useTranslation();
  const viewState = useViewState();
  const transContent = t("emptyWorkbench", {
    returnObjects: true
  }) as TransContent;

  return (
    <Box overflowY="auto" scroll column fullWidth>
      {/*hacky margin fix for spacing */}
      <Text medium light>
        <BoxHelpfulHints
          column
          gap={4}
          paddedVertically={5}
          paddedRatio={3}
          overflowY="auto"
          scroll
        >
          {transContent.map((content, idx) => (
            <div key={idx}>
              {content.heading && (
                <Text
                  css="margin-bottom: 5px; margin-top: 0"
                  as="h5"
                  medium
                  bold
                >
                  {content.heading}{" "}
                </Text>
              )}
              {content.body && <Text medium>{content.body}</Text>}
              {content.list && (
                <ul css="padding-inline-start: 25px; margin: 0">
                  {content.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <Box centered css="margin-top: 25px">
            <Button
              textLight
              transparentBg
              onClick={() => {
                viewState.terria.analytics?.logEvent(
                  Category.help,
                  HelpAction.takeTour
                );
                runInAction(() => {
                  viewState.setTourIndex(0);
                });
              }}
              renderIcon={() => (
                <StyledIcon
                  light
                  styledWidth={"18px"}
                  glyph={Icon.GLYPHS.info}
                />
              )}
              textProps={{
                large: true,
                textLight: true
              }}
              css={``}
            >
              {t("helpPanel.takeTour")}
            </Button>
          </Box>
        </BoxHelpfulHints>
      </Text>
    </Box>
  );
});

type SidePanelButtonProps = {
  btnText?: string;
} & ComponentPropsWithoutRef<typeof Button>;

const SidePanelButton = forwardRef<HTMLButtonElement, SidePanelButtonProps>(
  function SidePanelButton(props, ref) {
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
  }
);

export const EXPLORE_MAP_DATA_NAME = "ExploreMapDataButton";
export const SIDE_PANEL_UPLOAD_BUTTON_NAME = "SidePanelUploadButton";

interface SidePanelProps {
  viewState: ViewState;
  refForExploreMapData: Ref<HTMLButtonElement>;
  refForUploadData: Ref<HTMLButtonElement>;
  theme: DefaultTheme;
}

const SidePanel = observer<React.FC<SidePanelProps>>(
  ({ viewState, theme, refForExploreMapData, refForUploadData }) => {
    const terria = viewState.terria;
    const { t, i18n } = useTranslation();
    const onAddDataClicked: MouseEventHandler<HTMLButtonElement> = (e) => {
      e.stopPropagation();
      viewState.setTopElement(ExplorerWindowElementName);
      viewState.openAddData();
    };

    const onAddLocalDataClicked: MouseEventHandler<HTMLButtonElement> = (e) => {
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
            padding: 0 15px;
            background: none;
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
              styledWidth={"152px"}
            >
              <StyledIcon glyph={Icon.GLYPHS.add} light styledWidth={"20px"} />
            </SidePanelButton>
            <SidePanelButton
              ref={refForUploadData}
              onClick={onAddLocalDataClicked}
              title={t("addData.load")}
              btnText={uploadText}
              styledWidth={"152px"}
            >
              <StyledIcon
                glyph={Icon.GLYPHS.uploadThin}
                light
                styledWidth={"20px"}
              />
            </SidePanelButton>
          </Box>
          <Spacing bottom={2} />
        </div>
        <Box
          fullHeight
          column
          flex={1}
          css={`
            overflow: hidden;
          `}
        >
          {terria.workbench.items.length > 0 ? (
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
const SidePanelWithRefs: FC<
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
      refForExploreMapData={refForExploreMapData as Ref<HTMLButtonElement>}
      refForUploadData={refForUploadData as Ref<HTMLButtonElement>}
    />
  );
};

export default withTranslation()(withViewState(withTheme(SidePanelWithRefs)));
