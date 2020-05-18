import React from "react";
import Icon from "../Icon";
import Styles from "./sector_tabs.scss";

class SectorTabs extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    const sectors = [
      {
        title: "Agriculture",
        icon: Icon.GLYPHS.agriculture,
        info: `Agriculture  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
        convallis ex nulla, eu volutpat urna faucibus quis. Aliquam porta
        urna eu urna posuere dignissim. Sed bibendum ipsum in eros rhoncus
        elementum. Sed nec aliquam velit, bibendum volutpat justo.`
      },
      {
        title: "Manufacturing",
        icon: Icon.GLYPHS.manufacturing,
        info: `Manufacturing  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
        convallis ex nulla, eu volutpat urna faucibus quis. Aliquam porta
        urna eu urna posuere dignissim. Sed bibendum ipsum in eros rhoncus
        elementum. Sed nec aliquam velit, bibendum volutpat justo.`
      },
      {
        title: "International Cooperation And Development",
        icon: Icon.GLYPHS.internationalCooperationAndDevelopment,
        info: `International Cooperation And Development Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
        convallis ex nulla, eu volutpat urna faucibus quis. Aliquam porta
        urna eu urna posuere dignissim. Sed bibendum ipsum in eros rhoncus
        elementum. Sed nec aliquam velit, bibendum volutpat justo.`
      },
      {
        title: "Coastal Infrastructure",
        icon: Icon.GLYPHS.coastalInfrastructure,
        info: `Coastal Infrastructure Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
        convallis ex nulla, eu volutpat urna faucibus quis. Aliquam porta
        urna eu urna posuere dignissim. Sed bibendum ipsum in eros rhoncus
        elementum. Sed nec aliquam velit, bibendum volutpat justo.
        `
      },
      {
        title: "Finance",
        icon: Icon.GLYPHS.finance,
        info: `Finance Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
        convallis ex nulla, eu volutpat urna faucibus quis. Aliquam porta
        urna eu urna posuere dignissim. Sed bibendum ipsum in eros rhoncus
        elementum. Sed nec aliquam velit, bibendum volutpat justo.
        `
      }
    ];

    return (
      <div className={Styles.tabsContainer}>
        {sectors.map((sector, id) => {
          return (
            <div key={id} onClick={() => this.props.showSectorInfo(sector)}>
              <Icon glyph={sector.icon} />
            </div>
          );
        })}
      </div>
    );
  }
}
export default SectorTabs;
