import { action } from "mobx";
import { Trans } from "react-i18next";
import ViewState from "../../ReactViewModels/ViewState";
import FeatureLink from "../Generic/FeatureLink";

/**
 * Message for the "Shadows disabled" toast. Its `<settingspanel>` link opens
 * the settings panel and dismisses the toast. Kept as a single function so
 * repeated notifications are de-duplicated by `NotificationState`.
 */
export const shadowsDisabledNotificationMessage = (viewState: ViewState) => (
  <Trans
    i18nKey={($) => $.models.shadowsDisabledForPerformance.message}
    components={{
      settingspanel: (
        <FeatureLink
          onClick={action(() => {
            viewState.openSettingsPanel();
            viewState.terria.notificationState.dismissCurrentNotification();
          })}
        />
      )
    }}
  />
);
