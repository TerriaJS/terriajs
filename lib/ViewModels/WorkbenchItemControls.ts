import remove from "lodash-es/remove";
import { action } from "mobx";
import { BaseModel } from "../Models/Definition/Model";
import { SelectableDimension } from "../Models/SelectableDimensions/SelectableDimensions";
import ViewState from "../ReactViewModels/ViewState";

type WorkbenchItemControlsGenerator = (
  item: BaseModel
) => SelectableDimension[] | undefined;

type WorkbenchItemControlDisposer = () => void;

export const addControl = action(
  (
    viewState: ViewState,
    generator: WorkbenchItemControlsGenerator
  ): WorkbenchItemControlDisposer => {
    const generateFn = generator;
    viewState.workbenchItemControlGenerators.push(generateFn);
    return action(() =>
      remove(
        viewState.workbenchItemControlGenerators,
        (fn) => fn === generateFn
      )
    );
  }
);
