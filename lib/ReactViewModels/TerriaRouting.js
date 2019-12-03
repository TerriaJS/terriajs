// Route paths for the app.

var ROOT_ROUTE = "/";

var CATALOG_ROUTE = `${ROOT_ROUTE}catalog/`;
// var CATALOG_ROUTE = "/catalog/";

var CATALOG_MEMBER_ROUTE = `${CATALOG_ROUTE}:catalogMemberId`;

module.exports = {
  ROOT_ROUTE,
  CATALOG_ROUTE,
  CATALOG_MEMBER_ROUTE
};
