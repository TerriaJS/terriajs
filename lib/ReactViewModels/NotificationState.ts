import { action, computed, observable, runInAction } from "mobx";
import { ReactNode } from "react";

import ViewState from "./ViewState";

export interface Notification {
  title: string | (() => string);
  message: string | ((viewState: ViewState) => ReactNode);
  confirmText?: string;
  denyText?: string;
  confirmAction?: () => void;
  denyAction?: () => void;
  hideUi?: boolean;
  type?: string;
  width?: number | string;
  height?: number | string;
  key?: string;
}

/**
 * Tracks pending notifications, and provides and interface for adding and removing them.
 * Notification queue is first-in, first-out.
 * Notifications with the same key will only be added once.
 */
export default class NotificationState {
  @observable protected notifications: Notification[] = [];
  protected alreadyNotifiedKeys: Set<string> = new Set();

  @action
  addNotificationToQueue(notification: Notification) {
    const alreadyQueued =
      this.notifications.filter(
        item =>
          item.title === notification.title &&
          item.message === notification.message
      ).length !== 0;
    const keyNotSeenBefore =
      notification.key === undefined ||
      !this.alreadyNotifiedKeys.has(notification.key);

    if (!alreadyQueued && keyNotSeenBefore) {
      this.notifications.push(notification);
    }

    if (notification.key !== undefined) {
      this.alreadyNotifiedKeys.add(notification.key);
    }
  }

  @action
  dismissCurrentNotification(): Notification | undefined {
    return this.notifications.shift();
  }

  @computed
  get currentNotification(): Notification | undefined {
    return this.notifications.length > 0 ? this.notifications[0] : undefined;
  }
}
