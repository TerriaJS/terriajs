import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import {
  CircleChevronLeftIcon,
  CircleChevronRightIcon
} from "@terria/design-system-icons";
import { focusVisible, hover, press, snap } from "../../../visual";
import { Pagination, type PaginationSize } from "..";

type Options = {
  page?: number;
  size?: PaginationSize;
  summary?: string;
  custom?: boolean;
};

// Ten pages: ellipses stand for those left out, and Previous is disabled
// on the first
const pager = ({
  page = 2,
  size = "md",
  summary,
  custom
}: Options = {}): React.ReactElement => {
  const pages =
    page === 5 ? [1, "start", 4, 5, 6, "end", 10] : [1, 2, 3, "end", 10];
  return (
    <Pagination size={size}>
      {summary && <Pagination.Summary>{summary}</Pagination.Summary>}
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.Previous isDisabled={page === 1}>
            <Pagination.PreviousIcon>
              {custom && <CircleChevronLeftIcon />}
            </Pagination.PreviousIcon>
            <span>{custom ? "Back" : "Previous"}</span>
          </Pagination.Previous>
        </Pagination.Item>
        {pages.map((number) => (
          <Pagination.Item key={number}>
            {typeof number === "number" ? (
              <Pagination.Link isActive={number === page}>
                {number}
              </Pagination.Link>
            ) : (
              <Pagination.Ellipsis />
            )}
          </Pagination.Item>
        ))}
        <Pagination.Item>
          <Pagination.Next>
            <span>{custom ? "Forward" : "Next"}</span>
            <Pagination.NextIcon>
              {custom && <CircleChevronRightIcon />}
            </Pagination.NextIcon>
          </Pagination.Next>
        </Pagination.Item>
      </Pagination.Content>
    </Pagination>
  );
};

describe.each(["sm", "md", "lg"] as const)("Pagination %s", (size) => {
  it("default", async () => {
    await render(pager({ size }));
    await snap();
  });

  it("page hovered", async () => {
    const screen = await render(pager({ size }));
    await hover(screen.getByRole("button", { name: "3" }));
    await snap();
  });

  it("current page hovered", async () => {
    const screen = await render(pager({ size }));
    await hover(screen.getByRole("button", { name: "2" }));
    await snap();
  });

  it("page focused", async () => {
    const screen = await render(pager({ size }));
    const link = screen.getByRole("button", { name: "3" });
    await focusVisible(link);
    await expect.element(link).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("page pressed", async () => {
    const screen = await render(pager({ size }));
    const link = screen.getByRole("button", { name: "3" });
    await press(link);
    await expect.element(link).toHaveAttribute("data-pressed");
    await snap();
  });

  it("next hovered", async () => {
    const screen = await render(pager({ size }));
    await hover(screen.getByRole("button", { name: "Next" }));
    await snap();
  });
});

describe("Pagination", () => {
  it("first page, previous disabled", async () => {
    await render(pager({ page: 1 }));
    await snap();
  });

  it("disabled previous hovered", async () => {
    const screen = await render(pager({ page: 1 }));
    await hover(screen.getByRole("button", { name: "Previous" }));
    await snap();
  });

  it("ellipsis on both sides", async () => {
    await render(pager({ page: 5 }));
    await snap();
  });

  it("with a summary", async () => {
    await render(pager({ summary: "Showing 11-20 of 100 results" }));
    await snap();
  });

  it("custom icons", async () => {
    await render(pager({ custom: true }));
    await snap();
  });
});
