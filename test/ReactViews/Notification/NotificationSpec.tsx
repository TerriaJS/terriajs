import { screen } from "@testing-library/dom";
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
      terria: terria,
      catalogSearchProvider: undefined
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
});
