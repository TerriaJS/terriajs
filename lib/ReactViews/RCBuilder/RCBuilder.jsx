import PropTypes from "prop-types";
import React from "react";
import { Route, Switch, withRouter } from "react-router-dom";
import Styles from "./RCBuilder.scss";
import RCStoryCreator from "./RCStoryCreator/RCStoryCreator";
import RCStoryEditor from "./RCStoryEditor/RCStoryEditor";
import RCStoryList from "./RCStoryList/RCStoryList";
import RCPageEditor from "./RCPageEditor/RCPageEditor";

class RCBuilder extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { t, viewState } = this.props;
    const path = this.props.match.path;
    return (
      <div>
        <div>
          <h1 className={Styles.header}>Story Builder</h1>
        </div>
        <Switch>
          <Route path={`${path}/new`}>
            <RCStoryCreator viewState={viewState} />
          </Route>
          <Route path={`${path}/story/:id/edit`}>
            <RCStoryEditor viewState={viewState} />
          </Route>
          <Route path={`${path}/page/:id/edit`}>
            <RCPageEditor viewState={viewState} />
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
