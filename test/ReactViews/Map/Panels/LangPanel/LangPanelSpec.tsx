import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Terria from "../../../../../lib/Models/Terria";
import LangPanel from "../../../../../lib/ReactViews/Map/Panels/LangPanel/LangPanel";

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
    terria.updateParameters({
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
    });
    await terria.start({ configUrl: "./" });

    render(<LangPanel terria={terria} smallScreen={false} />);

    screen.getByRole("button", { name: "cimode" });
    await userEvent.click(screen.getByRole("button", { name: "cimode" }));
    screen.getByRole("button", { name: "English" });
    screen.getByRole("button", { name: "Français" });
    screen.getByRole("button", { name: "Afrikaans" });
  });
});
