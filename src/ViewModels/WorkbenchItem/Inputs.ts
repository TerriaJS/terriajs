import remove from "lodash-es/remove";
import { runInAction } from "mobx";
import { BaseModel } from "../../Models/Definition/Model";
import {
  SelectableDimension,
  SelectableDimensionButton
} from "../../Models/SelectableDimensions/SelectableDimensions";
import ViewState from "../../ReactViewModels/ViewState";
import { IconGlyph } from "../../Styled/Icon";

/**
 * A Button input type
 */
export interface ButtonInput {
  type: "button";
  text: string;
  onClick: () => void;
  icon: IconGlyph;
}

/**
 * Input types that can be added for a workbench item using this API.
 *
 * Currently just ButtonInput, but can be easily extended.
 */
export type WorkbenchItemInput = ButtonInput;

/**
 * Disposer function for removing an added input generator.
 */
export type InputDisposer = () => void;

/**
 * Add a new input generator for workbench item.
 *
 * You can use this API to add a hook that gets called for each workbench item.
 * The hook can then return an {@link WorkbenchItemInput} description to insert
 * a new input in the UI for the workbench item.
 *
 * @param viewState
 * @param inputGenerator The hook function that will receive the workbench item as a parameter.
 *    It can return a {@link WorkbenchItemInput} description or `undefined`
 *    if no new input need to be generated for the workbench item.
 * @returns A disposer function that when called will remove the the generator.
 */
export function addInput(
  viewState: ViewState,
  inputGenerator: (item: BaseModel) => WorkbenchItemInput | undefined
): InputDisposer {
  // Note: Instead of directly exposing a SelectableDimension we choose to
  // expose a WorkbenchItemInput type which is more tightly bound to this
  // use-case. Also by not exposing the internal SelectableDimension interface
  // we leave room for future refactoring without breaking this API.
  //
  // The dimGenerator below will translate the WorkbenchItemInput to a SelectableDimension
  const dimGenerator = (item: BaseModel) => {
    const input = inputGenerator(item);
    const dim = input && workbenchItemInputToSelectableDimension(input);
    return dim;
  };
  runInAction(() => viewState.workbenchItemInputGenerators.push(dimGenerator));

  return () =>
    runInAction(() =>
      remove(
        viewState.workbenchItemInputGenerators,
        (gen) => gen === dimGenerator
      )
    );
}

/**
 * Convert {@link WorkbenchItemInput} to a {link @SelectableDimension}
 */
function workbenchItemInputToSelectableDimension(
  input: WorkbenchItemInput
): SelectableDimension {
  let dim: SelectableDimension;
  switch (input.type) {
    case "button":
      const button: SelectableDimensionButton = {
        type: "button",
        value: input.text,
        setDimensionValue: input.onClick,
        icon: input.icon
      };
      dim = button;
      break;
  }
  return dim;
}
