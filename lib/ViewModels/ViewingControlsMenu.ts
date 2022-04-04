import ViewState from "../ReactViewModels/ViewState";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import { ViewingControl } from "../Models/ViewingControls";
import { runInAction } from "mobx";
import { remove } from "lodash-es";

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
    generateViewingControl: (
      item: CatalogMemberMixin.Instance
    ) => ViewingControl | undefined
  ): () => void {
    runInAction(() => {
      viewState.globalViewingControlOptions.push(generateViewingControl);
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
