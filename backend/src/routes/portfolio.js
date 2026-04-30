/**
 * Portfolio routes — all under the /api prefix.
 */
const express = require("express");
const ctrl = require("../controllers/portfolio");

const router = express.Router();

router.get("/", ctrl.root);
router.get("/portfolio", ctrl.listPortfolio);
router.get("/portfolio/refresh", ctrl.refreshPortfolio);
router.get("/portfolio/facets", ctrl.listFacets);

module.exports = router;
