import React from "react";
import { observer } from "mobx-react";
import { addOrReplaceRemoteFileUploadType } from "../../../../Core/getDataType";
import { t } from "i18next";
import { useViewState } from "terriajs-plugin-api";
import URI from "urijs";
import { string } from "prop-types";

let codeChallenge;

function CesiumIonConnector() {
  const viewState = useViewState();

  const [codeChallenge, setCodeChallenge] = React.useState({
    value: "",
    hash: ""
  });

  const [accessToken, setAccessToken] = React.useState("");

  const defaultProfile = {
    id: 0,
    scopes: [],
    username: "",
    email: "",
    emailVerified: false,
    avatar: string,
    storage: {}
  };
  const [userProfile, setUserProfile] = React.useState(defaultProfile);

  React.useEffect(() => {
    const codeChallenge = [...crypto.getRandomValues(new Uint8Array(32))]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");

    const codeChallengeHash = crypto.subtle
      .digest("SHA-256", new TextEncoder().encode(codeChallenge))
      .then((hash) => {
        setCodeChallenge({
          value: codeChallenge,
          hash: btoa(String.fromCharCode(...new Uint8Array(hash)))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "")
        });
      });
  }, []);

  React.useEffect(() => {
    fetch("https://api.cesium.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
      .then((response) => {
        return response.json();
      })
      .then((profile) => {
        if (profile && profile.username) {
          setUserProfile(profile);
        } else {
          setUserProfile(defaultProfile);
        }
      });
  }, [accessToken]);

  return accessToken.length > 0 ? renderConnected() : renderDisconnected();

  function renderConnected() {
    return (
      <div>
        {userProfile.username.length > 0 ? (
          <span>
            <label>Connected to Cesium ion as {userProfile.username}</label>
            <button onClick={disconnect}>Disconnect</button>
          </span>
        ) : (
          <label>Loading user profile information...</label>
        )}
      </div>
    );
  }

  function renderDisconnected() {
    return (
      <div>
        <label>
          Access globe high-resolution 3D content, including photogrammetry,
          terrain, imagery and buildings. Bring your own data for tiling,
          hosting and streaming to {viewState.terria.appName}.
        </label>
        <div>
          <button onClick={connect} disabled={codeChallenge.hash == ""}>
            Connect to Cesium ion
          </button>
        </div>
      </div>
    );
  }

  function connect() {
    // TODO: these need to be configurable
    const clientID = 643;
    const redirectUri =
      "http://localhost:3001/build/TerriaJS/cesium-ion-oauth2.html";

    const codeChallengeValue = codeChallenge.value;
    const codeChallengeHash = codeChallenge.hash;

    const state = [...crypto.getRandomValues(new Uint8Array(16))]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");

    const uri = new URI("https://ion.cesium.com/oauth").addQuery({
      response_type: "code",
      client_id: clientID,
      scope: "assets:read assets:list profile:read",
      redirect_uri: redirectUri,
      state: state,
      code_challenge: codeChallengeHash,
      code_challenge_method: "S256"
    });

    (window as any)["cesiumIonOAuth2_" + state] = function (code: string) {
      fetch("https://api.cesium.com/oauth/token", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          client_id: clientID,
          code: code,
          redirect_uri: redirectUri,
          code_verifier: codeChallengeValue
        })
      })
        .then((response) => {
          return response.json();
        })
        .then((response) => {
          setAccessToken(response.access_token);
        });
    };

    window.open(uri.toString(), "_blank", "popup=yes,width=600,height=600");
  }

  function disconnect() {
    setAccessToken("");
    setUserProfile(defaultProfile);
  }
}

const CesiumIonConnectorObserver = observer<React.FC>(CesiumIonConnector);
export default CesiumIonConnectorObserver;

addOrReplaceRemoteFileUploadType("cesium-ion", {
  value: "cesium-ion",
  // This doesn't work, probably because I don't know what I'm doing:
  //   name: t("core.dataType.cesium-ion")
  // So, hard-coding it instead.
  name: "Cesium ion",
  customComponent: CesiumIonConnectorObserver
});
