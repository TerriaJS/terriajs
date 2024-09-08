import React from "react";

interface WelcomeMessagePurePropsType {
  showWelcomeMessage: boolean;
  setShowWelcomeMessage: (show: boolean) => void;
  isTopElement: boolean;
}

export declare const WelcomeMessagePure: React.FC<WelcomeMessagePurePropsType>;

declare class WelcomeMessage extends React.Component<{}> {}
export default WelcomeMessage;
