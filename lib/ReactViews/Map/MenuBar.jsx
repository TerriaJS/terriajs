import React from "react";
import styled from "styled-components";
import triggerResize from "../../Core/triggerResize";

import PropTypes from "prop-types";
import classNames from "classnames";
import SettingPanel from "./Panels/SettingPanel";
import SharePanel from "./Panels/SharePanel/SharePanel";
import ToolsPanel from "./Panels/ToolsPanel/ToolsPanel";
import Icon from "../../Styled/Icon";
import Prompt from "../Generic/Prompt";
import { withTranslation, Trans } from "react-i18next";
import Styles from "./menu-bar.scss";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import Text from "../../Styled/Text";

import withControlledVisibility from "../../ReactViews/HOCs/withControlledVisibility";

import { useRefForTerria } from "../Hooks/useRefForTerria";
import LangPanel from "./Panels/LangPanel/LangPanel";

const StyledMenuBar = styled.div`
  pointer-events: none;
  ${p =>
    p.trainerBarVisible &&
    `
    top: ${Number(p.theme.trainerHeight) + Number(p.theme.mapButtonTop)}px;
  `}
`;
// The map navigation region
const STORY_BUTTON_NAME = "MenuBarStoryButton";
const MenuBar = observer(props => {
  const { t } = props;
  const storyButtonRef = useRefForTerria(STORY_BUTTON_NAME, props.viewState);
  const menuItems = props.menuItems || [];
  const handleClick = () => {
    runInAction(() => {
      props.viewState.topElement = "MenuBar";
    });
  };
  const onStoryButtonClick = () => {
    props.viewState.toggleStoryBuilder();
    props.terria.currentViewer.notifyRepaintRequired();
    // Allow any animations to finish, then trigger a resize.
    setTimeout(function() {
      triggerResize();
    }, props.animationDuration || 1);
    props.viewState.toggleFeaturePrompt("story", false, true);
  };
  const dismissAction = () => {
    props.viewState.toggleFeaturePrompt("story", false, true);
  };

  const storyEnabled = props.terria.configParameters.storyEnabled;
  const enableTools = props.terria.getUserProperty("tools") === "1";

  const promptHtml = (
    <Text textLight textAlignCenter>
      {props.terria.stories.length > 0 ? (
        <Trans i18nKey="story.promptHtml1">
          <Text extraLarge>
            You can view and create stories at any time by clicking here.
          </Text>
        </Trans>
      ) : (
        <Trans i18nKey="story.promptHtml2">
          <div>
            <Text>INTRODUCING</Text>
            <Text bold extraExtraLarge styledLineHeight={"32px"}>
              Data Stories
            </Text>
            <Text medium>
              Create and share interactive stories directly from your map.
            </Text>
          </div>
        </Trans>
      )}
    </Text>
  );
  const delayTime =
    storyEnabled && props.terria.stories.length > 0 ? 1000 : 2000;
  return (
    <StyledMenuBar
      className={classNames(
        props.viewState.topElement === "MenuBar" ? "top-element" : "",
        Styles.menuBar,
        {
          [Styles.menuBarWorkbenchClosed]: props.viewState.isMapFullScreen
        }
      )}
      onClick={handleClick}
      trainerBarVisible={props.viewState.trainerBarVisible}
    >
      <section>
        <ul className={classNames(Styles.menu)}>
          {enableTools && (
            <li className={Styles.menuItem}>
              <ToolsPanel terria={props.terria} viewState={props.viewState} />
            </li>
          )}
          <If condition={!props.viewState.useSmallScreenInterface}>
            <For each="element" of={props.menuLeftItems} index="i">
              <li className={Styles.menuItem} key={i}>
                {element}
              </li>
            </For>
          </If>
        </ul>
      </section>

      <section className={classNames(Styles.flex)}>
        <ul className={classNames(Styles.menu)}>
          <li className={Styles.menuItem}>
            <SettingPanel terria={props.terria} viewState={props.viewState} />
          </li>
          <li className={Styles.menuItem}>
            <SharePanel terria={props.terria} viewState={props.viewState} />
          </li>
          <If condition={storyEnabled}>
            <li className={Styles.menuItem}>
              <div>
                <button
                  ref={storyButtonRef}
                  className={Styles.storyBtn}
                  type="button"
                  onClick={onStoryButtonClick}
                  aria-expanded={props.viewState.storyBuilderShown}
                  css={`
                    ${p =>
                      p["aria-expanded"] &&
                      `&:not(.foo) {
                      background: ${p.theme.colorPrimary};
                      svg {
                        fill: ${p.theme.textLight};
                      }
                    }`}
                  `}
                >
                  <Icon glyph={Icon.GLYPHS.story} />
                  <span>{t("story.story")}</span>
                </button>
                <Prompt
                  centered
                  isVisible={
                    storyEnabled &&
                    props.viewState.featurePrompts.indexOf("story") >= 0
                  }
                  content={promptHtml}
                  displayDelay={delayTime}
                  dismissText={t("story.dismissText")}
                  dismissAction={dismissAction}
                />
              </div>
            </li>
          </If>
          <If condition={!props.viewState.useSmallScreenInterface}>
            <For each="element" of={menuItems} index="i">
              <li className={Styles.menuItem} key={i}>
                {element}
              </li>
            </For>
          </If>
        </ul>
        {props.terria.configParameters?.languageConfiguration?.enabled ? (
          <ul className={classNames(Styles.menu, Styles.langPanel)}>
            <li className={Styles.menuItem}>
              <LangPanel
                terria={props.terria}
                smallScreen={props.viewState.useSmallScreenInterface}
              />
            </li>
          </ul>
        ) : null}
      </section>
    </StyledMenuBar>
  );
});
MenuBar.displayName = "MenuBar";
MenuBar.propTypes = {
  terria: PropTypes.object,
  viewState: PropTypes.object.isRequired,
  allBaseMaps: PropTypes.array, // Not implemented yet
  animationDuration: PropTypes.number,
  menuItems: PropTypes.arrayOf(PropTypes.element),
  menuLeftItems: PropTypes.arrayOf(PropTypes.element),
  t: PropTypes.func.isRequired
};

export default withTranslation()(withControlledVisibility(MenuBar));
