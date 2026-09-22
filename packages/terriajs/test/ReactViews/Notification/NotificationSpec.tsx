import { screen } from "@testing-library/react";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import { renderWithContexts } from "../withContext";
import Notification from "../../../lib/ReactViews/Notification/Notification";
import { observable, runInAction } from "mobx";
import { act } from "@testing-library/react";

describe("Notification", function () {
  let viewState: ViewState;

  beforeEach(function () {
    const terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria
    });
  });

  it("renders the current notification", function () {
    viewState.terria.notificationState.addNotificationToQueue({
      title: "Hello, world",
      message: "this is a test message"
    });
    viewState.terria.notificationState.addNotificationToQueue({
      title: "Hello, blue planet",
      message: "this is another test message"
    });
    renderWithContexts(<Notification />, viewState);
    const title = screen.getByText("Hello, world");
    expect(title).toBeVisible();
    const message = screen.getByText("this is a test message");
    expect(message).toBeVisible();
  });

  describe("when ignore is true", function () {
    it("the message should not be shown", function () {
      viewState.terria.notificationState.addNotificationToQueue({
        title: "Hello, world",
        message: "this is a test message",
        ignore: true
      });
      renderWithContexts(<Notification />, viewState);
      const title = screen.queryByText("Hello, world");
      expect(title).toBeNull();
    });

    it("accepts an ignore fn", function () {
      viewState.terria.notificationState.addNotificationToQueue({
        title: "Hello, world",
        message: "this is a test message",
        ignore: () => true
      });
      renderWithContexts(<Notification />, viewState);
      const title = screen.queryByText("Hello, world");
      expect(title).toBeNull();
    });

    it("auto-dismisses an active notification if ignore becomes true", function () {
      const ignore = observable.box(false);
      viewState.terria.notificationState.addNotificationToQueue({
        title: "Hello, world",
        message: "this is a test message",
        ignore: () => ignore.get()
      });
      renderWithContexts(<Notification />, viewState);
      let title = screen.queryByText("Hello, world");
      expect(title).toBeVisible();
      act(() => {
        runInAction(() => {
          ignore.set(true);
        });
      });
      title = screen.queryByText("Hello, world");
      expect(title).toBeNull("Message must be ignored when mobx value changes");
    });
  });

  describe("toast notifications", function () {
    beforeEach(function () {
      jasmine.clock().install();
    });

    afterEach(function () {
      jasmine.clock().uninstall();
    });

    it("stays visible indefinitely when toastVisibleDuration is not set", function () {
      viewState.terria.notificationState.addNotificationToQueue({
        title: "Shadows disabled",
        message: "this toast has no duration set",
        showAsToast: true
      });
      renderWithContexts(<Notification />, viewState);
      act(() => {
        jasmine.clock().tick(10 * 60 * 1000);
      });
      const message = screen.queryByText("this toast has no duration set");
      expect(message).toBeVisible();
    });

    it("auto-dismisses once toastVisibleDuration elapses when it is set", function () {
      viewState.terria.notificationState.addNotificationToQueue({
        title: "Base map switched",
        message: "this toast has a 10 second duration",
        showAsToast: true,
        toastVisibleDuration: 10
      });
      renderWithContexts(<Notification />, viewState);
      act(() => {
        jasmine.clock().tick(10 * 1000);
      });
      const message = screen.queryByText("this toast has a 10 second duration");
      expect(message).toBeNull();
    });
  });
});
