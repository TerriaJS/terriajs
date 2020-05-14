import React from "react";
import Styles from "./sector_info.scss";

class SectorInfo extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { sector } = this.props;

    if (sector !== null) {
      return (
        <>
          <div className={Styles.panelHeading}>
            <span className={Styles.sectorTitle}>{sector.title}</span>
          </div>
          <div className={Styles.sectorInfo}>
            <p>{sector.info}</p>
          </div>
        </>
      );
    }
    return null;
    // return (
    //     <>
    //         <div className={Styles.panelHeading}>
    //             <span className={Styles.sectorTitle}>Agriculture</span>
    //         </div>
    //         <div className={Styles.sectorInfo}>
    //             <p>
    //                 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
    //                 convallis ex nulla, eu volutpat urna faucibus quis. Aliquam porta
    //                 urna eu urna posuere dignissim. Sed bibendum ipsum in eros rhoncus
    //                 elementum. Sed nec aliquam velit, bibendum volutpat justo. Proin
    //                 semper viverra risus at porta. Nunc tincidunt felis eget bibendum
    //                 elementum. In hac habitasse platea dictumst. Ut eu ullamcorper orci.
    //                 Suspendisse potenti. Sed eu dolor consectetur ex pulvinar porttitor
    //                 sit amet a augue. Quisque cursus blandit orci, mattis accumsan dolor
    //                 auctor a. Mauris et velit eget massa placerat aliquet. Donec eu
    //                 risus mi.
    //         </p>
    //         </div>
    //     </>
    // );
  }
}
export default SectorInfo;
