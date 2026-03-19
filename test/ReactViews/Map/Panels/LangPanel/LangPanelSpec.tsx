import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import Terria from "../../../../../lib/Models/Terria";
import LangPanel from "../../../../../lib/ReactViews/Map/Panels/LangPanel/LangPanel";
import { worker } from "../../../../mocks/browser";

describe("LangPanel", function () {
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
  });

  it("should not render if there is no langauge config", function () {
    render(<LangPanel terria={terria} smallScreen={false} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should render if language are provided in config", async function () {
    worker.use(
      http.get("serverconfig", () => HttpResponse.json({})),
      http.get("test-config.json", () =>
        HttpResponse.json({
          parameters: {
            languageConfiguration: {
              enabled: true,
              debug: false,
              languages: {
                cimode: "cimode",
                en: "English",
                fr: "Français",
                af: "Afrikaans"
              },
              fallbackLanguage: "en"
            }
          }
        })
      )
    );
    await terria.start({ configUrl: "test-config.json" });

    render(<LangPanel terria={terria} smallScreen={false} />);

    expect(screen.getByRole("button", { name: "cimode" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "cimode" }));
    expect(screen.getByRole("button", { name: "English" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Français" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Afrikaans" })).toBeVisible();
  });
});
