import React, { useState, useEffect } from "react";
import Styles from "./rc-menu-bar.scss";
import classNames from "classnames";
import Icon from "../Icon.jsx";

const RCMenuBar = props => {
  const { viewState } = props;
  const [showButton, setShowButton] = useState(true);

  useEffect(() => {
    setShowButton(viewState.isHotspotsFiltered);
  }, [viewState.isHotspotsFiltered]);

  const onBackToAllHotspots = () => {
    viewState.isHotspotsFiltered = false;
    setShowButton(false);
  };
  return (
    <div
      className={classNames(
        Styles.menuArea,
        viewState.topElement === "MenuBar" ? "top-element" : ""
      )}
    >
      <ul className={Styles.menu}>
        <If condition={showButton}>
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
