import React from "react";
import Styles from "./rc-menu-bar.scss";
import classNames from "classnames";
import Icon from "../Icon.jsx";

const RCMenuBar = props => {
  const { viewState, terria } = props;

  const onBackToAllHotspots = () => {
    viewState.isHotspotsFiltered = false;
    terria.nowViewing.items.map(item => {
      if (item.type === "geojson") {
        item.isShown = true;
      }
    });
  };
  return (
    <div
      className={classNames(
        Styles.menuArea,
        viewState.topElement === "MenuBar" ? "top-element" : ""
      )}
    >
      <ul className={Styles.menu}>
        <If condition={viewState.isHotspotsFiltered}>
          <li className={Styles.menuItem}>
            <button
              className={Styles.storyBtn}
              type="button"
              onClick={onBackToAllHotspots}
            >
              <Icon glyph={Icon.GLYPHS.back} />
              <span>All Hotspots</span>
            </button>
          </li>
        </If>
      </ul>
    </div>
  );
};

export default RCMenuBar;
