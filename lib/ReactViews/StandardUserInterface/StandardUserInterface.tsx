import classNames from "classnames";
import "inobounce";
import { action } from "mobx";
import { observer } from "mobx-react";
import React, { useEffect, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { DefaultTheme } from "styled-components";
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
import ContextProviders from "./ContextProviders";
import { GlobalTerriaStyles } from "./GlobalTerriaStyles";
import MapColumn from "./MapColumn";
import processCustomElements from "./processCustomElements";
import SidePanelContainer from "./SidePanelContainer";
import Styles from "./standard-user-interface.scss";
import { terriaTheme } from "./StandardTheme";
import WorkflowPanelPortal from "../Workflow/WorkflowPanelPortal";

export const animationDuration = 250;

interface StandardUserInterfaceProps {
  terria: ViewState["terria"];
  viewState: ViewState;
  allBaseMaps?: any[];
  themeOverrides?: Partial<DefaultTheme>;
  minimumLargeScreenWidth?: number;
  version: string;
  children?: ReactNode;
}

const StandardUserInterface: React.FC<StandardUserInterfaceProps> = observer(
  (props) => {
    const { t } = useTranslation();

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

    const shouldUseMobileInterface = () =>
      document.body.clientWidth < (props.minimumLargeScreenWidth ?? 768);

    const resizeListener = action(() => {
      props.viewState.useSmallScreenInterface = shouldUseMobileInterface();
    });

    useEffect(() => {
      window.addEventListener("resize", resizeListener, false);
      return () => {
        window.removeEventListener("resize", resizeListener, false);
      };
    }, []);

    useEffect(resizeListener, [props.minimumLargeScreenWidth]);

    useEffect(() => {
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
    }, [props.terria.storyPromptShown]);

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
      <ContextProviders viewState={props.viewState} theme={mergedTheme}>
        <GlobalTerriaStyles />
        <TourPortal />
        <CollapsedNavigation />
        <SatelliteHelpPrompt />
        <Medium>
          <SelectableDimensionWorkflow />
        </Medium>
        <div className={Styles.storyWrapper}>
          {!props.viewState.disclaimerVisible && <WelcomeMessage />}
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
                        menuItems={customElements.menu}
                        menuLeftItems={customElements.menuLeft}
                        version={props.version}
                        allBaseMaps={allBaseMaps}
                      />
                    </Small>
                    <Medium>
                      <>
                        <WorkflowPanelPortal
                          show={props.terria.isWorkflowPanelActive}
                        />
                        <SidePanelContainer
                          tabIndex={0}
                          show={
                            props.viewState.isMapFullScreen === false &&
                            props.terria.isWorkflowPanelActive === false
                          }
                        >
                          <FullScreenButton
                            minified={true}
                            animationDuration={250}
                            btnText={t("addData.btnHide")}
                          />
                          <Branding version={props.version} />
                          <SidePanel />
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
                      [Styles.showWorkbenchButtonisNotVisible]:
                        !props.viewState.isMapFullScreen
                    })}
                  >
                    <FullScreenButton
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
                  <ProgressBar />
                  <MapColumn
                    customFeedbacks={customElements.feedback}
                    customElements={customElements}
                    allBaseMaps={allBaseMaps}
                    animationDuration={animationDuration}
                  />
                  <div id="map-data-attribution"></div>
                  <main>
                    <ExplorerWindow />
                    {props.terria.configParameters.experimentalFeatures &&
                      !props.viewState.hideMapUi && (
                        <ExperimentalFeatures
                          experimentalItems={customElements.experimentalMenu}
                        />
                      )}
                  </main>
                </section>
              </div>
            </div>
            {!props.viewState.hideMapUi && (
              <Medium>
                <TrainerBar />
              </Medium>
            )}
            <Medium>
              {/* I think this does what the previous boolean condition does, but without the console error */}
              {props.viewState.isToolOpen && (
                <Tool {...props.viewState.currentTool!} />
              )}
            </Medium>

            {props.viewState.panel}

            <Notification />
            <MapInteractionWindow />
            {!customElements.feedback.length &&
              props.terria.configParameters.feedbackUrl &&
              !props.viewState.hideMapUi &&
              props.viewState.feedbackFormIsVisible && <FeedbackForm />}
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
              <FeatureInfoPanel />
            </div>
            <DragDropFile />
            <DragDropNotification />
            {showStoryPanel && <StoryPanel />}
          </div>
          {props.terria.configParameters.storyEnabled && showStoryBuilder && (
            <StoryBuilder
              isVisible={showStoryBuilder}
              animationDuration={animationDuration}
            />
          )}
          {props.viewState.showHelpMenu &&
            props.viewState.topElement === "HelpPanel" && <HelpPanel />}
          <Disclaimer />
        </div>
        {props.viewState.printWindow && (
          <PrintView
            window={props.viewState.printWindow}
            closeCallback={() => props.viewState.setPrintWindow(null)}
          />
        )}
      </ContextProviders>
    );
  }
);

export default withFallback(StandardUserInterface);
