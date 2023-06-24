export interface ArcGisItem {
  id: string;
  owner: string;
  created: number;
  modified: number;
  guid: string;
  name: string;
  title: string;
  type: string;
  categories: string[];
  typeKeywords: string[];
  description: string;
  tags: string[];
  snippet: string;
  thumbnail: string;
  extent: null | [[number, number], [number, number]];
  spatialReference: string;
  accessInformation: string;
  licenseInfo: string;
  culture: string;
  url: string;
  // proxyFilter: {},
  access: string;
  size: number;
  // properties: {};
  appCategories: string[];
  industries: string[];
  languages: string[];
  largeThumbnail: string;
  banner: string;
  screenshots: string;
  listed: boolean;
  ownerFolder: number;
  protected: boolean;
  numComments: number;
  numRatings: number;
  avgRating: number;
  numViews: number;

  // For items retrieved via a group search
  // we'll patch a groupId on
  groupId?: string;
}

export interface ArcGisPortalGroup {
  id: string;
  title: string;
  isInvitationOnly: boolean;
  owner: string;
  description: string;
  snippet: string;
  tags: string[];
  phone: string;
  sortField: string;
  sortOrder: string;
  isViewOnly: boolean;
  isFav: boolean;
  thumbnail: string;
  created: number;
  modified: number;
  access: string;
  userMembership?: {
    username: string;
    memberType: string;
  };
  protected: boolean;
  autoJoin: boolean;
  hasCategorySchema: boolean;
  isOpenData: boolean;
}

export interface ArcGisPortalGroupSearchResponse {
  total: number;
  start: number;
  num: number;
  nextStart: number;
  results: ArcGisPortalGroup[];
}

export interface ArcGisPortalSearchResponse {
  total: number;
  start: number;
  num: number;
  nextStart: number;
  results: ArcGisItem[];
}
