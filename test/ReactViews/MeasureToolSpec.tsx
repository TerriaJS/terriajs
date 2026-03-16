import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import ConstantPositionProperty from "terriajs-cesium/Source/DataSources/ConstantPositionProperty";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import { MeasureTool } from "../../lib/ReactViews/Map/MapNavigation/Items/MeasureTool";
import Terria from "../../lib/Models/Terria";

describe("MeasureTool", function () {
  let terria: Terria;
  let measureTool: MeasureTool;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    measureTool = new MeasureTool({ terria, onClose: () => {} });
  });

  describe("prettifyNumber", function () {
    it("formats distance in metres", function () {
      expect(measureTool.prettifyNumber(480, false)).toEqual("480.00 m");
    });

    it("formats area in metres squared", function () {
      expect(measureTool.prettifyNumber(480, true)).toEqual("480.00 m\u00B2");
    });

    it("formats distance in kilometres", function () {
      expect(measureTool.prettifyNumber(1280.23, false)).toEqual("1.28 km");
    });

    it("formats large distance in kilometres", function () {
      expect(measureTool.prettifyNumber(123123280.23, false)).toEqual(
        "123,123.28 km"
      );
    });
  });

  describe("getGeodesicDistance", function () {
    // Roughly Auckland
    const auckland = new Cartesian3(
      -5088454.576893678,
      465233.10329933715,
      -3804299.6786334896
    );

    // Roughly L.A.
    const losAngeles = new Cartesian3(
      -2503231.890682526,
      -4660863.528418564,
      3551306.84427321
    );

    it("measures geodesic distance between two points", function () {
      const distance = measureTool.getGeodesicDistance(auckland, losAngeles);
      expect(Math.abs(distance - 10476961.667267017) < 2e-9).toBeTruthy();
    });
  });

  describe("updateDistance and onMakeDialogMessage", function () {
    it("measures distance between two points on parliament house", function () {
      const pointEntities = new CustomDataSource();
      pointEntities.entities.add(
        new Entity({
          name: "Parl house 1",
          position: new ConstantPositionProperty(
            new Cartesian3(
              -4472628.878459197,
              2674320.0223987163,
              -3666272.9589235038
            )
          )
        })
      );
      pointEntities.entities.add(
        new Entity({
          name: "Parl house 2",
          position: new ConstantPositionProperty(
            new Cartesian3(
              -4472822.49209372,
              2674246.213307502,
              -3666094.8052623854
            )
          )
        })
      );

      measureTool.updateDistance(pointEntities);
      expect(measureTool.onMakeDialogMessage()).toEqual("273.23 m");
    });

    it("measures distance matching geoscience australia test", function () {
      const pointEntities = new CustomDataSource();

      const flindersPeak = Ellipsoid.WGS84.cartographicToCartesian(
        new Cartographic(
          CesiumMath.toRadians(144.424868),
          CesiumMath.toRadians(-37.951033),
          CesiumMath.toRadians(0)
        )
      );
      const buninyong = Ellipsoid.WGS84.cartographicToCartesian(
        new Cartographic(
          CesiumMath.toRadians(143.926496),
          CesiumMath.toRadians(-37.652821),
          CesiumMath.toRadians(0)
        )
      );

      pointEntities.entities.add(
        new Entity({
          name: "Flinder's Peak",
          position: new ConstantPositionProperty(flindersPeak)
        })
      );
      pointEntities.entities.add(
        new Entity({
          name: "Buninyong",
          position: new ConstantPositionProperty(buninyong)
        })
      );

      measureTool.updateDistance(pointEntities);
      expect(measureTool.onMakeDialogMessage()).toEqual("54.97 km");
    });

    it("measures distance with multiple intermediate points", function () {
      const pointEntities = new CustomDataSource();
      const positions = [
        [-4472821.5616301615, 2674248.078411612, -3666094.813749141],
        [-4472782.699102473, 2674262.986482508, -3666130.2532728123],
        [-4472753.492698317, 2674274.3463433487, -3666156.7158062747],
        [-4472723.915450494, 2674288.96271715, -3666190.6009734552],
        [-4472684.617701235, 2674304.5195146934, -3666229.3233881197],
        [-4472628.62862585, 2674320.1352525284, -3666273.2152227913]
      ];

      for (const [x, y, z] of positions) {
        pointEntities.entities.add(
          new Entity({
            position: new ConstantPositionProperty(new Cartesian3(x, y, z))
          })
        );
      }

      measureTool.updateDistance(pointEntities);
      expect(measureTool.onMakeDialogMessage()).toEqual("272.46 m");
    });

    it("updates distance when a point is removed", function () {
      const positions = [
        [-4472821.5616301615, 2674248.078411612, -3666094.813749141],
        [-4472782.699102473, 2674262.986482508, -3666130.2532728123],
        [-4472628.62862585, 2674320.1352525284, -3666273.2152227913]
      ];

      const pointEntities = new CustomDataSource();
      for (const [x, y, z] of positions) {
        pointEntities.entities.add(
          new Entity({
            position: new ConstantPositionProperty(new Cartesian3(x, y, z))
          })
        );
      }

      measureTool.updateDistance(pointEntities);
      expect(measureTool.onMakeDialogMessage()).toEqual("272.45 m");

      // Remove the last point
      const twoPointEntities = new CustomDataSource();
      for (const [x, y, z] of positions.slice(0, 2)) {
        twoPointEntities.entities.add(
          new Entity({
            position: new ConstantPositionProperty(new Cartesian3(x, y, z))
          })
        );
      }

      measureTool.updateDistance(twoPointEntities);
      expect(measureTool.onMakeDialogMessage()).toEqual("54.66 m");
    });
  });

  describe("area measurement", function () {
    it("measures area correctly for a closed polygon", function () {
      const corners = [
        [149.121, -35.309],
        [149.124, -35.311],
        [149.127, -35.308],
        [149.124, -35.306]
      ];

      const cartesianPositions = corners.map(([lon, lat]) =>
        Ellipsoid.WGS84.cartographicToCartesian(
          new Cartographic(
            CesiumMath.toRadians(lon),
            CesiumMath.toRadians(lat),
            CesiumMath.toRadians(0)
          )
        )
      );

      const pointEntities = new CustomDataSource();

      // Add each point and update distance (simulating user clicks)
      for (const pos of cartesianPositions) {
        pointEntities.entities.add(
          new Entity({ position: new ConstantPositionProperty(pos) })
        );
        measureTool.updateDistance(pointEntities);
      }

      // Close the loop by adding the first point again
      pointEntities.entities.add(
        new Entity({
          position: new ConstantPositionProperty(cartesianPositions[0])
        })
      );
      measureTool.updateDistance(pointEntities);

      // Simulate closing the polygon (userDrawing is private, access for testing)
      const tool = measureTool as unknown as {
        userDrawing: { closeLoop: boolean };
      };
      tool.userDrawing.closeLoop = true;
      measureTool.updateDistance(pointEntities);
      measureTool.updateArea(pointEntities);

      // Distance between each point:
      // a = 351.66917614964854
      // b = 430.3689959315394
      // c = 351.6769210634701
      // d = 430.3731676536625:
      // So expect roughly 151349 square m, based on a*b area of rectangle.
      // But more exactly:
      // Distance along diagonal is diag 554.7311731248245 (not quite exactly rectangle so not hypotenuse)
      // Using Heron's formula, area:
      //     first triangle (a, b, diag) = 75673.1975
      //     second triangle (c, d, diag) = 75675.5889
      // So area is 151348.79, which matches rough calculation.
      // Google maps area is roughly (for slightly different points): 157,408.91 square m
      expect(measureTool.onMakeDialogMessage()).toEqual(
        "1.56 km<br>151,348.79 m\u00B2"
      );
    });
  });
});
