var GeoRssCatalogItem = require("../../lib/Models/GeoRssCatalogItem");
var Terria = require("../../lib/Models/Terria");

describe("GeoRssCatalogItem", function() {
  var terria;
  var item;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    item = new GeoRssCatalogItem(terria);
  });

  it("has sensible type and typeName", function() {
    expect(item.type).toBe("georss");
    expect(item.typeName).toBe("GeoRSS");
  });

  it("throws if constructed without a Terria instance", function() {
    expect(function() {
      var viewModel = new GeoRssCatalogItem(); // eslint-disable-line no-unused-vars
    }).toThrow();
  });

  it("can be constructed", function() {
    expect(item).toBeDefined();
  });

  describe("georss 2.0", function() {
    it("can load a GeoRSS file by URL", function(done) {
      item.url = "test/GeoRSS/rss2/rss2.xml";
      item
        .load()
        .then(function() {
          expect(item.dataSource.entities.values.length).toBeGreaterThan(0);
        })
        .then(done)
        .otherwise(done.fail);
    });
    it("load point rss", function(done) {
      item.url = "test/GeoRSS/rss2/point.xml";
      item
        .load()
        .then(function() {
          expect(item.dataSource.entities.values.length).toEqual(1);
        })
        .then(done)
        .otherwise(done.fail);
    });
    it("load line rss", function(done) {
      item.url = "test/GeoRSS/rss2/line.xml";
      item
        .load()
        .then(function() {
          expect(item.dataSource.entities.values.length).toEqual(1);
        })
        .then(done)
        .otherwise(done.fail);
    });
    it("load polygon rss", function(done) {
      item.url = "test/GeoRSS/rss2/polygon.xml";
      item
        .load()
        .then(function() {
          expect(item.dataSource.entities.values.length).toEqual(1);
        })
        .then(done)
        .otherwise(done.fail);
    });
    it("load box rss", function(done) {
      item.url = "test/GeoRSS/rss2/box.xml";
      item
        .load()
        .then(function() {
          expect(item.dataSource.entities.values.length).toEqual(1);
        })
        .then(done)
        .otherwise(done.fail);
    });
    it("load GML point rss", function(done) {
      item.url = "test/GeoRSS/rss2/gmlPoint.xml";
      item
        .load()
        .then(function() {
          expect(item.dataSource.entities.values.length).toEqual(1);
        })
        .then(done)
        .otherwise(done.fail);
    });
    it("load GML lineString rss", function(done) {
      item.url = "test/GeoRSS/rss2/gmlLineString.xml";
      item
        .load()
        .then(function() {
          expect(item.dataSource.entities.values.length).toEqual(1);
        })
        .then(done)
        .otherwise(done.fail);
    });
    it("load GML polygon rss", function(done) {
      item.url = "test/GeoRSS/rss2/gmlPolygon.xml";
      item
        .load()
        .then(function() {
          expect(item.dataSource.entities.values.length).toEqual(1);
        })
        .then(done)
        .otherwise(done.fail);
    });
    it("load W3C point rss", function(done) {
      item.url = "test/GeoRSS/rss2/w3cPoint.xml";
      item
        .load()
        .then(function() {
          expect(item.dataSource.entities.values.length).toEqual(1);
        })
        .then(done)
        .otherwise(done.fail);
    });
    it("load combined geometry rss", function(done) {
      item.url = "test/GeoRSS/rss2/combineGeometry.xml";
      item
        .load()
        .then(function() {
          expect(item.dataSource.entities.values.length).toEqual(8);
        })
        .then(done)
        .otherwise(done.fail);
    });
  });
  describe("atom feed", function() {
    it("can load a GeoRSS Atom file by URL", function(done) {
      item.url = "test/GeoRSS/atom/atom.xml";
      item
        .load()
        .then(function() {
          expect(item.dataSource.entities.values.length).toBeGreaterThan(0);
        })
        .then(done)
        .otherwise(done.fail);
    });
    it("load point feed", function(done) {
      item.url = "test/GeoRSS/atom/point.xml";
      item
        .load()
        .then(function() {
          expect(item.dataSource.entities.values.length).toEqual(1);
        })
        .then(done)
        .otherwise(done.fail);
    });
    it("load line feed", function(done) {
      item.url = "test/GeoRSS/atom/line.xml";
      item
        .load()
        .then(function() {
          expect(item.dataSource.entities.values.length).toEqual(1);
        })
        .then(done)
        .otherwise(done.fail);
    });
    it("load polygon feed", function(done) {
      item.url = "test/GeoRSS/atom/polygon.xml";
      item
        .load()
        .then(function() {
          expect(item.dataSource.entities.values.length).toEqual(1);
        })
        .then(done)
        .otherwise(done.fail);
    });
    it("load box feed", function(done) {
      item.url = "test/GeoRSS/atom/box.xml";
      item
        .load()
        .then(function() {
          expect(item.dataSource.entities.values.length).toEqual(1);
        })
        .then(done)
        .otherwise(done.fail);
    });
    it("load GML point feed", function(done) {
      item.url = "test/GeoRSS/atom/gmlPoint.xml";
      item
        .load()
        .then(function() {
          expect(item.dataSource.entities.values.length).toEqual(1);
        })
        .then(done)
        .otherwise(done.fail);
    });
    it("load GML lineString feed", function(done) {
      item.url = "test/GeoRSS/atom/gmlLineString.xml";
      item
        .load()
        .then(function() {
          expect(item.dataSource.entities.values.length).toEqual(1);
        })
        .then(done)
        .otherwise(done.fail);
    });
    it("load GML polygon feed", function(done) {
      item.url = "test/GeoRSS/atom/gmlPolygon.xml";
      item
        .load()
        .then(function() {
          expect(item.dataSource.entities.values.length).toEqual(1);
        })
        .then(done)
        .otherwise(done.fail);
    });
    it("load W3C point feed", function(done) {
      item.url = "test/GeoRSS/atom/w3cPoint.xml";
      item
        .load()
        .then(function() {
          expect(item.dataSource.entities.values.length).toEqual(1);
        })
        .then(done)
        .otherwise(done.fail);
    });
    it("load combined geometry feed", function(done) {
      item.url = "test/GeoRSS/atom/combineGeometry.xml";
      item
        .load()
        .then(function() {
          expect(item.dataSource.entities.values.length).toEqual(8);
        })
        .then(done)
        .otherwise(done.fail);
    });
  });

  it("name is defined from title element", function(done) {
    item.url = "test/GeoRSS/geoRssName.xml";
    item
      .load()
      .then(function() {
        expect(item.name).toEqual("GeoRSS feed sample");
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("name is defined", function(done) {
    item.url = "test/GeoRSS/geoRssWithoutName.xml";
    item
      .load()
      .then(function() {
        expect(item.name).toEqual("geoRssWithoutName.xml");
      })
      .then(done)
      .otherwise(done.fail);
  });
});
