import { describe, expect, it, vi } from "vitest";
import { render, type RenderResult } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { FileTrigger, type FileTriggerProps } from "..";
import { Button } from "../../Button";

const renderTrigger = (
  props: Partial<FileTriggerProps> = {}
): Promise<RenderResult> =>
  render(
    <FileTrigger {...props}>
      <Button>Upload data</Button>
    </FileTrigger>
  );

const fileInput = (screen: RenderResult): HTMLInputElement => {
  const input =
    screen.container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("file input not rendered");
  return input;
};

describe("FileTrigger", () => {
  it("passes the chosen files to onSelect", async () => {
    const onSelect = vi.fn();
    const screen = await renderTrigger({ onSelect });

    await userEvent.upload(
      fileInput(screen),
      new File(["{}"], "suburbs.geojson", { type: "application/geo+json" })
    );

    expect(onSelect).toHaveBeenCalledOnce();
    const files = onSelect.mock.calls[0]?.[0] as FileList;
    expect(files[0]?.name).toBe("suburbs.geojson");
  });

  it("limits the picker to acceptedFileTypes", async () => {
    const screen = await renderTrigger({
      acceptedFileTypes: [".geojson", ".csv"]
    });

    expect(fileInput(screen).accept).toBe(".geojson,.csv");
  });

  it("allows several files with allowsMultiple", async () => {
    const screen = await renderTrigger({ allowsMultiple: true });

    expect(fileInput(screen).multiple).toBe(true);
  });

  it("keeps its child as the button people use", async () => {
    const screen = await renderTrigger();

    await expect
      .element(screen.getByRole("button", { name: "Upload data" }))
      .toBeVisible();
  });
});
