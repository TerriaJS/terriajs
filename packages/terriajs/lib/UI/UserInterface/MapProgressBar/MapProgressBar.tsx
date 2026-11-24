import { ProgressBar } from "@terria/design-system";
import { clsx } from "clsx";
import { observer } from "mobx-react";
import { useState, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useViewState } from "../../../ReactViewModels/ViewStateContext";
import { MapProgress } from "./mapProgress.model";

type MapProgressBarProps = {
  className?: string;
};

/**
 * How much of what the map is loading has loaded, or that it's loading while
 * it can't say how far. Gone while it isn't loading
 */
const MapProgressBar = observer(
  ({ className }: MapProgressBarProps): ReactElement | null => {
    const { terria } = useViewState();
    const { t } = useTranslation();
    const [progress] = useState(() => new MapProgress(terria));
    if (!progress.isLoading) return null;

    return (
      <ProgressBar
        size="sm"
        aria-label={t(($) => $.map.loadingData)}
        value={progress.percentage}
        isIndeterminate={progress.percentage === undefined}
        className={clsx("tjs-map-progress-bar", className)}
      >
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
    );
  }
);

export { MapProgressBar };
export type { MapProgressBarProps };
