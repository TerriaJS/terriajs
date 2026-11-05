import classNames from "classnames";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import styled, { useTheme } from "styled-components";
import { useViewState } from "../../Context";
import withControlledVisibility from "../../HOCs/withControlledVisibility";
import LangPanel from "../Panels/LangPanel/LangPanel";
import SettingPanel from "../Panels/SettingPanel";
import SharePanel from "../Panels/SharePanel/SharePanel";
import ToolsPanel from "../Panels/ToolsPanel/ToolsPanel";
import HelpButton from "./HelpButton/HelpButton";
import StoryButton from "./StoryButton/StoryButton";

import IElementConfig from "../../../Models/IElementConfig";
import Styles from "./menu-bar.scss";

const StyledMenuBar = styled.div<{ trainerBarVisible: boolean }>`
  pointer-events: none;
  ${(p) =>
    p.trainerBarVisible &&
    `
    top: ${Number(p.theme.trainerHeight) + Number(p.theme.mapButtonTop)}px;
  `}
`;

interface PropsType {
  animationDuration?: number;
  menuItems: React.ReactElement[];
  menuLeftItems: React.ReactElement[];
  elementConfig?: IElementConfig;
}

/**
 * A menu item that goes when the control inside it does.
 *
 * The rounding on each end of a group comes from `:first-child` and
 * `:last-child` in menu-bar.scss, and a hidden control renders nothing rather
 * than removing its own list item. Left to itself that empty item still counts
 * as the last one, so the button beside it keeps a square outer edge: hide the
 * help and Display settings ends up rounded on its left alone.
 */
const MenuItem = withControlledVisibility(
  ({ children }: { children: React.ReactNode }) => (
    <li className={Styles.menuItem}>{children}</li>
  )
);

// The map navigation region
const MenuBar = observer((props: PropsType) => {
  const theme = useTheme();
  const viewState = useViewState();
  const terria = viewState.terria;
  const menuItems = props.menuItems || [];
  const handleClick = () => {
    runInAction(() => {
      viewState.topElement = "MenuBar";
    });
  };

  const storyEnabled = terria.configParameters.storyEnabled;
  const enableTools = terria.userProperties.get("tools") === "1";

  return (
    <StyledMenuBar
      className={classNames(
        viewState.topElement === "MenuBar" ? "top-element" : "",
        Styles.menuBar,
        {
          [Styles.menuBarWorkbenchClosed]: viewState.isMapFullScreen
        }
      )}
      onClick={handleClick}
      trainerBarVisible={viewState.trainerBarVisible}
    >
      <section>
        <ul className={classNames(Styles.menu)}>
          {enableTools && (
            <MenuItem elementConfig={terria.elements.get("menu-bar-tools")}>
              <ToolsPanel />
            </MenuItem>
          )}
          {!viewState.useSmallScreenInterface &&
            props.menuLeftItems.map((element, i) => (
              <li className={Styles.menuItem} key={i}>
                {element}
              </li>
            ))}
        </ul>
      </section>
      <section className={classNames(Styles.flex)}>
        <ul className={classNames(Styles.menu)}>
          <MenuItem elementConfig={terria.elements.get("menu-bar-settings")}>
            <SettingPanel terria={terria} viewState={viewState} />
          </MenuItem>
          <MenuItem elementConfig={terria.elements.get("menu-bar-help")}>
            <HelpButton />
          </MenuItem>

          {terria.configParameters?.languageConfiguration?.enabled ? (
            <MenuItem elementConfig={terria.elements.get("menu-bar-lang")}>
              <LangPanel
                terria={terria}
                smallScreen={viewState.useSmallScreenInterface}
              />
            </MenuItem>
          ) : null}
        </ul>
        {storyEnabled && (
          <ul className={classNames(Styles.menu)}>
            <MenuItem elementConfig={terria.elements.get("menu-bar-story")}>
              <StoryButton
                terria={terria}
                viewState={viewState}
                theme={theme}
              />
            </MenuItem>
          </ul>
        )}
        <ul className={classNames(Styles.menu)}>
          <MenuItem elementConfig={terria.elements.get("menu-bar-share")}>
            <SharePanel terria={terria} viewState={viewState} />
          </MenuItem>
        </ul>
        {!viewState.useSmallScreenInterface &&
          menuItems.map((element, i) => (
            <li className={Styles.menuItem} key={i}>
              {element}
            </li>
          ))}
      </section>
    </StyledMenuBar>
  );
});

export default withControlledVisibility(MenuBar);
