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

const ErrorsBox = (props: { errors: (Error | TerriaError)[] }) => {
  return (
    <React.Fragment>
      {props.errors.map(error => (
        <Collapsible
          btnRight={true}
          title={error instanceof Error ? "Stacktrace" : error.title}
          titleTextProps={{ large: true }}
          bodyBoxProps={{ padded: true }}
        >
          {error instanceof Error ? (
            <pre>{error.stack ?? error.message}</pre>
          ) : (
            <TerriaErrorBox error={error}></TerriaErrorBox>
          )}
        </Collapsible>
      ))}
    </React.Fragment>
  );
};

const TerriaErrorBox = (props: { error: TerriaError }) => {
  return (
    <React.Fragment>
      <Text>{parseCustomMarkdownToReact(props.error.message)}</Text>

      <Spacing bottom={2} />

      {props.error.originalError ? (
        <ErrorsBox errors={props.error.originalError}></ErrorsBox>
      ) : null}

      <Spacing bottom={2} />
    </React.Fragment>
  );
};

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
      <TerriaErrorBox error={error}></TerriaErrorBox>

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
