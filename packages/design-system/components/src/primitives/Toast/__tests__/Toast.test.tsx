import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { Toast, ToastQueue, toast, toastQueue } from "..";

const queues: ToastQueue[] = [];

// A queue of its own for each test, so toasts don't carry over
const fresh = (
  options?: ConstructorParameters<typeof ToastQueue>[0]
): ToastQueue => {
  const queue = new ToastQueue(options);
  queues.push(queue);
  return queue;
};

afterEach(() => {
  for (const queue of queues.splice(0)) queue.destroy();
});

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

// The page's (hover: none) rules, applied as if it matched. Emulating a touch
// screen would do it too, but on Linux Chromium the page keeps (hover: none)
// once that's turned off, and the next test files on the page with it
const withoutHover = (): (() => void) => {
  const rules: string[] = [];
  const collect = (list: CSSRuleList): void => {
    for (const rule of list) {
      if (rule instanceof CSSMediaRule && rule.conditionText === "(hover: none)")
        rules.push(...Array.from(rule.cssRules, (inner) => inner.cssText));
      else if (rule instanceof CSSGroupingRule) collect(rule.cssRules);
    }
  };
  for (const sheet of document.styleSheets) collect(sheet.cssRules);
  const style = document.createElement("style");
  style.textContent = rules.join("\n");
  document.head.append(style);
  return () => {
    style.remove();
  };
};

describe("Toast", () => {
  it("shows a toast in a notifications landmark", async () => {
    const queue = fresh();
    const screen = await render(<Toast.Provider queue={queue} />);

    queue.add({
      title: "Layer added",
      description: "Suburbs 2021 is on the map"
    });

    const region = screen.getByRole("region", { name: /notification/ });
    await expect.element(region.getByText("Layer added")).toBeVisible();
    await expect
      .element(region.getByText("Suburbs 2021 is on the map"))
      .toBeVisible();
  });

  it("marks its variant, with a status icon", async () => {
    const queue = fresh();
    const screen = await render(<Toast.Provider queue={queue} />);

    queue.add({ title: "Layer failed to load", variant: "danger" });

    const item = screen.getByRole("alertdialog");
    await expect.element(item).toHaveAttribute("data-tds-variant", "danger");
    expect(
      item.element().querySelector("[data-tds='toast-indicator'] svg")
    ).not.toBeNull();
  });

  it("closes itself after its timeout, unless the timeout is 0", async () => {
    const queue = fresh({ exitDuration: 0 });
    const screen = await render(<Toast.Provider queue={queue} />);

    queue.add({ title: "Brief" }, { timeout: 200 });
    queue.add({ title: "Stays" }, { timeout: 0 });
    await expect.element(screen.getByText("Brief")).toBeVisible();

    await wait(400);
    await expect.element(screen.getByText("Brief")).not.toBeInTheDocument();
    await expect.element(screen.getByText("Stays")).toBeInTheDocument();
  });

  it("closes from its close button, calling onClose straight away", async () => {
    const queue = fresh();
    const onClose = vi.fn();
    const screen = await render(<Toast.Provider queue={queue} />);

    queue.add({ title: "Saved" }, { timeout: 0, onClose });
    const item = screen.getByRole("alertdialog");
    await expect.element(item).toBeVisible();
    const element = item.element();
    // The close button shows under a moving pointer. One left resting
    // where the toast appears, by an earlier test, doesn't count
    await userEvent.unhover(item);
    await userEvent.hover(item);
    await userEvent.click(item.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledOnce();
    // It stays for its exit animation, marked and hidden from assistive tech,
    // then goes
    expect(element).toHaveAttribute("data-exiting");
    expect(element).toHaveAttribute("aria-hidden", "true");
    await expect.element(screen.getByText("Saved")).not.toBeInTheDocument();
  });

  // Touch screens have no hover to show it under, and a toast that stays
  // open would have no other way to close
  it("shows its close button where there's no hover", async () => {
    const restore = withoutHover();
    try {
      const queue = fresh();
      const screen = await render(<Toast.Provider queue={queue} />);

      queue.add({ title: "Saved" }, { timeout: 0 });
      const item = screen.getByRole("alertdialog");
      await expect.element(item).toBeVisible();
      await userEvent.unhover(item);
      const close = item.getByRole("button", { name: "Close" }).element();

      await expect.poll(() => getComputedStyle(close).opacity).toBe("1");
      expect(getComputedStyle(close).pointerEvents).toBe("auto");
    } finally {
      restore();
    }
  });

  // Open, each toast reaches into the gap to its neighbour, so the stack
  // stays open between them; that mustn't cover its close button
  it("closes from its close button while the stack is open", async () => {
    const queue = fresh();
    const screen = await render(<Toast.Provider queue={queue} />);

    queue.add({ title: "Older" }, { timeout: 0 });
    queue.add({ title: "Newer" }, { timeout: 0 });
    await expect.element(screen.getByText("Newer")).toBeVisible();
    const front = document.querySelector<HTMLElement>(
      "[data-tds='toast'][data-frontmost]"
    );
    if (!front) throw new Error("No front toast");
    await userEvent.unhover(front);
    await userEvent.hover(front);
    await expect.element(front).toHaveAttribute("data-expanded");

    const close = front.querySelector("[data-tds-toast-close]");
    if (!close) throw new Error("No close button");
    const { x, y, width, height } = close.getBoundingClientRect();
    expect(document.elementFromPoint(x + width / 2, y + height / 2)).toBe(
      close
    );
  });

  // The 5 seconds React Aria gives as the least for reading one; with an
  // action, until the user closes it, as the action would go with it
  it("stays at least 5 seconds, and with an action until closed", () => {
    const queue = fresh();

    queue.add({ title: "Saved" });
    queue.add({ title: "Layer removed", actionProps: { children: "Undo" } });
    queue.add({ title: "Brief" }, { timeout: 2000 });

    expect(
      queue.visibleToasts.map(({ content, timeout }) => [
        content.title,
        timeout
      ])
    ).toEqual([
      ["Brief", 2000],
      ["Layer removed", 0],
      ["Saved", 5000]
    ]);
  });

  it("gives toast() the same defaults", () => {
    toast("Saved");
    toast("Layer removed", { actionProps: { children: "Undo" } });

    expect(
      toastQueue.visibleToasts.map(({ content, timeout }) => [
        content.title,
        timeout
      ])
    ).toEqual([
      ["Layer removed", 0],
      ["Saved", 5000]
    ]);
    toast.clear();
  });

  it("offers an action", async () => {
    const queue = fresh();
    const onPress = vi.fn();
    const screen = await render(<Toast.Provider queue={queue} />);

    queue.add(
      { title: "Layer removed", actionProps: { children: "Undo", onPress } },
      { timeout: 0 }
    );
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));

    expect(onPress).toHaveBeenCalledOnce();
  });

  // Toast.css puts the action beside the text from 768px; it's placed there
  // from the same width
  it("places its action beside the text from 768px wide", async () => {
    const { innerWidth, innerHeight } = window;
    await page.viewport(800, 600);
    try {
      const queue = fresh();
      const screen = await render(<Toast.Provider queue={queue} />);
      queue.add(
        { title: "Layer removed", actionProps: { children: "Undo" } },
        { timeout: 0 }
      );

      const action = screen.getByRole("button", { name: "Undo" });
      await expect.element(action).toBeVisible();
      expect(action.element().closest('[data-tds="toast-content"]')).toBeNull();
    } finally {
      await page.viewport(innerWidth, innerHeight);
    }
  });

  it("shows three at a time, hiding the rest from assistive tech", async () => {
    const queue = fresh();
    const screen = await render(<Toast.Provider queue={queue} />);

    for (const title of ["One", "Two", "Three", "Four"]) {
      queue.add({ title }, { timeout: 0 });
    }
    await expect.element(screen.getByText("One")).toBeInTheDocument();

    const hidden = [
      ...document.querySelectorAll("[data-tds='toast'][data-hidden]")
    ].map((item) => item.textContent);
    expect(hidden).toEqual([expect.stringContaining("One")]);
    expect(
      document.querySelector("[data-tds='toast'][data-hidden]")
    ).toHaveAttribute("aria-hidden", "true");
  });

  it("holds its timers while the pointer is over the stack", async () => {
    const queue = fresh({ exitDuration: 0 });
    const screen = await render(<Toast.Provider queue={queue} />);

    queue.add({ title: "Paused" }, { timeout: 1000 });
    // Moved onto it, once it has slid in, which hovering waits for. A
    // pointer left resting where it appears, by an earlier test, doesn't
    // count: nothing moves
    const item = screen.getByRole("alertdialog");
    await userEvent.unhover(item);
    await userEvent.hover(item);
    await wait(1200);

    await expect.element(screen.getByText("Paused")).toBeVisible();
  });

  it("updates a toast in place", async () => {
    const queue = fresh();
    const screen = await render(<Toast.Provider queue={queue} />);

    const key = queue.add({ title: "Uploading…" }, { timeout: 0 });
    await expect.element(screen.getByText("Uploading…")).toBeVisible();
    const before = screen.getByRole("alertdialog").element();
    queue.update(key, { title: "Uploaded", variant: "success" });

    await expect.element(screen.getByText("Uploaded")).toBeVisible();
    expect(screen.getByRole("alertdialog").element()).toBe(before);
  });

  it("shows a promise loading, then how it settled", async () => {
    const screen = await render(<Toast.Provider />);
    let resolve = (): void => undefined;
    const done = new Promise<void>((settle) => {
      resolve = settle;
    });

    toast.promise(done, {
      loading: "Exporting map…",
      success: "Map exported",
      error: "Export failed"
    });
    await expect.element(screen.getByText("Exporting map…")).toBeVisible();
    resolve();

    await expect.element(screen.getByText("Map exported")).toBeVisible();
    await expect
      .element(screen.getByRole("alertdialog"))
      .toHaveAttribute("data-tds-variant", "success");
    toast.clear();
  });

  it("is reached with Alt+T", async () => {
    const queue = fresh();
    const screen = await render(<Toast.Provider queue={queue} />);

    queue.add({ title: "Reach me" }, { timeout: 0 });
    await expect.element(screen.getByText("Reach me")).toBeVisible();
    await userEvent.keyboard("{Alt>}t{/Alt}");

    await expect.element(screen.getByRole("region")).toHaveFocus();
  });

  it("gives focus back to where it was when its last toast is closed", async () => {
    const queue = fresh();
    const screen = await render(
      <>
        <input aria-label="Search" />
        <Toast.Provider queue={queue} />
      </>
    );
    const search = screen.getByRole("textbox", { name: "Search" });

    queue.add({ title: "Saved" }, { timeout: 0 });
    await expect.element(screen.getByText("Saved")).toBeVisible();
    await userEvent.click(search);
    await userEvent.keyboard("{Alt>}t{/Alt}");
    const close = screen.getByRole("button", { name: "Close" });
    while (document.activeElement !== close.element()) {
      await userEvent.tab();
    }
    await userEvent.keyboard("{Enter}");

    await expect.element(screen.getByText("Saved")).not.toBeInTheDocument();
    await expect.element(search).toHaveFocus();
  });

  it("gives focus back to where it was on Escape", async () => {
    const queue = fresh();
    const screen = await render(
      <>
        <input aria-label="Search" />
        <Toast.Provider queue={queue} />
      </>
    );
    const search = screen.getByRole("textbox", { name: "Search" });

    queue.add({ title: "Saved" }, { timeout: 0 });
    await expect.element(screen.getByText("Saved")).toBeVisible();
    await userEvent.click(search);
    await userEvent.keyboard("{Alt>}t{/Alt}");
    await expect.element(screen.getByRole("region")).toHaveFocus();
    await userEvent.keyboard("{Escape}");

    await expect.element(search).toHaveFocus();
  });
});
