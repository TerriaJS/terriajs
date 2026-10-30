import { describe, expect, it } from "vitest";
import { page, type Locator } from "vitest/browser";
import { render } from "vitest-browser-react";
import { SparklesIcon } from "@terria/design-system-icons";
import { hover, snap, viewport } from "../../../visual";
import {
  Toast,
  ToastQueue,
  type ToastPlacement,
  type ToastProviderProps
} from "..";
import "../toast.stories.css";

// Done animating in: no data-entering left, every animation finished, and
// two frames drawn since, so nothing is caught on a layer of its own
const settled = async (): Promise<void> => {
  await expect.poll(() => document.querySelector("[data-entering]")).toBeNull();
  await Promise.all(
    document.getAnimations().map((animation) => animation.finished)
  );
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
};

type Content = Parameters<ToastQueue["add"]>[0];

const PLACEMENTS: ToastPlacement[] = [
  "top-start",
  "top",
  "top-end",
  "bottom-start",
  "bottom",
  "bottom-end"
];

const SHARED: Content = {
  title: "Shared view saved",
  description: "Anyone with the link sees this map",
  actionProps: { children: "Copy link", variant: "tertiary" }
};

const FAILED: Content = {
  variant: "danger",
  title: "Layer failed to load",
  description: "The server didn't respond",
  actionProps: { children: "Retry", variant: "danger" }
};

// The design's five, each with a description and an action
const VARIANTS: [string, Content][] = [
  ["default", SHARED],
  [
    "accent",
    {
      variant: "accent",
      title: "New data in the catalogue",
      description: "Flood planning areas were updated today",
      actionProps: { children: "View" }
    }
  ],
  [
    "success",
    {
      variant: "success",
      title: "Layer added",
      description: "Suburbs 2021 is on the map",
      actionProps: { children: "Zoom to", className: "toast-stories-success" }
    }
  ],
  [
    "warning",
    {
      variant: "warning",
      title: "Layer is large",
      description: "It may take a while to draw at this scale",
      actionProps: { children: "Simplify", className: "toast-stories-warning" }
    }
  ],
  ["danger", FAILED]
];

const TITLES: [string, Content][] = [
  ["default", { title: "Link copied" }],
  ["success", { title: "Map exported", variant: "success" }],
  ["accent", { title: "Catalogue updated", variant: "accent" }],
  [
    "warning",
    { title: "Some features are hidden at this scale", variant: "warning" }
  ],
  ["danger", { title: "Something went wrong", variant: "danger" }]
];

// Each test its own queue, so no toast carries over. The toasts stay until
// the test ends: no timeout closes them partway
const show = async (
  toasts: Content[],
  props: Omit<ToastProviderProps, "queue"> = {}
): Promise<void> => {
  const queue = new ToastQueue();
  await render(<Toast.Provider {...props} queue={queue} />);
  for (const content of toasts) queue.add(content, { timeout: 0 });
  await expect
    .poll(() => document.querySelectorAll('[data-tds="toast"]').length)
    .toBe(toasts.length);
  await settled();
};

const toast = (title: string): Locator =>
  page.getByRole("alertdialog").filter({ hasText: title });

describe("Toast", () => {
  it.each(VARIANTS)("%s", async (_, content) => {
    await show([content]);
    await snap(viewport());
  });

  it.each(TITLES)("%s, title only", async (_, content) => {
    await show([content]);
    await snap(viewport());
  });

  it("loading", async () => {
    await show([{ title: "Saving view…", isLoading: true }]);
    await snap(viewport());
  });

  it("custom indicator", async () => {
    await show([{ title: "Added to favourites", indicator: <SparklesIcon /> }]);
    await snap(viewport());
  });

  it("no indicator", async () => {
    await show([{ title: "No icon", indicator: null }]);
    await snap(viewport());
  });

  it.each(PLACEMENTS)("placed %s", async (placement) => {
    await show(
      [{ title: "Layer added", description: "Suburbs 2021 is on the map" }],
      { placement }
    );
    await snap(viewport());
  });

  it("stacked", async () => {
    await show([
      { title: "Layer added" },
      { title: "Map exported", variant: "success" },
      { title: "Catalogue updated", variant: "accent" }
    ]);
    await snap(viewport());
  });

  it("stacked, expanded", async () => {
    await show(
      [
        { title: "Layer added" },
        { title: "Map exported", variant: "success" },
        { title: "Catalogue updated", variant: "accent" }
      ],
      { isExpanded: true }
    );
    await snap(viewport());
  });

  it("stacked, hovered", async () => {
    await show([
      { title: "Layer added" },
      { title: "Map exported", variant: "success" },
      { title: "Catalogue updated", variant: "accent" }
    ]);
    await hover(toast("Catalogue updated"));
    await expect
      .poll(
        () =>
          document.querySelectorAll('[data-tds="toast"][data-expanded]').length
      )
      .toBe(3);
    await settled();
    await snap(viewport());
  });

  it("close button shown on hover", async () => {
    await show([SHARED]);
    await hover(toast("Shared view saved"));
    await snap(viewport());
  });

  it("close button hovered", async () => {
    await show([SHARED]);
    await hover(toast("Shared view saved"));
    await hover(page.getByRole("button", { name: /close/i }));
    await snap(viewport());
  });

  it("action hovered", async () => {
    await show([FAILED]);
    await hover(page.getByRole("button", { name: "Retry" }));
    await snap(viewport());
  });
});
