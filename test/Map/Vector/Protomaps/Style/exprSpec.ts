import { Feature, GeomType } from "protomaps-leaflet";
import {
  Expr,
  evalExpr as _evalExpr
} from "../../../../../lib/Map/Vector/Protomaps/Style/expr";
import { builtinOps } from "../../../../../lib/Map/Vector/Protomaps/Style/ops";

const evalExpr = (expr: Expr) => _evalExpr(expr, {});

fdescribe("expr", function () {
  const emptyFeature: Feature = {
    props: {},
    bbox: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
    geom: [],
    numVertices: 0,
    geomType: GeomType.Point
  };

  describe("type ops", function () {
    it("format", function () {
      // TODO: handle style override options
      expect(evalExpr(["format", "a", { "font-scale": 3 }, "b", "c"])()).toBe(
        "abc"
      );
    });

    describe("literal", function () {
      it("returns the literal array or object value", function () {
        expect(evalExpr(["literal", [42, "foo"]])()).toEqual([42, "foo"]);
        expect(evalExpr(["literal", { foo: 42 }])()).toEqual({ foo: 42 });
      });
    });

    describe("to-string", function () {
      it("converts any JsonValue to-string", function () {
        expect(evalExpr(["to-string", 42])()).toBe("42");
        expect(evalExpr(["to-string", "foo"])()).toBe("foo");
        expect(evalExpr(["to-string", true])()).toBe("true");
        expect(evalExpr(["to-string", false])()).toBe("false");
        expect(evalExpr(["to-string", { foo: "bar" }])()).toBe('{"foo":"bar"}');
        expect(evalExpr(["to-string", ["literal", ["foo", "bar"]]])()).toBe(
          '["foo","bar"]'
        );
        expect(evalExpr(["to-string", null])()).toBe("");
      });
    });
  });

  describe("feature data ops", function () {
    describe("geometry-type", function () {
      it("returns the feature geometry's type", function () {
        expect(
          evalExpr(["geometry-type"])(0, {
            ...emptyFeature,
            geomType: GeomType.Point
          })
        ).toBe("Point");
        expect(
          evalExpr(["geometry-type"])(0, {
            ...emptyFeature,
            geomType: GeomType.Line
          })
        ).toBe("LineString");
        expect(
          evalExpr(["geometry-type"])(0, {
            ...emptyFeature,
            geomType: GeomType.Polygon
          })
        ).toBe("Polygon");
      });
    });
  });

  describe("lookup ops", function () {
    describe("get", function () {
      it("can lookup a value from the current feature's properties", function () {
        expect(
          evalExpr(["get", "foo"])(0, {
            ...emptyFeature,
            props: { foo: 42 }
          })
        ).toBe(42);
      });

      it("can lookup a value from a given object", function () {
        // TODO: should be able to call without feature param when getting from an obj
        expect(evalExpr(["get", "foo", { foo: 32 }])(0, emptyFeature)).toBe(32);
      });

      it("returns null for missing prop", function () {
        expect(evalExpr(["get", "foo"])(0, emptyFeature)).toBe(null);
      });
    });

    describe("has", function () {
      it("can test the presence of a property value in the current feature's properties", function () {
        expect(
          evalExpr(["has", "foo"])(0, {
            ...emptyFeature,
            props: { foo: 42 }
          })
        ).toBe(true);

        expect(
          evalExpr(["has", "bar"])(0, {
            ...emptyFeature,
            props: { foo: 42 }
          })
        ).toBe(false);
      });

      it("can test the presence of a property value in a given object", function () {
        expect(evalExpr(["has", "foo", { foo: 42 }])(0, emptyFeature)).toBe(
          true
        );
        expect(evalExpr(["has", "bar", { foo: 42 }])(0, emptyFeature)).toBe(
          false
        );
      });
    });

    describe("!has", function () {
      it("can test the presence of a property value in the current feature's properties", function () {
        expect(
          evalExpr(["!has", "foo"])(0, {
            ...emptyFeature,
            props: { foo: 42 }
          })
        ).toBe(false);

        expect(
          evalExpr(["!has", "bar"])(0, {
            ...emptyFeature,
            props: { foo: 42 }
          })
        ).toBe(true);
      });

      it("can test the presence of a property value in a given object", function () {
        expect(evalExpr(["!has", "foo", { foo: 42 }])(0, emptyFeature)).toBe(
          false
        );
        expect(evalExpr(["!has", "bar", { foo: 42 }])(0, emptyFeature)).toBe(
          true
        );
      });
    });

    describe("in", function () {
      it("can test if a string exists in an array", function () {
        expect(evalExpr(["in", "foo", ["literal", ["foo", "bar"]]])()).toBe(
          true
        );
        expect(evalExpr(["in", "eek", ["literal", ["foo", "bar"]]])()).toBe(
          false
        );
      });

      it("can test if a substring exists in an string", function () {
        expect(evalExpr(["in", "foo", "foobar"])()).toBe(true);
        expect(evalExpr(["in", "eek", "foobar"])()).toBe(false);
      });
    });
  });

  describe("decision ops", function () {
    it("can test !", function () {
      expect(evalExpr(["!", true])()).toBe(false);
      expect(evalExpr(["!", false])()).toBe(true);
    });

    it("can test ==", function () {
      expect(evalExpr(["==", 42, 42])()).toBe(true);
      expect(evalExpr(["==", 42, 0])()).toBe(false);
      expect(evalExpr(["==", 42, "42"])()).toBe(false);
      expect(evalExpr(["==", "foo", "foo"])()).toBe(true);
    });

    it("can test !=", function () {
      expect(evalExpr(["!=", 42, 42])()).toBe(false);
      expect(evalExpr(["!=", 42, 0])()).toBe(true);
      expect(evalExpr(["!=", 42, "42"])()).toBe(true);
      expect(evalExpr(["!=", "foo", "foo"])()).toBe(false);
    });

    it("can test <", function () {
      expect(evalExpr(["<", 40, 42])()).toBe(true);
      expect(evalExpr(["<", 42, 42])()).toBe(false);
      expect(evalExpr(["<", 44, 42])()).toBe(false);
    });

    it("can test <=", function () {
      expect(evalExpr(["<=", 40, 42])()).toBe(true);
      expect(evalExpr(["<=", 42, 42])()).toBe(true);
      expect(evalExpr(["<=", 44, 42])()).toBe(false);
    });

    it("can test ==", function () {
      expect(evalExpr(["==", 42, 42])()).toBe(true);
      expect(evalExpr(["==", 40, 42])()).toBe(false);
    });

    it("can test >", function () {
      expect(evalExpr([">", 40, 42])()).toBe(false);
      expect(evalExpr([">", 42, 42])()).toBe(false);
      expect(evalExpr([">", 44, 42])()).toBe(true);
    });

    it("can test >=", function () {
      expect(evalExpr([">=", 40, 42])()).toBe(false);
      expect(evalExpr([">=", 42, 42])()).toBe(true);
      expect(evalExpr([">=", 44, 42])()).toBe(true);
    });

    describe("all", function () {
      it("can test all", function () {
        expect(evalExpr(["all", true, true])()).toBe(true);
        expect(evalExpr(["all", false, true])()).toBe(false);
      });

      it("should short-circuit by lazily evaluating its params", function () {
        const eq = spyOn(builtinOps, "==");
        expect(evalExpr(["all", false, ["==", "foo", "bar"]])()).toBe(false);
        expect(eq).not.toHaveBeenCalled();
      });
    });

    describe("any", function () {
      it("can test any", function () {
        expect(evalExpr(["any", true, true])()).toBe(true);
        expect(evalExpr(["any", false, true])()).toBe(true);
      });

      it("should short-circuit by lazily evaluating its params", function () {
        const eq = spyOn(builtinOps, "==");
        expect(evalExpr(["any", true, ["==", "foo", "bar"]])()).toBe(true);
        expect(eq).not.toHaveBeenCalled();
      });
    });

    describe("case", function () {
      it("returns the matched case", function () {
        expect(evalExpr(["case", false, 43, true, 42, 0])()).toBe(42);
      });

      it("returns fallback value if no match", function () {
        expect(
          evalExpr(["case", false, 43, false, ["==", "foo", "bar"], 0])()
        ).toBe(0);
      });

      it("should short-circuit by lazily evaluating its params", function () {
        const eq = spyOn(builtinOps, "==");
        expect(
          evalExpr(["case", true, 43, true, ["==", "foo", "bar"], 0])()
        ).toBe(43);
        expect(eq).not.toHaveBeenCalled();
      });
    });

    describe("coalesce", function () {
      it("returns the first non null value", function () {
        expect(evalExpr(["coalesce", true, "foo", 42, 0])()).toBe(true);
      });

      it("should short-circuit by lazily evaluating its params", function () {
        const eq = spyOn(builtinOps, "==");
        expect(
          evalExpr(["coalesce", true, "foo", ["==", "foo", "bar"], 0])()
        ).toBe(true);
        expect(eq).not.toHaveBeenCalled();
      });
    });

    describe("match", function () {
      it("returns the value of the first branch whose label value matches the input value", function () {
        expect(
          evalExpr(["match", 42, 0, "zero", 42, "fortytwo", "unknown"])()
        ).toBe("fortytwo");
      });

      it("can match from an array of labels", function () {
        expect(
          evalExpr([
            "match",
            42,
            0,
            "zero",
            [41, 42],
            "fortyone-or-fortytwo",
            "unknown"
          ])()
        ).toBe("fortyone-or-fortytwo");
      });

      it("returns the fallback value if there is no match", function () {
        expect(
          evalExpr([
            "match",
            120,
            0,
            "zero",
            ["+", 41, 1],
            "fortytwo",
            "unknown"
          ])()
        ).toBe("unknown");
      });

      it("should short-circuit by lazily evaluating its params", function () {
        const plus = spyOn(builtinOps, "+");
        expect(
          evalExpr([
            "match",
            "zero",
            "zero",
            0,
            "fortytwo",
            ["+", 41, 1],
            "unknown"
          ])()
        ).toBe(0);
        expect(plus).not.toHaveBeenCalled();
      });
    });
  });

  describe("ramps, scales, curves", function () {
    describe("interpolate", function () {
      describe("linear", function () {
        it("can linearly interpolate numbers", function () {
          expect(
            evalExpr(["interpolate", ["linear"], ["zoom"], 0, 0.9, 10, 0.3])(0)
          ).toBe(0.9);
          expect(
            evalExpr(["interpolate", ["linear"], ["zoom"], 0, 0.9, 10, 0.3])(5)
          ).toBe(0.6);
          expect(
            evalExpr(["interpolate", ["linear"], ["zoom"], 0, 0.9, 10, 0.3])(10)
          ).toBe(0.3);
        });

        it("can linearly interpolate colors", function () {
          expect(
            evalExpr([
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              "red",
              16,
              "blue"
            ])(0)
          ).toBe("rgb(255,0,0)");

          expect(
            evalExpr([
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              "red",
              16,
              "blue"
            ])(8)
          ).toBe("rgb(128,0,128)");

          expect(
            evalExpr([
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              "red",
              16,
              "blue"
            ])(16)
          ).toBe("rgb(0,0,255)");
        });
      });

      describe("exponential", function () {
        it("can exponentially interpolate numbers", function () {
          expect(
            evalExpr([
              "interpolate",
              ["exponential", 1.2],
              ["zoom"],
              0,
              0.9,
              10,
              0.3
            ])(0)
          ).toBe(0.9);
          expect(
            evalExpr([
              "interpolate",
              ["exponential", 1.2],
              ["zoom"],
              0,
              0.9,
              10,
              0.3
            ])(5)
          ).toBeCloseTo(0.72799);
          expect(
            evalExpr([
              "interpolate",
              ["exponential", 1.2],
              ["zoom"],
              0,
              0.9,
              10,
              0.3
            ])(10)
          ).toBe(0.3);
        });

        it("can exponentially interpolate colors", function () {
          expect(
            evalExpr([
              "interpolate",
              ["exponential", 1.2],
              ["zoom"],
              0,
              "red",
              16,
              "blue"
            ])(0)
          ).toBe("rgb(255,0,0)");

          expect(
            evalExpr([
              "interpolate",
              ["exponential", 1.2],
              ["zoom"],
              0,
              "red",
              16,
              "blue"
            ])(8)
          ).toBe("rgb(207,0,48)");

          expect(
            evalExpr([
              "interpolate",
              ["exponential", 1.2],
              ["zoom"],
              0,
              "red",
              16,
              "blue"
            ])(16)
          ).toBe("rgb(0,0,255)");
        });
      });
    });

    describe("step", function () {
      it("returns the output with stop-input just less than the expression input", function () {
        const expr = ["step", ["zoom"], "<6", 6, ">=6 and <7", 7, ">=7"];
        expect(evalExpr(expr)(5)).toBe("<6");
        expect(evalExpr(expr)(6)).toBe(">=6 and <7");
        expect(evalExpr(expr)(6.5)).toBe(">=6 and <7");
        expect(evalExpr(expr)(7)).toBe(">=7");
        expect(evalExpr(expr)(7.5)).toBe(">=7");
      });
    });
  });

  describe("string ops", function () {
    describe("concat", function () {
      it("concatenates input strings", function () {
        expect(evalExpr(["concat", "a", "b", "c"])()).toBe("abc");
        expect(evalExpr(["concat", "a", 42, "c"])()).toBe("a42c");
        expect(evalExpr(["concat", "a", true, "c"])()).toBe("atruec");
      });
    });

    describe("isSupportedScript", function () {
      it("returns true", function () {
        // currently returns true for any text
        expect(evalExpr(["is-supported-script", "foo"])()).toBe(true);
      });
    });
  });

  describe("math ops", function () {
    it("can + number", function () {
      expect(evalExpr(["+", 1, 2, 3, -3, 7, 8])()).toBe(18);
    });
  });
});
