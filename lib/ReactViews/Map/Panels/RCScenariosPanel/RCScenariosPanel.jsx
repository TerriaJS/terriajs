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
          <h4 className={Styles.heading}>SSP1</h4>
          <p className={Styles.section}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras tempus
            mi et hendrerit feugiat. Nunc euismod nulla eros, et tempus odio
            mollis et. Phasellus feugiat erat sed odio convallis, sed volutpat
            sapien elementum. Morbi maximus lobortis viverra. Aliquam tincidunt
            placerat quam at venenatis. Nunc vehicula, mauris sit amet semper
            eleifend, nisl felis condimentum ipsum, id sagittis est metus a
            lectus. Cras feugiat vestibulum laoreet. Quisque dapibus risus eu
            libero efficitur sollicitudin. In rutrum blandit arcu vel laoreet.
            Nunc enim purus, efficitur ut bibendum quis, hendrerit vel turpis.
            Pellentesque rutrum eros lorem, nec sagittis justo bibendum sed.
            Vestibulum ante ipsum primis in faucibus orci luctus et ultrices
            posuere cubilia curae; Duis maximus dapibus dolor, ac lacinia dui
            congue ac. Quisque velit dolor, ullamcorper eget viverra ac,
            fermentum sit amet orci. In imperdiet egestas elit feugiat
            condimentum. Nullam semper rhoncus diam, suscipit finibus magna
            convallis finibus.
          </p>
          <h4 className={Styles.heading}>SSP2</h4>
          <p className={Styles.section}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras tempus
            mi et hendrerit feugiat. Nunc euismod nulla eros, et tempus odio
            mollis et. Phasellus feugiat erat sed odio convallis, sed volutpat
            sapien elementum. Morbi maximus lobortis viverra. Aliquam tincidunt
            placerat quam at venenatis. Nunc vehicula, mauris sit amet semper
            eleifend, nisl felis condimentum ipsum, id sagittis est metus a
            lectus. Cras feugiat vestibulum laoreet. Quisque dapibus risus eu
            libero efficitur sollicitudin. In rutrum blandit arcu vel laoreet.
            Nunc enim purus, efficitur ut bibendum quis, hendrerit vel turpis.
            Pellentesque rutrum eros lorem, nec sagittis justo bibendum sed.
            Vestibulum ante ipsum primis in faucibus orci luctus et ultrices
            posuere cubilia curae; Duis maximus dapibus dolor, ac lacinia dui
            congue ac. Quisque velit dolor, ullamcorper eget viverra ac,
            fermentum sit amet orci. In imperdiet egestas elit feugiat
            condimentum. Nullam semper rhoncus diam, suscipit finibus magna
            convallis finibus.
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
