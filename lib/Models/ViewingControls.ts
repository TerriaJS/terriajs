import ViewState from "../ReactViewModels/ViewState";
import { IconProps } from "../Styled/Icon";

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
