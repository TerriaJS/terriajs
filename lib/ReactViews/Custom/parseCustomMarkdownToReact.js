import CustomComponents from "./CustomComponents";
import markdownToHtml from "../../Core/markdownToHtml";
import parseCustomHtmlToReact from "./parseCustomHtmlToReact";

/**
 * Converts a string from markdown format (of which html is a subset) into a ReactElement.
 * @param  {String} raw String in markdown or html.
 * @param  {Object} [context] Provide any further information that custom components need to know here, eg. which feature and catalogItem they come from.
 * @return {ReactElement}
 */
function parseCustomMarkdownToReact(raw, context) {
  const html = markdownToHtml(raw, false, {
    ADD_TAGS: CustomComponents.names(),
    ADD_ATTR: CustomComponents.attributes()
  });
  return parseCustomHtmlToReact("<div>" + html + "</div>", context);
}

module.exports = parseCustomMarkdownToReact;
