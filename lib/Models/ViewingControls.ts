import ViewState from "../ReactViewModels/ViewState";
import { IconProps } from "../Styled/Icon";

/** This model represents an item in the ViewingControls menu for a given catalog member in the workbench. (This menu has "Remove", "Export", "Compare", ...).
 * See `lib/ReactViews/Workbench/Controls/ViewingControls.tsx` for more info and usage
 */
export interface ViewingControl {
  onClick: (viewState: ViewState) => void;
  id: string;
  name: string;
  icon: IconProps;
  iconTitle?: string;
}

interface ViewingControls {
  viewingControls: ViewingControl[];
}

namespace ViewingControls {
  export function is(model: any): model is ViewingControls {
    return "viewingControls" in model;
  }
}

export default ViewingControls;
