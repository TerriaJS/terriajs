import React, { useState } from "react";
import OAuth2Login from "react-simple-oauth2-login";
import Styles from "./panel.scss";
import TerriaError from "../../../Core/TerriaError";
import i18next from "i18next";
import Cookies from "universal-cookie";

export default function AuthPanel(props) {
  const cookies = new Cookies();
  const { loginEnabled, AuthConfiguration } = props.terria.configParameters;
  const [loggedIn, setLoggedIn] = useState(cookies.get("token"));

  /**
   * @implements on a success login store an access token in cookies to be used then to fetch some private data
   * @param response
   */
  const onLoginSuccess = response => {
    cookies.set("token", response.access_token, { path: "/" });
    setLoggedIn(true);
  };

  /**
   * @implements revoke the access token from the auth provider and clear the cookie
   * @returns {Promise<void>}
   */
  const handleLogout = async () => {
    const token = cookies.get("token");

    if (token) {
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token: token,
          client_id: AuthConfiguration.clientId,
          client_secret: AuthConfiguration.clientSecret
        })
      };

      // revoke the access token
      await fetch(AuthConfiguration.logoutUrl, requestOptions)
        .then(response => response.text())
        .then(() => {
          cookies.remove("token");
          setLoggedIn(false);
        });
    }

    window.location.reload();
  };

  /**
   * @implements raise a terria error if the login failed
   */
  const onLoginFailure = () => {
    const t = i18next.t.bind(i18next);
    props.terria.raiseErrorToUser(
      new TerriaError({
        sender: this,
        title: t("login.loginFailed"),
        message: t("login.errorMessage")
      })
    );
  };

  if (!loginEnabled) {
    return null;
  }

  return (
    <Choose>
      <When condition={!loggedIn}>
        <OAuth2Login
          authorizationUrl={AuthConfiguration.authorizationUrl}
          clientId={AuthConfiguration.clientId}
          redirectUri={AuthConfiguration.redirectUri}
          responseType={AuthConfiguration.responseType}
          onSuccess={onLoginSuccess}
          onFailure={onLoginFailure}
          buttonText={AuthConfiguration.loginText}
          className={Styles.button}
        />
      </When>
      <Otherwise>
        <button className={Styles.button} onClick={() => handleLogout()}>
          {AuthConfiguration.logoutText}
        </button>
      </Otherwise>
    </Choose>
  );
}
