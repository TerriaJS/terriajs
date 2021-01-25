import React from "react";
import PropTypes from "prop-types";
import Styles from "./story.scss";
import classNames from "classnames";
import Icon from "../Icon";
import RCScenariosPanel from "../Map/Panels/RCScenariosPanel/RCScenariosPanel";
class RCScenarioTabs extends React.Component {
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
      <div className={Styles.scenarios}>
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
        <Icon
          glyph={Icon.GLYPHS.info}
          className={Styles.infoIcon}
          onClick={() => {
            this.setState({ showModal: true });
          }}
        />
        <RCScenariosPanel
          showDropdownAsModal={this.state.showModal}
          onModalDismiss={this.onModalDismiss}
        />
      </div>
    );
  }
}
RCScenarioTabs.propTypes = {
  story: PropTypes.object,
  onScenarioChange: PropTypes.func
};
export default RCScenarioTabs;
