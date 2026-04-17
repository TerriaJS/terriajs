import { runInAction } from "mobx";
import ViewState from "../../../ReactViewModels/ViewState";
import { PanelMenuProps } from "../../../ReactViews/Workflow/PanelMenu";
import { IconProps } from "../../../Styled/Icon";
import { SelectableDimension } from "../../SelectableDimensions/SelectableDimensions";
import Terria from "../../Terria";

export default interface AppWorkflow {
  /** Human readable name - used as title */
  name: string;
  icon?: IconProps["glyph"];

  onClose?: () => void;
  /** Footer button */
  footer?: SelectableDimension[];
  menu?: PanelMenuProps;

  /**
   * Main inputs to render
   */
  inputs?: SelectableDimension[];
}

/**
 * Runs an app workflow
 *
 * @param viewStateOrTerria - The {@link ViewState} or {@link Terria} instance
 * @param workflow - A {@link SelectableDimensionWorkflow} instance
 */
export function runAppWorkflow(
  viewStateOrTerria: ViewState | Terria,
  workflow: AppWorkflow
) {
  runInAction(() => {
    const terria =
      viewStateOrTerria instanceof Terria
        ? viewStateOrTerria
        : viewStateOrTerria.terria;
    terria.appWorkflow = workflow;
  });
}

export function closeAppWorkflow(
  viewStateOrTerria: ViewState | Terria,
  workflow: AppWorkflow
) {
  runInAction(() => {
    const terria =
      viewStateOrTerria instanceof Terria
        ? viewStateOrTerria
        : viewStateOrTerria.terria;

    if (terria.appWorkflow === workflow) {
      terria.appWorkflow = undefined;
    }
  });
}
