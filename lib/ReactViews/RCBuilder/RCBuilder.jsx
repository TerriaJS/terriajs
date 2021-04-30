import PropTypes from "prop-types";
import React from "react";
import { Route, Switch, withRouter } from "react-router-dom";
import Styles from "./RCBuilder.scss";
import RCStoryCreator from "./RCStoryCreator/RCStoryCreator";
import RCStoryEditor from "./RCStoryEditor/RCStoryEditor";
import RCStoryList from "./RCStoryList/RCStoryList";
class RCBuilder extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    console.log("🎹", this.props.viewState);
  }

  render() {
    const { t, viewState } = this.props;
    const path = this.props.match.path;
    return (
      <div>
        <div>
          <h1 className={Styles.header}>
            <img
              src={require("../../../wwwroot/images/receipt/receipt-logo.svg")}
            />
            Story Builder
          </h1>
        </div>
        <Switch>
          <Route path={`${path}/new`}>
            <RCStoryCreator viewState={viewState} />
          </Route>
          <Route path={`${path}/story/:id/edit`}>
            <RCStoryEditor viewState={viewState} />
          </Route>
          <Route>
            <RCStoryList viewState={viewState} />
          </Route>
        </Switch>
      </div>
    );
  }
}
RCBuilder.propTypes = {
  /**
   * Terria instance
   */
  viewState: PropTypes.object.isRequired
};

export default withRouter(RCBuilder);
