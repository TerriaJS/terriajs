export interface Term {
  term: string;
  content: string;
  aliases?: string[];
}

export const defaultTerms: Term[] = [
  {
    term: "dataset",
    // if we are properly consistent with copy, the split-word version of
    // this alias should never occur?
    aliases: ["data set", "data sets", "datasets"],
    content:
      "A collection of related information, organised together as one using a particular data structure, e.g. "
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
    aliases: ["basemap", "base map"],
    content:
      "different map options for the blank base map, such as Bing imagery, roads, dark or light maps"
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
  }
];
export default defaultTerms;
