import express, { RequestHandler } from "express";
import {
  scrapeAmazonProduct,
  getSingleScrapedProduct,
  getAllScrapedProducts,
} from "../controllers/Scrape";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    message: "Up and running!",
  });
});

router.post("/new", scrapeAmazonProduct as RequestHandler);
router.post("/fetch-all", getAllScrapedProducts as RequestHandler);
router.get("/single/:id", getSingleScrapedProduct as RequestHandler);

export default router;
