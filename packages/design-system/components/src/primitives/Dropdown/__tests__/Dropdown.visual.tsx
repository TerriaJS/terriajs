import { describe, expect, it } from "vitest";
import { page, userEvent, type Locator } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  CircleChevronRightIcon,
  CopyIcon,
  DotsIcon,
  EditIcon,
  LinkIcon,
  ShareIcon,
  SquarePlusIcon,
  TrashIcon
} from "@terria/design-system-icons";
import type { ReactNode } from "react";
import { focusVisible, hover, snap, viewport } from "../../../visual";
import { Button } from "../../Button";
import { Description, Label } from "../../Field";
import { Header } from "../../Header";
import { Kbd } from "../../Kbd";
import { Separator } from "../../Separator";
import { Dropdown, type DropdownPopoverProps } from "..";
import "../dropdown.stories.css";
import "./dropdown.visual.css";

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

const PLACEMENTS = ["top", "bottom", "left", "right"] as const;

// Open, placed, and done animating in: `menus` of them, with submenus
const opened = async (menus = 1): Promise<void> => {
  await expect.element(page.getByRole("menu").first()).toBeVisible();
  await expect
    .poll(() => document.querySelectorAll('[role="menu"]').length)
    .toBe(menus);
  await settled();
};

// Opened from the keyboard, so its items show keyboard focus
const openFromKeyboard = async (trigger: Locator): Promise<void> => {
  await focusVisible(trigger);
  await userEvent.keyboard("{Enter}");
  await opened();
};

const actions = (
  <Dropdown>
    <Button variant="secondary">Actions</Button>
    <Dropdown.Popover>
      <Dropdown.Menu>
        <Dropdown.Section>
          <Header>Actions</Header>
          <Dropdown.Item id="new" textValue="New file">
            <SquarePlusIcon aria-hidden size={16} />
            <div className="dropdown-stories-text">
              <Label>New file</Label>
              <Description>Create a new file</Description>
            </div>
          </Dropdown.Item>
          <Dropdown.Item id="copy" textValue="Copy link">
            <CopyIcon aria-hidden size={16} />
            <div className="dropdown-stories-text">
              <Label>Copy link</Label>
              <Description>Copy the file link</Description>
            </div>
          </Dropdown.Item>
          <Dropdown.Item id="edit" textValue="Edit file">
            <EditIcon aria-hidden size={16} />
            <div className="dropdown-stories-text">
              <Label>Edit file</Label>
              <Description>Make changes</Description>
            </div>
          </Dropdown.Item>
        </Dropdown.Section>
        <Separator />
        <Dropdown.Section>
          <Header>Danger zone</Header>
          <Dropdown.Item id="delete" textValue="Delete file" variant="danger">
            <TrashIcon aria-hidden size={16} />
            <div className="dropdown-stories-text">
              <Label>Delete file</Label>
              <Description>Move to trash</Description>
            </div>
          </Dropdown.Item>
        </Dropdown.Section>
      </Dropdown.Menu>
    </Dropdown.Popover>
  </Dropdown>
);

const choices = ({
  selectionMode,
  indicator = <Dropdown.ItemIndicator />
}: {
  selectionMode: "single" | "multiple";
  indicator?: ReactNode;
}): React.ReactElement => (
  <Dropdown>
    <Button variant="secondary">Layers</Button>
    <Dropdown.Popover>
      <Dropdown.Menu
        selectionMode={selectionMode}
        defaultSelectedKeys={
          selectionMode === "single" ? ["labels"] : ["roads", "labels"]
        }
      >
        {["Roads", "Labels", "Boundaries"].map((name) => (
          <Dropdown.Item key={name} id={name.toLowerCase()} textValue={name}>
            {indicator}
            {name}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown.Popover>
  </Dropdown>
);

const shortcut = (...keys: ("command" | "shift")[]): ReactNode => (
  <Kbd variant="light">
    {keys.map((key) => (
      <Kbd.Abbr key={key} keyValue={key} />
    ))}
    <Kbd.Content>N</Kbd.Content>
  </Kbd>
);

const share = (indicator?: ReactNode): React.ReactElement => (
  <Dropdown>
    <Button variant="secondary">Share</Button>
    <Dropdown.Popover>
      <Dropdown.Menu>
        <Dropdown.Item id="copy" textValue="Copy link">
          <LinkIcon aria-hidden size={16} />
          Copy link
        </Dropdown.Item>
        <Dropdown.SubmenuTrigger>
          <Dropdown.Item id="other" textValue="Share to">
            <ShareIcon aria-hidden size={16} />
            Share to
            <Dropdown.SubmenuIndicator>{indicator}</Dropdown.SubmenuIndicator>
          </Dropdown.Item>
          <Dropdown.Popover>
            <Dropdown.Menu>
              <Dropdown.Item id="email">Email</Dropdown.Item>
              <Dropdown.Item id="teams">Teams</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown.SubmenuTrigger>
      </Dropdown.Menu>
    </Dropdown.Popover>
  </Dropdown>
);

const placed = (
  placement: DropdownPopoverProps["placement"]
): React.ReactElement => (
  <div className="dropdown-visual-stage">
    <Dropdown>
      <Button variant="secondary">File</Button>
      <Dropdown.Popover placement={placement}>
        <Dropdown.Menu>
          <Dropdown.Item id="copy">Copy link</Dropdown.Item>
          <Dropdown.Item id="edit">Edit file</Dropdown.Item>
          <Dropdown.Item id="delete" variant="danger">
            Delete file
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  </div>
);

const openActions = async (): Promise<void> => {
  await userEvent.click(page.getByRole("button", { name: "Actions" }));
  await opened();
};

describe("Dropdown", () => {
  it("open", async () => {
    await render(actions);
    await openActions();
    await snap(viewport());
  });

  it("item hovered", async () => {
    await render(actions);
    await openActions();
    await hover(page.getByRole("menuitem", { name: /Copy link/ }));
    await snap(viewport());
  });

  it("danger item hovered", async () => {
    await render(actions);
    await openActions();
    await hover(page.getByRole("menuitem", { name: /Delete file/ }));
    await snap(viewport());
  });

  it("item focused from the keyboard", async () => {
    await render(actions);
    await openFromKeyboard(page.getByRole("button", { name: "Actions" }));
    await userEvent.keyboard("{ArrowDown}");
    await expect
      .element(page.getByRole("menuitem", { name: /Copy link/ }))
      .toHaveAttribute("data-focus-visible");
    await snap(viewport());
  });

  it("danger item focused from the keyboard", async () => {
    await render(actions);
    await openFromKeyboard(page.getByRole("button", { name: "Actions" }));
    await userEvent.keyboard("{End}");
    await expect
      .element(page.getByRole("menuitem", { name: /Delete file/ }))
      .toHaveAttribute("data-focus-visible");
    await snap(viewport());
  });

  it("disabled items", async () => {
    await render(
      <Dropdown>
        <Button variant="secondary">Actions</Button>
        <Dropdown.Popover>
          <Dropdown.Menu disabledKeys={["edit", "delete"]}>
            <Dropdown.Item id="copy">Copy link</Dropdown.Item>
            <Dropdown.Item id="edit">Edit file</Dropdown.Item>
            <Dropdown.Item id="delete" variant="danger">
              Delete file
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    );
    await openActions();
    await snap(viewport());
  });

  it("single selection", async () => {
    await render(choices({ selectionMode: "single" }));
    await userEvent.click(page.getByRole("button", { name: "Layers" }));
    await opened();
    await snap(viewport());
  });

  it("single selection with a dot", async () => {
    await render(
      choices({
        selectionMode: "single",
        indicator: <Dropdown.ItemIndicator type="dot" />
      })
    );
    await userEvent.click(page.getByRole("button", { name: "Layers" }));
    await opened();
    await snap(viewport());
  });

  it("multiple selection", async () => {
    await render(choices({ selectionMode: "multiple" }));
    await userEvent.click(page.getByRole("button", { name: "Layers" }));
    await opened();
    await snap(viewport());
  });

  it("with shortcuts", async () => {
    await render(
      <Dropdown>
        <Button variant="secondary">File</Button>
        <Dropdown.Popover>
          <Dropdown.Menu>
            <Dropdown.Item id="new" textValue="New file">
              <SquarePlusIcon aria-hidden size={16} />
              New file
              {shortcut("command")}
            </Dropdown.Item>
            <Dropdown.Item id="copy" textValue="Copy link">
              <CopyIcon aria-hidden size={16} />
              Copy link
              {shortcut("command", "shift")}
            </Dropdown.Item>
            <Separator />
            <Dropdown.Item id="delete" textValue="Delete file" variant="danger">
              <TrashIcon aria-hidden size={16} />
              Delete file
              {shortcut("command")}
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    );
    await userEvent.click(page.getByRole("button", { name: "File" }));
    await opened();
    await snap(viewport());
  });

  it("submenu open", async () => {
    await render(share());
    await userEvent.click(page.getByRole("button", { name: "Share" }));
    await opened();
    await hover(page.getByRole("menuitem", { name: /Share to/ }));
    await opened(2);
    await snap(viewport());
  });

  it("submenu with a custom indicator", async () => {
    await render(share(<CircleChevronRightIcon size={16} />));
    await userEvent.click(page.getByRole("button", { name: "Share" }));
    await opened();
    await snap(viewport());
  });

  it("from an icon button, placed bottom end", async () => {
    await render(
      <div className="dropdown-visual-stage">
        <Dropdown>
          <Button variant="ghost" isIconOnly aria-label="More actions">
            <DotsIcon size={16} />
          </Button>
          <Dropdown.Popover placement="bottom end">
            <Dropdown.Menu>
              <Dropdown.Item id="rename">Rename</Dropdown.Item>
              <Dropdown.Item id="duplicate">Duplicate</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    );
    await userEvent.click(page.getByRole("button", { name: "More actions" }));
    await opened();
    await snap(viewport());
  });

  it.each(PLACEMENTS)("placed %s", async (placement) => {
    await render(placed(placement));
    await userEvent.click(page.getByRole("button", { name: "File" }));
    await opened();
    await snap(viewport());
  });
});
