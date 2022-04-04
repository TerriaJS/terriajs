import ViewState from "../ReactViewModels/ViewState";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import { ViewingControl } from "../Models/ViewingControls";
import { runInAction } from "mobx";
import { remove } from "lodash-es";
import { Optional } from "../Core/types";
import createGuid from "terriajs-cesium/Source/Core/createGuid";

export type ViewingControlGenerateFunction = (
  item: CatalogMemberMixin.Instance
) => Optional<ViewingControl, "id"> | undefined;

export namespace ViewingControlsMenu {
  /**
   * Adds a new viewing control menu option.
   *
   * @param viewState - The {@link ViewState} instance.
   * @param generateViewingControl - A function that either generates a {@link ViewingControl} description for the given catalog item or returns `undefined` if no option should be shown
   * @returns A cleanup function that when called will remove the option
   */
  export function addMenuItem(
    viewState: ViewState,
    generateViewingControl: ViewingControlGenerateFunction
  ): () => void {
    runInAction(() => {
      viewState.globalViewingControlOptions.push(item => {
        const viewingControl = generateViewingControl(item);
        return viewingControl === undefined
          ? undefined
          : {
              // if id is not specified, create one
              id: viewingControl.id ?? createGuid(),
              ...viewingControl
            };
      });
    });
    return () => {
      runInAction(() => {
        remove(
          viewState.globalViewingControlOptions,
          fn => fn === generateViewingControl
        );
      });
    };
  }
}
