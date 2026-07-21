import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import FeatureInfoDownload from "../../../lib/ReactViews/FeatureInfo/FeatureInfoDownload";
import { renderWithContexts } from "../withContext";

// The feature-info "Download" links build a CSV from the (attacker-influenceable)
// feature properties. Cell values a spreadsheet would treat as a formula must be
// neutralised in the downloaded CSV (CWE-1236).
describe("FeatureInfoDownload", function () {
  it("neutralises CSV/formula injection in the downloadable CSV", function () {
    const viewState = new ViewState({ terria: new Terria({ baseUrl: "./" }) });
    const data = {
      "=formulaKey": "=cmd|'/c calc.exe'!A1",
      total: "@SUM(A1:A5)",
      delta: -5
    };

    const { container } = renderWithContexts(
      <FeatureInfoDownload data={data} name="feature" />,
      viewState
    );

    const csvLink = container.querySelector<HTMLAnchorElement>(
      'a[download="feature.csv"]'
    );
    expect(csvLink).not.toBeNull();

    const href = csvLink!.getAttribute("href") ?? "";
    const csv = decodeURIComponent(href.replace("data:attachment/csv,", ""));

    // Both keys and values that look like formulas are prefixed with a quote.
    expect(csv).toContain("'=formulaKey");
    expect(csv).toContain("'=cmd|'/c calc.exe'!A1");
    expect(csv).toContain("'@SUM(A1:A5)");
    // No cell is left as a bare formula.
    expect(csv).not.toMatch(/(^|,)=/m);
    // Numbers are preserved (not turned into text).
    expect(csv).toContain("-5");
  });
});
