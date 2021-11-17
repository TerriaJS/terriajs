export interface CkanResource {
  description: string;
  name: string;
  format: string;
  url: string;
  license_id: string;
  id: string;
  size: number | null;
  created: string;
  last_modified: string;
  // Present on data.vic.gov.au
  wms_url?: string;
  wms_layer?: string;
  wms_api_url?: string;
}

export interface CkanOrganisation {
  name: string;
  title: string;
  description: string;
  id: string;
}

export interface CkanDatasetGroup {
  title: string;
  display_name: string;
  id: string;
  description: string;
}

export interface CkanExtra {
  key: string;
  value: string;
}

export interface CkanDataset {
  id: string;
  name: string;
  title: string;
  url: string;
  organization: CkanOrganisation | null;
  geo_coverage?: string;
  extras?: CkanExtra[];
  metadata_created: string;
  metadata_modified: string;
  update_freq: string;
  notes: string;
  license_title: string;
  license_url: string;
  author: string;
  contact_point: string;
  groups: CkanDatasetGroup[];
  resources: CkanResource[];
  spatial?: string;
}

export interface CkanResourceServerResponse {
  help: string;
  result: CkanResource;
}

export interface CkanDatasetServerResponse {
  help: string;
  result: CkanDataset;
}

export interface CkanSearchResult {
  count: number;
  results: CkanDataset[];
}

export interface CkanServerResponse {
  help: string;
  result: CkanSearchResult;
}
