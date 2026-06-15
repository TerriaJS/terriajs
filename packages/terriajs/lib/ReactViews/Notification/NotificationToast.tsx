import { FC, useEffect, useRef } from "react";
import styled from "styled-components";
import { Notification } from "../../ReactViewModels/NotificationState";
import { Button } from "../../Styled/Button";
import Icon, { StyledIcon } from "../../Styled/Icon";
import { useViewState } from "../Context";

const NotificationToast: FC<{
  notification: Notification;
}> = ({ notification }) => {
  const viewState = useViewState();
  const nodeRef = useRef(null);

  const notificationState = viewState.terria.notificationState;
  const durationMsecs = notification.toastVisibleDuration
    ? notification.toastVisibleDuration * 1000
    : undefined;

  const message =
    typeof notification.message === "function"
      ? notification.message(viewState)
      : notification.message;

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (notificationState.currentNotification === notification) {
        notificationState.dismissCurrentNotification();
      }
    }, durationMsecs);
    return () => clearTimeout(timeout);
  }, [notification, notificationState, durationMsecs]);

  return (
    <Wrapper ref={nodeRef}>
      <StyledIcon
        styledWidth="24px"
        styledHeight="24px"
        glyph={Icon.GLYPHS.warning}
        fillColor="#EA580C"
      />
      <div>{message}</div>
      <CloseButton
        onClick={(e: MouseEvent) => {
          e.stopPropagation();
          notificationState.dismissCurrentNotification();
        }}
      />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  position: fixed;
  bottom: 70px;
  left: 50%;
  transform: translate(-35%);
  border: 1px solid #ea580c;
  border-radius: 6px;
  z-index: ${(p) => p.theme.notificationWindowZIndex};

  max-width: 50%;
  padding: 16px;
  gap: 16px;
  background-color: #f2f2f2;
`;

const CloseButton = styled(Button).attrs({
  styledWidth: "24px",
  styledHeight: "24px",
  renderIcon: () => (
    <StyledIcon
      glyph={Icon.GLYPHS.closeLight}
      styledWidth="16px"
      styledHeight="16px"
      dark
    />
  )
})`
  background-color: transparent;
  border: 0;
  min-height: max-content;
`;

export default NotificationToast;
