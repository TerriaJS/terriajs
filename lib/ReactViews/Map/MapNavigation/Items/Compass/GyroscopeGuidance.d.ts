import { ViewState } from "terriajs-plugin-api";

interface PropsType {
  viewState: ViewState;
  handleHelp?: () => void;
  onClose: () => void;
}

export declare const GyroscopeGuidance: React.FC<PropsType>;
