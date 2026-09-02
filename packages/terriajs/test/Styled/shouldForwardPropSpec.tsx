import { render } from "@testing-library/react";
import styled from "styled-components";
import Box from "../../lib/Styled/Box";
import { TerriaThemeProvider } from "../ReactViews/withContext";

const Passthrough = (props: { charcoalGreyBg?: boolean }) => (
  <span>{String(props.charcoalGreyBg)}</span>
);
const StyledPassthrough = styled(Passthrough)``;

describe("shouldForwardProp", function () {
  it("keeps styling props off host elements", function () {
    const { container } = render(
      <TerriaThemeProvider>
        <Box fullWidth paddedRatio={2} charcoalGreyBg />
      </TerriaThemeProvider>
    );

    const div = container.querySelector("div")!;
    const attributes = div.getAttributeNames();
    expect(attributes).not.toContain("fullwidth");
    expect(attributes).not.toContain("paddedratio");
    expect(attributes).not.toContain("charcoalgreybg");
  });

  it("still forwards valid HTML attributes", function () {
    const { container } = render(
      <TerriaThemeProvider>
        <Box fullWidth id="a-box" aria-label="a box" title="a box" />
      </TerriaThemeProvider>
    );

    const div = container.querySelector("div")!;
    expect(div.getAttribute("id")).toBe("a-box");
    expect(div.getAttribute("aria-label")).toBe("a box");
    expect(div.getAttribute("title")).toBe("a box");
  });

  it("still forwards every prop to custom component targets", function () {
    const { container } = render(
      <TerriaThemeProvider>
        <StyledPassthrough charcoalGreyBg />
      </TerriaThemeProvider>
    );

    expect(container.querySelector("span")!.textContent).toBe("true");
  });
});
