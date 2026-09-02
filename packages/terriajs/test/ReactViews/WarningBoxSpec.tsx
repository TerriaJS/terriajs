import { render, screen } from "@testing-library/react";
import WarningBox from "../../lib/ReactViews/Preview/WarningBox";
import { TerriaThemeProvider } from "./withContext";

describe("WarningBox", function () {
  beforeEach(function () {
    // terria = new Terria({ baseUrl: "./" });
  });

  it("renders", function () {
    render(
      <TerriaThemeProvider>
        <WarningBox>Test text</WarningBox>
      </TerriaThemeProvider>
    );
    expect(screen.getByText("Test text")).toBeTruthy();
  });
});
