import React from "react";
import PropTypes from "prop-types";
import RCInnerPanel from "./RCInnerPanel";
import Styles from "./RCPanel.scss";
class RCScenariosPanel extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <RCInnerPanel
        showDropdownAsModal={this.props.showDropdownAsModal}
        onDismissed={this.props.onModalDismiss}
      >
        <div>
          <h4 className={Styles.heading}>
            SSP1: Sustainability (Taking the Green Road)
          </h4>
          <p className={Styles.section}>
            The world shifts gradually, but pervasively, toward a more
            sustainable path, emphasizing more inclusive development that
            respects perceived environmental boundaries. Management of the
            global commons slowly improves, educational and health investments
            accelerate the demographic transition, and the emphasis on economic
            growth shifts toward a broader emphasis on human well-being. Driven
            by an increasing commitment to achieving development goals,
            inequality is reduced both across and within countries. Consumption
            is oriented toward low material growth and lower resource and energy
            intensity.
          </p>
          <h4 className={Styles.heading}>SSP2: Middle of the road</h4>
          <p className={Styles.section}>
            The world follows a path in which social, economic, and
            technological trends do not shift markedly from historical patterns.
            Development and income growth proceeds unevenly, with some countries
            making relatively good progress while others fall short of
            expectations. Global and national institutions work toward but make
            slow progress in achieving sustainable development goals.
            Environmental systems experience degradation, although there are
            some improvements and overall the intensity of resource and energy
            use declines. Global population growth is moderate and levels off in
            the second half of the century. Income inequality persists or
            improves only slowly and challenges to reducing vulnerability to
            societal and environmental changes remain.
          </p>
          <h4 className={Styles.heading}>
            SSP3: Regional rivalry (A Rocky Road)
          </h4>
          <p className={Styles.section}>
            A resurgent nationalism, concerns about competitiveness and
            security, and regional conflicts push countries to increasingly
            focus on domestic or, at most, regional issues. Policies shift over
            time to become increasingly oriented toward national and regional
            security issues. Countries focus on achieving energy and food
            security goals within their own regions at the expense of
            broader-based development. Investments in education and
            technological development decline. Economic development is slow,
            consumption is material-intensive, and inequalities persist or
            worsen over time. Population growth is low in industrialized and
            high in developing countries. A low international priority for
            addressing environmental concerns leads to strong environmental
            degradation in some regions.
          </p>
          <h4 className={Styles.heading}>SSP4: Inequality (A Road Divided)</h4>
          <p className={Styles.section}>
            Highly unequal investments in human capital, combined with
            increasing disparities in economic opportunity and political power,
            lead to increasing inequalities and stratification both across and
            within countries. Over time, a gap widens between an
            internationally-connected society that contributes to knowledge- and
            capital-intensive sectors of the global economy, and a fragmented
            collection of lower-income, poorly educated societies that work in a
            labor intensive, low-tech economy. Social cohesion degrades and
            conflict and unrest become increasingly common. Technology
            development is high in the high-tech economy and sectors. The
            globally connected energy sector diversifies, with investments in
            both carbon-intensive fuels like coal and unconventional oil, but
            also low-carbon energy sources. Environmental policies focus on
            local issues around middle and high income areas.
          </p>
        </div>
      </RCInnerPanel>
    );
  }
}
RCScenariosPanel.propTypes = {
  onModalDismiss: PropTypes.func.isRequired,
  showDropdownAsModal: PropTypes.bool.isRequired
};
export default RCScenariosPanel;
