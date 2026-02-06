import { Ref } from "react";
import { useTranslation } from "react-i18next";
import { DefaultTheme } from "styled-components";
import Terria from "../../../../Models/Terria";
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

const LoginButton = (props: Props) => {
  const storyButtonRef: Ref<HTMLButtonElement> = useRefForTerria(
    LOGIN_BUTTON_NAME,
    props.viewState
  );

  const onLoginButtonClick = (viewState: ViewState) => () => {
    const a = document.createElement("a");
    a.href = !viewState.terria.userProfile
      ? viewState.terria.configParameters.userProfileLoginServiceUrl +
        document.baseURI
      : document.baseURI;
    a.click();
  };

  const { t } = useTranslation();

  return (
    <div>
      <button
        ref={storyButtonRef}
        className={Styles.loginBtn}
        type="button"
        onClick={onLoginButtonClick(props.viewState)}
        aria-expanded={!!props.viewState.terria.userProfile}
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
        title={
          !props.viewState.terria.userProfile
            ? t("login.loginTitle")
            : t("login.logoutTitle")
        }
      >
        <Icon glyph={Icon.GLYPHS.user} />
      </button>
    </div>
  );
};
export default LoginButton;
