import {
  AmplifyAuthenticator,
  AmplifySignOut,
  AmplifySignUp
} from "@aws-amplify/ui-react";
import React from "react";

import { withTranslation } from "react-i18next";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import "./RCLogin.scss";

const Receipt = require("../../Models/Receipt");

export const RCLogin = createReactClass({
  propTypes: {
    /**
     * Terria instance
     */
    viewState: PropTypes.object.isRequired
  },

  componentDidMount() {
    // console.log('🎹', this.props.viewState);
  },

  render() {
    const { t, viewState } = this.props;

    const MyTheme = {
      googleSignInButton: { backgroundColor: "red", borderColor: "red" },
      button: { backgroundColor: "green", borderColor: "red" },
      signInButtonIcon: { display: "none" }
    };

    const signupFormFields = [
      {
        type: "name",
        label: "Full Name *",
        required: true
      },
      {
        type: "custom:Affilliation",
        label: "Affiliation *",
        required: true
      },
      {
        type: "email",
        label: "Email Address *",
        required: true
      },
      {
        type: "password",
        label: "Password *",
        required: true
      }
    ];
    return (
      <div>
        <h2>Login</h2>
        <div>
          <AmplifyAuthenticator usernameAlias="email">
            <AmplifySignUp
              theme={MyTheme}
              usernameAlias="email"
              formFields={signupFormFields}
              slot="sign-up"
            />
          </AmplifyAuthenticator>

          <AmplifySignOut />
        </div>
      </div>
    );
  }
});
// export default withAuthenticator(withTranslation()(RCLogin));
export default withTranslation()(RCLogin);
