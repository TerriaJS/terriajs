enum CommonStrata {
  defaults = "defaults",
  underride = "underride",
  definition = "definition",
  override = "override",
  user = "user",

  // Stratum for temporary user changes that shouldn't be captured in share links, example: form inputs
  edit = "edit"
}

export default CommonStrata;
