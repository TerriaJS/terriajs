import i18next from "i18next";
import { observable, makeObservable } from "mobx";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import TimeInterval from "terriajs-cesium/Source/Core/TimeInterval";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import PropertyBag from "terriajs-cesium/Source/DataSources/PropertyBag";
import TimeIntervalCollectionProperty from "terriajs-cesium/Source/DataSources/TimeIntervalCollectionProperty";
import loadJson from "../../lib/Core/loadJson";
import CatalogMemberMixin, {
  getName
} from "../../lib/ModelMixins/CatalogMemberMixin";
import DiscretelyTimeVaryingMixin from "../../lib/ModelMixins/DiscretelyTimeVaryingMixin";
import MappableMixin, { MapItem } from "../../lib/ModelMixins/MappableMixin";
import CzmlCatalogItem from "../../lib/Models/Catalog/CatalogItems/CzmlCatalogItem";
import CatalogMemberFactory from "../../lib/Models/Catalog/CatalogMemberFactory";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import CreateModel from "../../lib/Models/Definition/CreateModel";
import { ModelConstructorParameters } from "../../lib/Models/Definition/Model";
import upsertModelFromJson from "../../lib/Models/Definition/upsertModelFromJson";
import TerriaFeature from "../../lib/Models/Feature/Feature";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
import { FeatureInfoSection } from "../../lib/ReactViews/FeatureInfo/FeatureInfoSection";
import DiscretelyTimeVaryingTraits from "../../lib/Traits/TraitsClasses/DiscretelyTimeVaryingTraits";
import FeatureInfoUrlTemplateTraits from "../../lib/Traits/TraitsClasses/FeatureInfoTraits";
import MappableTraits from "../../lib/Traits/TraitsClasses/MappableTraits";
import mixTraits from "../../lib/Traits/mixTraits";
import * as FeatureInfoPanel from "../../lib/ViewModels/FeatureInfoPanel";
import { renderWithContexts } from "./withContext";
import CsvCatalogItem from "../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import updateModelFromJson from "../../lib/Models/Definition/updateModelFromJson";
import { cleanup, screen, within } from "@testing-library/react";
import { act } from "react";

let separator = ",";
if (typeof Intl === "object" && typeof Intl.NumberFormat === "function") {
  const thousand = Intl.NumberFormat().format(1000);
  if (thousand.length === 5) {
    separator = thousand[1];
  }
}

// Takes the absolute value of the value and pads it to 2 digits i.e. 7->07, 17->17, -3->3, -13->13. It is expected that value is an integer is in the range [0, 99].
function absPad2(value: number) {
  return (Math.abs(value) < 10 ? "0" : "") + Math.abs(value);
}

describe("FeatureInfoSection", function () {
  let terria: Terria;
  let feature: TerriaFeature;
  let viewState: ViewState;
  let catalogItem: TestModel;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    catalogItem = new TestModel("teststrata", terria);

    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined
    });
    const properties = {
      name: "Kay",
      foo: "bar",
      material: "steel",
      "material.process.#1": "smelted",
      size: 12345678.9012,
      efficiency: "0.2345678",
      date: "2017-11-23T08:47:53Z",
      owner_html: "Jay<br>Smith",
      ampersand: "A & B",
      lessThan: "A < B",
      unsafe: 'ok!<script>alert("gotcha")</script>'
    };
    feature = new TerriaFeature({
      name: "Bar",
      properties: properties
    });

    feature._catalogItem = catalogItem;
  });

  it("renders a static description", function () {
    feature.description = new ConstantProperty("<p>hi!</p>");
    renderWithContexts(
      <FeatureInfoSection
        catalogItem={catalogItem}
        feature={feature}
        isOpen
        viewState={viewState}
        t={() => {}}
      />,
      viewState
    );

    expect(screen.getByText("hi!")).toBeVisible();
  });

  it("does not render unsafe html", function () {
    feature.description = new ConstantProperty(
      '<script>alert("gotcha")</script><p>hi!</p>'
    );
    const { container } = renderWithContexts(
      <FeatureInfoSection
        catalogItem={catalogItem}
        feature={feature}
        isOpen
        viewState={viewState}
        t={() => {}}
      />,
      viewState
    );

    expect(container.querySelectorAll("script").length).toEqual(0);
    expect(screen.queryByText(/alert\("gotcha"\)/)).not.toBeInTheDocument();
    expect(screen.getByText("hi!")).toBeVisible();
  });

  function timeVaryingDescription() {
    const desc = new TimeIntervalCollectionProperty();
    desc.intervals.addInterval(
      new TimeInterval({
        start: JulianDate.fromDate(new Date("2010-01-01")),
        stop: JulianDate.fromDate(new Date("2011-01-01")),
        data: "<p>hi</p>"
      })
    );
    desc.intervals.addInterval(
      new TimeInterval({
        start: JulianDate.fromDate(new Date("2011-01-01")),
        stop: JulianDate.fromDate(new Date("2012-01-01")),
        data: "<p>bye</p>"
      })
    );
    return desc;
  }

  it("renders a time-varying description", function () {
    feature.description = timeVaryingDescription();
    catalogItem.setTrait(CommonStrata.user, "currentTime", "2011-06-30");

    const { rerender } = renderWithContexts(
      <FeatureInfoSection
        feature={feature}
        isOpen
        catalogItem={catalogItem}
        viewState={viewState}
        t={() => {}}
      />,
      viewState
    );

    expect(screen.queryByText("hi")).not.toBeInTheDocument();
    expect(screen.getByText("bye")).toBeVisible();

    act(() => {
      catalogItem.setTrait(CommonStrata.user, "currentTime", "2010-06-30");
    });

    rerender(
      <FeatureInfoSection
        feature={feature}
        isOpen
        catalogItem={catalogItem}
        viewState={viewState}
        t={() => {}}
      />
    );

    expect(screen.getByText("hi")).toBeVisible();
    expect(screen.queryByText("bye")).not.toBeInTheDocument();
  });

  it("handles features with no properties", function () {
    feature = new Entity({
      name: "Foot",
      description: "bart"
    });
    renderWithContexts(
      <FeatureInfoSection
        catalogItem={catalogItem}
        feature={feature}
        isOpen
        viewState={viewState}
        t={() => {}}
      />,
      viewState
    );

    expect(screen.getByText("bart")).toBeVisible();
    expect(screen.getByText(`${getName(catalogItem)} - Foot`)).toBeVisible();
  });

  it("handles html format feature info", function () {
    feature = new Entity({
      name: "Foo",
      description:
        "<html><head><title>GetFeatureInfo</title></head><body><table><tr><th>thing</th></tr><tr><td>BAR</td></tr></table><br/></body></html>"
    });
    renderWithContexts(
      <FeatureInfoSection
        catalogItem={catalogItem}
        feature={feature}
        isOpen
        viewState={viewState}
        t={() => {}}
      />,
      viewState
    );

    expect(screen.getByText(`${getName(catalogItem)} - Foo`)).toBeVisible();
    expect(screen.queryByText("GetFeatureInfo")).not.toBeInTheDocument();
    expect(screen.getByText("BAR")).toBeVisible();
  });

  it("handles html format feature info where markdown would break the html", function () {
    feature = new Entity({
      name: "Foo",
      description:
        "<html><head><title>GetFeatureInfo</title></head><body><table>\n\n    <tr>\n\n<th>thing</th></tr><tr><td>BAR</td></tr></table><br/></body></html>"
    });

    // Markdown applied to this description would pull out the lonely <tr> and make it <pre><code><tr>\n</code></pre> , so check this doesn't happen.
    renderWithContexts(
      <FeatureInfoSection
        catalogItem={catalogItem}
        feature={feature}
        isOpen
        viewState={viewState}
        t={() => {}}
      />,
      viewState
    );

    expect(screen.queryByText("<tr>\n")).not.toBeInTheDocument();
    expect(screen.queryByText("&lt;\n")).not.toBeInTheDocument();
  });

  it("maintains and applies inline style attributes", function () {
    feature = new Entity({
      name: "Foo",
      description: '<div style="background:rgb(170, 187, 204)">countdown</div>'
    });
    renderWithContexts(
      <FeatureInfoSection
        catalogItem={catalogItem}
        feature={feature}
        isOpen
        viewState={viewState}
        t={() => {}}
      />,
      viewState
    );

    const styledDiv = screen.getByText("countdown");
    expect(styledDiv.style.background.replace(/ /g, "")).toEqual(
      "rgb(170,187,204)"
    );
  });

  it("does not break when html format feature info has style tag", function () {
    feature = new Entity({
      name: "Foo",
      description:
        '<html><head><title>GetFeatureInfo</title></head><style>table.info tr {background:#fff;}</style><body><table class="info"><tr><th>thing</th></tr><tr><td>BAR</td></tr></table><br/></body></html>'
    });
    renderWithContexts(
      <FeatureInfoSection
        catalogItem={catalogItem}
        feature={feature}
        isOpen
        viewState={viewState}
        t={() => {}}
      />,
      viewState
    );
    expect(screen.getByText(`${getName(catalogItem)} - Foo`)).toBeVisible();
    expect(screen.queryByText("GetFeatureInfo")).not.toBeInTheDocument();
    expect(screen.getByText("BAR")).toBeVisible();
  });

  it("does not break when there are neither properties nor description", function () {
    feature = new Entity({
      name: "Vapid"
    });

    renderWithContexts(
      <FeatureInfoSection
        catalogItem={catalogItem}
        feature={feature}
        isOpen
        viewState={viewState}
        t={(s: string) => s}
      />,
      viewState
    );

    expect(screen.getByText(`${getName(catalogItem)} - Vapid`)).toBeVisible();
    expect(screen.getByText("featureInfo.noInfoAvailable")).toBeVisible();
  });

  it("does not break when a template name needs to be rendered but no properties are set", function () {
    catalogItem.featureInfoTemplate.setTrait(
      CommonStrata.user,
      "name",
      "Title {{name}}"
    );

    feature = new Entity();
    renderWithContexts(
      <FeatureInfoSection
        catalogItem={catalogItem}
        feature={feature}
        isOpen
        viewState={viewState}
        t={() => {}}
      />,
      viewState
    );

    expect(screen.getByText("Title")).toBeVisible();
  });

  it("shows properties if no description", function () {
    feature = new Entity({
      name: "Meals",
      properties: {
        lunch: "eggs",
        dinner: {
          getValue: function () {
            return "ham";
          }
        }
      }
    });
    renderWithContexts(
      <FeatureInfoSection
        catalogItem={catalogItem}
        feature={feature}
        isOpen
        viewState={viewState}
        t={() => {}}
      />,
      viewState
    );

    expect(screen.getByText(`${getName(catalogItem)} - Meals`)).toBeVisible();
    expect(screen.getByText("lunch")).toBeVisible();
    expect(screen.getByText("eggs")).toBeVisible();
    expect(screen.getByText("dinner")).toBeVisible();
    expect(screen.getByText("ham")).toBeVisible();
  });

  it("gracefully handles bad nested JSON", function () {
    feature = new Entity({
      name: "Meals",
      properties: {
        somethingBad: "{broken object",
        somethingGood: JSON.stringify({ good: "this object is good" })
      }
    });
    renderWithContexts(
      <FeatureInfoSection
        catalogItem={catalogItem}
        feature={feature}
        isOpen
        viewState={viewState}
        t={() => {}}
      />,
      viewState
    );
    expect(screen.getByText("{broken object")).toBeVisible();
    expect(screen.getByText(`{"good":"this object is good"}`)).toBeVisible();
  });

  describe("templating", function () {
    it("uses and completes a string-form featureInfoTemplate if present", function () {
      const template = "This is a {{material}} {{foo}}.";
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      renderWithContexts(
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      expect(screen.getByText("This is a steel bar.")).toBeInTheDocument();
    });

    it("uses activeStyle of catalog item having TableTraits in featureInfoTemplate", function () {
      const csvItem = new CsvCatalogItem("testId", terria, undefined);
      csvItem.setTrait(CommonStrata.user, "activeStyle", "User Style");
      const styles = [
        {
          id: "User Style",
          color: {
            colorColumn: "ste_name",
            colorPalette: "HighContrast"
          },
          hidden: false
        },
        {
          id: "Other Style",
          color: {
            colorColumn: "other",
            colorPalette: "HighContrast"
          },
          hidden: false
        }
      ];

      updateModelFromJson(csvItem, CommonStrata.user, { styles });

      const template = "The active style id is {{terria.activeStyle.id}}.";
      csvItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      renderWithContexts(
        <FeatureInfoSection
          catalogItem={csvItem}
          feature={feature}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      expect(
        screen.getByText("The active style id is User Style.")
      ).toBeInTheDocument();
    });

    it("can use _ to refer to . and # in property keys in the featureInfoTemplate", function () {
      const template = "Made from {{material_process__1}} {{material}}.";

      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      renderWithContexts(
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      expect(screen.getByText("Made from smelted steel.")).toBeInTheDocument();
    });

    it("formats large numbers without commas", function () {
      const template = "Size: {{size}}";

      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      renderWithContexts(
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      expect(screen.getByText("Size: 12345678.9012")).toBeInTheDocument();
    });

    it("can format numbers with commas", function () {
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        "Size: {{size}}"
      );
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "formats",
        { size: { type: "number", useGrouping: true } } as any
      );
      renderWithContexts(
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );

      expect(
        screen.getByText(
          "Size: 12" + separator + "345" + separator + "678.9012"
        )
      ).toBeVisible();
    });

    it("formats numbers in the formats section with no type as if type were number", function () {
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        "Size: {{size}}"
      );
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "formats",
        { size: { useGrouping: true } } as any
      );

      renderWithContexts(
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      expect(
        screen.getByText(
          "Size: 12" + separator + "345" + separator + "678.9012"
        )
      ).toBeVisible();
    });

    it("can format numbers using terria.formatNumber", function () {
      let template =
        'Base: {{#terria.formatNumber}}{"useGrouping":false}{{size}}{{/terria.formatNumber}}';
      template +=
        '; Sep: {{#terria.formatNumber}}{"useGrouping":true, "maximumFractionDigits":3}{{size}}{{/terria.formatNumber}}';
      template +=
        '; DP: {{#terria.formatNumber}}{"maximumFractionDigits":3}{{efficiency}}{{/terria.formatNumber}}';

      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      renderWithContexts(
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );

      expect(
        screen.getByText("Base: 12345678.9012; Sep: 12,345,678.901; DP: 0.235")
      ).toBeVisible();
    });

    it("can format numbers using terria.formatNumber without quotes", function () {
      let template =
        "Sep: {{#terria.formatNumber}}{useGrouping:true, maximumFractionDigits:3}{{size}}{{/terria.formatNumber}}";
      template +=
        "; DP: {{#terria.formatNumber}}{maximumFractionDigits:3}{{efficiency}}{{/terria.formatNumber}}";

      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      renderWithContexts(
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );

      expect(screen.getByText("Sep: 12,345,678.901; DP: 0.235")).toBeVisible();
    });

    it("can handle white text in terria.formatNumber", function () {
      const template =
        'Sep: {{#terria.formatNumber}}{"useGrouping":true, "maximumFractionDigits":3} \n {{size}}{{/terria.formatNumber}}';

      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      renderWithContexts(
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      expect(
        screen.getByText("Sep: 12" + separator + "345" + separator + "678.901")
      ).toBeVisible();
    });

    it("handles non-numbers terria.formatNumber", function () {
      const template =
        "Test: {{#terria.formatNumber}}text{{/terria.formatNumber}}";

      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      renderWithContexts(
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      expect(screen.getByText("Test: text")).toBeInTheDocument();
    });

    it("can use a dateFormatString when it is specified in terria.formatDateTime", function () {
      const template =
        'Test: {{#terria.formatDateTime}}{"format": "dd-mm-yyyy HH:MM:ss"}2017-11-23T08:47:53Z{{/terria.formatDateTime}}';

      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      renderWithContexts(
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      const date = new Date(Date.UTC(2017, 11, 23, 8, 47, 53));
      const formattedDate =
        absPad2(date.getDate()) +
        "-" +
        absPad2(date.getMonth()) +
        "-" +
        date.getFullYear() +
        " " +
        absPad2(date.getHours()) +
        ":" +
        absPad2(date.getMinutes()) +
        ":" +
        absPad2(date.getSeconds());

      expect(screen.getByText("Test: " + formattedDate)).toBeInTheDocument();
    });

    it("defaults dateFormatString to isoDateTime when it is not specified in terria.formatDateTime", function () {
      const template =
        "Test: {{#terria.formatDateTime}}2017-11-23T08:47:53Z{{/terria.formatDateTime}}";

      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      renderWithContexts(
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      const date = new Date(Date.UTC(2017, 11, 23, 8, 47, 53));
      const offset = -date.getTimezoneOffset();
      const offsetMinute = offset % 60;
      const offsetHour = (offset - offsetMinute) / 60;
      const timeZone =
        (offset >= 0 ? "+" : "-") +
        absPad2(offsetHour) +
        "" +
        absPad2(offsetMinute);
      const formattedDate =
        date.getFullYear() +
        "-" +
        absPad2(date.getMonth()) +
        "-" +
        absPad2(date.getDate()) +
        "T" +
        absPad2(date.getHours()) +
        ":" +
        absPad2(date.getMinutes()) +
        ":" +
        absPad2(date.getSeconds()) +
        timeZone;

      expect(screen.getByText("Test: " + formattedDate)).toBeInTheDocument();
    });

    it("can format dates using the dateTime as the type within the formats section", function () {
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        "Date: {{date}}"
      );
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "formats",
        { date: { type: "dateTime", format: "dd-mm-yyyy HH:MM:ss" } } as any
      );
      renderWithContexts(
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      const date = new Date(Date.UTC(2017, 11, 23, 8, 47, 53));
      const formattedDate =
        absPad2(date.getDate()) +
        "-" +
        absPad2(date.getMonth()) +
        "-" +
        date.getFullYear() +
        " " +
        absPad2(date.getHours()) +
        ":" +
        absPad2(date.getMinutes()) +
        ":" +
        absPad2(date.getSeconds());

      expect(screen.getByText("Date: " + formattedDate)).toBeInTheDocument();
    });

    it("handles non-numbers in terria.formatDateTime", function () {
      const template =
        "Test: {{#terria.formatDateTime}}text{{/terria.formatDateTime}}";

      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      renderWithContexts(
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      expect(screen.getByText("Test: text")).toBeInTheDocument();
    });

    it("url encodes text components", function () {
      const template =
        "Test: {{#terria.urlEncodeComponent}}W/HO:E#1{{/terria.urlEncodeComponent}}";

      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      renderWithContexts(
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      expect(screen.getByText("Test: W%2FHO%3AE%231")).toBeInTheDocument();
    });

    it("url encodes sections of text", function () {
      const template =
        "Test: {{#terria.urlEncode}}http://example.com/a b{{/terria.urlEncode}}";

      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      const { container } = renderWithContexts(
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );

      expect(within(container).getByRole("link")).toHaveAttribute(
        "href",
        "http://example.com/a%20b"
      );
    });

    it("does not escape ampersand as &amp;", function () {
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        "Ampersand: {{ampersand}}"
      );
      renderWithContexts(
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      expect(screen.getByText("Ampersand: A & B")).toBeInTheDocument();
      expect(screen.queryByText(/&amp;/)).not.toBeInTheDocument();
    });

    it("does not escape < as &lt;", function () {
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        "Less than: {{lessThan}}"
      );
      renderWithContexts(
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      expect(screen.getByText("Less than: A < B")).toBeInTheDocument();
      expect(screen.queryByText(/&lt;/)).not.toBeInTheDocument();
    });

    it("can embed safe html in template", function () {
      const template = "<div>Hello {{owner_html}}.</div>";
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );

      const { container } = renderWithContexts(
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      expect(screen.getByText(/Hello Jay/)).toBeInTheDocument();
      expect(container.querySelectorAll("br").length).toEqual(1);
      expect(screen.getByText(/Smith\./)).toBeInTheDocument();
    });

    it("cannot embed unsafe html in template", function () {
      const template = "<div>Hello {{unsafe}}</div>";
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );

      const { container } = renderWithContexts(
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      expect(screen.getByText(/Hello ok!/)).toBeInTheDocument();
      expect(container.querySelectorAll("script").length).toEqual(0);
      expect(screen.queryByText(/alert\("gotcha"\)/)).not.toBeInTheDocument();
    });

    it("can use a json featureInfoTemplate with partials", function () {
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        '<div class="jj">test {{>boldfoo}}</div>'
      );
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "partials",
        { boldfoo: "<b>{{foo}}</b>" }
      );
      const { container } = renderWithContexts(
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );

      expect(container.querySelectorAll(".jk").length).toEqual(0);
      expect(container.querySelectorAll(".jj").length).toEqual(1);
      expect(container.querySelectorAll("b").length).toEqual(1);
      expect(screen.getByText(/bar/)).toBeInTheDocument();
      expect(container.textContent).toContain("test ");
    });

    it("sets the name from featureInfoTemplate", function () {
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "name",
        "{{name}} {{foo}}"
      );
      renderWithContexts(
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen={false}
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );

      expect(screen.getByText("Kay bar")).toBeInTheDocument();
    });

    it("can access clicked lat and long", function () {
      const template =
        "<div>Clicked {{#terria.formatNumber}}{maximumFractionDigits:0}{{terria.coords.latitude}}{{/terria.formatNumber}}, {{#terria.formatNumber}}{maximumFractionDigits:0}{{terria.coords.longitude}}{{/terria.formatNumber}}</div>";
      const position = Ellipsoid.WGS84.cartographicToCartesian(
        Cartographic.fromDegrees(77, 44, 6)
      );
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );

      renderWithContexts(
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature}
          isOpen
          viewState={viewState}
          position={position}
          t={() => {}}
        />,
        viewState
      );
      expect(screen.getByText("Clicked 44, 77")).toBeInTheDocument();
    });

    it("can replace text, using terria.partialByName", function () {
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        "{{#terria.partialByName}}{{name}}{{/terria.partialByName}}"
      );
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "partials",
        {
          Bar: "Rab",
          Kay: "Yak",
          "This name": "That name"
        }
      );

      renderWithContexts(
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      expect(screen.getByText("Yak")).toBeInTheDocument();
      expect(screen.queryByText("Kay")).not.toBeInTheDocument();

      cleanup();
      feature.properties = new PropertyBag({ name: "This name" });
      renderWithContexts(
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      expect(screen.getByText("That name")).toBeInTheDocument();
      expect(screen.queryByText("Yak")).not.toBeInTheDocument();
    });

    it("does not replace text if no matching, using terria.partialByName", function () {
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        "{{#terria.partialByName}}{{name}}{{/terria.partialByName}}"
      );
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "partials",
        {
          Bar: "Rab",
          NotKay: "Yak",
          "This name": "That name"
        }
      );

      renderWithContexts(
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      expect(screen.queryByText("Yak")).not.toBeInTheDocument();
      expect(screen.getByText("Kay")).toBeInTheDocument();
    });

    it("can replace text and filter out unsafe replacement, using terria.partialByName", function () {
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        "{{#terria.partialByName}}{{name}}{{/terria.partialByName}}"
      );
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "partials",
        {
          Bar: "Rab",
          Kay: "Yak!<script>alert('gotcha')</script>",
          This: "That"
        }
      );

      renderWithContexts(
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      expect(screen.getByText("Yak!")).toBeInTheDocument();
      expect(screen.queryByText(/Yak!alert/)).not.toBeInTheDocument();
      expect(screen.queryByText(/alert\('gotcha'\)/)).not.toBeInTheDocument();
      expect(screen.queryByText("Kay")).not.toBeInTheDocument();
    });

    it("can access the current time", function () {
      const template = "<div class='rrrr'>Time: {{terria.currentTime}}</div>";
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );

      catalogItem._discreteTimes = ["2017-11-23", "2018-01-03"];

      catalogItem.setTrait(CommonStrata.user, "currentTime", "2017-12-01");

      terria.timelineClock.currentTime = JulianDate.fromIso8601(
        "2001-01-01T01:01:01+01:00"
      );
      renderWithContexts(
        <FeatureInfoSection
          feature={feature}
          isOpen
          viewState={viewState}
          catalogItem={catalogItem}
          t={() => {}}
        />,
        viewState
      );
      const expectedTime = new Date(catalogItem._discreteTimes[0]).toString();
      expect(screen.getByText(`Time: ${expectedTime}`)).toBeInTheDocument();
    });

    it("can render a recursive featureInfoTemplate", function () {
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        "<ul>{{>show_children}}</ul>"
      );
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "partials",
        {
          show_children:
            "{{#children}}<li>{{name}}<ul>{{>show_children}}</ul></li>{{/children}}"
        }
      );

      feature.properties?.merge({
        children: [
          {
            name: "Alice",
            children: [
              { name: "Bailey", children: null },
              { name: "Beatrix", children: null }
            ]
          },
          {
            name: "Xavier",
            children: [
              { name: "Yann", children: null },
              { name: "Yvette", children: null }
            ]
          }
        ]
      });
      const { container } = renderWithContexts(
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      expect(within(container).getAllByRole("list").length).toBe(7);
      expect(within(container).getAllByRole("listitem").length).toBe(7);
    });
  });

  describe("raw data", function () {
    beforeEach(function () {
      feature.description = new ConstantProperty("<p>hi!</p>");
    });

    it("does not appear if no template", function () {
      renderWithContexts(
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature}
          isOpen
          viewState={viewState}
          t={i18next.t}
        />,
        viewState
      );
      expect(
        screen.queryByText(/featureInfo\.showCuratedData/)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/featureInfo\.showRawData/)
      ).not.toBeInTheDocument();
    });

    it('shows "Show Raw Data" if template', function () {
      const template = "Test";
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );

      renderWithContexts(
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature}
          isOpen
          viewState={viewState}
          t={i18next.getFixedT("cimode")}
        />,
        viewState
      );
      expect(
        screen.queryByText(/featureInfo\.showCuratedData/)
      ).not.toBeInTheDocument();
      expect(screen.getByText("featureInfo.showRawData")).toBeInTheDocument();
    });
  });

  describe("CZML templating", function () {
    beforeEach(function () {});

    it("uses and completes a string-form featureInfoTemplate", async function () {
      const json = await loadJson("test/init/czml-with-template-0.json");
      const czmlItem = upsertModelFromJson(
        CatalogMemberFactory,
        terria,
        "",
        "definition",
        json,
        {}
      ).throwIfUndefined() as CzmlCatalogItem;

      await czmlItem.loadMapItems();

      const czmlData = czmlItem.mapItems;
      expect(czmlData.length).toBeGreaterThan(0);
      const czmlFeature = czmlData[0].entities.values[0];
      renderWithContexts(
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={czmlFeature}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      expect(screen.getByText(/ABC/)).toBeInTheDocument();
      expect(screen.getByText(/2010/)).toBeInTheDocument();
      expect(screen.getByText(/14\.4/)).toBeInTheDocument();
      expect(screen.getByText(/2012/)).toBeInTheDocument();
      expect(screen.getByText(/10\.7/)).toBeInTheDocument();
    });

    it("uses and completes a time-varying, string-form featureInfoTemplate", async function () {
      const json = await loadJson("test/init/czml-with-template-1.json");
      const czmlItem = upsertModelFromJson(
        CatalogMemberFactory,
        terria,
        "",
        "definition",
        json,
        {}
      ).throwIfUndefined() as CzmlCatalogItem;

      await czmlItem.loadMapItems();

      const czmlData = czmlItem.mapItems;
      expect(czmlData.length).toBeGreaterThan(0);
      const czmlFeature = czmlData[0].entities.values[0];
      czmlItem.setTrait(CommonStrata.user, "currentTime", "2010-02-02");
      renderWithContexts(
        <FeatureInfoSection
          feature={czmlFeature}
          isOpen
          catalogItem={czmlItem}
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      expect(screen.queryByText(/ABC/)).not.toBeInTheDocument();
      expect(screen.queryByText(/DEF/)).not.toBeInTheDocument();

      cleanup();
      czmlItem.setTrait(CommonStrata.user, "currentTime", "2012-02-02");
      renderWithContexts(
        <FeatureInfoSection
          feature={czmlFeature}
          isOpen
          catalogItem={czmlItem}
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      expect(screen.getByText(/ABC/)).toBeInTheDocument();
      expect(screen.queryByText(/DEF/)).not.toBeInTheDocument();

      cleanup();
      czmlItem.setTrait(CommonStrata.user, "currentTime", "2014-02-02");
      renderWithContexts(
        <FeatureInfoSection
          feature={czmlFeature}
          isOpen
          catalogItem={czmlItem}
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      expect(screen.queryByText(/ABC/)).not.toBeInTheDocument();
      expect(screen.getByText(/DEF/)).toBeInTheDocument();
    });
  });

  describe("feature info panel buttons", function () {
    it("renders buttons added using FeatureInfoPanel.addFeatureButton", function () {
      FeatureInfoPanel.addFeatureButton(viewState, ({ feature, item }) => {
        if (!(item instanceof TestModel)) {
          return;
        }

        const materialUsed = feature.properties?.getValue(JulianDate.now())[
          "material"
        ];
        return materialUsed
          ? {
              text: `More info on ${materialUsed}`,
              title: "Show more info on material used",
              onClick() {}
            }
          : undefined;
      });
      renderWithContexts(
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature}
          isOpen
          viewState={viewState}
          t={() => {}}
        />,
        viewState
      );
      expect(screen.getByText("More info on steel")).toBeInTheDocument();
    });
  });
});

class TestModelTraits extends mixTraits(
  FeatureInfoUrlTemplateTraits,
  MappableTraits,
  DiscretelyTimeVaryingTraits
) {}

class TestModel extends MappableMixin(
  DiscretelyTimeVaryingMixin(CatalogMemberMixin(CreateModel(TestModelTraits)))
) {
  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get mapItems(): MapItem[] {
    throw new Error("Method not implemented.");
  }
  protected forceLoadMapItems(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  @observable _discreteTimes: string[] = [];
  get discreteTimes() {
    return this._discreteTimes.map((t) => ({ time: t, tag: undefined }));
  }
}
