import express from "express";
import { proj4def } from "proj4-cli-defs/epsg.js";

const router = express.Router();

// GDA2020 proj4 string from https://gis.stackexchange.com/questions/349780/is-there-a-proj4-string-for-gda2020-epsg7844-that-we-use-to-transform-from-38
proj4def[7844] =
  "+proj=longlat +ellps=GRS80 +towgs84=-0.06155,0.01087,0.04019,-0.0394924,-0.0327221,-0.03289790,0.009994 +no_defs";
//provide REST service for proj4 definition strings
router.get("/epsg\\::code", (req, res) => {
  const code = parseInt(req.params.code, 10);
  if (isNaN(code)) {
    res.status(400).send("Invalid EPSG code.");
    return;
  }
  const epsg = proj4def[code];
  if (epsg !== undefined) {
    res.status(200).send(epsg);
  } else {
    res.status(404).send("No proj4 definition available for this CRS.");
  }
});

export default router;
