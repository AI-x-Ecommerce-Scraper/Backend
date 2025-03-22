import mongoose from "mongoose";

const scrapedSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  rating: {
    type: String,
    required: true,
  },
  numberOfRatings: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  discount: {
    type: String,
    required: true,
    default: "0%",
  },
  offers: {
    type: Array,
    required: true,
    default: [],
  },
  aboutItem: {
    type: String,
    required: true,
  },
  productInfo: {
    type: Object,
    required: true,
    default: {},
  },
  images: {
    type: Array,
    required: true,
    default: [],
  },
  manufacturerImages: {
    type: Array,
    required: true,
    default: [],
  },
  aiReviewSummary: {
    type: String,
    required: true,
    default: "Not available",
  },
});

export const Scraped = mongoose.model("Scraped", scrapedSchema);
