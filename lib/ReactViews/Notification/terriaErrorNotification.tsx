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
const Box: any = require("../../Styled/Box").default;

const ErrorsBox = (props: {
  errors: (Error | TerriaError)[];
  depth: number;
}) => {
  return (
    <>
      {props.errors.map((error, idx) => (
        <Box
          displayInlineBlock
          css={{
            paddingLeft: "7px",
            borderLeft: "solid 1px rgba(255,255,255,.1)"
          }}
          key={idx}
        >
          {error instanceof TerriaError ? (
            <TerriaErrorBox
              error={error}
              depth={props.depth + 1}
            ></TerriaErrorBox>
          ) : (
            <pre>{error.stack ?? error.message ?? error.toString()}</pre>
          )}
        </Box>
      ))}
    </>
  );
};

const TerriaErrorBox = (props: { error: TerriaError; depth: number }) => {
  return (
    <>
      <Text>{parseCustomMarkdownToReact(props.error.message)}</Text>

      <Spacing bottom={1} />

      {Array.isArray(props.error.originalError) &&
      props.error.originalError.length > 0 ? (
        props.depth === 0 ? (
          <Collapsible
            btnRight={true}
            title={i18next.t("models.raiseError.developerDetails")}
            titleTextProps={{ large: true }}
            bodyBoxProps={{ padded: true }}
          >
            <ErrorsBox
              errors={props.error.originalError}
              depth={props.depth}
            ></ErrorsBox>
          </Collapsible>
        ) : (
          <ErrorsBox
            errors={props.error.originalError}
            depth={props.depth}
          ></ErrorsBox>
        )
      ) : null}
    </>
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
    <>
      <TerriaErrorBox error={error} depth={0}></TerriaErrorBox>

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
              i18next.t("models.raiseError.notificationFeedback")
            )}
          </TextSpan>
        </RawButton>
      ) : (
        <Text>
          Please report it by sending an email to{" "}
          {viewState.terria.supportEmail}
        </Text>
      )}
    </>
  );
};
