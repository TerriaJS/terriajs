import CustomComponent from "./CustomComponent";
import markdownToHtml from "../../Core/markdownToHtml";
import parseCustomHtmlToReact from "./parseCustomHtmlToReact";

/**
 * Converts a string from markdown format (of which html is a subset) into a ReactElement.
 * @param  {String} raw String in markdown or html.
 * @param  {Object} [context] Provide any further information that custom components need to know here, eg. which feature and catalogItem they come from.
 * @return {ReactElement}
 */
function parseCustomMarkdownToReact(raw, context) {
  return parseCustomMarkdownToReactWithOptions(raw, {}, context);
}

// TODO: re-write parseCustomMarkdownToReactWithOptions defaults in a separate PR
export function parseCustomMarkdownToReactWithOptions(raw, options, context) {
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
  return parseCustomHtmlToReact("<span>" + html + "</span>", context);
}

export default parseCustomMarkdownToReact;
