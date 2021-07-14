import React from "react";
import PropTypes from "prop-types";

// Tracks pageviews on location change
const withRoutingTracker = WrappedComponent => {
  // eslint-disable-next-line
  class RoutingTracker extends React.Component {
    componentDidMount() {
      // eslint-disable-next-line
      const page = this.props.location.pathname + this.props.location.search;
      this.props.terria.analytics.logPageView(page);
    }

    componentDidUpdate(prevProps) {
      const currentPage =
        prevProps.location.pathname + prevProps.location.search;
      const newPage = this.props.location.pathname + this.props.location.search;

      if (currentPage !== newPage) {
        this.props.terria.analytics.logPageView(newPage);
      }
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  }

  RoutingTracker.propTypes = {
    terria: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
  };

  return RoutingTracker;
};

export default withRoutingTracker;
