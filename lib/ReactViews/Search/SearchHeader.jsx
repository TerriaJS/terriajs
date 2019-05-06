import Loader from "../Loader";
import ObserveModelMixin from "../ObserveModelMixin";
import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import Styles from "./search-header.scss";

/** Renders either a loader or a message based off search state. */
export default createReactClass({
  mixins: [ObserveModelMixin],

  displayName: "SearchHeader",

  propTypes: {
    searchProvider: PropTypes.object.isRequired,
    isWaitingForSearchToStart: PropTypes.bool
  },

  render() {
    if (
      this.props.searchProvider.isSearching ||
      this.props.isWaitingForSearchToStart
    ) {
      return (
        <div key="loader" className={Styles.loader}>
          <Loader />
        </div>
      );
    } else if (this.props.searchProvider.searchMessage) {
      return (
        <div key="message" className={Styles.noResults}>
          {this.props.searchProvider.searchMessage}
        </div>
      );
    } else {
      return null;
    }
  }
});
