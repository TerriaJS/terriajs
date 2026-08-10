import { render, screen, within } from "@testing-library/react";
import { createElement, ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import CustomComponent, {
  DomElement,
  ProcessNodeContext
} from "../../lib/ReactViews/Custom/CustomComponent";
import parseCustomMarkdownToReact, {
  parseCustomMarkdownToReactWithOptions
} from "../../lib/ReactViews/Custom/parseCustomMarkdownToReact";
import registerCustomComponentTypes from "../../lib/ReactViews/Custom/registerCustomComponentTypes";
import { withThemeContext } from "../ReactViews/withContext";

/**
 * A minimal custom component that renders its attributes into the DOM so the
 * result of sanitization can be observed. `urls` is a URL (list) attribute;
 * `label` is free text.
 */
class UrlProbeCustomComponent extends CustomComponent {
  get name(): string {
    return "urlprobe";
  }
  get attributes(): string[] {
    return ["urls", "label"];
  }
  get urlAttributes(): string[] {
    return ["urls"];
  }
  processNode(
    _context: ProcessNodeContext,
    node: DomElement,
    _children: ReactElement[],
    index: number
  ): ReactElement {
    return createElement(
      "span",
      { key: index },
      `label=${node.attribs?.label ?? ""} urls=${node.attribs?.urls ?? ""}`
    );
  }
}

describe("parseCustomMarkdownToReactTs", function () {
  beforeEach(function () {
    registerCustomComponentTypes();
  });
  it("correctly parses tooltip terms", function () {
    const spatialDataTerm = {
      term: "spatial data",
      content: "data that is spatial, spluh"
    };
    const result = parseCustomMarkdownToReactWithOptions(
      "something something spatial data mochi",
      {
        injectTermsAsTooltips: true,
        tooltipTerms: [spatialDataTerm]
      }
    );

    render(withThemeContext(result));

    expect(
      screen.getByRole("button", { name: /spatial data/i })
    ).toBeInTheDocument();
    expect(screen.getByText(spatialDataTerm.content)).toBeInTheDocument();
  });

  it("skips injecting tooltips when no options provided", function () {
    const result = parseCustomMarkdownToReactWithOptions(
      "something something spatial data mochi",
      {}
    );

    render(withThemeContext(result));

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("correctly linkifies URLs with ampersands", function () {
    const url =
      "https://programs.communications.gov.au/geoserver/ows?service=WMS&version=1.3.0&request=GetCapabilities";
    const result = parseCustomMarkdownToReact(url);

    const { container } = render(withThemeContext(result));

    const link = within(container).getByRole("link");
    expect(link).toHaveAttribute("href", url);
    expect(link).toHaveTextContent(url);
  });
});

// Regression tests for F12: parseCustomMarkdownToReact must not preserve
// non-standard URI schemes on browser-navigable attributes. OS/app handler
// schemes (ms-its:, vscode:, slack:, ...) reach the OS when a rendered <a> or
// <img> is activated, so they must be stripped during sanitization.
describe("parseCustomMarkdownToReact URI scheme sanitization", function () {
  beforeEach(function () {
    registerCustomComponentTypes();
  });

  function renderMarkdown(raw: string) {
    const { container } = render(
      withThemeContext(parseCustomMarkdownToReact(raw))
    );
    return container;
  }

  const dangerousHrefSchemes = [
    "ms-its:mhtml:file:///c:/!attacker/payload.cab::/index.html",
    "vscode://attacker.malicious-extension/install",
    "slack://channel?team=attacker",
    "intent://attacker.example/#Intent;scheme=https;end"
  ];

  dangerousHrefSchemes.forEach(function (href) {
    it(`strips the "${href.split(":")[0]}:" scheme from an <a href>`, function () {
      const container = renderMarkdown(`<a href="${href}">click</a>`);
      const anchor = container.querySelector("a");

      expect(anchor).not.toBeNull();
      expect(anchor?.getAttribute("href")).toBeNull();
    });
  });

  it("strips a dangerous scheme from an <img src>", function () {
    const container = renderMarkdown(
      `<img src="vscode://attacker.malicious-extension/install">`
    );
    const img = container.querySelector("img");

    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBeNull();
  });

  it("continues to block the javascript: scheme on an <a href>", function () {
    const container = renderMarkdown(`<a href="javascript:alert(1)">click</a>`);

    expect(container.querySelector("a")?.getAttribute("href")).toBeNull();
  });

  it("preserves a normal https link (does not over-strip)", function () {
    const url = "https://example.com/data?x=1&y=2";
    const container = renderMarkdown(`<a href="${url}">ok</a>`);

    expect(container.querySelector("a")?.getAttribute("href")).toBe(url);
  });

  it("preserves a relative link (does not over-strip)", function () {
    const container = renderMarkdown(`<a href="/relative/path">ok</a>`);

    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "/relative/path"
    );
  });
});

// A custom component's URL attribute may be a comma-separated list, and its
// value can flow to an href. DOMPurify only checks the scheme at the start of a
// value, so the sanitize hook must drop dangerous-scheme URLs from anywhere in
// the list while leaving free-text attributes (which may contain `:`) intact.
describe("parseCustomMarkdownToReact custom component attribute sanitization", function () {
  beforeEach(function () {
    registerCustomComponentTypes();
    CustomComponent.register(new UrlProbeCustomComponent());
  });

  afterEach(function () {
    CustomComponent.unregisterAll();
    registerCustomComponentTypes();
  });

  // Serialise the whole converted tree to a string.
  function convert(markup: string): string {
    return renderToStaticMarkup(parseCustomMarkdownToReact(markup));
  }

  it("drops a dangerous-scheme URL from a comma-separated URL list", function () {
    const html = convert(
      `<urlprobe urls="https://example.com/a.csv,vscode://attacker/x"></urlprobe>`
    );

    expect(html).toContain("urls=https://example.com/a.csv");
    expect(html).not.toContain("vscode:");
  });

  it("removes a URL attribute whose only value is unsafe", function () {
    const html = convert(`<urlprobe urls="vscode://attacker/x"></urlprobe>`);

    expect(html).toContain("urls=");
    expect(html).not.toContain("vscode:");
  });

  it("keeps a free-text attribute containing a colon", function () {
    const html = convert(`<urlprobe label="Time: UTC"></urlprobe>`);

    expect(html).toContain("label=Time: UTC");
  });
});
