import {
  AmplifyAuthenticator,
  AmplifySignOut,
  AmplifySignUp
} from "@aws-amplify/ui-react";
import React from "react";
import PropTypes from "prop-types";
import "./RCLogin.scss";
import { Auth } from "aws-amplify";

const Receipt = require("../../Models/Receipt");

class RCLogin extends React.Component {
  state = {
    user: null
  };

  componentDidMount() {
    Auth.currentAuthenticatedUser({
      bypassCache: false // Optional, By default is false. If set to true, this call will send a request to Cognito to get the latest user data
    })
      .then(user => {
        console.log(user);
        this.setState({ user: user });
      })
      .catch(err => {
        this.setState({ user: null });
        console.log(err);
      });
  }

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
      <div style={{ padding: "16px" }}>
        <h2>Login</h2>
        {this.state && this.state.user?.attributes && (
          <div style={{ padding: "16px" }}>
            <div>{this.state?.user.attributes.name}</div>
            <div>{this.state?.user.attributes["custom:Affilliation"]}</div>
            <div>{this.state?.user.attributes.email}</div>
          </div>
        )}
        <div>
          {!this.state.user && (
            <AmplifyAuthenticator usernameAlias="email">
              <AmplifySignUp
                theme={MyTheme}
                usernameAlias="email"
                formFields={signupFormFields}
                slot="sign-up"
              />
            </AmplifyAuthenticator>
          )}

          {this.state.user && <AmplifySignOut />}
        </div>
      </div>
    );
  }
}

RCLogin.propTypes = {
  viewState: PropTypes.object
};

export default RCLogin;
