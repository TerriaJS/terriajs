import React from "react";

interface PropsType {
  content: React.ReactNode;
  isVisible: boolean;
  displayDelay: number;
  dismissText: string;
  dismissAction: () => void;
  centered?: boolean;
  caretTopOffset?: number;
  caretLeftOffset?: number;
  caretSize?: number;
  promptWidth?: number;
  promptTopOffset?: number;
  promptLeftOffset?: number;
}

declare class Prompt extends React.PureComponent<PropsType> {}

export default Prompt;
