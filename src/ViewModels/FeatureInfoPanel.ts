import { runInAction } from "mobx";
import { BaseModel } from "../Models/Definition/Model";
import TerriaFeature from "../Models/Feature/Feature";
import ViewState from "../ReactViewModels/ViewState";
import { IconGlyph } from "../Styled/Icon";

/**
 * FeatureInfoPanel Button type
 */
export interface FeatureInfoPanelButton {
  text?: string;
  icon?: IconGlyph;
  title?: string;
  onClick: () => void;
}

/**
 * A generator function called once for each feature in the feature info panel.
 *
 * @param feature The feature for which the button is being generated
 * @param item The map item for which the button is being generated
 * @returns An instance of {@link FeatureInfoPanelButton} or `undefined` if no button should be shown.
 */
export type FeatureInfoPanelButtonGenerator = (props: {
  feature: TerriaFeature;
  item: BaseModel;
}) => FeatureInfoPanelButton | undefined;

/**
 * Add a new feature button generator to Terria ViewState.
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

/**
 * Close feature info panel
 */
export function closePanel(viewState: ViewState) {
  runInAction(() => {
    viewState.terria.pickedFeatures = undefined;
  });
}
