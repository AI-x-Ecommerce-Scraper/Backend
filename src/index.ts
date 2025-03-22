import express, { Request, Response, Application } from "express";
import { secrets } from "./secrets";
import scrapeRoute from "./routes/scrape";
import { connect } from "./connection";

const { PORT } = secrets;

const app: Application = express();
const port = PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Up and running!",
  });
});

app.use("/scrape", scrapeRoute);

connect();

app.listen(port, () => {
  console.log("Server is running on port " + port);
});
