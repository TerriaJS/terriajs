import React, { useEffect, useState } from "react";
import Styles from "./rc-menu-bar.scss";
import classNames from "classnames";
// import Icon from "../Icon.jsx";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import PropTypes from "prop-types";
import Branding from "../StandardUserInterface/Branding";

const RCMenuBar = props => {
  const { viewState, terria } = props;
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const viewStateChangeHandler = knockout
      .getObservable(viewState, "isHotspotsFiltered")
      .subscribe(function() {
        setShowButton(viewState.isHotspotsFiltered);
      });
    return () => {
      viewStateChangeHandler.dispose();
    };
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
        <li className={Styles.menuItem}>
          {/* <Branding terria={terria} viewState={viewState} /> */}
        </li>
        {/*
          <If condition={showButton}>
          <li className={Styles.menuItem}>
            <button
              className={Styles.backToBtn}
              type="button"
              onClick={onBackToAllHotspots}
            >
              <Icon glyph={Icon.GLYPHS.back} />
              <span>All Hotspots</span>
            </button>
          </li>
        </If>
        */}
      </ul>
    </div>
  );
};

RCMenuBar.propTypes = {
  viewState: PropTypes.object,
  terria: PropTypes.object
};

export default RCMenuBar;
