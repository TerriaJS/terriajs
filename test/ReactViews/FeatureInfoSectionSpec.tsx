import i18next from "i18next";
import { observable, makeObservable } from "mobx";
import React from "react";
import { ReactTestRenderer } from "react-test-renderer";
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
import mixTraits from "../../lib/Traits/mixTraits";
import DiscretelyTimeVaryingTraits from "../../lib/Traits/TraitsClasses/DiscretelyTimeVaryingTraits";
import FeatureInfoUrlTemplateTraits from "../../lib/Traits/TraitsClasses/FeatureInfoTraits";
import MappableTraits from "../../lib/Traits/TraitsClasses/MappableTraits";
import * as FeatureInfoPanel from "../../lib/ViewModels/FeatureInfoPanel";
import { createWithContexts } from "./withContext";

let separator = ",";
if (typeof Intl === "object" && typeof Intl.NumberFormat === "function") {
  const thousand = Intl.NumberFormat().format(1000);
  if (thousand.length === 5) {
    separator = thousand[1];
  }
}

function findWithText(test: ReactTestRenderer, text: string) {
  return test.root.findAll((node) =>
    node.children.some((child) => child === text)
  );
}

// Takes the absolute value of the value and pads it to 2 digits i.e. 7->07, 17->17, -3->3, -13->13. It is expected that value is an integer is in the range [0, 99].
function absPad2(value: number) {
  return (Math.abs(value) < 10 ? "0" : "") + Math.abs(value);
}

describe("FeatureInfoSection", function () {
  let terria: Terria;
  let feature: TerriaFeature;
  let viewState: any;
  let catalogItem: TestModel;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    catalogItem = new TestModel("test", terria);

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
    const section = (
      <FeatureInfoSection
        catalogItem={catalogItem}
        feature={feature}
        isOpen={true}
        viewState={viewState}
        t={() => {}}
      />
    );
    const result = createWithContexts(viewState, section);
    result.root.findAllByType("p");
    expect(result.root.findAllByType("p").length).toEqual(1);
    expect(findWithText(result, "hi!").length).toEqual(1);
  });

  it("does not render unsafe html", function () {
    feature.description = new ConstantProperty(
      '<script>alert("gotcha")</script><p>hi!</p>'
    );
    const section = (
      <FeatureInfoSection
        catalogItem={catalogItem}
        feature={feature}
        isOpen={true}
        viewState={viewState}
        t={() => {}}
      />
    );
    const result = createWithContexts(viewState, section);
    expect(result.root.findAllByType("script").length).toEqual(0);
    expect(findWithText(result, 'alert("gotcha")').length).toEqual(0);
    expect(result.root.findAllByType("p").length).toEqual(1);
    expect(findWithText(result, "hi!").length).toEqual(1);
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

    const section = (
      <FeatureInfoSection
        feature={feature}
        isOpen={true}
        catalogItem={catalogItem}
        viewState={viewState}
        t={() => {}}
      />
    );
    const result = createWithContexts(viewState, section);

    expect(
      result.root.findAll((node) =>
        node.children.some((child) => child === "hi")
      ).length
    ).toEqual(0, "hi");
    expect(
      result.root.findAll(
        (node) => node.children.some((child) => child === "bye"),
        {
          deep: true
        }
      ).length
    ).toEqual(1, "bye");

    catalogItem.setTrait(CommonStrata.user, "currentTime", "2010-06-30");

    const section2 = (
      <FeatureInfoSection
        feature={feature}
        isOpen={true}
        catalogItem={catalogItem}
        viewState={viewState}
        t={() => {}}
      />
    );
    const result2 = createWithContexts(viewState, section2);
    expect(findWithText(result2, "hi").length).toEqual(1, "hi2");
    expect(findWithText(result2, "bye").length).toEqual(0, "bye2");
  });

  it("handles features with no properties", function () {
    feature = new Entity({
      name: "Foot",
      description: "bart"
    });
    const section = (
      <FeatureInfoSection
        catalogItem={catalogItem}
        feature={feature}
        isOpen={true}
        viewState={viewState}
        t={() => {}}
      />
    );
    const result = createWithContexts(viewState, section);

    expect(
      findWithText(result, getName(catalogItem) + " - " + "Foot").length
    ).toEqual(1);
    expect(findWithText(result, "bart").length).toEqual(1);
  });

  it("handles html format feature info", function () {
    feature = new Entity({
      name: "Foo",
      description:
        "<html><head><title>GetFeatureInfo</title></head><body><table><tr><th>thing</th></tr><tr><td>BAR</td></tr></table><br/></body></html>"
    });
    const section = (
      <FeatureInfoSection
        catalogItem={catalogItem}
        feature={feature}
        isOpen={true}
        viewState={viewState}
        t={() => {}}
      />
    );
    const result = createWithContexts(viewState, section);
    expect(
      findWithText(result, getName(catalogItem) + " - " + "Foo").length
    ).toEqual(1);
    expect(findWithText(result, "BAR").length).toEqual(1);
  });

  it("handles html format feature info where markdown would break the html", function () {
    feature = new Entity({
      name: "Foo",
      description:
        "<html><head><title>GetFeatureInfo</title></head><body><table>\n\n    <tr>\n\n<th>thing</th></tr><tr><td>BAR</td></tr></table><br/></body></html>"
    });
    // Markdown applied to this description would pull out the lonely <tr> and make it <pre><code><tr>\n</code></pre> , so check this doesn't happen.
    const section = (
      <FeatureInfoSection
        catalogItem={catalogItem}
        feature={feature}
        isOpen={true}
        viewState={viewState}
        t={() => {}}
      />
    );
    const result = createWithContexts(viewState, section);
    expect(findWithText(result, "<tr>\n").length).toEqual(0);
    expect(findWithText(result, "&lt;\n").length).toEqual(0); // Also cover the possibility that it might be encoded.
  });

  it("maintains and applies inline style attributes", function () {
    feature = new Entity({
      name: "Foo",
      description: '<div style="background:rgb(170, 187, 204)">countdown</div>'
    });
    const section = (
      <FeatureInfoSection
        catalogItem={catalogItem}
        feature={feature}
        isOpen={true}
        viewState={viewState}
        t={() => {}}
      />
    );
    const result = createWithContexts(viewState, section);
    const divs = findWithText(result, "countdown");
    expect(findWithText(result, "countdown").length).toEqual(1);
    // Note #ABC is converted by IE11 to rgb(170, 187, 204), so just test that directly. Also IE11 adds space to the front, so strip all spaces out.
    expect(divs[0].props.style.background.replace(/ /g, "")).toEqual(
      "rgb(170,187,204)"
    );
  });

  it("does not break when html format feature info has style tag", function () {
    // Note this does not test that it actually uses the style tag for styling.
    feature = new Entity({
      name: "Foo",
      description:
        '<html><head><title>GetFeatureInfo</title></head><style>table.info tr {background:#fff;}</style><body><table class="info"><tr><th>thing</th></tr><tr><td>BAR</td></tr></table><br/></body></html>'
    });
    const section = (
      <FeatureInfoSection
        catalogItem={catalogItem}
        feature={feature}
        isOpen={true}
        viewState={viewState}
        t={() => {}}
      />
    );
    const result = createWithContexts(viewState, section);
    expect(
      findWithText(result, getName(catalogItem) + " - " + "Foo").length
    ).toEqual(1);
    expect(findWithText(result, "BAR").length).toEqual(1);
  });

  it("does not break when there are neither properties nor description", function () {
    feature = new Entity({
      name: "Vapid"
    });

    const section = (
      <FeatureInfoSection
        catalogItem={catalogItem}
        feature={feature}
        isOpen={true}
        viewState={viewState}
        t={() => {}}
      />
    );
    const result = createWithContexts(viewState, section);

    expect(
      findWithText(result, getName(catalogItem) + " - " + "Vapid").length
    ).toEqual(1);

    // Dodgy test to see if no info message is shown
    expect(
      result.root.findAll((node) => (node as any)._fiber.key === "no-info")
        .length
    ).toEqual(1);
  });

  it("does not break when a template name needs to be rendered but no properties are set", function () {
    catalogItem.featureInfoTemplate.setTrait(
      CommonStrata.user,
      "name",
      "Title {{name}}"
    );

    feature = new Entity();
    const section = (
      <FeatureInfoSection
        catalogItem={catalogItem}
        feature={feature}
        isOpen={true}
        viewState={viewState}
        t={() => {}}
      />
    );
    const result = createWithContexts(viewState, section);
    expect(findWithText(result, "Title ").length).toEqual(1);
  });

  it("shows properties if no description", function () {
    // Tests both static and potentially time-varying properties.
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
    const section = (
      <FeatureInfoSection
        catalogItem={catalogItem}
        feature={feature}
        isOpen={true}
        viewState={viewState}
        t={() => {}}
      />
    );
    const result = createWithContexts(viewState, section);
    expect(
      findWithText(result, getName(catalogItem) + " - " + "Meals").length
    ).toEqual(1);
    expect(findWithText(result, "lunch").length).toEqual(1);
    expect(findWithText(result, "eggs").length).toEqual(1);
    expect(findWithText(result, "dinner").length).toEqual(1);
    expect(findWithText(result, "ham").length).toEqual(1);
  });

  describe("templating", function () {
    it("uses and completes a string-form featureInfoTemplate if present", function () {
      const template = "This is a {{material}} {{foo}}.";
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      const section = (
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);
      expect(findWithText(result, "This is a steel bar.").length).toEqual(1);
    });

    it("can use _ to refer to . and # in property keys in the featureInfoTemplate", function () {
      const template = "Made from {{material_process__1}} {{material}}.";

      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      const section = (
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);
      expect(findWithText(result, "Made from smelted steel.").length).toEqual(
        1
      );
    });

    it("formats large numbers without commas", function () {
      const template = "Size: {{size}}";

      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      const section = (
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);
      expect(findWithText(result, "Size: 12345678.9012").length).toEqual(1);
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
      const section = (
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);

      expect(
        findWithText(
          result,
          "Size: 12" + separator + "345" + separator + "678.9012"
        ).length
      ).toEqual(1);
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

      const section = (
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);
      expect(
        findWithText(
          result,
          "Size: 12" + separator + "345" + separator + "678.9012"
        ).length
      ).toEqual(1);
    });

    it("can format numbers using terria.formatNumber", function () {
      let template =
        'Base: {{#terria.formatNumber}}{"useGrouping":false}{{size}}{{/terria.formatNumber}}';
      template +=
        '  Sep: {{#terria.formatNumber}}{"useGrouping":true, "maximumFractionDigits":3}{{size}}{{/terria.formatNumber}}';
      template +=
        '  DP: {{#terria.formatNumber}}{"maximumFractionDigits":3}{{efficiency}}{{/terria.formatNumber}}';

      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      const section = (
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);

      expect(
        findWithText(
          result,
          "Base: 12345678.9012  Sep: 12" +
            separator +
            "345" +
            separator +
            "678.901  DP: 0.235"
        ).length
      ).toEqual(1);
    });

    it("can format numbers using terria.formatNumber without quotes", function () {
      let template =
        "Sep: {{#terria.formatNumber}}{useGrouping:true, maximumFractionDigits:3}{{size}}{{/terria.formatNumber}}";
      template +=
        "  DP: {{#terria.formatNumber}}{maximumFractionDigits:3}{{efficiency}}{{/terria.formatNumber}}";

      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      const section = (
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);
      expect(
        findWithText(
          result,
          "Sep: 12" + separator + "345" + separator + "678.901  DP: 0.235"
        ).length
      ).toEqual(1);
    });

    it("can handle white text in terria.formatNumber", function () {
      const template =
        'Sep: {{#terria.formatNumber}}{"useGrouping":true, "maximumFractionDigits":3} \n {{size}}{{/terria.formatNumber}}';

      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      const section = (
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);
      expect(
        findWithText(
          result,
          "Sep: 12" + separator + "345" + separator + "678.901"
        ).length
      ).toEqual(1);
    });

    it("handles non-numbers terria.formatNumber", function () {
      const template =
        "Test: {{#terria.formatNumber}}text{{/terria.formatNumber}}";

      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      const section = (
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);
      expect(findWithText(result, "Test: text").length).toEqual(1);
    });

    it("can use a dateFormatString when it is specified in terria.formatDateTime", function () {
      const template =
        'Test: {{#terria.formatDateTime}}{"format": "dd-mm-yyyy HH:MM:ss"}2017-11-23T08:47:53Z{{/terria.formatDateTime}}';

      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      const section = (
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);
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
        absPad2(date.getSeconds()); // E.g. "23-11-2017 19:47:53"
      expect(findWithText(result, "Test: " + formattedDate).length).toEqual(1);
    });

    it("defaults dateFormatString to isoDateTime when it is not specified in terria.formatDateTime", function () {
      const template =
        "Test: {{#terria.formatDateTime}}2017-11-23T08:47:53Z{{/terria.formatDateTime}}";

      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      const section = (
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);
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
        timeZone; // E.g. "2017-11-23T19:47:53+1100"
      expect(findWithText(result, "Test: " + formattedDate).length).toEqual(1);
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
      const section = (
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);
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
        absPad2(date.getSeconds()); // E.g. "23-11-2017 19:47:53"
      expect(findWithText(result, "Date: " + formattedDate).length).toEqual(1);
    });

    it("handles non-numbers in terria.formatDateTime", function () {
      const template =
        "Test: {{#terria.formatDateTime}}text{{/terria.formatDateTime}}";

      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      const section = (
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);
      expect(findWithText(result, "Test: text").length).toEqual(1);
    });

    it("url encodes text components", function () {
      const template =
        "Test: {{#terria.urlEncodeComponent}}W/HO:E#1{{/terria.urlEncodeComponent}}";

      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      const section = (
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);
      expect(findWithText(result, "Test: W%2FHO%3AE%231").length).toEqual(1);
    });

    it("url encodes sections of text", function () {
      const template =
        "Test: {{#terria.urlEncode}}http://example.com/a b{{/terria.urlEncode}}";

      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );
      const section = (
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);

      expect(
        result.root.findAllByProps({ href: "http://example.com/a%20b" }).length
      ).toEqual(1);
    });

    it("does not escape ampersand as &amp;", function () {
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        "Ampersand: {{ampersand}}"
      );
      const section = (
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);
      expect(findWithText(result, "Ampersand: A & B").length).toEqual(1);
      expect(findWithText(result, "&amp;").length).toEqual(0);
    });

    it("does not escape < as &lt;", function () {
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        "Less than: {{lessThan}}"
      );
      const section = (
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);
      expect(findWithText(result, "Less than: A < B").length).toEqual(1);
      expect(findWithText(result, "&lt;").length).toEqual(0);
    });

    it("can embed safe html in template", function () {
      const template = "<div>Hello {{owner_html}}.</div>";
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );

      const section = (
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);
      expect(findWithText(result, "Hello Jay").length).toEqual(1);
      expect(result.root.findAllByType("br").length).toEqual(1);
      expect(findWithText(result, "Smith.").length).toEqual(1);
    });

    it("cannot embed unsafe html in template", function () {
      const template = "<div>Hello {{unsafe}}</div>";
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );

      const section = (
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);
      expect(findWithText(result, "Hello ok!").length).toEqual(1);
      expect(result.root.findAllByType("script").length).toEqual(0);
      expect(findWithText(result, 'alert("gotcha")').length).toEqual(0);
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
      const section = (
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);

      expect(result.root.findAllByProps({ className: "jk" }).length).toEqual(0); // just to be sure the null case gives 0.
      expect(result.root.findAllByProps({ className: "jj" }).length).toEqual(1);
      expect(result.root.findAllByType("b").length).toEqual(1);
      expect(findWithText(result, "test ").length).toEqual(1);
      expect(findWithText(result, "bar").length).toEqual(1);
    });

    it("sets the name from featureInfoTemplate", function () {
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "name",
        "{{name}} {{foo}}"
      );
      const section = (
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen={false}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);

      expect(findWithText(result, "Kay bar").length).toBe(1);
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

      const section = (
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature}
          isOpen={true}
          viewState={viewState}
          position={position}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);
      expect(findWithText(result, "Clicked 44, 77").length).toEqual(1);
    });

    it("can replace text, using terria.partialByName", function () {
      // Replace "Kay" of feature.properties.name with "Yak", or "This name" with "That name".

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

      let section = (
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature} // feature.properties.name === "Kay";
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      let result = createWithContexts(viewState, section);
      expect(findWithText(result, "Yak").length).toEqual(1);
      expect(findWithText(result, "Kay").length).toEqual(0);

      feature.properties = new PropertyBag({ name: "This name" });
      section = (
        <FeatureInfoSection
          feature={feature}
          catalogItem={catalogItem}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      result = createWithContexts(viewState, section);
      expect(findWithText(result, "That name").length).toEqual(1);
      expect(findWithText(result, "Yak").length).toEqual(0);
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

      const section = (
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature} // feature.properties.name === "Kay";
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);
      expect(findWithText(result, "Yak").length).toEqual(0);
      expect(findWithText(result, "Kay").length).toEqual(1);
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

      const section = (
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature} // feature.properties.name === "Kay";
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);
      expect(findWithText(result, "Yak!").length).toEqual(1);
      expect(findWithText(result, "Yak!alert('gotcha')").length).toEqual(0);
      expect(findWithText(result, "alert('gotcha')").length).toEqual(0);
      expect(
        findWithText(result, "Yak!<script>alert('gotcha')</script>").length
      ).toEqual(0);
      expect(findWithText(result, "Kay").length).toEqual(0);
    });

    it("can access the current time", function () {
      const template = "<div class='rrrr'>Time: {{terria.currentTime}}</div>";
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );

      catalogItem._discreteTimes = ["2017-11-23", "2018-01-03"];

      // const timeInterval = new TimeInterval({
      //   start: JulianDate.fromIso8601("2017-11-23T19:47:53+11:00"),
      //   stop: JulianDate.fromIso8601("2018-01-03T07:05:00Z"),
      //   isStartIncluded: true,
      //   isStopIncluded: false
      // });
      // const intervals = new TimeIntervalCollection([timeInterval]);
      // const availableDate = JulianDate.toDate(timeInterval.start);
      // catalogItem.intervals = intervals;
      // catalogItem.availableDates = [availableDate];

      // catalogItem.canUseOwnClock = true;
      // catalogItem.useOwnClock = true;

      // catalogItem.clock.currentTime = JulianDate.fromIso8601(
      //   "2017-12-19T17:13:11+07:00"
      // );

      catalogItem.setTrait(CommonStrata.user, "currentTime", "2017-12-01");

      terria.timelineClock.currentTime = JulianDate.fromIso8601(
        "2001-01-01T01:01:01+01:00"
      ); // An decoy date to make sure that we are indeed using the catalog items clock and not terria.clock.
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          viewState={viewState}
          catalogItem={catalogItem}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);
      expect(
        findWithText(
          result,
          "Time: " + new Date(catalogItem._discreteTimes[0]).toString()
        ).length
      ).toEqual(1);
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
      // const recursedHtml = ''
      //     + '<ul>'
      //     +   '<li>Alice'
      //     +       '<ul>'
      //     +           '<li>' + 'Bailey' + '<ul></ul>' + '</li>'
      //     +           '<li>' + 'Beatrix' + '<ul></ul>' + '</li>'
      //     +       '</ul>'
      //     +   '</li>'
      //     +   '<li>Xavier'
      //     +       '<ul>'
      //     +           '<li>' + 'Yann' + '<ul></ul>' + '</li>'
      //     +           '<li>' + 'Yvette' + '<ul></ul>' + '</li>'
      //     +       '</ul>'
      //     +   '</li>'
      //     + '</ul>';
      const section = (
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);
      expect(result.root.findAllByType("ul").length).toEqual(7);
      expect(result.root.findAllByType("li").length).toEqual(7); // Note extra "li" element for FeatureInfoSection <li>
    });
  });

  describe("raw data", function () {
    beforeEach(function () {
      feature.description = new ConstantProperty("<p>hi!</p>");
    });

    it("does not appear if no template", function () {
      const section = (
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature}
          isOpen={true}
          viewState={viewState}
          t={i18next.t}
        />
      );
      const result = createWithContexts(viewState, section);
      expect(
        findWithText(result, "featureInfo.showCuratedData").length
      ).toEqual(0);
      expect(findWithText(result, "featureInfo.showRawData").length).toEqual(0);
    });

    it('shows "Show Raw Data" if template', function () {
      const template = "Test";
      catalogItem.featureInfoTemplate.setTrait(
        CommonStrata.definition,
        "template",
        template
      );

      const section = (
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature}
          isOpen={true}
          viewState={viewState}
          t={i18next.getFixedT("cimode")}
        />
      );
      const result = createWithContexts(viewState, section);
      expect(
        findWithText(result, "featureInfo.showCuratedData").length
      ).toEqual(0);
      expect(findWithText(result, "featureInfo.showRawData").length).toEqual(1);
    });
  });

  describe("CZML templating", function () {
    beforeEach(function () {});

    it("uses and completes a string-form featureInfoTemplate", async function () {
      // target = '<table><tbody><tr><td>Name:</td><td>Test</td></tr><tr><td>Type:</td><td>ABC</td></tr></tbody></table><br />
      //           <table><tbody><tr><td>Year</td><td>Capacity</td></tr><tr><td>2010</td><td>14.4</td></tr><tr><td>2011</td><td>22.8</td></tr><tr><td>2012</td><td>10.7</td></tr></tbody></table>';
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
      const section = (
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={czmlFeature}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = createWithContexts(viewState, section);
      expect(findWithText(result, "ABC").length).toEqual(1);
      expect(findWithText(result, "2010").length).toEqual(1);
      expect(findWithText(result, "14.4").length).toEqual(1);
      expect(findWithText(result, "2012").length).toEqual(1);
      expect(findWithText(result, "10.7").length).toEqual(1);
    });

    it("uses and completes a time-varying, string-form featureInfoTemplate", async function () {
      // targetBlank = '<table><tbody><tr><td>Name:</td><td>Test</td></tr><tr><td>Type:</td><td></td></tr></tbody></table><br />
      //                <table><tbody><tr><td>Year</td><td>Capacity</td></tr><tr><td>2010</td><td>14.4</td></tr><tr><td>2011</td><td>22.8</td></tr><tr><td>2012</td><td>10.7</td></tr></tbody></table>';
      // targetABC = '<table><tbody><tr><td>Name:</td><td>Test</td></tr><tr><td>Type:</td><td>ABC</td></tr></tbody></table><br />
      //              <table><tbody><tr><td>Year</td><td>Capacity</td></tr><tr><td>2010</td><td>14.4</td></tr><tr><td>2011</td><td>22.8</td></tr><tr><td>2012</td><td>10.7</td></tr></tbody></table>';
      // targetDEF = '<table><tbody><tr><td>Name:</td><td>Test</td></tr><tr><td>Type:</td><td>DEF</td></tr></tbody></table><br />
      //              <table><tbody><tr><td>Year</td><td>Capacity</td></tr><tr><td>2010</td><td>14.4</td></tr><tr><td>2011</td><td>22.8</td></tr><tr><td>2012</td><td>10.7</td></tr></tbody></table>';
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
      let section = (
        <FeatureInfoSection
          feature={czmlFeature}
          isOpen={true}
          catalogItem={czmlItem}
          viewState={viewState}
          t={() => {}}
        />
      );
      let result = createWithContexts(viewState, section);
      expect(findWithText(result, "ABC").length).toEqual(0);
      expect(findWithText(result, "DEF").length).toEqual(0);
      czmlItem.setTrait(CommonStrata.user, "currentTime", "2012-02-02");
      section = (
        <FeatureInfoSection
          feature={czmlFeature}
          isOpen={true}
          catalogItem={czmlItem}
          viewState={viewState}
          t={() => {}}
        />
      );
      result = createWithContexts(viewState, section);
      expect(findWithText(result, "ABC").length).toEqual(1);
      expect(findWithText(result, "DEF").length).toEqual(0);

      czmlItem.setTrait(CommonStrata.user, "currentTime", "2014-02-02");
      section = (
        <FeatureInfoSection
          feature={czmlFeature}
          isOpen={true}
          catalogItem={czmlItem}
          viewState={viewState}
          t={() => {}}
        />
      );
      result = createWithContexts(viewState, section);
      expect(findWithText(result, "ABC").length).toEqual(0);
      expect(findWithText(result, "DEF").length).toEqual(1);
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
      const result = createWithContexts(
        viewState,
        <FeatureInfoSection
          catalogItem={catalogItem}
          feature={feature}
          isOpen={true}
          viewState={viewState}
          t={() => {}}
        />
      );
      expect(findWithText(result, "More info on steel").length).toEqual(1);
    });
  });
});

// Test time varying item
// Mixins: discretely time varying & Mappable mixins
// Traits: traits for the above

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
