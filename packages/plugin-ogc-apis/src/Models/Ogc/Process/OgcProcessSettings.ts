import DefaultOgcProcessFieldMapper from "./DefaultOgcProcessFieldMapper";
import DefaultOgcProcessOutputMapper from "./DefaultOgcProcessOutputMapper";

export default {
  // Map OGC input descriptions to UI fields
  FieldMapper: DefaultOgcProcessFieldMapper,

  // Map OGC output definitions to Terria catalog definitions
  OutputMapper: DefaultOgcProcessOutputMapper,

  // Maximum times to attempt to fetch job status
  maxJobRefreshAttempts: 20
};
