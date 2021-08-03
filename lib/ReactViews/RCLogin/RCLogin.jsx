import { onAuthUIStateChange } from "@aws-amplify/ui-components";
import {
  AmplifyAuthenticator,
  AmplifySignIn,
  AmplifySignOut,
  AmplifySignUp
} from "@aws-amplify/ui-react";
import { Auth } from "aws-amplify";
import React from "react";
import "./RCLogin.scss";

const RCLogin = props => {
  const [authState, setAuthState] = React.useState();
  const [user, setUser] = React.useState({});

  React.useEffect(() => {
    return onAuthUIStateChange(async newAuthState => {
      setAuthState(newAuthState);
      const user = await Auth.currentAuthenticatedUser();
      setUser(user);
    });
  }, []);

  const signupFormFields = [
    {
      type: "name",
      label: "Full Name *",
      placeholder: "Enter your name",
      required: true
    },
    {
      type: "custom:affiliation",
      label: "Affiliation *",
      placeholder: "Enter your affiliation",
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
      <AmplifyAuthenticator federated={{}} usernameAlias="email">
        <div slot="sign-in">
          <AmplifySignIn>
            <div slot="federated-buttons">
              {/*  Left empty to override the AWS federated buttons*/}
            </div>
          </AmplifySignIn>
        </div>
        <AmplifySignUp
          usernameAlias="email"
          slot="sign-up"
          formFields={signupFormFields}
        />

        {authState === "signedin" && (
          <div>
            <div className="bold">{user.attributes?.name}</div>
            <div>{user.attributes?.email}</div>
            <div>{user.attributes?.["custom:affiliation"]}</div>
          </div>
        )}
        <div style={{ marginTop: "32px", width: "25%" }}>
          <AmplifySignOut />
        </div>
      </AmplifyAuthenticator>
    </div>
  );
};
export default RCLogin;
