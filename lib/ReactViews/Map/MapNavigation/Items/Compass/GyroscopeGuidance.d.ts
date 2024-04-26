import ViewState from "../../../../../ReactViewModels/ViewState";

interface PropsType {
  viewState: ViewState;
  handleHelp?: () => void;
  onClose: () => void;
}

export declare const GyroscopeGuidance: React.FC<PropsType>;
