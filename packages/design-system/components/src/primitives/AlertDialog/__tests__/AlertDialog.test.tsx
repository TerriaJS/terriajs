import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "../../Button";
import { AlertDialog, type AlertDialogContainerProps } from "..";

// A token's radius as the browser computes it, to compare with an element's
const tokenRadius = (token: string): string => {
  const probe = document.createElement("div");
  probe.style.borderTopLeftRadius = `var(${token})`;
  document.body.append(probe);
  const radius = getComputedStyle(probe).borderTopLeftRadius;
  probe.remove();
  return radius;
};

const RemoveLayer = ({
  size,
  isDismissable
}: {
  size?: AlertDialogContainerProps["size"];
  isDismissable?: boolean;
}): React.ReactElement => (
  <AlertDialog>
    <Button variant="danger">Remove layer</Button>
    <AlertDialog.Backdrop isDismissable={isDismissable}>
      <AlertDialog.Container size={size}>
        <AlertDialog.Dialog>
          <AlertDialog.CloseTrigger />
          <AlertDialog.Header>
            <AlertDialog.Heading>Remove layer?</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>It will be removed from the map.</AlertDialog.Body>
          <AlertDialog.Footer>
            <Button slot="close" variant="tertiary">
              Cancel
            </Button>
            <Button slot="close" variant="danger">
              Remove
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  </AlertDialog>
);

const open = async (
  screen: Awaited<ReturnType<typeof render>>
): Promise<void> => {
  await screen.getByRole("button", { name: "Remove layer" }).click();
  await expect
    .element(page.getByRole("alertdialog", { name: "Remove layer?" }))
    .toBeVisible();
};

describe("AlertDialog", () => {
  it("opens an alert dialog named by its heading", async () => {
    const screen = await render(<RemoveLayer />);

    await open(screen);
  });

  it("stays open when the backdrop is pressed, so a choice has to be made", async () => {
    const screen = await render(<RemoveLayer />);
    await open(screen);

    await userEvent.click(document.body, { position: { x: 4, y: 4 } });

    await expect.element(page.getByRole("alertdialog")).toBeVisible();
  });

  it("can be made dismissable from the backdrop", async () => {
    const screen = await render(<RemoveLayer isDismissable />);
    await open(screen);

    await userEvent.click(document.body, { position: { x: 4, y: 4 } });

    await expect.element(page.getByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("cancels on Escape", async () => {
    const screen = await render(<RemoveLayer />);
    await open(screen);

    await userEvent.keyboard("{Escape}");

    await expect.element(page.getByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("closes from a footer action and returns focus to the trigger", async () => {
    const screen = await render(<RemoveLayer />);
    await open(screen);

    await page.getByRole("button", { name: "Remove", exact: true }).click();

    await expect.element(page.getByRole("alertdialog")).not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: "Remove layer" }))
      .toHaveFocus();
  });

  it.each(["xs", "sm", "md", "lg"] as const)(
    "renders the %s size",
    async (size) => {
      const screen = await render(<RemoveLayer size={size} />);
      await open(screen);

      expect(
        document.querySelector('[data-tds="alert-dialog-container"]')
      ).toHaveAttribute("data-tds-size", size);
    }
  );

  it("has the large radius", async () => {
    const screen = await render(<RemoveLayer />);

    await open(screen);

    expect(
      getComputedStyle(page.getByRole("alertdialog").element())
        .borderTopLeftRadius
    ).toBe(tokenRadius("--terria-ds-radius-lg"));
  });
});
