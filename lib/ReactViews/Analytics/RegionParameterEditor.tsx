import { observer } from "mobx-react";
import React from "react";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";
import CommonStrata from "../../Models/Definition/CommonStrata";
import RegionParameter from "../../Models/FunctionParameters/RegionParameter";
import MapInteractionMode from "../../Models/MapInteractionMode";
import ViewState from "../../ReactViewModels/ViewState";
import { useViewState } from "../Context";
import RegionPicker, { getDisplayValue } from "./RegionPicker";
import Styles from "./parameter-editors.scss";

interface PropsType {
  previewed: CatalogFunctionMixin.Instance;
  parameter: RegionParameter;
}

const RegionParameterEditor: React.FC<PropsType> = observer(
  ({ parameter, previewed }) => {
    const viewState = useViewState();

    const selectRegionOnMap = () => {
      selectOnMap(viewState, parameter, previewed);
    };

    return (
      <div>
        <input
          className={Styles.field}
          type="text"
          readOnly={parameter.value === undefined}
          onChange={() => {
            // clear value on any attempt to edit the input
            // ideally we should place an `x` icon to clear the field
            parameter.setValue(CommonStrata.user, undefined);
          }}
          value={getDisplayValue(parameter.value as any, parameter)}
        />
        <button
          type="button"
          onClick={selectRegionOnMap}
          className={Styles.btnSelector}
        >
          Select region
        </button>
      </div>
    );
  }
);

/**
 * Prompt user to select/draw on map in order to define parameter.
 * @param viewState ViewState.
 * @param parameter Region parameter.
 * @param previewed Previewed catalog function item.
 */
export function selectOnMap(
  viewState: ViewState,
  parameter: RegionParameter,
  previewed: CatalogFunctionMixin.Instance
) {
  const terria = previewed.terria;
  // Cancel any feature picking already in progress.
  terria.pickedFeatures = undefined;

  const pickPointMode = new MapInteractionMode({
    message: "Select a region on the map",
    onCancel: () => {
      terria.mapInteractionModeStack.pop();
      viewState.openAddData();
    },
    buttonText: "Done",
    customUi: () => <RegionPicker previewed={previewed} parameter={parameter} />
  });
  terria.mapInteractionModeStack.push(pickPointMode);
  viewState.explorerPanelIsVisible = false;
}

export default RegionParameterEditor;
