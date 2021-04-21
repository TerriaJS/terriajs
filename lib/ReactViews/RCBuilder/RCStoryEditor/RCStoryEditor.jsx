import React from "react";
import Styles from "./RCStoryEditor.scss";
import Tooltip from "../../RCTooltip/RCTooltip";
import Icon from "../../Icon";
// Sector images
import Agriculture from "../../../../wwwroot/images/receipt/sectors/agriculture.jpg";
import Manufacturing from "../../../../wwwroot/images/receipt/sectors/manufacturing.png";
import InternationalCooperation from "../../../../wwwroot/images/receipt/sectors/international-cooperation.png";
import CoastalInfra from "../../../../wwwroot/images/receipt/sectors/coastal-Infra.png";
import Finance from "../../../../wwwroot/images/receipt/sectors/finance.png";
class RCStoryEditor extends React.Component {
  constructor(props) {
    super(props);
  }
  state = {
    sector: null,
    selectedId: -1,
    selectedSectors: []
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
  render() {
    const { selectedSectors } = this.state;
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
        </form>
      </div>
    );
  }
}
export default RCStoryEditor;
