import i18next from "i18next";
import { runInAction } from "mobx";
import React from "react";
import TerriaError from "../../Core/TerriaError";
import ViewState from "../../ReactViewModels/ViewState";
import Collapsible from "../Custom/Collapsible/Collapsible";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";

const Text: any = require("../../Styled/Text").default;
const Spacing: any = require("../../Styled/Spacing").Spacing;
const RawButton: any = require("../../Styled/Button").RawButton;
const TextSpan: any = require("../../Styled/Text").TextSpan;

export const terriaErrorNotification = (error: TerriaError) => (
  viewState: ViewState
) => {
  const showFeedback = () => {
    runInAction(() => {
      viewState.feedbackFormIsVisible = true;
      viewState.notifications.splice(0, 1);
    });
  };

  return (
    <React.Fragment>
      <Text>Details of the error are below.</Text>

      <Text>{parseCustomMarkdownToReact(error.message)}</Text>

      <Spacing bottom={2} />

      {error.stackTrace ? (
        <Collapsible
          btnRight={true}
          title={"Stacktrace"}
          titleTextProps={{ large: true }}
          bodyBoxProps={{ padded: true }}
        >
          <pre>{error.stackTrace}</pre>
        </Collapsible>
      ) : null}

      <Spacing bottom={2} />

      {viewState.terria.configParameters.feedbackUrl ? (
        <RawButton
          fullWidth
          onClick={showFeedback}
          css={`
            text-align: left;
          `}
        >
          <TextSpan textLight bold medium>
            {parseCustomMarkdownToReact(
              i18next.t("share.convertNotificationFeedback")
            )}
          </TextSpan>
        </RawButton>
      ) : (
        <Text>
          Please report it by sending an email to{" "}
          {viewState.terria.supportEmail}
        </Text>
      )}
    </React.Fragment>
  );
};
