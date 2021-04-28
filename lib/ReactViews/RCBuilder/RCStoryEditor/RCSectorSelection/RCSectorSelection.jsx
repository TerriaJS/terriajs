import React from "react";
import PropTypes from "prop-types";
import Styles from "./RCSectorSelection.scss";
import Tooltip from "../../../RCTooltip/RCTooltip";
import Icon from "../../../Icon";

class RCSectorSelection extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { sectors, selectedSectors, onSectorSelected } = this.props;
    return (
      <div>
        <label>Sectors</label>
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
                        selectedSectors.includes(sector.title)
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
  }
}
RCSectorSelection.propTypes = {
  sectors: PropTypes.array.isRequired,
  selectedSectors: PropTypes.array.isRequired,
  onSectorSelected: PropTypes.func
};
export default RCSectorSelection;
