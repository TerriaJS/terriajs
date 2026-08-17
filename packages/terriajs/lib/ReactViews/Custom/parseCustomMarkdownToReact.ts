import DOMPurify, { type UponSanitizeAttributeHookEvent } from "dompurify";
import sanitizeUrl from "../../Core/sanitizeUrl";
import CustomComponent from "./CustomComponent";
import markdownToHtml, { MarkdownOptions } from "../../Core/markdownToHtml";
import parseCustomHtmlToReact, {
  ParseCustomHtmlToReactContext
} from "./parseCustomHtmlToReact";

/**
 * A DOMPurify `uponSanitizeAttribute` hook that handles the non-standard
 * attributes registered by custom components (via ADD_ATTR):
 *
 * - Free-text attributes (eg. a chart's `column-titles="name:title"`) may
 *   legitimately contain `:`. DOMPurify would otherwise discard them as
 *   unknown-protocol URIs, so we force-keep them. This is scoped to the
 *   attribute's own custom-component tag, so it does not relax scheme checking
 *   on browser-navigable `<a href>`/`<img src>` (which is why we don't use the
 *   blunt `ALLOW_UNKNOWN_PROTOCOLS` flag).
 *
 * - URL attributes (eg. a chart's `sources`/`downloads`, which may be a
 *   comma-separated list) are scheme-validated per URL. DOMPurify only checks
 *   the scheme at the start of a value, so a list like
 *   `"https://ok,vscode://evil"` would otherwise slip a dangerous URL through to
 *   the chart's download link. We drop the unsafe entries here, at the trust
 *   boundary, before the value reaches the component.
 *
 * The hook is added and removed around our own sanitize call rather than
 * registered globally, so it never affects other DOMPurify consumers.
 */
function sanitizeCustomComponentAttributes(
  currentNode: Element,
  hookEvent: UponSanitizeAttributeHookEvent
) {
  const tagName = currentNode.tagName.toLowerCase();
  if (CustomComponent.isFreeTextAttribute(tagName, hookEvent.attrName)) {
    hookEvent.forceKeepAttr = true;
  } else if (CustomComponent.isUrlAttribute(tagName, hookEvent.attrName)) {
    const safeUrls = hookEvent.attrValue
      .split(",")
      .map((url) => sanitizeUrl(url))
      .filter((url): url is string => url !== undefined);
    if (safeUrls.length === 0) {
      hookEvent.keepAttr = false;
    } else {
      hookEvent.attrValue = safeUrls.join(",");
    }
  }
}

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
  DOMPurify.addHook("uponSanitizeAttribute", sanitizeCustomComponentAttributes);
  let html: string;
  try {
    html = markdownToHtml(
      raw,
      false,
      {
        ADD_TAGS: CustomComponent.names,
        ADD_ATTR: CustomComponent.attributes
      },
      options
    );
  } finally {
    DOMPurify.removeHook(
      "uponSanitizeAttribute",
      sanitizeCustomComponentAttributes
    );
  }
  return parseCustomHtmlToReact(
    "<span>" + html + "</span>",
    context,
    true /** We can set allowUnsafeHtml to true here as we purify HTML in markdownToHtml */
  );
}

export default parseCustomMarkdownToReact;
