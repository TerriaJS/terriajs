import NotificationState, {
  Notification
} from "../../lib/ReactViewModels/NotificationState";

describe("NotificationState", () => {
  let notificationState: NotificationState;
  let testNotification: Notification;
  let anotherTestNotification: Notification;
  let andAnotherTestNotification: Notification;
  const sameKey = "a key";

  beforeEach(() => {
    notificationState = new NotificationState();
    testNotification = {
      title: "Test",
      message: "Something witty and insightful"
    };
    anotherTestNotification = {
      title: "Test 2",
      message: "The human condition",
      key: sameKey
    };
    andAnotherTestNotification = {
      title: "Test 3",
      message: "please let me sleep",
      key: sameKey
    };
  });

  it("adds new notifications to the queue, and then removes them in the correct order when requested", () => {
    // Add notifications
    notificationState.addNotificationToQueue(testNotification);
    expect(notificationState.currentNotification).toEqual(testNotification);
    notificationState.addNotificationToQueue(anotherTestNotification);
    expect(notificationState.currentNotification).toEqual(testNotification); // Shouldn't have changed

    // Remove notifications
    expect(notificationState.dismissCurrentNotification()).toEqual(
      testNotification
    );
    expect(notificationState.dismissCurrentNotification()).toEqual(
      anotherTestNotification
    );

    // Nothing left in the queue
    expect(notificationState.dismissCurrentNotification()).toBeUndefined();

    // New notification not added because the key is the same as a previous one
    notificationState.addNotificationToQueue(andAnotherTestNotification);
    expect(notificationState.currentNotification).toBeUndefined();
  });
});
