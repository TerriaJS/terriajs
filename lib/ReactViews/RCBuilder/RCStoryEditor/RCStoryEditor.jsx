import React from "react";
import PropTypes from "prop-types";
import Styles from "./RCStoryEditor.scss";
class RCStoryEditor extends React.Component {
  constructor(props) {
    super(props);
  }
  state = {
    selectedScenario: 0,
    showModal: false
  };
  onModalDismiss = () => {
    this.setState({ showModal: false });
  };
  render() {
    const { selectedScenario } = this.state;
    const { story, onScenarioChange } = this.props;
    return (
      <div className={Styles.RCStoryEditor}>
        <div>
          <label>Story Title</label>
          <input type="text" placeholder="title" />
        </div>
      </div>
    );
  }
}
RCStoryEditor.propTypes = {
  story: PropTypes.object,
  onScenarioChange: PropTypes.func
};
export default RCStoryEditor;
