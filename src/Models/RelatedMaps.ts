export interface RelatedMap {
  imageUrl: string;
  url: string;
  title: string;
  description: string;
}

export const defaultRelatedMaps: RelatedMap[] = [
  {
    imageUrl:
      "https://terria-catalogs-public.storage.googleapis.com/misc/related-maps/nationalmap.jpg",
    url: "https://nationalmap.gov.au/",
    title: "NationalMap",
    description:
      "The NationalMap is a website for map-based access to spatial data from Australian government agencies. It is an initiative of the Australian Government's Department of the Prime Minister and Cabinet and the software has been developed by Data61 working closely with the Department of the Prime Minister and Cabinet, Geoscience Australia and other government agencies."
  },
  {
    imageUrl:
      "https://terria-catalogs-public.storage.googleapis.com/misc/related-maps/vic-dt.jpg",
    url: "https://vic.digitaltwin.terria.io/",
    title: "Digital Twin Victoria",
    description:
      "The Digital Twin Victoria (DTV) platform is the most comprehensive digital model ever assembled for Victoria. It brings together masses of 2D, 3D and live data in a single online place open for everyone to use. The DTV platform is one part of the $37.4 million Digital Twin Victoria Program."
  },
  {
    imageUrl:
      "https://terria-catalogs-public.storage.googleapis.com/misc/related-maps/nsw-dt.png",
    url: "https://nsw.digitaltwin.terria.io/",
    title: "NSW Spatial Digital Twin",
    description:
      "The NSW Spatial Digital Twin aims to respond to the NSW State Infrastructure Strategy by developing a 4D (3D+time) Foundation Spatial Data Framework. The goal is to help the NSW Government with infrastructure assets planning and management, integration with land use planning, data collaboration, and sharing."
  },
  {
    imageUrl:
      "https://terria-catalogs-public.storage.googleapis.com/misc/related-maps/qld-dt.png",
    url: "https://qld.digitaltwin.terria.io/",
    title: "QLD Spatial Digital Twin",
    description:
      "The QLD Spatial Digital Twin is an evolving 4D data platform that enables users to discover, visualise, analyse and share a rich range of datasets in a real world context, to enable better planning and decision making. It is an initiative of Advance Queensland and the Department of Resources in partnership with CSIRO-Data61."
  },
  {
    imageUrl:
      "https://terria-catalogs-public.storage.googleapis.com/misc/related-maps/dea.png",
    url: "https://maps.dea.ga.gov.au/",
    title: "Digital Earth Australia",
    description:
      "Digital Earth Australia (DEA) Map is a website for map-based access to DEA’s products, developed by Data61 CSIRO for Geoscience Australia. DEA uses satellite data to detect physical changes across Australia in unprecedented detail. It identifies soil and coastal erosion, crop growth, water quality and changes to cities and regions."
  },
  {
    imageUrl:
      "https://terria-catalogs-public.storage.googleapis.com/misc/related-maps/droughtmap.jpg",
    url: "https://map.drought.gov.au/",
    title: "National Drought Map",
    description:
      "The DroughtMap is a platform built for the Australian Government to assist with planning and management of drought effects in Australia."
  },
  {
    imageUrl:
      "https://terria-catalogs-public.storage.googleapis.com/misc/related-maps/aurin-map.jpg",
    url: "https://map.aurin.org.au/",
    title: "AURIN Map",
    description:
      "AURIN Map provides access to datasets on urban infrastructure for urban researchers, policy and decision makers."
  }
];
