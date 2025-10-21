import classNames from "classnames";
import { observer } from "mobx-react";
import { string } from "prop-types";
import { MouseEvent, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import URI from "urijs";
import isDefined from "../../../../Core/isDefined";
import TerriaError from "../../../../Core/TerriaError";
import Cesium3dTilesMixin from "../../../../ModelMixins/Cesium3dTilesMixin";
import CesiumIonMixin from "../../../../ModelMixins/CesiumIonMixin";
import TimeVarying from "../../../../ModelMixins/TimeVarying";
import addUserCatalogMember from "../../../../Models/Catalog/addUserCatalogMember";
import CesiumTerrainCatalogItem from "../../../../Models/Catalog/CatalogItems/CesiumTerrainCatalogItem";
import IonImageryCatalogItem from "../../../../Models/Catalog/CatalogItems/IonImageryCatalogItem";
import CatalogMemberFactory from "../../../../Models/Catalog/CatalogMemberFactory";
import CommonStrata from "../../../../Models/Definition/CommonStrata";
import upsertModelFromJson from "../../../../Models/Definition/upsertModelFromJson";
import Terria from "../../../../Models/Terria";
import { RawButton } from "../../../../Styled/Button";
import Icon from "../../../../Styled/Icon";
import { useViewState } from "../../../Context";
import Dropdown from "../../../Generic/Dropdown";
import WarningBox from "../../../Preview/WarningBox";
import AddDataStyles from "./add-data.scss";
import Styles from "./cesium-ion-connector.scss";

interface CesiumIonToken {
  id?: string;
  name?: string;
  uniqueName: string; // we populate this one ourselves
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
  id?: number;
  name?: string;
  uniqueName: string; // we populate this one ourselves
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

/**
 * An interface getting and setting the user's Cesium ion login token obtained via OAuth2.
 */
interface LoginTokenPersistence {
  get(): string | null;
  set(token: string): void;
  clear(): void;
}

class LoginTokenPersistenceInLocalStorage implements LoginTokenPersistence {
  private storageName = "cesium-ion-login-token";

  public get(): string | null {
    return localStorage.getItem(this.storageName) ?? "";
  }

  public set(token: string) {
    localStorage.setItem(this.storageName, token);
  }

  public clear() {
    localStorage.removeItem(this.storageName);
  }
}

class LoginTokenPersistenceInSessionStorage implements LoginTokenPersistence {
  private storageName = "cesium-ion-login-token";

  public get(): string | null {
    return sessionStorage.getItem(this.storageName) ?? "";
  }

  public set(token: string) {
    sessionStorage.setItem(this.storageName, token);
  }

  public clear() {
    sessionStorage.removeItem(this.storageName);
  }
}

class LoginTokenPersistenceInPage implements LoginTokenPersistence {
  private loginToken: string | null = null;

  public get(): string | null {
    return this.loginToken;
  }

  public set(token: string) {
    this.loginToken = token;
  }

  public clear() {
    this.loginToken = null;
  }
}

const loginTokenPersistenceTypes = {
  page: new LoginTokenPersistenceInPage(),
  sessionStorage: new LoginTokenPersistenceInSessionStorage(),
  localStorage: new LoginTokenPersistenceInLocalStorage()
};

const loginTokenPersistenceLookup: {
  [key: string]: LoginTokenPersistence | undefined;
} = loginTokenPersistenceTypes;

const defaultUserProfile = {
  id: 0,
  scopes: [],
  username: "",
  email: "",
  emailVerified: false,
  avatar: string,
  storage: {}
};

function CesiumIonConnector() {
  const viewState = useViewState();
  const { t } = useTranslation();

  const loginTokenPersistence =
    loginTokenPersistenceLookup[
      viewState.terria.configParameters.cesiumIonLoginTokenPersistence ?? ""
    ] ?? loginTokenPersistenceTypes.page;

  const [codeChallenge, setCodeChallenge] = useState({
    value: "",
    hash: ""
  });

  const [tokens, setTokens] = useState<CesiumIonToken[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState<boolean>(false);
  const [assets, setAssets] = useState<CesiumIonAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState<boolean>(false);

  // This is the Cesium ion token representing the currently logged-in user, as obtained via
  // an OAuth2 Authorization Code Grant flow with Cesium ion.
  const [loginToken, setLoginToken] = useState(
    loginTokenPersistence.get() ?? ""
  );

  const [error, setError] = useState<TerriaError | undefined>(undefined);

  const [userProfile, setUserProfile] = useState(defaultUserProfile);
  const [isLoadingUserProfile, setIsLoadingUserProfile] =
    useState<boolean>(false);

  useEffect(() => {
    if (!crypto || !crypto.subtle) return;

    const codeChallenge = [...crypto.getRandomValues(new Uint8Array(32))]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");

    crypto.subtle
      .digest("SHA-256", new TextEncoder().encode(codeChallenge))
      .then((hash) => {
        setCodeChallenge({
          value: codeChallenge,
          hash: btoa(String.fromCharCode(...new Uint8Array(hash)))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/[=]/g, "")
        });
      });
  }, []);

  useEffect(() => {
    if (loginToken.length === 0) return;

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
          setUserProfile(defaultUserProfile);
        }
        setIsLoadingUserProfile(false);
      });
  }, [loginToken]);

  useEffect(() => {
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

  useEffect(() => {
    if (
      !viewState.terria.configParameters.cesiumIonAllowSharingAddedAssets ||
      loginToken.length === 0
    ) {
      return;
    }

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

          if (viewState.terria.configParameters.cesiumIonDisableDefaultToken) {
            tokens.items = tokens.items.filter((item) => !item.isDefault);
          }
          setTokens(tokens.items);
        }
        setIsLoadingTokens(false);
      });
  }, [
    loginToken,
    viewState.terria.configParameters.cesiumIonAllowSharingAddedAssets,
    viewState.terria.configParameters.cesiumIonDisableDefaultToken
  ]);

  let selectedToken = viewState.currentCesiumIonToken
    ? tokens.find((token) => token.id === viewState.currentCesiumIonToken)
    : undefined;

  if (selectedToken === undefined && tokens.length > 0) {
    selectedToken = tokens[0];
  }

  const setSelectedToken = (token: CesiumIonToken) => {
    viewState.currentCesiumIonToken = token.id;
  };

  if (!crypto || !crypto.subtle) {
    return (
      <label className={AddDataStyles.label}>
        This service is not currently available. The most likely cause is that
        this web page is being accessed with `http` instead of `https`.
      </label>
    );
  }

  const dropdownTheme = {
    list: AddDataStyles.dropdownList,
    icon: <Icon glyph={Icon.GLYPHS.opened} />,
    dropdown: Styles.dropDown,
    button: Styles.dropDownButton
  };

  return (
    <>
      <label className={AddDataStyles.label}>
        <Trans i18nKey="addData.cesiumIon">
          <strong>Step 2:</strong>
        </Trans>
      </label>
      {error && <WarningBox error={error} viewState={viewState} />}
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
        {userProfile.username.length > 0 && renderConnected()}
      </>
    );
  }

  function renderConnected() {
    const isAssetAccessibleBySelectedToken = (asset: CesiumIonAsset) => {
      if (!selectedToken) {
        if (viewState.terria.configParameters.cesiumIonAllowSharingAddedAssets)
          return false;
        else return true;
      }

      if (asset.id === undefined) return true;

      if (selectedToken.assetIds === undefined) {
        // Token allows access to all assets
        return true;
      }

      return selectedToken.assetIds.indexOf(asset.id) >= 0;
    };

    const accessibleAssets = assets.filter(isAssetAccessibleBySelectedToken);

    return (
      <>
        {renderTokenSelector()}
        {isLoadingAssets ? (
          <label className={AddDataStyles.label}>Loading asset list...</label>
        ) : (
          <>
            {accessibleAssets.length === 0 && renderNoAssetsAvailableWarning()}
            {accessibleAssets.length > 0 && (
              <table className={Styles.assetsList}>
                <tbody>
                  <tr>
                    <th />
                    <th>Name</th>
                    <th>Type</th>
                  </tr>
                  {accessibleAssets.map(renderAssetRow)}
                </tbody>
              </table>
            )}
          </>
        )}
      </>
    );
  }

  function renderTokenSelector() {
    if (!viewState.terria.configParameters.cesiumIonAllowSharingAddedAssets)
      return undefined;

    return (
      <>
        <label className={AddDataStyles.label}>
          <Trans i18nKey="addData.cesiumIonToken">Cesium ion token:</Trans>
        </label>
        {isLoadingTokens ? (
          <label className={AddDataStyles.label}>Loading token list...</label>
        ) : (
          <>
            {renderNoTokensAvailableWarning()}
            {tokens.length > 0 && (
              <Dropdown
                options={tokens}
                textProperty="uniqueName"
                selected={selectedToken}
                selectOption={setSelectedToken}
                matchWidth
                theme={dropdownTheme}
              />
            )}
          </>
        )}
        <div
          className={classNames(Styles.tokenWarning, {
            [Styles.tokenWarningHidden]: !selectedToken
          })}
        >
          {renderTokenWarning()}
        </div>
      </>
    );
  }

  function renderNoAssetsAvailableWarning() {
    if (!selectedToken) return undefined;
    return <strong>No assets available.</strong>;
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
            disabled={codeChallenge.hash === ""}
          >
            Connect to Cesium ion
          </button>
        </div>
      </div>
    );
  }

  function renderNoTokensAvailableWarning() {
    if (tokens.length > 0) return undefined;
    return (
      <>
        <p>
          <strong>No restricted tokens found.</strong> To protect your data,
          Cesium default tokens are not allowed. Add a new token with a
          restricted scope to access your datasets.
        </p>
        <button
          className={Styles.connectButton}
          onClick={() =>
            window.open(
              "https://ion.cesium.com/tokens",
              "_blank",
              "noopener,noreferrer"
            )
          }
        >
          Add a new token
        </button>
      </>
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
          <a
            href="https://ion.cesium.com/tokens"
            target="_blank"
            rel="noreferrer"
          >
            Cesium ion account
          </a>{" "}
          using the following scopes that provide potentially sensitive
          information or allow changes to be made to your account:{" "}
          {dangerousScopes.join(", ")}
        </>
      );
    }

    if (!siteMatchesAllowedUrls(selectedToken)) {
      return (
        <>
          This token cannot be used with this map because the map is not in the
          token&apos;s list of allowed URLs in your{" "}
          <a
            href="https://ion.cesium.com/tokens"
            target="_blank"
            rel="noreferrer"
          >
            Cesium ion account
          </a>
          .
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
        <a
          href="https://ion.cesium.com/tokens"
          target="_blank"
          rel="noreferrer"
        >
          Cesium ion account
        </a>
        .
      </>
    );
  }

  function renderAssetRow(asset: CesiumIonAsset) {
    const existingItem =
      viewState.terria.catalog.userAddedDataGroup.memberModels.find(
        (item) =>
          (CesiumIonMixin.isMixedInto(item) ||
            Cesium3dTilesMixin.isMixedInto(item) ||
            item instanceof CesiumTerrainCatalogItem ||
            item instanceof IonImageryCatalogItem) &&
          item.ionAssetId === asset.id
      );

    return (
      <tr key={asset.id}>
        <td>
          <ActionButton
            type="button"
            onClick={
              existingItem
                ? () => viewState.terria.removeModelReferences(existingItem)
                : addToMap.bind(undefined, viewState.terria, asset)
            }
            title={t("catalogItem.add")}
          >
            {existingItem ? (
              <Icon
                glyph={Icon.GLYPHS.minus}
                className={Styles.addAssetButton}
              />
            ) : (
              <Icon glyph={Icon.GLYPHS.add} className={Styles.addAssetButton} />
            )}
          </ActionButton>
        </td>
        <td>{asset.name}</td>
        <td>{asset.type}</td>
      </tr>
    );
  }

  function connect() {
    const clientID =
      viewState.terria.configParameters.cesiumIonOAuth2ApplicationID;

    const redirectUri = URI(`${viewState.terria.baseUrl}cesium-ion-oauth2.html`)
      .absoluteTo(window.location.href)
      .fragment("")
      .query("");

    // Don't allow the use of a different origin for the redirect URI
    if (window.location.origin !== redirectUri.origin()) {
      setError(
        new TerriaError({
          title: "Security Error",
          message:
            "The redirect URI is not valid. Please contact your administrator."
        })
      );

      return;
    }

    const codeChallengeValue = codeChallenge.value;
    const codeChallengeHash = codeChallenge.hash;

    const state = [...crypto.getRandomValues(new Uint8Array(16))]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");

    const uri = new URI("https://ion.cesium.com/oauth").addQuery({
      response_type: "code",
      client_id: clientID,
      scope: "assets:read assets:list tokens:read profile:read",
      redirect_uri: redirectUri.toString(),
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
          redirect_uri: redirectUri.toString(),
          code_verifier: codeChallengeValue
        })
      })
        .then((response) => {
          return response.json();
        })
        .then((response) => {
          loginTokenPersistence.set(response.access_token);
          setLoginToken(response.access_token ?? "");
        });
    };

    window.open(uri.toString(), "_blank", "popup=yes,width=600,height=600");
  }

  function disconnect() {
    loginTokenPersistence.clear();
    setLoginToken("");
    setUserProfile(defaultUserProfile);
  }

  function addToMap(
    terria: Terria,
    asset: CesiumIonAsset,
    event: MouseEvent<HTMLButtonElement>
  ) {
    // If the asset may be shared, the user must choose a suitable token.
    // If not, we can access the asset using the login token.
    const allowSharing =
      viewState.terria.configParameters.cesiumIonAllowSharingAddedAssets;
    const assetToken = allowSharing
      ? selectedToken
      : {
          token: loginToken,
          name: `${userProfile.username}'s login token`,
          uniqueName: `${userProfile.username}'s login token`
        };
    if (!assetToken) return;

    const definition = createCatalogItemDefinitionFromAsset(
      terria,
      asset,
      assetToken
    );
    if (!definition) return;

    const newItem = upsertModelFromJson(
      CatalogMemberFactory,
      viewState.terria,
      "",
      terria.configParameters.cesiumIonAllowSharingAddedAssets
        ? CommonStrata.user
        : CommonStrata.definition,
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
    terria: Terria,
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
        break;
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
      shareable:
        terria.configParameters.cesiumIonAllowSharingAddedAssets ?? false,
      description: asset.description ?? "",
      ionAssetId: asset.id ?? 0,
      ionAccessToken: token.token,
      info: [
        {
          name: "Cesium ion Account",
          content: userProfile.username
        },
        {
          name: "Cesium ion token",
          content: token.name ?? token.id
        }
      ],
      ...extras
    };
  }
}

function siteMatchesAllowedUrls(token: CesiumIonToken) {
  if (!isDefined(token.allowedUrls)) {
    return true;
  }

  const current = new URI(window.location.href);

  for (const allowedUrl of token.allowedUrls) {
    let allowed;

    try {
      allowed = new URI(allowedUrl);
    } catch (_e) {
      continue;
    }

    const currentHostname = current.hostname();
    const allowedHostname = allowed.hostname();

    // Current hostname must either match the allowed one exactly, or be a subdomain of the allowed one.
    const hostnameValid =
      currentHostname === allowedHostname ||
      (currentHostname.endsWith(allowedHostname) &&
        currentHostname[currentHostname.length - allowedHostname.length - 1] ===
          ".");
    if (!hostnameValid) continue;

    // If the current has a port, the allowed must match.
    if (current.port().length > 0 && current.port() !== allowed.port())
      continue;

    // The current path must start with the allowed path.
    if (!current.path().startsWith(allowed.path())) continue;

    return true;
  }

  return false;
}

const CesiumIonConnectorObserver = observer<React.FC>(CesiumIonConnector);
export default CesiumIonConnectorObserver;
