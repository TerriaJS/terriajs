import { screen } from "@testing-library/react";
import english from "../../../wwwroot/languages/en/translation.json";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import CustomComponent from "../../../lib/ReactViews/Custom/CustomComponent";
import parseCustomMarkdownToReact from "../../../lib/ReactViews/Custom/parseCustomMarkdownToReact";
import registerCustomComponentTypes from "../../../lib/ReactViews/Custom/registerCustomComponentTypes";
import { renderWithContexts } from "../withContext";

const supportEmail = "support@example.com";

describe("FeedbackLinkCustomComponent", function () {
  let viewState: ViewState;

  beforeEach(function () {
    viewState = new ViewState({
      terria: new Terria()
    });
    viewState.terria.updateParameters({ supportEmail });

    registerCustomComponentTypes(viewState.terria);
  });

  afterEach(function () {
    CustomComponent.unregisterAll();
  });

  function renderMarkdown(markdown: string) {
    return renderWithContexts(
      parseCustomMarkdownToReact(markdown, {
        viewState,
        terria: viewState.terria
      }),
      viewState
    );
  }

  describe("when only supportEmail is available", function () {
    it("replaces an `{{email}}` placeholder in email-message", function () {
      const { container } = renderMarkdown(
        "<feedbacklink email-message='Please report to {{email}}'/>"
      );

      expect(container.textContent).toContain(
        `Please report to ${supportEmail}`
      );
      expect(container.textContent).not.toContain("{{email}}");
    });

    it("appends the email to an email-message without a placeholder", function () {
      const { container } = renderMarkdown(
        "<feedbacklink email-message='Please report to'/>"
      );

      expect(container.textContent).toContain(
        `Please report to ${supportEmail}`
      );
    });

    it("does not leave `{{email}}` in the network request error message", function () {
      const { container } = renderMarkdown(
        english.core.terriaError.networkRequestMessage
      );

      expect(container.textContent).not.toContain("{{email}}");
      expect(container.textContent).toContain(
        `If the problem persists, please report to ${supportEmail}`
      );
    });
  });

  describe("when feedbackUrl is configured", function () {
    beforeEach(function () {
      viewState.terria.updateParameters({ feedbackUrl: "feedback" });
    });

    it("shows the feedback message instead of the email address", function () {
      const { container } = renderMarkdown(
        "<feedbacklink feedback-message='Submit feedback here.' email-message='Please report to {{email}}'/>"
      );

      expect(screen.getByText("Submit feedback here.")).toBeVisible();
      expect(container.textContent).not.toContain(supportEmail);
    });
  });
});
