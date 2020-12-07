import React from "react";
import ViewState from "../../../../ReactViewModels/ViewState";

interface ToolButtonProps {
  viewState: ViewState;
  toolName: string;
  getToolComponent: () => React.ReactNode | Promise<React.ReactNode>;
  params?: any;
}

export class ToolButton {
  private options: ToolButtonProps;

  constructor(options: ToolButtonProps) {
    this.options = options;
  }

  get isThisToolOpen() {
    const currentTool = this.options.viewState.currentTool;
    return currentTool && currentTool.toolName === this.options.toolName;
  }

  toggleOpen() {
    if (this.isThisToolOpen) {
      this.options.viewState.closeTool();
    } else {
      const tool = {
        toolName: this.options.toolName,
        getToolComponent: this.options.getToolComponent,
        params: this.options.params,
        showCloseButton: false
      };
      this.options.viewState.openTool(tool);
    }
  }
}
