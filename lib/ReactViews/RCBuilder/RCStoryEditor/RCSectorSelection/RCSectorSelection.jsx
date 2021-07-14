import React, { useState } from "react";
import PropTypes from "prop-types";
import Styles from "./RCSectorSelection.scss";
import Tooltip from "../../../RCTooltip/RCTooltip";
import Icon from "../../../Icon";

const RCSectorSelection = props => {
  const {
    sectors,
    selectedSectors,
    onSectorSelected,
    sectorRequiredMessage
  } = props;

  return (
    <div className={Styles.group}>
      <div className={Styles.container}>
        <label className={Styles.topLabel}>Sectors</label>
        <label style={{ color: "red" }}>{sectorRequiredMessage}</label>
      </div>
      <div className={Styles.tabsContainer}>
        {sectors.map((sector, id) => {
          return (
            <div key={id}>
              <Tooltip content={sector.title} direction="bottom" delay="100">
                <label>
                  <input
                    type="checkbox"
                    value={sector.title}
                    onChange={onSectorSelected}
                  />
                  <Icon
                    glyph={
                      selectedSectors.includes(
                        sector.title
                          .split(" ")
                          .join("_")
                          .toUpperCase()
                      )
                        ? sector.iconHover
                        : sector.icon
                    }
                    className={Styles.label}
                  />
                </label>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </div>
  );
};
RCSectorSelection.propTypes = {
  sectors: PropTypes.array.isRequired,
  selectedSectors: PropTypes.array.isRequired,
  onSectorSelected: PropTypes.func
};
export default RCSectorSelection;
