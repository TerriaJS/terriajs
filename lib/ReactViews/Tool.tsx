import React from "react";
import ViewState from "../ReactViewModels/ViewState";
import DiffTool from "./Tools/DiffTool/DiffTool";

interface PropsType {
  viewState: ViewState;
  type: string;
  params: unknown;
}

export default function Tool({ type, params, viewState }: PropsType) {
  const ToolComponent: any = getToolComponent(type);
  return ToolComponent && <ToolComponent viewState={viewState} {...params} />;
}

export function getToolComponent(type: string) {
  if (type === "diffTool") {
    return DiffTool;
  }
}

export function getToolName(type: string): string | undefined {
  const component: any = getToolComponent(type);
  return component?.toolName;
}
