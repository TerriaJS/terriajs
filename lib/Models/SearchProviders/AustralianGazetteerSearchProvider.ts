import { makeObservable } from "mobx";
import {
  Category,
  SearchAction
} from "../../Core/AnalyticEvents/analyticEvents";
import WebFeatureServiceSearchProviderMixin from "../../ModelMixins/SearchProviders/WebFeatureServiceSearchProviderMixin";
import WebFeatureServiceSearchProviderTraits from "../../Traits/SearchProviders/WebFeatureServiceSearchProviderTraits";
import CreateModel from "../Definition/CreateModel";
import { ModelConstructorParameters } from "../Definition/Model";
import SearchResult from "./SearchResult";

const featureCodesToNamesMap = new Map([
  ["AF", "Aviation"],
  ["ANCH", "Anchorage"],
  ["ARCH", "Archipelago"],
  ["BANK", "Bank/Sandbar"],
  ["BAY", "Bay"],
  ["BCH", "Beach"],
  ["BCST", "Broadcasting station"],
  ["BEND", "Bend/Loop"],
  ["BGHT", "Bight"],
  ["BLDG", "Building"],
  ["BORE", "Bore/Well"],
  ["BRDG", "Bridge/Culvert"],
  ["BRK", "Breaker"],
  ["BRKW", "Breakwater/Groyne/Levee"],
  ["CAPE", "Cape"],
  ["CAVE", "Cave/Blowhole/Grotto"],
  ["CEM", "Cemetery"],
  ["CHAN", "Offshore channel"],
  ["CLAY", "Claypan/Clay pit"],
  ["CLIF", "Cliff"],
  ["CNAL", "Canal/Waterway"],
  ["CNTY", "County"],
  ["COMM", "Community center/Commune"],
  ["CONT", "Continent"],
  ["COVE", "Cove/Inlet"],
  ["CP", "Campsite"],
  ["CRTR", "Crater"],
  ["DAM", "Dam"],
  ["DPR", "Depression/Basin"],
  ["DI", "District/Region"],
  ["DOCK", "Dock"],
  ["DRN", "Drain"],
  ["DSRT", "Desert"],
  ["DUNE", "Dunes"],
  ["ENTR", "Entrance"],
  ["EST", "Estuary"],
  ["FARM", "Special purpose farm/Research establishment"],
  ["FORD", "Ford/Crossing"],
  ["FRNG", "Firing range"],
  ["FRST", "Forest"],
  ["GASF", "Gasfield/Oil well"],
  ["GATE", "Gate/City exit"],
  ["GLCR", "Glacier"],
  ["GORG", "Gorge/Canyon"],
  ["GRDN", "Garden/Vineyard"],
  ["GULF", "Gulf"],
  ["HBR", "Harbour"],
  ["Hill", "Hill"],
  ["HMSD", "Homestead/Outstation"],
  ["HWY", "Highway"],
  ["INTL", "Intermittent lake"],
  ["IS", "Island"],
  ["ISTH", "Isthmus/Neck"],
  ["LAGN", "Lagoon"],
  ["LAKE", "Lake"],
  ["LDGE", "Ledge"],
  ["LH", "Lighthouse"],
  ["LOCB", "Town"],
  ["LOCK", "Lock"],
  ["LOCU", "Place"],
  ["MINE", "Mine"],
  ["MONU", "Monument"],
  ["MT", "Mountain"],
  ["NAVB", "Beacon/Buoy"],
  ["OCEN", "Ocean"],
  ["PASS", "Pass"],
  ["PEAK", "Peak/Summit"],
  ["PEN", "Peninsula"],
  ["PIER", "Pier"],
  ["PL", "Plateau/Tableland"],
  ["PLAN", "Plantation"],
  ["PLN", "Plain"],
  ["PORT", "Port"],
  ["PRSH", "Parish"],
  ["PT", "Point"],
  ["QUAR", "Quarry"],
  ["RCH", "Reach/Arm"],
  ["RDGE", "Ridge"],
  ["REEF", "Reef"],
  ["RES", "Reservoir/Pond"],
  ["RESV", "Reserve/Park"],
  ["RH", "Rockhole"],
  ["ROAD", "Road"],
  ["ROCK", "Rock"],
  ["RSTA", "Railway station"],
  ["RTRK", "Racetrack"],
  ["RUIN", "Ruin"],
  ["SCHL", "School/College"],
  ["SEA", "Sea"],
  ["SHOL", "Shoal"],
  ["SITE", "Historical site"],
  ["SLP", "Slope/Hillside"],
  ["SND", "Sound"],
  ["SOAK", "Native well/Soak"],
  ["SPAN", "Salt pan"],
  ["SPIT", "Sandspit"],
  ["SPRG", "Spring"],
  ["STAT", "State"],
  ["STOK", "Stock route"],
  ["STR", "Strait"],
  ["STRM", "Stream"],
  ["SUB", "Suburb"],
  ["SWP", "Swamp/Marsh/Wetland"],
  ["TANK", "Tank"],
  ["TOWR", "Tower"],
  ["TREE", "Tree"],
  ["TRIG", "Trig station"],
  ["TRK", "Track/Trail"],
  ["TUNN", "Tunnel"],
  ["URBN", "City"],
  ["VAL", "Valley"],
  ["WRCK", "Wreck"],
  ["WRFL", "Waterfall"],
  ["WTRH", "Waterhole"],
  ["YD", "Yard"]
]);

const featureToSearchResultFunction = function (feature: any): SearchResult {
  let featureTypeString = "";
  const featureType = featureCodesToNamesMap.get(
    feature.Gazetteer_of_Australia.Feature_code
  );
  if (featureType !== undefined) {
    featureTypeString = " — " + featureType;
  }
  return new SearchResult({
    name: `${feature.Gazetteer_of_Australia.Name}, ${feature.Gazetteer_of_Australia.State_ID}${featureTypeString}`,
    location: {
      latitude: parseFloat(feature.Gazetteer_of_Australia.Latitude),
      longitude: parseFloat(feature.Gazetteer_of_Australia.Longitude)
    }
  });
};

const searchResultFilterFunction = function (feature: any): boolean {
  return (
    // search results with state ID of N/A seem to be poor quality
    feature.Gazetteer_of_Australia.State_ID !== "N/A" &&
    // filter out trig stations
    feature.Gazetteer_of_Australia.Feature_code !== "TRIG"
  );
};

const searchResultScoreFunction = function (
  feature: any,
  searchText: string
): number {
  feature = feature.Gazetteer_of_Australia;

  // Taken from original GazetteerSearchProviderViewModel in v7
  var featureTypes = [
    "CONT",
    "STAT",
    "URBN",
    "LOCB",
    "LOCU",
    "SUB",
    "DI",
    "CNTY"
  ];
  featureTypes.push(
    "HBR",
    "CAPE",
    "PEN",
    "PT",
    "BAY",
    "PORT",
    "GULF",
    "BGHT",
    "COVE",
    "MT",
    "HILL",
    "PEAK",
    "OCEN",
    "SEA",
    "RESV",
    "LAKE",
    "RES",
    "STRM"
  );
  featureTypes.push("PLN", "REEF", "VAL", "PRSH");

  let score = 10000 - (featureTypes.indexOf(feature.Feature_code) + 1) * 100;
  if (score === 10000) {
    score = 0;
  }

  if (feature.Name.toUpperCase() === searchText.toUpperCase()) {
    // Bonus for exact match
    // More testing required to choose this value. Should "Geelong" (parish in Queensland) outrank "North Geelong" (suburb in Vic)?
    score += 10 * 100;
  } else if (feature.Name.match(new RegExp("^" + searchText + "\\b", "i"))) {
    // bonus for first word match ('Steve Bay' better than 'West Steve Bay')
    score += 8 * 100;
  } else if (feature.Name.match(new RegExp("\\b" + searchText + "\\b", "i"))) {
    // bonus for word-boundary match ('Steve' better than 'Steveville')
    score += 4 * 100;
  } else if (feature.Name.match(new RegExp("^" + searchText, "i"))) {
    // bonus for word-boundary match ('Steventon' better than 'Nosteve Town')
    score += 2 * 100;
  }
  if (feature.State_ID === "N/A") {
    // seems to be an indicator of a low quality result
    score -= 10 * 100;
  }
  if (feature.Status === "U") {
    // Not official? H=historical, U=unofficial. Bleh.
    score -= 5 * 100;
  }
  if (feature.Status === "H") {
    score -= 10 * 100;
  }

  return score;
};

export default class AustralianGazetteerSearchProvider extends WebFeatureServiceSearchProviderMixin(
  CreateModel(WebFeatureServiceSearchProviderTraits)
) {
  static readonly type = "australian-gazetteer-search-provider";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return AustralianGazetteerSearchProvider.type;
  }

  protected logEvent(searchText: string) {
    this.terria.analytics?.logEvent(
      Category.search,
      SearchAction.gazetteer,
      searchText
    );
  }

  featureToSearchResultFunction: (feature: any) => SearchResult =
    featureToSearchResultFunction;
  transformSearchText: ((searchText: string) => string) | undefined = (
    searchText
  ) => searchText.toUpperCase();
  searchResultFilterFunction: ((feature: any) => boolean) | undefined =
    searchResultFilterFunction;
  searchResultScoreFunction:
    | ((feature: any, searchText: string) => number)
    | undefined = searchResultScoreFunction;
}
