import { ReactElement, useState } from "react";
import CustomComponent, {
  DomElement,
  ProcessNodeContext
} from "./CustomComponent";
import Button from "../../Styled/Button";
import Text from "../../Styled/Text";
import xml2json from "../../ThirdParty/xml2json";
import { useViewState } from "../Context";
import { action, runInAction } from "mobx";

enum EmbedWpsHtmlState {
  Default,
  AwaitingResponse,
  ResponseError,
  ResponseOk
}

function EmbedWpsHtml({ url }: { url: string }) {
  const viewState = useViewState();
  // Doesn't support changing url
  const [state, setState] = useState(EmbedWpsHtmlState.Default);

  async function sendWpsRequest() {
    try {
      setState(EmbedWpsHtmlState.AwaitingResponse);
      const request = await fetch(url);
      if (!request.ok) throw new Error(`HTTP Error. Status: ${request.status}`);
      const xmlString = await request.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlString, "text/xml");
      const json = xml2json(xml);
      const html = json.ProcessOutputs?.Output?.Data?.LiteralData;
      // xml2json returns String not string
      if (!(html instanceof String)) {
        throw new Error("Data error: xml not in expected format");
      }
      setState(EmbedWpsHtmlState.ResponseOk);
      runInAction(() => {
        viewState.contentPopoutHtml = String(html);
        viewState.contentPopoutOpen = true;
      });
    } catch (e: any) {
      console.error(`Error requesting WPS data: ${(e ?? "").toString()}`);
      setState(EmbedWpsHtmlState.ResponseError);
    }
  }

  let onClick = undefined;
  let text = "";
  if (state === EmbedWpsHtmlState.Default) {
    onClick = sendWpsRequest;
    text = "Fetch additional data";
  } else if (state === EmbedWpsHtmlState.AwaitingResponse) {
    text = "Fetching data...";
  } else if (state === EmbedWpsHtmlState.ResponseError) {
    text = "Data fetching failed";
  } else if (state === EmbedWpsHtmlState.ResponseOk) {
    onClick = action(() => {
      viewState.contentPopoutOpen = true;
    });
    text = "Open additional data";
  }

  return (
    <Button enabled={!!onClick} onClick={onClick}>
      <Text bold>{text}</Text>
    </Button>
  );
}

/**
 * A `<wfsrequestlink>` custom component, which displays a button to fetch additional data.
 */
export default class EmbedWebProcessingServiceHtml extends CustomComponent {
  static componentName = "embed-wps-html";

  get name(): string {
    return EmbedWebProcessingServiceHtml.componentName;
  }

  get attributes(): string[] {
    return [];
  }

  processNode(
    context: ProcessNodeContext,
    node: DomElement,
    children: ReactElement[]
  ) {
    if (
      children.length !== 1 ||
      typeof children[0] !== "string" ||
      children[0] === ""
    ) {
      return (
        <Text bold color="red">
          &lt;embed-wps-html&gt; must have a URL
        </Text>
      );
    }

    return <EmbedWpsHtml url={children[0]} />;
  }
}
