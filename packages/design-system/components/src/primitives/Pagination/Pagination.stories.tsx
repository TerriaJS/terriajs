import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  CircleChevronLeftIcon,
  CircleChevronRightIcon
} from "@terria/design-system-icons";
import { useState, type ReactNode } from "react";
import { Pagination, type PaginationProps } from ".";
import { ListBox } from "../ListBox";
import { Select } from "../Select";
import { figmaDesign } from "../../figma";
import "./pagination.stories.css";

const meta = {
  title: "Example/Pagination",
  component: Pagination,
  parameters: {
    ...figmaDesign("Pagination"),
    docs: {
      description: {
        component:
          "Moves between the pages of a long list split into pages, such as search results in the data catalogue or the rows of a feature table. A Summary says what's shown, and the Content lists Previous, page Links with Ellipses for the pages left out, and Next. It only shows the pages: the app keeps the current page, decides which pages to list, and loads a page when one is pressed. For moving between the steps of a task, or sections of one page, use Tabs."
      }
    }
  },
  args: { size: "md" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] }
  },
  decorators: [
    (Story) => (
      <div className="pagination-stories-frame">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

// The pages to list: the first and last, the current page's neighbours, and
// a gap on either side of them when pages are left out
const pageNumbers = (
  page: number,
  totalPages: number
): (number | "start-ellipsis" | "end-ellipsis")[] => {
  const pages: (number | "start-ellipsis" | "end-ellipsis")[] = [];
  pages.push(1);
  if (page > 3) {
    pages.push("start-ellipsis");
  }
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (page < totalPages - 2) {
    pages.push("end-ellipsis");
  }
  pages.push(totalPages);
  return pages;
};

type PagerOptions = {
  total?: number;
  /** Only Previous and Next, no page numbers */
  simple?: boolean;
  summary?: ReactNode;
  previousLabel?: string;
  nextLabel?: string;
  previousIcon?: ReactNode;
  nextIcon?: ReactNode;
};

// A pagination that moves between pages as they're pressed; the story keeps
// the current page, as an app would. Called as a function, not rendered as a
// component, so a story's code shows the markup it returns
const pager = (
  props: PaginationProps,
  page: number,
  setPage: (page: number) => void,
  {
    total = 3,
    simple = false,
    summary,
    previousLabel = "Previous",
    nextLabel = "Next",
    previousIcon,
    nextIcon
  }: PagerOptions = {}
): React.ReactElement => (
  <Pagination {...props}>
    {summary !== undefined && (
      <Pagination.Summary>{summary}</Pagination.Summary>
    )}
    <Pagination.Content>
      <Pagination.Item>
        <Pagination.Previous
          isDisabled={page === 1}
          onPress={() => {
            setPage(page - 1);
          }}
        >
          <Pagination.PreviousIcon>{previousIcon}</Pagination.PreviousIcon>
          <span>{previousLabel}</span>
        </Pagination.Previous>
      </Pagination.Item>
      {!simple &&
        pageNumbers(page, total).map((number) => (
          <Pagination.Item key={number}>
            {typeof number === "number" ? (
              <Pagination.Link
                isActive={number === page}
                onPress={() => {
                  setPage(number);
                }}
              >
                {number}
              </Pagination.Link>
            ) : (
              <Pagination.Ellipsis />
            )}
          </Pagination.Item>
        ))}
      <Pagination.Item>
        <Pagination.Next
          isDisabled={page === total}
          onPress={() => {
            setPage(page + 1);
          }}
        >
          <span>{nextLabel}</span>
          <Pagination.NextIcon>{nextIcon}</Pagination.NextIcon>
        </Pagination.Next>
      </Pagination.Item>
    </Pagination.Content>
  </Pagination>
);

const PER_PAGE = 10;

/** Press a page, or Previous and Next, to move between three pages */
export const Default: Story = {
  render: function Render(args) {
    const [page, setPage] = useState(1);
    return pager(args, page, setPage);
  }
};

/** Page buttons are a step larger on narrow screens, for fingers */
export const Sizes: Story = {
  render: function Render(args) {
    const [small, setSmall] = useState(1);
    const [medium, setMedium] = useState(1);
    const [large, setLarge] = useState(1);
    return (
      <div className="pagination-stories-stack">
        {/* Several on a page: each needs a name of its own */}
        {pager(
          { ...args, size: "sm", "aria-label": "Small pagination" },
          small,
          setSmall
        )}
        {pager(
          { ...args, size: "md", "aria-label": "Medium pagination" },
          medium,
          setMedium
        )}
        {pager(
          { ...args, size: "lg", "aria-label": "Large pagination" },
          large,
          setLarge
        )}
      </div>
    );
  }
};

/** With many pages, an Ellipsis stands for those left out; the pages listed
 * follow the current one */
export const WithEllipsis: Story = {
  render: function Render(args) {
    const [page, setPage] = useState(1);
    return pager(args, page, setPage, { total: 10 });
  }
};

/** Previous and Next alone, with a summary, as the design's first */
export const SimplePrevNext: Story = {
  render: function Render(args) {
    const [page, setPage] = useState(1);
    return pager(args, page, setPage, {
      total: 2,
      simple: true,
      previousLabel: "Prev",
      summary: `${String((page - 1) * 5 + 1)} to ${String(page * 5)} of 10 datasets`
    });
  }
};

/** The summary with a Select of the results shown, as the design's second;
 * choosing a range goes to its page */
export const WithSummary: Story = {
  decorators: [
    (Story) => (
      <div className="pagination-stories-wide">
        <Story />
      </div>
    )
  ],
  render: function Render(args) {
    const [page, setPage] = useState(1);
    const total = 12;
    const range = (number: number): string =>
      `${String((number - 1) * PER_PAGE + 1)}-${String(number * PER_PAGE)}`;
    return pager(args, page, setPage, {
      total,
      summary: (
        <>
          Showing
          <Select
            aria-label="Results shown"
            value={page}
            onChange={(key) => {
              setPage(Number(key));
            }}
          >
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {Array.from({ length: total }, (_, index) => index + 1).map(
                  (number) => (
                    <ListBox.Item
                      key={number}
                      id={number}
                      textValue={range(number)}
                    >
                      {range(number)}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  )
                )}
              </ListBox>
            </Select.Popover>
          </Select>
          of {total * PER_PAGE} results
        </>
      )
    });
  }
};

/** The arrows replaced by other icons */
export const CustomIcons: Story = {
  render: function Render(args) {
    const [page, setPage] = useState(1);
    return pager(args, page, setPage, {
      previousLabel: "Back",
      nextLabel: "Forward",
      previousIcon: <CircleChevronLeftIcon />,
      nextIcon: <CircleChevronRightIcon />
    });
  }
};

/** The summary follows the page, as an app's would */
export const Controlled: Story = {
  render: function Render(args) {
    const [page, setPage] = useState(1);
    return pager(args, page, setPage, {
      total: 12,
      summary: `Showing ${String((page - 1) * PER_PAGE + 1)}-${String(page * PER_PAGE)} of 120 results`
    });
  }
};
