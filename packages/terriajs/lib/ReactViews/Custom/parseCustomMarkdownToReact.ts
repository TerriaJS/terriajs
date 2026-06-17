import CustomComponent from "./CustomComponent";
import markdownToHtml, { MarkdownOptions } from "../../Core/markdownToHtml";
import parseCustomHtmlToReact, {
  ParseCustomHtmlToReactContext
} from "./parseCustomHtmlToReact";

/**
 * Converts a string from markdown format (of which html is a subset) into a ReactElement.
 */
function parseCustomMarkdownToReact(
  raw: string,
  context?: ParseCustomHtmlToReactContext
) {
  return parseCustomMarkdownToReactWithOptions(raw, {}, context);
}

// TODO: re-write parseCustomMarkdownToReactWithOptions defaults in a separate PR
export function parseCustomMarkdownToReactWithOptions(
  raw: string,
  options?: MarkdownOptions,
  context?: ParseCustomHtmlToReactContext
) {
  const html = markdownToHtml(
    raw,
    false,
    {
      ADD_TAGS: CustomComponent.names,
      ADD_ATTR: CustomComponent.attributes,
      // This is so that we can have attrs with `:` in their values.
      // Without this setting such attrs are discarded as unknown protocols.
      ALLOW_UNKNOWN_PROTOCOLS: true
    },
    options
  );
  return parseCustomHtmlToReact(
    "<span>" + html + "</span>",
    context,
    true /** We can set allowUnsafeHtml to true here as we purify HTML in markdownToHtml */
  );
}

export default parseCustomMarkdownToReact;
