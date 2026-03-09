import { Ref, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import { DefaultTheme } from "styled-components";
import Terria, { LoginProfileServiceType } from "../../../../Models/Terria";
import ViewState from "../../../../ReactViewModels/ViewState";
import Icon from "../../../../Styled/Icon";
import { useRefForTerria } from "../../../Hooks/useRefForTerria";

import Styles from "./login-button.scss";

interface Props {
  terria: Terria;
  theme: DefaultTheme;
  viewState: ViewState;
}

interface ButtonProps extends Props {
  ["aria-expanded"]: boolean;
}

const LOGIN_BUTTON_NAME = "MenuBarLoginButton";

const LoginButton = observer((props: Props) => {
  const storyButtonRef: Ref<HTMLButtonElement> = useRefForTerria(
    LOGIN_BUTTON_NAME,
    props.viewState
  );
  const buttonWrapperRef = useRef<HTMLDivElement>(null);
  const [isLogoutConfirmVisible, setIsLogoutConfirmVisible] =
    useState<boolean>(false);

  const { t } = useTranslation();
  const isLoggedIn = !!(props.terria.userAuthToken || props.terria.userProfile);

  useEffect(() => {
    if (!isLogoutConfirmVisible) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        buttonWrapperRef.current &&
        !buttonWrapperRef.current.contains(event.target as Node)
      ) {
        setIsLogoutConfirmVisible(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLogoutConfirmVisible(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isLogoutConfirmVisible]);

  useEffect(() => {
    if (!isLoggedIn && isLogoutConfirmVisible) {
      setIsLogoutConfirmVisible(false);
    }
  }, [isLoggedIn, isLogoutConfirmVisible]);

  const executeAuthAction = (viewState: ViewState) => {
    if (
      props.terria.configParameters.userProfileLoginServiceType ===
      LoginProfileServiceType.Cohesion
    ) {
      const a = document.createElement("a");
      a.href = !viewState.terria.userProfile
        ? viewState.terria.configParameters.userProfileLoginServiceUrl +
          document.baseURI
        : document.baseURI;
      a.click();
    } else if (
      props.terria.configParameters.userProfileLoginServiceType ===
      LoginProfileServiceType.Geoserver
    ) {
      runInAction(() => {
        if (props.terria.userAuthToken) {
          props.terria.userAuthToken = undefined;
        } else {
          viewState.isLoginPanelVisible = true;
        }
      });
    }
  };

  const onLoginButtonClick = (viewState: ViewState) => () => {
    if (isLoggedIn) {
      setIsLogoutConfirmVisible((showPanel) => !showPanel);
      return;
    }

    executeAuthAction(viewState);
  };

  const onConfirmLogout = () => {
    setIsLogoutConfirmVisible(false);
    executeAuthAction(props.viewState);
  };

  return (
    <div className={Styles.loginContainer} ref={buttonWrapperRef}>
      <button
        ref={storyButtonRef}
        className={Styles.loginBtn}
        type="button"
        onClick={onLoginButtonClick(props.viewState)}
        aria-expanded={isLoggedIn}
        css={`
          ${(p: ButtonProps) =>
            p["aria-expanded"] &&
            `&:not(.foo) {
              background: ${p.theme.colorPrimary};
              svg {
                fill: ${p.theme.textLight};
              }
            }`}
        `}
        title={!isLoggedIn ? t("login.loginTitle") : t("login.logoutTitle")}
      >
        <Icon glyph={isLoggedIn ? Icon.GLYPHS.logout : Icon.GLYPHS.user} />
      </button>
      {isLoggedIn && isLogoutConfirmVisible && (
        <div
          className={Styles.logoutConfirmPanel}
          role="dialog"
          aria-modal={false}
          aria-label={t("login.logoutConfirmTitle")}
        >
          <div className={Styles.logoutConfirmMessage}>
            {t("login.logoutConfirmMessage")}
          </div>
          <div className={Styles.logoutConfirmActions}>
            <button
              type="button"
              className={Styles.logoutConfirmBtn}
              onClick={onConfirmLogout}
            >
              {t("login.logoutConfirmOk")}
            </button>
            <button
              type="button"
              className={Styles.logoutCancelBtn}
              onClick={() => setIsLogoutConfirmVisible(false)}
            >
              {t("login.logoutConfirmCancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
export default LoginButton;
