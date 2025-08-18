import { observer } from "mobx-react";
import { useEffect } from "react";
import triggerResize from "../../Core/triggerResize";
import { useViewState } from "../Context";
import NotificationToast from "./NotificationToast";
import NotificationWindow from "./NotificationWindow";
import AnimateSlideUpFadeIn from "../Transitions/SlideUpFadeIn/AnimateSlideUpFadeIn";

const Notification = observer(() => {
  const viewState = useViewState();
  const notificationState = viewState?.terria.notificationState;
  const notification = notificationState?.currentNotification;

  const ignore =
    typeof notification?.ignore === "function"
      ? notification.ignore()
      : notification?.ignore ?? false;

  useEffect(() => {
    if (ignore) {
      notificationState.dismissCurrentNotification();
    }
  }, [notificationState, ignore]);

  const close = () => {
    if (!notification) return;

    // Force refresh once the notification is dispatched if .hideUi is set
    // since once all the .hideUi's have been dispatched the UI will no longer
    // be suppressed causing a change in the view state.

    if (notification.hideUi) {
      triggerResize();
    }

    notificationState.dismissCurrentNotification();
  };

  return (
    <>
      <AnimateSlideUpFadeIn
        isVisible={notification?.showAsToast === true}
        renderOnVisible={() =>
          notification ? (
            <NotificationToast notification={notification} />
          ) : null
        }
      />
      {notification && !notification.showAsToast && (
        <NotificationWindow
          viewState={viewState}
          title={notification.title}
          message={notification.message}
          confirmText={notification.confirmText}
          denyText={notification.denyText}
          onConfirm={() => {
            notification.confirmAction?.();
            close();
          }}
          onDeny={() => notification.denyAction?.()}
          type={notification.type ?? "notification"}
          width={notification.width}
          height={notification.height}
        />
      )}
    </>
  );
});

export default Notification;
