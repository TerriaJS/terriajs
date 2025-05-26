import type { Component } from "react";

interface WelcomeMessagePurePropsType {
  showWelcomeMessage: boolean;
  setShowWelcomeMessage: (show: boolean) => void;
  isTopElement: boolean;
}

export declare const WelcomeMessagePure: React.FC<WelcomeMessagePurePropsType>;

declare class WelcomeMessage extends Component<object> {}
export default WelcomeMessage;
