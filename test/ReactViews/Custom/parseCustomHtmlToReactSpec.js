import parseCustomHtmlToReact from '../../../lib/ReactViews/Custom/parseCustomHtmlToReact';
var ReactDOMServer = require('react-dom/server');

describe('Parse html to react', () => {
  it('should open link in new tab', function() {
    const html = "<a href=\"https://www.csiro.au/\">csiro</a>";
    const reactComponent = parseCustomHtmlToReact(html);
    const reactHtml = ReactDOMServer.renderToStaticMarkup(reactComponent);
    expect(reactHtml).toBe("<a target=\"_blank\" rel=\"noreferrer noopener\" href=\"https://www.csiro.au/\">csiro</a>");
  });

  it('should correctly parse style attributes on a tag', function() {
    const html = "<a href=\"https://www.csiro.au/\" style=\"color:yellow\" >csiro</a>";
    const reactComponent = parseCustomHtmlToReact(html);
    const reactHtml = ReactDOMServer.renderToStaticMarkup(reactComponent);
    expect(reactHtml).toBe("<a target=\"_blank\" rel=\"noreferrer noopener\" href=\"https://www.csiro.au/\" style=\"color:yellow\">csiro</a>");
  });

  it('should correctly parse empty style attributes on a tag', function() {
    const html = "<a href=\"https://www.csiro.au/\" style=\"\" >csiro</a>";
    const reactComponent = parseCustomHtmlToReact(html);
    const reactHtml = ReactDOMServer.renderToStaticMarkup(reactComponent);
    expect(reactHtml).toBe("<a target=\"_blank\" rel=\"noreferrer noopener\" href=\"https://www.csiro.au/\">csiro</a>");
  });
});
