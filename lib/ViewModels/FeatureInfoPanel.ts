import { runInAction } from "mobx";
import { BaseModel } from "../Models/Definition/Model";
import TerriaFeature from "../Models/Feature/Feature";
import ViewState from "../ReactViewModels/ViewState";
import { IconGlyph } from "../Styled/Icon";

/**
 * Close feature info panel
 */
export function closePanel(viewState: ViewState) {
  runInAction(() => {
    viewState.terria.pickedFeatures = undefined;
  });
}

export interface FeatureInfoPanelButton {
  text?: string;
  icon?: IconGlyph;
  title?: string;
  onClick: () => void;
}

export type FeatureInfoPanelButtonGenerator = (props: {
  feature: TerriaFeature;
  item: BaseModel;
}) => FeatureInfoPanelButton | undefined;

/**
 * Add a feature button generator.
 *
 * @param viewState The ViewState object
 * @param buttonGenerator A button generator function. It will be called once
 * for each catalog item shown in the Feature info panel. The generator
 * function receives the catalog item as a parameter. It can decide to not show a
 * button by returning `undefined`. To show a button return a `SelectableDimensionButton` object.
 */
export function addFeatureButton(
  viewState: ViewState,
  buttonGenerator: FeatureInfoPanelButtonGenerator
) {
  runInAction(() =>
    viewState.featureInfoPanelButtonGenerators.push(buttonGenerator)
  );
}
