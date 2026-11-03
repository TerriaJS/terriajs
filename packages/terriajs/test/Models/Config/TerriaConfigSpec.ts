import * as z from "zod";
import { ConfigParametersSchema } from "../../../lib/Models/Config/ConfigParametersSchema";
import { createTerriaConfig } from "../../../lib/Models/Config/TerriaConfig";

describe("createTerriaConfig", function () {
  it("loads the built-in defaults when no overrides are given", function () {
    const config = createTerriaConfig();

    expect(config.appName).toBe("TerriaJS App");
    expect(config.welcomeMessageVideo.videoTitle).toBe(
      "Getting started with the map"
    );
  });

  it("overrides a top-level default", function () {
    const config = createTerriaConfig(undefined, { appName: "My Map" });

    expect(config.appName).toBe("My Map");
    // untouched defaults are still present
    expect(config.supportEmail).toBe("info@terria.io");
  });

  it("deep-merges overrides into nested default objects", function () {
    const config = createTerriaConfig(undefined, {
      welcomeMessageVideo: { videoUrl: "https://example.com/video" }
    });

    expect(config.welcomeMessageVideo.videoUrl).toBe(
      "https://example.com/video"
    );
    // sibling fields of the nested object are preserved, not wiped
    expect(config.welcomeMessageVideo.videoTitle).toBe(
      "Getting started with the map"
    );
  });

  it("replaces arrays rather than merging them", function () {
    const config = createTerriaConfig(undefined, {
      initFragmentPaths: ["custom/"]
    });

    expect(config.initFragmentPaths).toEqual(["custom/"]);
  });

  it("accepts a schema whose output is exactly ConfigParameters", function () {
    const config = createTerriaConfig(ConfigParametersSchema);

    expect(config.appName).toBe("TerriaJS App");
  });

  it("rejects, at compile time, a schema that drifts from ConfigParameters", function () {
    const addsUndeclaredKey = ConfigParametersSchema.extend({
      notInConfigParameters: z.boolean().optional()
    });
    const untyped: z.ZodObject = ConfigParametersSchema;

    // The check is type-level only; at runtime both still build a config.
    expect(() =>
      // @ts-expect-error the schema adds a key ConfigParameters does not declare
      createTerriaConfig(addsUndeclaredKey)
    ).not.toThrow();
    expect(() =>
      // @ts-expect-error an untyped schema proves nothing about its output
      createTerriaConfig(untyped)
    ).not.toThrow();
  });
});
