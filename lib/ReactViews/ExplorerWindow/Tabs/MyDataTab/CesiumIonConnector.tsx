import React from "react";
import { observer } from "mobx-react";
import { t } from "i18next";
import URI from "urijs";
import { string } from "prop-types";
import { Trans, withTranslation } from "react-i18next";
import AddDataStyles from "./add-data.scss";
import Styles from "./cesium-ion-connector.scss";
import upsertModelFromJson from "../../../../Models/Definition/upsertModelFromJson";
import CatalogMemberFactory from "../../../../Models/Catalog/CatalogMemberFactory";
import CommonStrata from "../../../../Models/Definition/CommonStrata";
import addUserCatalogMember from "../../../../Models/Catalog/addUserCatalogMember";
import Dropdown from "../../../Generic/Dropdown";
import Icon from "../../../../Styled/Icon";
import classNames from "classnames";
import { RawButton } from "../../../../Styled/Button";
import styled from "styled-components";
import { useViewState } from "../../../Context";
import TimeVarying from "../../../../ModelMixins/TimeVarying";

interface CesiumIonToken {
  id?: string;
  name?: string;
  uniqueName?: string; // we populate this one ourselves
  token?: string;
  dateAdded?: string;
  dateModified?: string;
  dateLastUsed?: string;
  assetIds?: number[];
  isDefault?: boolean;
  allowedUrls?: string[];
  scopes?: string[];
}

interface CesiumIonAsset {
  id?: string;
  name?: string;
  uniqueName?: string; // we populate this one ourselves
  description?: string;
  type?: string;
  bytes?: number;
  dateAdded?: string;
  status?: string;
  percentComplete?: number;
  archivable?: boolean;
  exportable?: boolean;
}

const ActionButton = styled(RawButton)`
  svg {
    height: 20px;
    width: 20px;
    margin: 5px;
    fill: ${(p) => p.theme.charcoalGrey};
  }

  &:hover,
  &:focus {
    svg {
      fill: ${(p) => p.theme.modalHighlight};
    }
  }
`;

function CesiumIonConnector() {
  const tokenLocalStorageName = "cesium-ion-login-token";

  const viewState = useViewState();

  const [codeChallenge, setCodeChallenge] = React.useState({
    value: "",
    hash: ""
  });

  const [tokens, setTokens] = React.useState<CesiumIonToken[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = React.useState<boolean>(false);
  const [assets, setAssets] = React.useState<CesiumIonAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = React.useState<boolean>(false);

  const [loginToken, setLoginToken] = React.useState(
    localStorage.getItem(tokenLocalStorageName) ?? ""
  );

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
  const [isLoadingUserProfile, setIsLoadingUserProfile] =
    React.useState<boolean>(false);

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
    setIsLoadingUserProfile(true);

    fetch("https://api.cesium.com/v1/me", {
      headers: {
        Authorization: `Bearer ${loginToken}`
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
        setIsLoadingUserProfile(false);
      });
  }, [loginToken]);

  React.useEffect(() => {
    if (loginToken.length === 0) return;

    setIsLoadingAssets(true);

    fetch("https://api.cesium.com/v1/assets", {
      headers: {
        Authorization: `Bearer ${loginToken}`
      }
    })
      .then((response) => response.json())
      .then((assets: { items: CesiumIonAsset[] }) => {
        if (assets.items) {
          assets.items.forEach((item) => {
            item.uniqueName = `${item.name} (${item.id})`;
          });
          setAssets(assets.items);
        }

        setIsLoadingAssets(false);
      });
  }, [loginToken]);

  React.useEffect(() => {
    if (loginToken.length === 0) return;

    setIsLoadingTokens(true);

    fetch("https://api.cesium.com/v2/tokens", {
      headers: {
        Authorization: `Bearer ${loginToken}`
      }
    })
      .then((response) => response.json())
      .then((tokens: { items: CesiumIonToken[] }) => {
        if (tokens.items) {
          tokens.items.forEach((item) => {
            item.uniqueName = `${item.name} (${item.id})`;
          });
          setTokens(tokens.items);
        }
        setIsLoadingTokens(false);
      });
  }, [loginToken]);

  let selectedToken = viewState.currentCesiumIonToken
    ? tokens.find((token) => token.id == viewState.currentCesiumIonToken)
    : undefined;

  if (selectedToken === undefined && tokens.length > 0) {
    selectedToken = tokens[0];
  }

  const setSelectedToken = (token: CesiumIonToken) => {
    viewState.currentCesiumIonToken = token.id;
  };

  return (
    <>
      <label className={AddDataStyles.label}>
        <Trans i18nKey="addData.cesiumIon">
          <strong>Step 2:</strong>
        </Trans>
      </label>
      {loginToken.length > 0
        ? renderConnectedOrConnecting()
        : renderDisconnected()}
    </>
  );

  function renderConnectedOrConnecting() {
    return (
      <>
        {isLoadingUserProfile ? (
          <label className={AddDataStyles.label}>
            Loading user profile information...
          </label>
        ) : (
          <label className={AddDataStyles.label}>
            Connected to Cesium ion as {userProfile.username}
          </label>
        )}
        <button className={Styles.connectButton} onClick={disconnect}>
          Disconnect
        </button>
        {userProfile.username.length > 0
          ? renderConnected()
          : renderConnecting()}
      </>
    );
  }

  function renderConnected() {
    const dropdownTheme = {
      list: AddDataStyles.dropdownList,
      icon: <Icon glyph={Icon.GLYPHS.opened} />,
      dropdown: Styles.dropDown,
      button: Styles.dropDownButton
    };

    return (
      <>
        <label className={AddDataStyles.label}>
          <Trans i18nKey="addData.cesiumIonToken">Cesium ion Token:</Trans>
        </label>
        {isLoadingTokens ? (
          <label className={AddDataStyles.label}>Loading token list...</label>
        ) : (
          <Dropdown
            options={tokens}
            textProperty="uniqueName"
            selected={selectedToken}
            selectOption={setSelectedToken}
            matchWidth
            theme={dropdownTheme}
          />
        )}
        <div
          className={classNames(Styles.tokenWarning, {
            [Styles.tokenWarningHidden]: !selectedToken
          })}
        >
          {renderTokenWarning()}
        </div>
        {isLoadingAssets ? (
          <label className={AddDataStyles.label}>Loading asset list...</label>
        ) : (
          <table className={Styles.assetsList}>
            <tbody>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Type</th>
              </tr>
              {assets.map(renderAssetRow)}
            </tbody>
          </table>
        )}
      </>
    );
  }

  function renderConnecting() {
    return <></>;
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
          <button
            className={Styles.connectButton}
            onClick={connect}
            disabled={codeChallenge.hash == ""}
          >
            Connect to Cesium ion
          </button>
        </div>
      </div>
    );
  }

  function renderTokenWarning() {
    if (!selectedToken) return;

    const dangerousScopes = [];
    for (const scope of selectedToken.scopes ?? []) {
      // Only these scopes are "safe".
      if (scope !== "assets:read" && scope !== "geocode") {
        dangerousScopes.push(scope);
      }
    }

    if (dangerousScopes.length > 0) {
      return (
        <>
          <strong>DO NOT USE THIS TOKEN!</strong> It allows access to your{" "}
          <a href="https://ion.cesium.com/tokens" target="_blank">
            Cesium ion account
          </a>{" "}
          using the following scopes that provide potentially sensitive
          information or allow changes to be made to your account:{" "}
          {dangerousScopes.join(", ")}
        </>
      );
    }

    let numberOfAssetsAccessible = -1;
    if (selectedToken.assetIds) {
      numberOfAssetsAccessible = selectedToken.assetIds.length;
    }

    return (
      <>
        This token allows access to{" "}
        <strong>
          {numberOfAssetsAccessible < 0 ? "every" : numberOfAssetsAccessible}
        </strong>{" "}
        {numberOfAssetsAccessible <= 1 ? "asset" : "assets"} in your{" "}
        <a href="https://ion.cesium.com/tokens" target="_blank">
          Cesium ion account
        </a>
        .
      </>
    );
  }

  function renderAssetRow(asset: CesiumIonAsset) {
    return (
      <tr>
        <td>
          <ActionButton
            type="button"
            onClick={addToMap.bind(undefined, asset)}
            title={t("catalogItem.add")}
          >
            <Icon glyph={Icon.GLYPHS.add} className={Styles.addAssetButton} />
          </ActionButton>
        </td>
        <td>{asset.name}</td>
        <td>{asset.type}</td>
      </tr>
    );
  }

  function connect() {
    // TODO: these need to be configurable
    const clientID =
      viewState.terria.configParameters.cesiumIonOAuth2ApplicationID;
    const redirectUri = URI("build/TerriaJS/cesium-ion-oauth2.html")
      .absoluteTo(window.location.href)
      .fragment("")
      .query("")
      .toString();

    const codeChallengeValue = codeChallenge.value;
    const codeChallengeHash = codeChallenge.hash;

    const state = [...crypto.getRandomValues(new Uint8Array(16))]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");

    const uri = new URI("https://ion.cesium.com/oauth").addQuery({
      response_type: "code",
      client_id: clientID,
      scope: "assets:read assets:list tokens:read profile:read",
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
          localStorage.setItem(tokenLocalStorageName, response.access_token);
          setLoginToken(response.access_token ?? "");
        });
    };

    window.open(uri.toString(), "_blank", "popup=yes,width=600,height=600");
  }

  function disconnect() {
    localStorage.removeItem(tokenLocalStorageName);
    setLoginToken("");
    setUserProfile(defaultProfile);
  }

  function addToMap(
    asset: CesiumIonAsset,
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    if (!selectedToken) return;

    const definition = createCatalogItemDefinitionFromAsset(
      asset,
      selectedToken
    );
    if (!definition) return;

    const newItem = upsertModelFromJson(
      CatalogMemberFactory,
      viewState.terria,
      "",
      CommonStrata.definition,
      definition,
      {}
    ).throwIfUndefined({
      message: `An error occurred trying to add asset: ${asset.name}`
    });

    const keepCatalogOpen = event.shiftKey || event.ctrlKey;

    addUserCatalogMember(viewState.terria, Promise.resolve(newItem)).then(
      (addedItem) => {
        if (addedItem) {
          if (TimeVarying.is(addedItem)) {
            viewState.terria.timelineStack.addToTop(addedItem);
          }
        }

        if (!keepCatalogOpen) {
          viewState.closeCatalog();
        }
      }
    );
  }

  function createCatalogItemDefinitionFromAsset(
    asset: CesiumIonAsset,
    token: CesiumIonToken
  ) {
    let type = "";
    const extras: any = {};
    switch (asset.type) {
      case "3DTILES":
        type = "3d-tiles";
        break;
      case "GLTF":
        type = "gltf";
        // TODO
        extras.origin = {
          longitude: 0.0,
          latitude: 0.0,
          height: 0.0
        };
      case "IMAGERY":
        type = "ion-imagery";
        break;
      case "TERRAIN":
        type = "cesium-terrain";
        break;
      case "CZML":
        type = "czml";
        break;
      case "KML":
        type = "kml";
        break;
      case "GEOJSON":
        type = "geojson";
        break;
    }

    if (type === "") return undefined;

    return {
      name: asset.name ?? "Unnamed",
      type: type,
      description: asset.description ?? "",
      ionAssetId: Number.parseInt(asset.id ?? "0"),
      ionAccessToken: token.token,
      info: [
        {
          name: "Cesium ion Account",
          content: userProfile.username
        },
        {
          name: "Cesium ion Token",
          content: token.name ?? token.id
        }
      ],
      ...extras
    };
  }
}

const CesiumIonConnectorObserver = observer<React.FC>(CesiumIonConnector);
export default withTranslation()(CesiumIonConnectorObserver);
