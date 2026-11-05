import { observer } from "mobx-react";
import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Loader } from "./Loader";
import { terriaStore } from "./terriaStore";

// Each user interface is loaded on its own, with its own styles, so the page
// never has both: the current one, or the new one on the design system when
// the config's experimentalNewUi is on
const LazyTerriaUserInterface = React.lazy(() =>
  import("./UserInterface").then((module) => ({
    default: module.TerriaUserInterface
  }))
);
const LazyNewUserInterface = React.lazy(() =>
  import("terriajs/lib/UI/UserInterface/UserInterface").then((module) => ({
    default: module.UserInterface
  }))
);

const Root = observer(() => {
  const { terria, viewState, status } = terriaStore;

  if (status === "loading") {
    return <Loader />;
  }

  const UserInterface = terria.configParameters.experimentalNewUi
    ? LazyNewUserInterface
    : LazyTerriaUserInterface;

  return (
    <Suspense fallback={<Loader />}>
      <UserInterface terria={terria} viewState={viewState} />
    </Suspense>
  );
});

export const renderUi = () => {
  const container = document.getElementById("ui");
  if (!container) {
    console.error("Container element with id 'ui' not found.");
    return;
  }

  const root = createRoot(container);
  root.render(<Root />);
};
