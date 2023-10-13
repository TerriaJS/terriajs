import { act } from "react-dom/test-utils";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import NotificationWindow from "../../../lib/ReactViews/Notification/NotificationWindow.jsx";
import { createWithContexts } from "../withContext";

describe("NotificationWindow", function () {
  let terria: Terria;
  let viewState: ViewState;
  let testRenderer: ReturnType<typeof createWithContexts>;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });

    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: null,
      locationSearchProviders: []
    });
  });

  it("should render a confirm button with text from props", function () {
    const confirmText = "Yep";
    act(() => {
      testRenderer = createWithContexts(
        viewState,
        <NotificationWindow
          viewState={viewState}
          type="notification"
          title="Notification Title"
          message="Message"
          onCofirm={() => {}}
          onDeny={() => {}}
          confirmText={confirmText}
        />
      );
    });
    expect(
      testRenderer.root.find(
        (n) => n.type === "button" && n.props.children === confirmText
      )
    ).toBeTruthy();
  });
});
