import {
  autorun,
  computed,
  getDependencyTree,
  IComputedValue,
  IDependencyTree,
  runInAction
} from "mobx";
import Mappable from "../../lib/Models/Mappable";
import Terria from "../../lib/Models/Terria";
import ViewerMode from "../../lib/Models/ViewerMode";
import TerriaViewer from "../../lib/ViewModels/TerriaViewer";

describe("TerriaViewer", () => {
  let terriaViewer: TerriaViewer;
  const items = [] as Mappable[];

  let container: HTMLDivElement;
  beforeEach(() => {
    terriaViewer = new TerriaViewer(
      new Terria(),
      computed(() => items)
    );
    container = document.createElement("div");
    container.id = "container";
    document.body.appendChild(container);
  });

  afterEach(() => {
    terriaViewer.destroy();
    document.body.removeChild(container);
  });

  function isUnexpectedDependency({ name }: IDependencyTree) {
    // Reject any dependency except:
    //  - A known public property dependency on TerriaViewer
    //  - Any private property dependency on TerriaViewer
    //  - Any dependency on any Promise (which comes from mobx-utils' fromPromise)
    const goodTerriaViewerProps = [
      /mapContainer$/,
      /viewerMode$/,
      /attached$/,
      /_.*/
    ];
    return !(
      (/^TerriaViewer@\d+\./.test(name) &&
        goodTerriaViewerProps.some(re => re.test(name))) ||
      /^Promise@\d+\./.test(name)
    );
  }

  const createTestForViewer = (
    viewerMode: ViewerMode,
    isDone: IComputedValue<boolean>
  ) => () => {
    // Test that currentViewer doesn't rely on more than mapContainer
    // 1. Observe currentViewer
    // 2. Check its depedencies whenever the currentViewer changes
    // 3. Set TerriaViewer's viewerMode
    // 4. Wait until currentViewer changes
    // 5. Pass the test if there were no unexpected dependencies

    const p = new Promise((resolve, reject) => {
      const disposeCurrentViewerReaction = autorun(() => {
        // Depend on currentViewer for autorun
        terriaViewer.currentViewer;

        const dependencies =
          getDependencyTree(terriaViewer, "currentViewer").dependencies || [];
        if (dependencies.some(isUnexpectedDependency)) {
          console.log(dependencies);
          reject(
            `Unexpected dependencies to currentViewer: ${dependencies
              .filter(isUnexpectedDependency)
              .map(dep => dep.name)}`
          );
        }
        if (isDone.get()) {
          disposeCurrentViewerReaction();
          expect().nothing();
          resolve();
        }
      });
    });
    terriaViewer.attach(container);
    runInAction(() => {
      terriaViewer.viewerMode = viewerMode;
    });
    return p;
  };

  it(
    "currentViewer doesn't track extra dependencies with a Cesium viewer",
    createTestForViewer(
      ViewerMode.Cesium,
      computed(() => terriaViewer.currentViewer.type === "Cesium")
    )
  );

  it(
    "currentViewer doesn't track extra dependencies with a Leaflet viewer",
    createTestForViewer(
      ViewerMode.Leaflet,
      computed(() => terriaViewer.currentViewer.type === "Leaflet")
    )
  );
});
