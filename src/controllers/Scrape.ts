import { Request, Response } from "express";
import puppeteer from "puppeteer";
import { Scraped } from "../model/scraped";

export const scrapeAmazonProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { url } = req.body;

    if (!url || !url.includes("amazon.in")) {
      res.status(400).json({ error: "Invalid Amazon India product URL" });
      return;
    }

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0" });

    const productData = await page.evaluate(async () => {
      const cleanText = (text: string): string => {
        return text
          .replace(/\s+/g, " ")
          .replace(/[\u200E\u200F\u202A-\u202E]/g, "")
          .trim();
      };

      const getText = (selector: string) =>
        cleanText(
          document.querySelector(selector)?.textContent || "Not Available"
        );

      const getImages = (selector: string): string[] =>
        Array.from(document.querySelectorAll(selector)).map(
          (img) => (img as HTMLImageElement).src
        );

      const extractTableData = (selector: string): Record<string, string> => {
        const data: Record<string, string> = {};
        document.querySelectorAll(selector).forEach((row) => {
          const key = cleanText(row.querySelector("th")?.textContent || "");
          const value = cleanText(row.querySelector("td")?.textContent || "");
          if (key && value) data[key] = value;
        });
        return data;
      };

      const waitForElement = async (selector: string, timeout = 5000) => {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
          const element = document.querySelector(selector);
          if (element && window.getComputedStyle(element).display !== "none") {
            return element;
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return null;
      };

      const extractOffers = async () => {
        const offers: Array<{
          title: string;
          description: string;
          count: string;
          detailedOffers?: Array<{
            bankName: string;
            offerDetails: string;
            validity?: string;
          }>;
        }> = [];

        const offerCards = document.querySelectorAll(".a-carousel-card");
        console.log("Number of offer cards found:", offerCards.length);

        for (const card of offerCards) {
          const titleElement = card.querySelector(".offers-items-title");
          const descriptionElement = card.querySelector(".a-truncate-full");
          const countElement = card.querySelector(".vsx-offers-count");

          if (titleElement && descriptionElement) {
            const title = cleanText(titleElement.textContent || "");
            const description = cleanText(descriptionElement.textContent || "");
            const count = cleanText(countElement?.textContent || "");

            console.log("Processing offer:", title);

            if (
              title.toLowerCase().includes("bank") &&
              !title.toLowerCase().includes("emi")
            ) {
              const clickableElement = card.querySelector(
                '[data-action="side-sheet"]'
              );
              if (clickableElement) {
                console.log("Clicking on bank offer");
                (clickableElement as HTMLElement).click();

                await new Promise((resolve) => setTimeout(resolve, 2000));

                const detailedOffers: Array<{
                  bankName: string;
                  offerDetails: string;
                  validity?: string;
                }> = [];

                const bankSideSheet = await waitForElement(
                  "#InstantBankDiscount-sideSheet"
                );
                if (bankSideSheet) {
                  console.log("Found bank side sheet");
                  const offerItems = bankSideSheet.querySelectorAll(
                    ".vsx-offers-desktop-lv__item"
                  );
                  console.log(
                    "Number of bank offer items found:",
                    offerItems.length
                  );

                  offerItems.forEach((item) => {
                    const offerTitle =
                      item.querySelector("h1")?.textContent || "";
                    const offerDesc =
                      item.querySelector("p")?.textContent || "";
                    const validityElement = item.querySelector(
                      ".vsx-offers-desktop__footer-text"
                    );
                    const validity = validityElement
                      ? cleanText(validityElement.textContent || "")
                      : undefined;

                    if (offerTitle && offerDesc) {
                      detailedOffers.push({
                        bankName: cleanText(offerTitle),
                        offerDetails: cleanText(offerDesc),
                        validity,
                      });
                    }
                  });

                  if (detailedOffers.length > 0) {
                    console.log(`Found ${detailedOffers.length} bank offers`);
                    offers.push({
                      title,
                      description,
                      count,
                      detailedOffers,
                    });
                  }
                }

                const closeButton = document.querySelector(
                  ".vsx__offers-sideSheet-close"
                );
                if (closeButton) {
                  (closeButton as HTMLElement).click();
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                }
              }
            } else if (title.toLowerCase().includes("emi")) {
              const clickableElement = card.querySelector(
                '[data-action="side-sheet"]'
              );
              if (clickableElement) {
                console.log("Clicking on EMI offer");
                (clickableElement as HTMLElement).click();

                await new Promise((resolve) => setTimeout(resolve, 2000));

                const detailedOffers: Array<{
                  bankName: string;
                  offerDetails: string;
                  validity?: string;
                }> = [];

                const emiSideSheet = await waitForElement(
                  ".emi-options-box, .emi-table"
                );
                if (emiSideSheet) {
                  console.log("Found EMI side sheet");

                  const emiItems = document.querySelectorAll(
                    ".emi-option-row, .emi-bank-option"
                  );

                  emiItems.forEach((item) => {
                    const bankName =
                      item.querySelector(".emi-bank-name, .bank-name")
                        ?.textContent || "";
                    const emiDetails =
                      item.querySelector(".emi-details, .monthly-payment")
                        ?.textContent || "";
                    const tenure =
                      item.querySelector(".emi-tenure")?.textContent || "";

                    if (bankName && emiDetails) {
                      detailedOffers.push({
                        bankName: cleanText(bankName),
                        offerDetails: `${cleanText(emiDetails)} ${cleanText(
                          tenure
                        )}`.trim(),
                      });
                    }
                  });

                  if (detailedOffers.length > 0) {
                    console.log(`Found ${detailedOffers.length} EMI offers`);
                    offers.push({
                      title,
                      description,
                      count,
                      detailedOffers,
                    });
                  } else {
                    offers.push({
                      title,
                      description,
                      count,
                    });
                  }
                } else {
                  offers.push({
                    title,
                    description,
                    count,
                  });
                }
                const closeButton = document.querySelector(
                  ".vsx__offers-sideSheet-close"
                );
                if (closeButton) {
                  (closeButton as HTMLElement).click();
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                }
              }
            } else {
              offers.push({
                title,
                description,
                count,
              });
            }
          }
        }

        console.log("Total offers found:", offers.length);
        return offers;
      };

      return {
        name: getText("#productTitle"),
        rating: getText(".a-icon-alt"),
        numberOfRatings: getText("#acrCustomerReviewText"),
        price: getText(".a-price-whole"),
        discount: getText(".savingsPercentage"),
        offers: await extractOffers(),
        aboutItem: getText("#feature-bullets"),
        productInfo: extractTableData("#productDetails_techSpec_section_1 tr"),
        images: getImages("#altImages img"),
        manufacturerImages: getImages("#imageBlock img"),
        aiReviewSummary: getText("#product-summary > p"),
      };
    });

    await browser.close();

    const scrapedProduct = new Scraped(productData);
    await scrapedProduct.save();

    if (!scrapedProduct) {
      res.status(500).json({
        success: false,
        error: "Failed to save scraped product details",
      });
      return;
    }

    res.status(200).json({ success: true, data: productData });
  } catch (error) {
    console.error("Scraper Error:", error);
    res.status(500).json({ error: "Failed to scrape product details" });
  }
};

export const getAllScrapedProducts = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const totalProducts = await Scraped.countDocuments();
    const totalPages = Math.ceil(totalProducts / limit);

    const scrapedProducts = await Scraped.find()
      .skip(skip)
      .limit(limit)
      .select("name _id");

    res.status(200).json({
      success: true,
      data: scrapedProducts,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        limit,
      },
    });
  } catch (error) {
    console.error("Get Scraped Products Error:", error);
    res.status(500).json({ error: "Failed to get scraped products" });
  }
};

export const getSingleScrapedProduct = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  try {
    const { id } = req.params;

    const scrapedProduct = await Scraped.findById(id);

    if (!scrapedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json({ success: true, data: scrapedProduct });
  } catch (error) {
    console.error("Get Single Scraped Product Error:", error);
    res.status(500).json({ error: "Failed to get scraped product" });
  }
};
