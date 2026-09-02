import bodyParser from "body-parser";
import express from "express";

/**
 * Receives Content-Security-Policy violation reports (sent by browsers to the
 * CSP `report-uri`) and logs them, so operators can see what a deployment's CSP
 * would block before switching it from report-only to enforcing.
 *
 * @returns {import('express').Router}
 */
export default function () {
  const router = express.Router();
  router.use(
    bodyParser.json({
      type: [
        "application/csp-report",
        "application/reports+json",
        "application/json"
      ],
      limit: "100kb"
    })
  );
  router.post("/", (req, res) => {
    const report = (req.body && req.body["csp-report"]) || req.body;
    console.warn("CSP violation report:", JSON.stringify(report));
    res.status(204).end();
  });
  return router;
}
