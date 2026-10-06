import { observer } from "mobx-react";
import { FC, useEffect, useRef } from "react";
import styled, { useTheme } from "styled-components";
import { Notification } from "../../ReactViewModels/NotificationState";
import { Button } from "../../Styled/Button";
import Icon, { StyledIcon } from "../../Styled/Icon";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import { useViewState } from "../Context";

const NotificationToast: FC<{
  notification: Notification;
}> = observer(({ notification }) => {
  const viewState = useViewState();
  const theme = useTheme();
  const nodeRef = useRef(null);

  const notificationState = viewState.terria.notificationState;
  const durationMsecs = notification.toastVisibleDuration
    ? notification.toastVisibleDuration * 1000
    : undefined;

  const rawMessage =
    typeof notification.message === "function"
      ? notification.message(viewState)
      : notification.message;
  const message =
    typeof rawMessage === "string"
      ? parseCustomMarkdownToReact(rawMessage)
      : rawMessage;

  useEffect(() => {
    // No toastVisibleDuration means the toast stays open until the user
    // closes it - omitting the timeout here rather than passing `undefined`
    // to setTimeout, which would fire almost immediately instead of never.
    if (durationMsecs === undefined) {
      return;
    }
    const timeout = setTimeout(() => {
      if (notificationState.currentNotification === notification) {
        notificationState.dismissCurrentNotification();
      }
    }, durationMsecs);
    return () => clearTimeout(timeout);
  }, [notification, notificationState, durationMsecs]);

  return (
    <Wrapper ref={nodeRef} trainerBarVisible={viewState.trainerBarVisible}>
      <StyledIcon
        styledWidth="24px"
        styledHeight="24px"
        glyph={Icon.GLYPHS.warning}
        fillColor={theme.colorSecondary}
      />
      <Message>{message}</Message>
      <CloseButton
        onClick={(e: MouseEvent) => {
          e.stopPropagation();
          notificationState.dismissCurrentNotification();
        }}
      />
    </Wrapper>
  );
});

const Wrapper = styled.div<{ trainerBarVisible: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;

  position: fixed;
  top: ${(p) =>
    (p.trainerBarVisible ? Number(p.theme.trainerHeight) : 0) + 70}px;
  left: 50%;
  transform: translate(-35%);
  border: 1px solid ${(p) => p.theme.darkLighter};
  border-radius: 6px;
  z-index: ${(p) => p.theme.notificationWindowZIndex};

  max-width: 50%;
  padding: 16px;
  gap: 16px;
  background-color: ${(p) => p.theme.dark};
`;

const Message = styled.div`
  color: ${(p) => p.theme.textLight};

  p {
    margin: 0;
  }
  p + p {
    margin-top: 8px;
  }

  button {
    color: ${(p) => p.theme.colorPrimary};
    text-decoration: none;
  }
`;

const CloseButton = styled(Button).attrs({
  styledWidth: "24px",
  styledHeight: "24px",
  renderIcon: () => (
    <StyledIcon
      glyph={Icon.GLYPHS.closeLight}
      styledWidth="16px"
      styledHeight="16px"
      light
    />
  )
})`
  background-color: transparent;
  border: 0;
  min-height: max-content;
`;

export default NotificationToast;
