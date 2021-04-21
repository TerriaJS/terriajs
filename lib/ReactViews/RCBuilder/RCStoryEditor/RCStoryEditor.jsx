import React from "react";
import PropTypes from "prop-types";
import Styles from "./RCStoryEditor.scss";
import Tooltip from "../../RCTooltip/RCTooltip";
import Icon from "../../Icon";
// Sector images
import Agriculture from "../../../../wwwroot/images/receipt/sectors/agriculture.jpg";
import Manufacturing from "../../../../wwwroot/images/receipt/sectors/manufacturing.png";
import InternationalCooperation from "../../../../wwwroot/images/receipt/sectors/international-cooperation.png";
import CoastalInfra from "../../../../wwwroot/images/receipt/sectors/coastal-Infra.png";
import Finance from "../../../../wwwroot/images/receipt/sectors/finance.png";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import defined from "terriajs-cesium/Source/Core/defined";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
class RCStoryEditor extends React.Component {
  constructor(props) {
    super(props);
  }
  state = {
    sector: null,
    selectedId: -1,
    selectedSectors: [],
    isSettingHotspot: false,
    hotspotPoint: null
  };
  sectors = [
    {
      id: "agriculture",
      title: "Agriculture",
      icon: Icon.GLYPHS.agriculture,
      iconHover: Icon.GLYPHS.agricultureHover
    },
    {
      id: "manufacturing",
      title: "Manufacturing",
      icon: Icon.GLYPHS.manufacturing,
      iconHover: Icon.GLYPHS.manufacturingHover
    },
    {
      id: "cooperation",
      title: "International Cooperation And Development",
      icon: Icon.GLYPHS.internationalCooperationAndDevelopment,
      iconHover: Icon.GLYPHS.internationalCooperationAndDevelopmentHover
    },
    {
      id: "coastalInfrastructure",
      title: "Coastal Infrastructure",
      icon: Icon.GLYPHS.coastalInfrastructure,
      iconHover: Icon.GLYPHS.coastalInfrastructureHover
    },
    {
      id: "finance",
      title: "Finance",
      icon: Icon.GLYPHS.finance,
      iconHover: Icon.GLYPHS.financeHover
    }
  ];
  onSectorChanged = event => {
    // current array of options
    const selectedSectors = this.state.selectedSectors;
    let index;

    // check if the check box is checked or unchecked
    if (event.target.checked) {
      // add the  value of the checkbox to selectedSectors array
      selectedSectors.push(event.target.value);
    } else {
      // or remove the value from the unchecked checkbox from the array
      index = selectedSectors.indexOf(event.target.value);
      selectedSectors.splice(index, 1);
    }

    // update the state with the new array of options
    this.setState({ selectedSectors: selectedSectors });
    console.log("Sectors", this.state.selectedSectors);
  };
  componentDidMount() {
    const viewState = this.props.viewState;
    this._selectHotspotSubscription = knockout
      .getObservable(viewState, "selectedPosition")
      .subscribe(() => {
        if (this.state.isSettingHotspot) {
          // Convert position to cartographic
          const point = Cartographic.fromCartesian(viewState.selectedPosition);
          this.setState({
            hotspotPoint: {
              lat: (point.latitude / Math.PI) * 180,
              lon: (point.longitude / Math.PI) * 180
            },
            isSettingHotspot: false
          });
        }
      });
  }
  componentWillUnmount() {
    if (defined(this._pickedFeaturesSubscription)) {
      this._pickedFeaturesSubscription.dispose();
      this._pickedFeaturesSubscription = undefined;
    }
  }
  listenForHotspot = () => {
    this.setState({ isSettingHotspot: true });
  };
  cancelListenForHotspot = () => {
    this.setState({ isSettingHotspot: false });
  };
  render() {
    const { selectedSectors, hotspotPoint, isSettingHotspot } = this.state;
    const hotspotText = hotspotPoint
      ? `${Number(hotspotPoint.lat).toFixed(4)}, ${Number(
          hotspotPoint.lon
        ).toFixed(4)}`
      : "none set";
    return (
      <div className={Styles.RCStoryEditor}>
        <h3>Edit your story</h3>
        <form className={Styles.RCStoryCard}>
          <div className={Styles.group}>
            <input type="text" required />
            <span className={Styles.highlight} />
            <span className={Styles.bar} />
            <label>Story Title</label>
          </div>
          <div className={Styles.group}>
            <textarea />
            <span className={Styles.highlight} />
            <span className={Styles.bar} />
            <label>Short Description</label>
          </div>
          <div>
            <label>Sector</label>
            <div className={Styles.tabsContainer}>
              {this.sectors.map((sector, id) => {
                return (
                  <div key={id}>
                    <Tooltip
                      content={sector.title}
                      direction="bottom"
                      delay="100"
                    >
                      <label>
                        <input
                          type="checkbox"
                          value={sector.title}
                          onChange={this.onSectorChanged}
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
          <div>
            <label>Hotspot</label>
            {!isSettingHotspot && (
              <div>
                <label>Set at: {hotspotText}</label>&nbsp;
                <button
                  type="button"
                  className={Styles.button}
                  onClick={this.listenForHotspot}
                >
                  Select hotspot
                </button>
              </div>
            )}
            {isSettingHotspot && (
              <div>
                <label>Click on map to set the hotspot position</label>&nbsp;
                <button onClick={this.cancelListenForHotspot}>Cancel</button>
              </div>
            )}
          </div>
        </form>
      </div>
    );
  }
}
RCStoryEditor.propTypes = {
  viewState: PropTypes.object
};
export default RCStoryEditor;
