import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import { snap } from "../../../visual";
import { Card } from "../../Card";
import { Skeleton } from "..";
import "../skeleton.stories.css";

// In the card whose content is loading, as in the stories. Animations are
// stopped for screenshots, so shimmer, pulse and none all come out still
const loading = (content: React.ReactElement): React.ReactElement => (
  <Card aria-busy="true" variant="secondary" className="skeleton-stories-frame">
    {content}
  </Card>
);

describe("Skeleton", () => {
  it("catalogue card", async () => {
    await render(
      loading(
        <Skeleton className="skeleton-stories-card">
          <Skeleton className="skeleton-stories-image" />
          <Skeleton className="skeleton-stories-line skeleton-stories-w-60" />
          <Skeleton className="skeleton-stories-line skeleton-stories-w-70" />
          <Skeleton className="skeleton-stories-line skeleton-stories-w-45" />
        </Skeleton>
      )
    );
    await snap();
  });

  it("text", async () => {
    await render(
      loading(
        <Skeleton className="skeleton-stories-text">
          <Skeleton className="skeleton-stories-line" />
          <Skeleton className="skeleton-stories-line skeleton-stories-w-80" />
          <Skeleton className="skeleton-stories-line skeleton-stories-w-60" />
          <Skeleton className="skeleton-stories-line" />
          <Skeleton className="skeleton-stories-line skeleton-stories-w-45" />
        </Skeleton>
      )
    );
    await snap();
  });

  it("user profile", async () => {
    await render(
      loading(
        <Skeleton className="skeleton-stories-profile">
          <Skeleton className="skeleton-stories-avatar" />
          <div className="skeleton-stories-lines">
            <Skeleton className="skeleton-stories-line" />
            <Skeleton className="skeleton-stories-line skeleton-stories-w-70" />
          </div>
        </Skeleton>
      )
    );
    await snap();
  });

  it("list items", async () => {
    await render(
      loading(
        <Skeleton className="skeleton-stories-list">
          {[1, 2, 3].map((row) => (
            <div key={row} className="skeleton-stories-row">
              <Skeleton className="skeleton-stories-icon" />
              <div className="skeleton-stories-lines">
                <Skeleton className="skeleton-stories-line" />
                <Skeleton className="skeleton-stories-line skeleton-stories-w-80" />
              </div>
            </div>
          ))}
        </Skeleton>
      )
    );
    await snap();
  });

  // Each its own skeleton, not one holding the others
  it.each(["shimmer", "pulse", "none"] as const)(
    "separate shapes, %s",
    async (animationType) => {
      await render(
        loading(
          <div className="skeleton-stories-grid">
            {[1, 2, 3].map((tile) => (
              <Skeleton
                key={tile}
                animationType={animationType}
                className="skeleton-stories-tile"
              />
            ))}
          </div>
        )
      );
      await snap();
    }
  );
});
