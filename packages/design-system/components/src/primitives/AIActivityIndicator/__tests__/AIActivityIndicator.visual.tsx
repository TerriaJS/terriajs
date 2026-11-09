import { beforeAll, describe, it } from "vitest";
import { render } from "vitest-browser-react";
import { snap } from "../../../visual";
import { AIActivityIndicator, type AIActivityIndicatorSize } from "..";
import { Button } from "../../Button";
import { Description, Label } from "../../Field";
import { SearchField } from "../../SearchField";

const SIZES: AIActivityIndicatorSize[] = ["sm", "md", "lg"];

// Still, as people who reduce motion see it: the pulse, cut short for
// screenshots, ends a frame earlier or later from run to run, and the small
// sparkles' edges show it
beforeAll(() => {
  const still = document.createElement("style");
  still.textContent = `[data-tds="ai-activity-indicator"] path {
    animation: none !important;
  }`;
  document.head.append(still);
});

describe("AIActivityIndicator", () => {
  it.each(SIZES)("size %s", async (size) => {
    await render(<AIActivityIndicator aria-label="Thinking" size={size} />);
    await snap();
  });

  it.each([4, 5] as const)("%i sparkles", async (count) => {
    await render(
      <AIActivityIndicator aria-label="Thinking" sparkles={count} />
    );
    await snap();
  });

  // Drawn by a plain element rather than the progressbar, it looks the same
  it("hidden, as decoration", async () => {
    await render(<AIActivityIndicator aria-hidden />);
    await snap();
  });

  it("in a button", async () => {
    await render(
      <Button variant="outline">
        <AIActivityIndicator aria-hidden size="sm" />
        Generating
      </Button>
    );
    await snap();
  });

  // In the search icon's place, without stretching the field
  it("in a search field", async () => {
    await render(
      <SearchField defaultValue="Roads">
        <Label>Search the catalogue</Label>
        <SearchField.Group>
          <SearchField.SearchIcon>
            <AIActivityIndicator aria-hidden />
          </SearchField.SearchIcon>
          <SearchField.Input />
          <SearchField.ClearButton />
        </SearchField.Group>
        <Description role="status">Finding pages with geometry…</Description>
      </SearchField>
    );
    await snap();
  });
});
