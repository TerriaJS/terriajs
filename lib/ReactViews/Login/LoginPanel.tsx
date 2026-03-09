import classNames from "classnames";
import { action, runInAction } from "mobx";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
//import { useTheme } from "styled-components";
import Resource from "terriajs-cesium/Source/Core/Resource";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";
import Box from "../../Styled/Box";
import Button from "../../Styled/Button";
import Input from "../../Styled/Input";
import Text from "../../Styled/Text";
import Icon from "../../Styled/Icon";
import Styles from "./login-panel.scss";

const DragWrapper = require("../DragWrapper");

interface Props {
  terria: Terria;
  viewState: ViewState;
  onClose?: () => void;
}

const LoginPanel = observer((props: Props) => {
  const { terria, viewState } = props;

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [messageKey, setMessageKey] = useState<string>();
  const [messageType, setMessageType] = useState<"error" | "info">("error");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  //const theme = useTheme();

  const { t } = useTranslation();

  useEffect(() => {
    setUsername("");
    setPassword("");
    setMessageKey(undefined);
    setMessageType("error");
    setIsLoading(false);
    document.body.style.cursor = "default";
  }, [viewState.isLoginPanelVisible]);

  const panelClassName = classNames(Styles.panel, {
    [Styles.isVisible]: viewState.isLoginPanelVisible,
    [Styles.isLoading]: isLoading
  });

  const doLogin = action(async () => {
    if (terria.userAuthToken) {
      terria.userAuthToken = undefined;
      return;
    }

    if (!username?.trim() || !password?.trim()) {
      setMessageType("error");
      setMessageKey("login.loginPanelMissingFields");
      return;
    }

    if (terria.configParameters.userProfileLoginServiceUrl) {
      setIsLoading(true);
      setMessageKey(undefined);
      document.body.style.cursor = "wait";

      const header = `Basic ${Buffer.from(`${username}:${password}`).toString(
        "base64"
      )}`;
      const resource = new Resource({
        url: terria.corsProxy.getURL(
          terria.configParameters.userProfileLoginServiceUrl
        ),
        headers: {
          Authorization: header,
          "Cache-Control": "no-cache, no-store, must-revalidate"
        }
      });
      resource
        .fetch()
        ?.then((res) => {
          if (res) {
            terria.userAuthToken = header;
            viewState.isLoginPanelVisible = false;
          }
        })
        .catch((e) => {
          console.log(e);
          setMessageType("error");
          if (e.statusCode === 401) {
            setMessageKey("login.loginPanelInvalidCredentials");
          } else if (
            e.statusCode === 0 ||
            !e.statusCode ||
            e.response === "Proxy error"
          ) {
            setMessageKey("login.loginPanelConnectionProblem");
          } else {
            setMessageKey("login.loginPanelGenericError");
          }
        })
        .finally(() => {
          setIsLoading(false);
          document.body.style.cursor = "default";
        });
    }
  });

  const cancel = () => {
    runInAction(() => {
      viewState.isLoginPanelVisible = false;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      doLogin();
    }
  };

  return (
    <DragWrapper>
      <div
        className={panelClassName}
        aria-hidden={!viewState.isLoginPanelVisible}
      >
        <div className={Styles.header}>
          <div className={classNames("drag-handle", Styles.btnPanelHeading)}>
            <span className={Styles.headerContent}>
              <Icon glyph={Icon.GLYPHS.lock} className={Styles.headerIcon} />
              <b>{t("login.loginPanelHeader")}</b>
            </span>
          </div>
        </div>
        <div className={Styles.body}>
          <div className={Styles.fieldGroup}>
            <Text
              textLight
              style={{
                textAlign: "left",
                marginBottom: "4px",
                fontSize: "0.85em"
              }}
              title={t("login.loginPanelUsernameTitle")}
            >
              {t("login.loginPanelUsername")}
            </Text>
            <Input
              title={t("login.loginPanelUsernameTitle")}
              required
              dark
              disabled={isLoading}
              value={username}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                setUsername(e.target.value);
                setMessageKey(undefined);
              }}
            />
          </div>
          <div className={Styles.fieldGroup}>
            <Text
              textLight
              style={{
                textAlign: "left",
                marginBottom: "4px",
                fontSize: "0.85em"
              }}
              title={t("login.loginPanelPasswordTitle")}
            >
              {t("login.loginPanelPassword")}
            </Text>
            <Input
              title={t("login.loginPanelPasswordTitle")}
              required
              dark
              type="password"
              disabled={isLoading}
              value={password}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                setPassword(e.target.value);
                setMessageKey(undefined);
              }}
            />
          </div>
          {messageKey && (
            <div
              className={classNames(Styles.messageBox, {
                [Styles.messageError]: messageType === "error",
                [Styles.messageInfo]: messageType === "info"
              })}
            >
              <Text style={{ textAlign: "center", fontSize: "0.8em" }}>
                {t(messageKey)}
              </Text>
            </div>
          )}
          {isLoading && (
            <div className={Styles.loadingIndicator}>
              <Text
                textLight
                style={{ textAlign: "center", fontSize: "0.8em" }}
              >
                {t("login.loginPanelLoading")}
              </Text>
            </div>
          )}
          <Box justifySpaceBetween className={Styles.buttonRow}>
            <Button
              primary
              shortMinHeight
              onClick={doLogin}
              disabled={isLoading}
              style={{
                fontSize: "0.85em",
                padding: "6px 20px",
                flex: 1,
                margin: "0 4px 0 0"
              }}
            >
              {t("login.loginPanelOk")}
            </Button>
            <Button
              secondary
              shortMinHeight
              onClick={cancel}
              disabled={isLoading}
              style={{
                fontSize: "0.85em",
                padding: "6px 20px",
                flex: 1,
                margin: "0 0 0 4px"
              }}
            >
              {t("login.loginPanelCancel")}
            </Button>
          </Box>
        </div>
      </div>
    </DragWrapper>
  );
});

export default LoginPanel;
