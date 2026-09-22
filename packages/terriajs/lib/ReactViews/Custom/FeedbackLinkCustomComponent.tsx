import i18next from "i18next";
import { runInAction } from "mobx";
import { ReactElement } from "react";
import ViewState from "../../ReactViewModels/ViewState";
import { RawButton } from "../../Styled/Button";
import Text from "../../Styled/Text";
import CustomComponent, {
  DomElement,
  ProcessNodeContext
} from "./CustomComponent";
import parseCustomMarkdownToReact from "./parseCustomMarkdownToReact";

function showFeedback(viewState: ViewState) {
  runInAction(() => {
    viewState.feedbackFormIsVisible = true;
    viewState.terria.notificationState.dismissCurrentNotification();
  });
}

const emailPlaceholder = /\{\{email\}\}/g;

/** Resolve an `email-message` override against the support email address. The
 * message can position the address with a `{{email}}` placeholder - i18next
 * leaves it untouched because the address isn't known at translation time. If
 * there's no placeholder, the address is appended to the message.
 */
function resolveEmailMessage(emailMessage: string, supportEmail: string) {
  return emailMessage.includes("{{email}}")
    ? emailMessage.replace(emailPlaceholder, supportEmail)
    : `${emailMessage} ${supportEmail}`;
}

export const FeedbackLink = (props: {
  viewState: ViewState;
  /** Override for feedback message */
  feedbackMessage?: string;
  /** Override for email message - this will be shown if feedback isn't available. NOTE: supportEmail will replace a `{{email}}` placeholder in this string, or be appended to it if there is no placeholder */
  emailMessage?: string;
}) =>
  // If we have feedbackUrl = show button to open feedback dialog
  props.viewState.terria.configParameters.feedbackUrl ? (
    <RawButton
      fullWidth
      onClick={() => showFeedback(props.viewState)}
      css={`
        text-align: left;
      `}
    >
      <Text bold isLink>
        {parseCustomMarkdownToReact(
          props.feedbackMessage
            ? props.feedbackMessage
            : i18next.t(($) => $.models.raiseError.notificationFeedback)
        )}
      </Text>
    </RawButton>
  ) : (
    // If we only have supportEmail - show message and the email address
    <>
      {parseCustomMarkdownToReact(
        props.emailMessage
          ? resolveEmailMessage(
              props.emailMessage,
              props.viewState.terria.supportEmail
            )
          : i18next.t(($) => $.models.raiseError.notificationFeedbackEmail, {
              email: props.viewState.terria.supportEmail
            })
      )}
    </>
  );

/**
 * A `<feedbacklink>` custom component, which displays a feedback button (if the feature is enabled), or an email address.
 */
export default class FeedbackLinkCustomComponent extends CustomComponent {
  static componentName = "feedbacklink";

  get name(): string {
    return FeedbackLinkCustomComponent.componentName;
  }

  get attributes(): string[] {
    return ["email-message", "feedback-message"];
  }

  processNode(
    context: ProcessNodeContext,
    node: DomElement,
    _children: ReactElement[]
  ) {
    if (!context.viewState) return undefined;

    return (
      <FeedbackLink
        viewState={context.viewState}
        emailMessage={node.attribs?.["email-message"]}
        feedbackMessage={node.attribs?.["feedback-message"]}
      />
    );
  }
}
