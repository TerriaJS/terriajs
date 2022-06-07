import classNames from "classnames";
import "inobounce";
import { action } from "mobx";
import { observer } from "mobx-react";
import React, { useEffect, useRef } from "react";
import { useTranslation, withTranslation } from "react-i18next";
import {
  createGlobalStyle,
  DefaultTheme,
  ThemeProvider
} from "styled-components";
import combine from "terriajs-cesium/Source/Core/combine";
import arrayContains from "../../Core/arrayContains";
import ViewState from "../../ReactViewModels/ViewState";
import Disclaimer from "../Disclaimer";
import DragDropFile from "../DragDropFile";
import DragDropNotification from "../DragDropNotification";
import ExplorerWindow from "../ExplorerWindow/ExplorerWindow";
import FeatureInfoPanel from "../FeatureInfo/FeatureInfoPanel";
import FeedbackForm from "../Feedback/FeedbackForm";
import { Medium, Small } from "../Generic/Responsive";
import SatelliteHelpPrompt from "../HelpScreens/SatelliteHelpPrompt";
import withFallback from "../HOCs/withFallback";
import ExperimentalFeatures from "../Map/ExperimentalFeatures";
import CollapsedNavigation from "../Map/Navigation/Items/OverflowNavigationItem";
import HelpPanel from "../Map/Panels/HelpPanel/HelpPanel";
import PrintView from "../Map/Panels/SharePanel/Print/PrintView";
import ProgressBar from "../Map/ProgressBar";
import TrainerBar from "../Map/TrainerBar/TrainerBar";
import MobileHeader from "../Mobile/MobileHeader";
import MapInteractionWindow from "../Notification/MapInteractionWindow";
import Notification from "../Notification/Notification";
import Branding from "../SidePanel/Branding";
import FullScreenButton from "../SidePanel/FullScreenButton";
import SidePanel from "../SidePanel/SidePanel";
import StoryBuilder from "../Story/StoryBuilder";
import StoryPanel from "../Story/StoryPanel/StoryPanel";
import Tool from "../Tools/Tool";
import TourPortal from "../Tour/TourPortal";
import WelcomeMessage from "../WelcomeMessage/WelcomeMessage";
import SelectableDimensionWorkflow from "../Workflow/SelectableDimensionWorkflow";
import MapColumn from "./MapColumn";
import processCustomElements from "./processCustomElements";
import SidePanelContainer from "./SidePanelContainer";
import Styles from "./standard-user-interface.scss";
import { terriaTheme } from "./StandardTheme";
import WorkflowPanelContainer from "./WorkflowPanelContainer";

const GlobalTerriaStyles = createGlobalStyle`
  body {
    font-family: ${p => p.theme.fontBase}

    *:focus {
      outline: 3px solid #C390F9;
    }
  }

  // Theme-ify sass classes until they are removed

  // We override the primary, secondary, map and share buttons here as they
  // are imported everywhere and used in various ways - until we remove sass
  // this is the quickest way to tackle them for now
  .tjs-_buttons__btn--map {
    ${p => p.theme.addTerriaMapBtnStyles(p)}
  }

  .tjs-_buttons__btn-primary {
    ${p => p.theme.addTerriaPrimaryBtnStyles(p)}
  }

  .tjs-_buttons__btn--secondary,
  .tjs-_buttons__btn--close-modal {
    ${p => p.theme.addTerriaSecondaryBtnStyles(p)}
  }

  .tjs-_buttons__btn--tertiary {
    ${p => p.theme.addTerriaTertiaryBtnStyles(p)}
  }

  .tjs-_buttons__btn-small:hover,
  .tjs-_buttons__btn-small:focus {
    color: ${p => p.theme.colorPrimary};
  }

  .tjs-share-panel__catalog-share-inner {
    background: ${p => p.theme.greyLightest};
  }

  .tjs-share-panel__btn--catalogShare {
    color: ${p => p.theme.colorPrimary};
    background:transparent;
    svg {
      fill: ${p => p.theme.colorPrimary};
    }
  }
  .tjs-dropdown__btn--dropdown {
    color: ${p => p.theme.textDark};
    background: ${p => p.theme.textLight};
    &:hover,
    &:focus {
      color: ${p => p.theme.textDark};
      background: ${p => p.theme.textLight};
      border: 1px solid ${p => p.theme.colorPrimary};
    }
    svg {
      fill: ${p => p.theme.textDark};
    }
  }
  .tjs-dropdown__btn--option.tjs-dropdown__is-selected {
    color: ${p => p.theme.colorPrimary};
  }

  button {
    cursor: pointer;
  }
`;
export const animationDuration = 250;

interface StandardUserInterfaceProps {
  terria: ViewState["terria"];
  viewState: ViewState;
  allBaseMaps?: any[];
  themeOverrides?: Partial<DefaultTheme>;
  minimumLargeScreenWidth?: number;
  version: string;
}

const StandardUserInterface = observer<React.FC<StandardUserInterfaceProps>>(
  props => {
    const { t } = useTranslation();
    const uiRootRef = useRef<HTMLDivElement>(null);

    const shouldUseMobileInterface =
      document.body.clientWidth < (props.minimumLargeScreenWidth ?? 768);

    const acceptDragDropFile = action(() => {
      props.viewState.isDraggingDroppingFile = true;
      // if explorer window is already open, we open my data tab
      if (props.viewState.explorerPanelIsVisible) {
        props.viewState.openUserData();
      }
    });

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      if (
        !e.dataTransfer.types ||
        !arrayContains(e.dataTransfer.types, "Files")
      ) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
      acceptDragDropFile();
    };

    const resizeListener = action(() => {
      props.viewState.useSmallScreenInterface = shouldUseMobileInterface;
    });

    //TODO: Changes here
    useEffect(() => {
      window.addEventListener("resize", resizeListener, false);
      resizeListener();

      if (
        props.terria.configParameters.storyEnabled &&
        props.terria.stories &&
        props.terria.stories.length &&
        !props.viewState.storyShown
      ) {
        props.terria.notificationState.addNotificationToQueue({
          title: t("sui.notifications.title"),
          message: t("sui.notifications.message"),
          confirmText: t("sui.notifications.confirmText"),
          denyText: t("sui.notifications.denyText"),
          confirmAction: action(() => {
            props.viewState.storyShown = true;
          }),
          denyAction: action(() => {
            props.viewState.storyShown = false;
          }),
          type: "story",
          width: 300
        });
      }

      return () => {
        window.removeEventListener("resize", resizeListener, false);
      };
    }, [props.terria.storiesInitialized]);

    // Merge theme in order of highest priority: themeOverrides props -> theme config parameter -> default terriaTheme
    const mergedTheme = combine(
      props.themeOverrides,
      combine(props.terria.configParameters.theme, terriaTheme, true),
      true
    );
    const theme = mergedTheme;

    const customElements = processCustomElements(
      props.viewState.useSmallScreenInterface,
      props.children
    );

    const terria = props.terria;
    const allBaseMaps = props.allBaseMaps;

    const showStoryBuilder =
      props.viewState.storyBuilderShown &&
      !props.viewState.useSmallScreenInterface;
    const showStoryPanel =
      props.terria.configParameters.storyEnabled &&
      props.terria.stories.length > 0 &&
      props.viewState.storyShown &&
      !props.viewState.explorerPanelIsVisible &&
      !props.viewState.storyBuilderShown;
    return (
      <ThemeProvider theme={mergedTheme}>
        <GlobalTerriaStyles />
        <TourPortal viewState={props.viewState} />
        <CollapsedNavigation viewState={props.viewState} />
        <SatelliteHelpPrompt viewState={props.viewState} />
        <Medium>
          <SelectableDimensionWorkflow viewState={props.viewState} />
        </Medium>
        <div className={Styles.storyWrapper}>
          {!props.viewState.disclaimerVisible && (
            <WelcomeMessage viewState={props.viewState} />
          )}
          <div
            className={Styles.uiRoot}
            css={`
              ${props.viewState.disclaimerVisible && `filter: blur(10px);`}
            `}
            onDragOver={handleDragOver}
          >
            <div
              className={Styles.ui}
              css={`
                background: ${theme.dark};
              `}
            >
              <div className={Styles.uiInner}>
                {!props.viewState.hideMapUi && (
                  <>
                    <Small>
                      <MobileHeader
                        terria={terria}
                        menuItems={customElements.menu}
                        menuLeftItems={customElements.menuLeft}
                        viewState={props.viewState}
                        version={props.version}
                        allBaseMaps={allBaseMaps}
                      />
                    </Small>
                    <Medium>
                      <>
                        <WorkflowPanelContainer
                          viewState={props.viewState}
                          show={props.terria.isWorkflowPanelActive}
                        />
                        <SidePanelContainer
                          viewState={props.viewState}
                          tabIndex={0}
                          show={
                            props.viewState.isMapFullScreen === false &&
                            props.terria.isWorkflowPanelActive === false
                          }
                        >
                          <Branding
                            terria={terria}
                            viewState={props.viewState}
                            version={props.version}
                          />
                          <SidePanel
                            terria={terria}
                            viewState={props.viewState}
                          />
                        </SidePanelContainer>
                      </>
                    </Medium>
                  </>
                )}
                <Medium>
                  <div
                    className={classNames(Styles.showWorkbenchButton, {
                      [Styles.showWorkbenchButtonTrainerBarVisible]:
                        props.viewState.trainerBarVisible,
                      [Styles.showWorkbenchButtonisVisible]:
                        props.viewState.isMapFullScreen,
                      [Styles.showWorkbenchButtonisNotVisible]: !props.viewState
                        .isMapFullScreen
                    })}
                  >
                    <FullScreenButton
                      terria={props.terria}
                      viewState={props.viewState}
                      minified={false}
                      btnText={t("sui.showWorkbench")}
                      animationDuration={animationDuration}
                      elementConfig={props.terria.elements.get(
                        "show-workbench"
                      )}
                    />
                  </div>
                </Medium>

                <section className={Styles.map}>
                  <ProgressBar terria={terria} />
                  <MapColumn
                    terria={terria}
                    viewState={props.viewState}
                    customFeedbacks={customElements.feedback}
                    customElements={customElements}
                    allBaseMaps={allBaseMaps}
                    animationDuration={animationDuration}
                  />
                  <main>
                    <ExplorerWindow
                      terria={terria}
                      viewState={props.viewState}
                    />
                    {props.terria.configParameters.experimentalFeatures &&
                      !props.viewState.hideMapUi && (
                        <ExperimentalFeatures
                          terria={terria}
                          viewState={props.viewState}
                          experimentalItems={customElements.experimentalMenu}
                        />
                      )}
                  </main>
                </section>
              </div>
            </div>
            {!props.viewState.hideMapUi && (
              <Medium>
                <TrainerBar terria={terria} viewState={props.viewState} />
              </Medium>
            )}
            <Medium>
              {/* I think this does what the previous boolean condition does, but without the console error */}
              {props.viewState.isToolOpen && (
                <Tool
                  {...props.viewState.currentTool!}
                  viewState={props.viewState}
                />
              )}
            </Medium>

            {props.viewState.panel}

            <Notification viewState={props.viewState} />
            <MapInteractionWindow terria={terria} viewState={props.viewState} />
            {!customElements.feedback.length &&
              props.terria.configParameters.feedbackUrl &&
              !props.viewState.hideMapUi &&
              props.viewState.feedbackFormIsVisible && (
                <FeedbackForm viewState={props.viewState} />
              )}
            <div
              className={classNames(
                Styles.featureInfo,
                props.viewState.topElement === "FeatureInfo"
                  ? "top-element"
                  : "",
                {
                  [Styles.featureInfoFullScreen]:
                    props.viewState.isMapFullScreen
                }
              )}
              tabIndex={0}
              onClick={action(() => {
                props.viewState.topElement = "FeatureInfo";
              })}
            >
              <FeatureInfoPanel terria={terria} viewState={props.viewState} />
            </div>
            <DragDropFile terria={props.terria} viewState={props.viewState} />
            <DragDropNotification viewState={props.viewState} />
            {showStoryPanel && (
              <StoryPanel terria={terria} viewState={props.viewState} />
            )}
          </div>
          {props.terria.configParameters.storyEnabled && showStoryBuilder && (
            <StoryBuilder
              isVisible={showStoryBuilder}
              terria={terria}
              viewState={props.viewState}
              animationDuration={animationDuration}
            />
          )}
          {props.viewState.showHelpMenu &&
            props.viewState.topElement === "HelpPanel" && (
              <HelpPanel terria={terria} viewState={props.viewState} />
            )}
          <Disclaimer viewState={props.viewState} />
        </div>
        {props.viewState.printWindow && (
          <PrintView
            window={props.viewState.printWindow}
            terria={terria}
            viewState={props.viewState}
            closeCallback={() => props.viewState.setPrintWindow(null)}
          />
        )}
      </ThemeProvider>
    );
  }
);

export default withFallback(StandardUserInterface);
