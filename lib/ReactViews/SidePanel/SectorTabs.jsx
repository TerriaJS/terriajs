import React from "react";
import Icon from "../Icon";
import PropTypes from "prop-types";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import Styles from "./SectorTabs.scss";
import Tooltip from "../RCTooltip/RCTooltip";
import { RCChangeUrlParams } from "../../Models/Receipt";

class SectorTabs extends React.Component {
  constructor(props) {
    super(props);
  }

  state = {
    selectedId: -1
  };

  componentDidMount() {
    this._viewStateSelectedSector = knockout
      // eslint-disable-next-line jsx-control-statements/jsx-jcs-no-undef
      .getObservable(viewState, "RCSelectedSector")
      .subscribe(RCSelectedSector => {
        if (RCSelectedSector) {
          const sectorIndex = this.props.sectors.findIndex(
            sector => sector.title === RCSelectedSector
          );
          this.setState({
            selectedId: sectorIndex
          });
        }
        // unselect the id
        else {
          this.setState({ selectedId: null });
        }
      });

    this._viewStateChangeHandler = knockout
      // eslint-disable-next-line jsx-control-statements/jsx-jcs-no-undef
      .getObservable(viewState, "isHotspotsFiltered")
      .subscribe(isHotspotsFiltered => {
        if (!isHotspotsFiltered) {
          this.setState({
            selectedId: -1
          });
        }
      });
  }
  componentWillUnmount() {
    this._viewStateChangeHandler.dispose();
  }
  render() {
    const { sectors } = this.props;
    const { selectedId } = this.state;
    return (
      <div className={Styles.tabsContainer}>
        {sectors.map((sector, id) => {
          return (
            <div
              key={id}
              onClick={() => {
                RCChangeUrlParams({ sector: sector.title }, viewState);
              }}
            >
              <Tooltip content={sector.title} direction="bottom" delay="100">
                <Icon
                  glyph={selectedId === id ? sector.iconHover : sector.icon}
                  className={selectedId === id ? Styles.selectedTab : ""}
                />
              </Tooltip>
            </div>
          );
        })}
      </div>
    );
  }
}
SectorTabs.propTypes = {
  viewState: PropTypes.func || PropTypes.object,
  sectors: PropTypes.array
};
export default SectorTabs;
