type TranslationKey = string;

export interface Term {
  term: string;
  content: string;
  aliases?: string[] | TranslationKey;
}

export const defaultTerms: Term[] = [
  {
    term: "dataset",
    // if we are properly consistent with copy, the split-word version of
    // this alias should never occur?
    aliases: ["data set", "data sets", "datasets"],
    content:
      'A collection of related information, organised as one using a common data structure, e.g. "average house prices in Sydney for 2019" or "minimum and maximum daily temperature"'
  },
  {
    term: "time series",
    aliases: ["timeseries"],
    content:
      "A sequence of data collected over different points in time, e.g. temperature sensor data or a gallery of images of the same location"
  },
  {
    term: "workbench",
    content:
      "The panel on the left side of the screen that shows what datasets you have added to the map"
  },
  {
    term: "4D",
    content: "3D data that also has a time-series component"
  },
  {
    term: "catalog",
    aliases: ["catalogue"],
    content: "the inventory of all datasets available to be added to the map"
  },
  {
    term: "base maps",
    aliases: ["basemap", "base map", "basemaps"],
    content:
      "Different map options for the blank base map, such as Bing imagery, roads, dark or light maps"
  },
  {
    term: "source dataset",
    content:
      "The dataset you added to your workbench that allows for difference calculations"
  },
  {
    term: "preview style",
    content:
      "The way the dataset appears in the preview window. We recommend true colour to search for cloud-free images"
  },
  {
    term: "difference output",
    content:
      "Imagery showing differences in landscape according to specific styles and data sources"
  }
];
export default defaultTerms;
