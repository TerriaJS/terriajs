// import { http, HttpResponse } from "msw";
// import {
//   convertStartData,
//   interpretUrl,
//   parseHashProperties
// } from "../../lib/ViewModels/interpretUrl";
// import {
//   isInitFromData,
//   isInitFromUrl,
//   isInitFromOptions
// } from "../../lib/Models/InitSource";
// import { worker } from "../mocks/browser";

// const INIT_FRAGMENT_PATHS = ["init/", "http://cdn.example.com/init/"];
// const APP_BASE_HREF = "http://example.com/";

// function makeOptions(
//   overrides: Partial<{
//     shareDataService: { resolveData: (token: string) => Promise<unknown> };
//     storyRouteUrlPrefix: string;
//   }> = {}
// ) {
//   return {
//     initFragmentPaths: INIT_FRAGMENT_PATHS,
//     appBaseHref: APP_BASE_HREF,
//     ...overrides
//   };
// }

// describe("parseHashProperties", function () {
//   it("returns empty object for URL with no hash", function () {
//     expect(parseHashProperties("http://example.com/")).toEqual({});
//   });

//   it("returns empty object for URL with empty hash", function () {
//     expect(parseHashProperties("http://example.com/#")).toEqual({});
//   });

//   it("parses key=value pairs", function () {
//     const result = parseHashProperties("http://example.com/#map=3d&foo=bar");
//     expect(result["map"]).toBe("3d");
//     expect(result["foo"]).toBe("bar");
//   });

//   it("parses keys without values as empty string", function () {
//     const result = parseHashProperties("http://example.com/#nationalparks");
//     expect(result["nationalparks"]).toBe("");
//   });
// });

// describe("convertStartData", function () {
//   it("returns empty array for non-object input", async function () {
//     const result = await convertStartData(null, "test");
//     expect(result).toEqual([]);
//   });

//   it("returns empty array for input without initSources", async function () {
//     const result = await convertStartData({ version: "8.0.0" }, "test");
//     expect(result).toEqual([]);
//   });

//   it("maps string initSources to InitSourceFromUrl", async function () {
//     const result = await convertStartData(
//       { version: "8.0.0", initSources: ["http://example.com/data.json"] },
//       "my-name"
//     );
//     expect(result.length).toBe(1);
//     expect(isInitFromUrl(result[0])).toBeTrue();
//     if (isInitFromUrl(result[0])) {
//       expect(result[0].initUrl).toBe("http://example.com/data.json");
//       expect(result[0].name).toBe("my-name");
//     }
//   });

//   it("maps object initSources to InitSourceFromData", async function () {
//     const result = await convertStartData(
//       {
//         version: "8.0.0",
//         initSources: [{ workbench: ["id1"], camera: {} }]
//       },
//       "share-name"
//     );
//     expect(result.length).toBe(1);
//     expect(isInitFromData(result[0])).toBeTrue();
//     if (isInitFromData(result[0])) {
//       expect(result[0].name).toBe("share-name");
//     }
//   });

//   it("handles mix of string and object initSources", async function () {
//     const result = await convertStartData(
//       {
//         version: "8.0.0",
//         initSources: ["url.json", { workbench: [] }]
//       },
//       "mixed"
//     );
//     expect(result.length).toBe(2);
//     expect(isInitFromUrl(result[0])).toBeTrue();
//     expect(isInitFromData(result[1])).toBeTrue();
//   });
// });

// describe("interpretUrl", function () {
//   describe("no hash / empty hash", function () {
//     it("returns empty initSources, empty userProperties, clean=false, hideWelcomeMessage=false", async function () {
//       const result = await interpretUrl("http://example.com/", makeOptions());
//       expect(result.initSources).toEqual([]);
//       expect(result.userProperties.size).toBe(0);
//       expect(result.clean).toBe(false);
//       expect(result.hideWelcomeMessage).toBe(false);
//     });
//   });

//   describe("#clean", function () {
//     it("sets clean=true", async function () {
//       const result = await interpretUrl(
//         "http://example.com/#clean",
//         makeOptions()
//       );
//       expect(result.clean).toBe(true);
//     });
//   });

//   describe("#hideWelcomeMessage", function () {
//     it("sets hideWelcomeMessage=true", async function () {
//       const result = await interpretUrl(
//         "http://example.com/#hideWelcomeMessage",
//         makeOptions()
//       );
//       expect(result.hideWelcomeMessage).toBe(true);
//     });
//   });

//   describe("hash key with value (user property)", function () {
//     it("sets the key in userProperties", async function () {
//       const result = await interpretUrl(
//         "http://example.com/#map=3d",
//         makeOptions()
//       );
//       expect(result.userProperties.get("map")).toBe("3d");
//     });

//     it("does not add a reserved key (clean, start, share, hideWelcomeMessage) to userProperties", async function () {
//       const result = await interpretUrl(
//         "http://example.com/#clean",
//         makeOptions()
//       );
//       expect(result.userProperties.has("clean")).toBe(false);
//     });
//   });

//   describe("hash key without value (named fragment)", function () {
//     it("adds an InitSourceFromOptions with one option per initFragmentPath", async function () {
//       const result = await interpretUrl(
//         "http://example.com/#nationalparks",
//         makeOptions()
//       );
//       expect(result.initSources.length).toBe(1);
//       expect(isInitFromOptions(result.initSources[0])).toBeTrue();
//       if (isInitFromOptions(result.initSources[0])) {
//         const options = result.initSources[0].options;
//         expect(options.length).toBe(2);
//         expect(isInitFromUrl(options[0])).toBeTrue();
//         if (isInitFromUrl(options[0])) {
//           expect(options[0].initUrl).toBe(
//             "http://example.com/init/nationalparks.json"
//           );
//         }
//       }
//     });
//   });

//   describe("#start=JSON", function () {
//     it("parses inline JSON and returns initSources", async function () {
//       const startData = JSON.stringify({
//         version: "8.0.0",
//         initSources: [{ workbench: ["id1"] }]
//       });
//       const result = await interpretUrl(
//         `http://example.com/#start=${encodeURIComponent(startData)}`,
//         makeOptions()
//       );
//       expect(result.initSources.length).toBe(1);
//       expect(isInitFromData(result.initSources[0])).toBeTrue();
//     });
//   });

//   describe("#share=TOKEN", function () {
//     it("calls shareDataService.resolveData and returns initSources", async function () {
//       const shareData = {
//         version: "8.0.0",
//         initSources: [{ workbench: ["item1"] }]
//       };
//       const shareDataService = {
//         resolveData: jasmine
//           .createSpy("resolveData")
//           .and.returnValue(Promise.resolve(shareData))
//       };

//       const result = await interpretUrl(
//         "http://example.com/#share=abc123",
//         makeOptions({ shareDataService })
//       );

//       expect(shareDataService.resolveData).toHaveBeenCalledWith("abc123");
//       expect(result.initSources.length).toBe(1);
//       expect(isInitFromData(result.initSources[0])).toBeTrue();
//     });

//     it("returns empty initSources when no shareDataService is provided", async function () {
//       const result = await interpretUrl(
//         "http://example.com/#share=abc123",
//         makeOptions()
//       );
//       expect(result.initSources).toEqual([]);
//     });
//   });

//   describe("/catalog/:id route", function () {
//     it("adds an initSource with previewedItemId", async function () {
//       const result = await interpretUrl(
//         "http://example.com/catalog/my-layer",
//         makeOptions()
//       );
//       expect(result.initSources.length).toBe(1);
//       if (isInitFromData(result.initSources[0])) {
//         expect((result.initSources[0].data as any).previewedItemId).toBe(
//           "my-layer"
//         );
//       }
//     });
//   });

//   describe("/story/:id route", function () {
//     it("fetches the story JSON, adds initSources, and sets playStory in userProperties", async function () {
//       worker.use(
//         http.get("*/stories/my-story", () =>
//           HttpResponse.json({
//             version: "8.0.0",
//             initSources: [{ stories: [{ id: "s1", title: "Story 1" }] }]
//           })
//         )
//       );

//       const result = await interpretUrl(
//         "http://example.com/story/my-story",
//         makeOptions({ storyRouteUrlPrefix: "stories/" })
//       );

//       expect(result.initSources.length).toBe(1);
//       expect(result.userProperties.get("playStory")).toBe("1");
//     });

//     it("returns empty initSources when storyRouteUrlPrefix is not configured", async function () {
//       const result = await interpretUrl(
//         "http://example.com/story/my-story",
//         makeOptions()
//       );
//       expect(result.initSources).toEqual([]);
//     });
//   });

//   describe("combined hash params", function () {
//     it("handles multiple params: user property + named fragment", async function () {
//       const result = await interpretUrl(
//         "http://example.com/#map=3d&nationalparks",
//         makeOptions()
//       );
//       expect(result.userProperties.get("map")).toBe("3d");
//       expect(result.initSources.length).toBe(1);
//       expect(isInitFromOptions(result.initSources[0])).toBeTrue();
//     });
//   });
// });
