import React from "react";
import PropTypes from "prop-types";
import Styles from "./story.scss";
import classNames from "classnames";
class RCScenarioTabs extends React.Component {
  constructor(props) {
    super(props);
  }
  state = {
    selectedScenario: 0
  };
  render() {
    const { selectedScenario } = this.state;
    const { story, onScenarioChange } = this.props;

    console.log("story", story);
    return (
      <div className={Styles.tabsContainer}>
        {Object.keys(story.text).map((storyText, id) => {
          return (
            <div
              key={id}
              onClick={() => {
                this.setState({ selectedScenario: id });
                onScenarioChange(id);
              }}
              className={classNames(
                Styles.tab,
                selectedScenario === id && Styles.selectedTab
              )}
            >
              <span>SSP {storyText}</span>
            </div>
          );
        })}
      </div>
    );
  }
}
RCScenarioTabs.propTypes = {
  story: PropTypes.object,
  onScenarioChange: PropTypes.func
};
export default RCScenarioTabs;
