import { action } from "mobx";
import { createElement, ReactElement } from "react";
import ViewState from "../../ReactViewModels/ViewState";
import FeatureLink from "../Generic/FeatureLink";
import CustomComponent, {
  DomElement,
  ProcessNodeContext
} from "./CustomComponent";

/**
 * A `<settingspanel>` custom component, that shows a link like button which when clicked
 * opens the settings panel.
 *
 * Props accepted
 *   - title - The text to use as alt link content
 *   - children - The link text
 *
 * Example: <settingspanel title="Open settings panel">Change base map</settingspanel>
 */
export default class SettingsPanelLinkCustomComponent extends CustomComponent {
  get name(): string {
    return "settingspanel";
  }

  get attributes(): string[] {
    return ["title"];
  }

  processNode(
    _context: ProcessNodeContext,
    node: DomElement,
    children: ReactElement[]
  ): ReactElement {
    return createElement(
      FeatureLink,
      {
        title: node.attribs?.title,
        onClick: action((viewState: ViewState) => viewState.openSettingsPanel())
      },
      ...children
    );
  }
}
