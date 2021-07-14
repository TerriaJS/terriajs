import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";

class RoutingListener extends React.Component {
  constructor() {
    super();
    this.syncLocation = this.syncLocation.bind(this);
  }
  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    this.props.viewState.history = this.props.history;
    this.syncLocation();
  }
  componentDidUpdate() {
    this.syncLocation();
  }
  syncLocation() {
    this.props.viewState.location = this.props.location;
  }
  render() {
    return <></>;
  }
}
RoutingListener.propTypes = {
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  viewState: PropTypes.object.isRequired
};

export default withRouter(RoutingListener);
