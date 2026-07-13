import { createElement, FC, ReactElement } from "react";
import styled from "styled-components";
import { useViewState, ViewState } from "terriajs-plugin-api";
import CustomComponent, {
  DomElement,
  ProcessNodeContext
} from "terriajs/lib/ReactViews/Custom/CustomComponent";
import OgcProcessCatalogFunction from "../Models/Ogc/Process/OgcProcessCatalogFunction";
import OgcProcessCatalogGroup from "../Models/Ogc/Process/OgcProcessCatalogGroup";

interface PropsType {
  processGroupId?: string;
  processId?: string;
  children: ReactElement[];
}

const ProcessLink: FC<PropsType> = ({
  processGroupId,
  processId,
  children
}) => {
  const viewState = useViewState();
  return processGroupId && processId ? (
    <ButtonAsLink
      onClick={() => openGroup(viewState, processGroupId, processId)}
    >
      {children}
    </ButtonAsLink>
  ) : (
    children
  );
};

async function openGroup(
  viewState: ViewState,
  processGroupId: string,
  processId: string
) {
  const group = viewState.terria.getModelById(
    OgcProcessCatalogGroup,
    processGroupId
  );
  if (!group) {
    return;
  }

  await group.loadMembers();
  const process = viewState.terria.getModelById(
    OgcProcessCatalogFunction,
    `${processGroupId}/${processId}`
  );

  if (process) {
    viewState.viewCatalogMember(process);
  }
}

const ButtonAsLink = styled.button.attrs({ type: "button" })`
  background: none;
  border: none;
  text-decoration: underline;
  color: blue;
`;

export class ProcessLinkCustomComponent extends CustomComponent {
  get name(): string {
    // must be lower case
    return "processlink";
  }

  get attributes(): string[] {
    return ["process-group-id", "process-id"];
  }

  processNode(
    _context: ProcessNodeContext,
    node: DomElement,
    children: ReactElement[],
    _index: number
  ): ReactElement | undefined {
    return createElement(ProcessLink, {
      processGroupId: node.attribs?.["process-group-id"],
      processId: node.attribs?.["process-id"],
      children
    });
  }
}
