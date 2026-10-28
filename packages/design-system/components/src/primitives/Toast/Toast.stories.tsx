import type { Meta, StoryObj } from "@storybook/react-vite";
import { Share2Icon, SparklesIcon } from "@terria/design-system-icons";
import {
  Toast,
  ToastProvider,
  ToastQueue,
  toast,
  type ToastPlacement,
  type ToastProviderProps
} from ".";
import { Button } from "../Button";
import { figmaDesign } from "../../figma";
import "./toast.stories.css";

const PLACEMENTS: ToastPlacement[] = [
  "top-start",
  "top",
  "top-end",
  "bottom-start",
  "bottom",
  "bottom-end"
];

// A queue for each placement, so each stack shows only its own
const placementQueues = Object.fromEntries(
  PLACEMENTS.map((placement) => [placement, new ToastQueue()])
) as Record<ToastPlacement, ToastQueue>;

const expandedQueue = new ToastQueue();

const workspaceQueue = new ToastQueue({ maxVisibleToasts: 5 });

const meta = {
  title: "Example/Toast",
  component: ToastProvider,
  parameters: {
    ...figmaDesign("Toast"),
    docs: {
      description: {
        component:
          "A short message about something that has just happened, such as a layer added to the map, a share link copied, or an export finished, shown in a stack at the screen's edge for a few seconds. Add one from anywhere with toast(), or toast.success(), .info(), .warning() and .danger(); toast.promise() shows a task loading, then how it went. Render one Toast.Provider in the app to show them. Hovering or focusing the stack opens it out and holds the toasts; Alt+T reaches it from the keyboard. For a message that must be read or answered before going on, use an AlertDialog; for one that stays with the content it's about, an Alert."
      }
    }
  },
  // The queues live as long as the page, as an app's would; leaving a story
  // clears them, so its toasts don't turn up in the next
  beforeEach: () => () => {
    for (const queue of [
      ...Object.values(placementQueues),
      expandedQueue,
      workspaceQueue
    ]) {
      queue.clear();
    }
    toast.clear();
  },
  args: { placement: "bottom" },
  argTypes: {
    placement: {
      control: "select",
      options: [
        "top-start",
        "top",
        "top-end",
        "bottom-start",
        "bottom",
        "bottom-end"
      ]
    }
  }
} satisfies Meta<typeof ToastProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

// The provider and buttons that add toasts. Called as a function, not
// rendered as a component, so a story's code shows the markup it returns
const demo = (
  props: ToastProviderProps,
  buttons: React.ReactNode
): React.ReactElement => (
  <div className="toast-stories-demo">
    <Toast.Provider {...props} />
    <div className="toast-stories-buttons">{buttons}</div>
  </div>
);

/** The design's five: each with a description and an action, coloured to
 * match */
export const Default: Story = {
  render: (args) =>
    demo(
      args,
      <>
        <Button
          size="sm"
          variant="tertiary"
          onPress={() => {
            const id = toast("Shared view saved", {
              description: "Anyone with the link sees this map",
              indicator: <Share2Icon />,
              actionProps: {
                children: "Copy link",
                variant: "tertiary",
                onPress: () => {
                  toast.close(id);
                }
              }
            });
          }}
        >
          Default
        </Button>
        <Button
          size="sm"
          variant="tertiary"
          onPress={() => {
            const id = toast.info("New data in the catalogue", {
              description: "Flood planning areas were updated today",
              actionProps: {
                children: "View",
                onPress: () => {
                  toast.close(id);
                }
              }
            });
          }}
        >
          Accent
        </Button>
        <Button
          size="sm"
          variant="tertiary"
          onPress={() => {
            const id = toast.success("Layer added", {
              description: "Suburbs 2021 is on the map",
              actionProps: {
                children: "Zoom to",
                className: "toast-stories-success",
                onPress: () => {
                  toast.close(id);
                }
              }
            });
          }}
        >
          Success
        </Button>
        <Button
          size="sm"
          variant="tertiary"
          onPress={() => {
            const id = toast.warning("Layer is large", {
              description: "It may take a while to draw at this scale",
              actionProps: {
                children: "Simplify",
                className: "toast-stories-warning",
                onPress: () => {
                  toast.close(id);
                }
              }
            });
          }}
        >
          Warning
        </Button>
        <Button
          size="sm"
          variant="tertiary"
          onPress={() => {
            const id = toast.danger("Layer failed to load", {
              description: "The server didn't respond",
              actionProps: {
                children: "Retry",
                variant: "danger",
                onPress: () => {
                  toast.close(id);
                }
              }
            });
          }}
        >
          Danger
        </Button>
      </>
    )
};

/** Titles alone */
export const SimpleToast: Story = {
  render: (args) =>
    demo(
      args,
      <>
        <Button
          size="sm"
          variant="secondary"
          onPress={() => toast("Link copied")}
        >
          Default
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onPress={() => toast.success("Map exported")}
        >
          Success
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onPress={() => toast.info("Catalogue updated")}
        >
          Info
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onPress={() =>
            toast.warning("Some features are hidden at this scale")
          }
        >
          Warning
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onPress={() => toast.danger("Something went wrong")}
        >
          Danger
        </Button>
      </>
    )
};

/** At each edge and corner of the screen */
export const Placements: Story = {
  render: () => (
    <div className="toast-stories-demo">
      {PLACEMENTS.map((placement) => (
        <Toast.Provider
          key={placement}
          placement={placement}
          queue={placementQueues[placement]}
        />
      ))}
      <div className="toast-stories-buttons">
        {PLACEMENTS.map((placement) => (
          <Button
            key={placement}
            size="sm"
            variant="secondary"
            onPress={() =>
              placementQueues[placement].add({
                title: "Layer added",
                description: "Suburbs 2021 is on the map"
              })
            }
          >
            {placement}
          </Button>
        ))}
      </div>
    </div>
  )
};

/** Kept open at full height, rather than only while hovered or focused */
export const Expanded: Story = {
  render: (args) =>
    demo(
      { ...args, isExpanded: true, queue: expandedQueue },
      <Button
        size="sm"
        variant="secondary"
        onPress={() => {
          expandedQueue.add({ title: "Layer added" });
          setTimeout(() => {
            expandedQueue.add({ title: "Map exported", variant: "success" });
          }, 400);
          setTimeout(() => {
            expandedQueue.add({
              title: "Catalogue updated",
              variant: "accent"
            });
          }, 800);
        }}
      >
        Show 3 toasts
      </Button>
    )
};

// A task that takes a couple of seconds, succeeding or not
const task = <T,>(result: T, fail = false): Promise<T> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (fail) {
        reject(new Error("The server didn't respond"));
      } else {
        resolve(result);
      }
    }, 2000);
  });

/** A task shown loading, then how it went, in the same toast */
export const PromiseToast: Story = {
  render: (args) =>
    demo(
      args,
      <>
        <Button
          size="sm"
          variant="secondary"
          onPress={() => {
            toast.promise(task({ name: "sydney.png", size: 1240 }), {
              loading: "Exporting map…",
              success: (file) =>
                `Exported ${file.name} (${String(file.size)} KB)`,
              error: "Export failed"
            });
          }}
        >
          Export map
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onPress={() => {
            toast.promise(task(null, true), {
              loading: "Loading layer…",
              success: "Layer loaded",
              error: (error) => error.message
            });
          }}
        >
          Load layer (fails)
        </Button>
      </>
    )
};

/** A spinner while loading, updated in place when it's done */
export const LoadingState: Story = {
  render: (args) =>
    demo(
      args,
      <Button
        size="sm"
        variant="secondary"
        onPress={() => {
          const id = toast("Saving view…", { isLoading: true, timeout: 0 });
          setTimeout(() => {
            toast.update(id, "View saved", {
              variant: "success",
              timeout: 4000
            });
          }, 2000);
        }}
      >
        Save view
      </Button>
    )
};

/** Another icon in place of the variant's, or none */
export const CustomIndicator: Story = {
  render: (args) =>
    demo(
      args,
      <>
        <Button
          size="sm"
          variant="secondary"
          onPress={() =>
            toast("Added to favourites", { indicator: <SparklesIcon /> })
          }
        >
          Custom icon
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onPress={() => toast("No icon", { indicator: null })}
        >
          No icon
        </Button>
      </>
    )
};

/** A queue of its own, here showing up to five at a time */
export const CustomQueue: Story = {
  render: (args) =>
    demo(
      { ...args, queue: workspaceQueue },
      <Button
        size="sm"
        variant="secondary"
        onPress={() =>
          workspaceQueue.add({
            title: "Workspace synced",
            variant: "success"
          })
        }
      >
        Add to this queue
      </Button>
    )
};
