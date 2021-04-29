import { withAuthenticator } from "@aws-amplify/ui-react";
import React from "react";

import { withTranslation } from "react-i18next";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import RCStoryList from "./RCStoryList/RCStoryList";

const Receipt = require("../../Models/Receipt");

export const RCBuilder = createReactClass({
  propTypes: {
    /**
     * Terria instance
     */
    viewState: PropTypes.object.isRequired
  },

  componentDidMount() {
    console.log("🎹", this.props.viewState);
  },

  render() {
    const { t, viewState } = this.props;

    return (
      <div>
        <h1>I am the builder</h1>
        <RCStoryList />
      </div>
    );
  }
});
// export default withAuthenticator(withTranslation()(RCBuilder));
export default withTranslation()(RCBuilder);
