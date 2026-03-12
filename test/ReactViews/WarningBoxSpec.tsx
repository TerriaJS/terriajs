import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { terriaTheme } from "../../lib/ReactViews/StandardUserInterface";
import WarningBox from "../../lib/ReactViews/Preview/WarningBox";

describe("WarningBox", function () {
  beforeEach(function () {
    // terria = new Terria({ baseUrl: "./" });
  });

  it("renders", function () {
    render(
      <ThemeProvider theme={terriaTheme}>
        <WarningBox>Test text</WarningBox>
      </ThemeProvider>
    );
    expect(screen.getByText("Test text")).toBeTruthy();
  });
});
