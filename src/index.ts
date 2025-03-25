import express, { Request, Response, Application } from "express";
import { secrets } from "./secrets";
import scrapeRoute from "./routes/scrape";
import { connect } from "./connection";
import cors from "cors";

const { PORT } = secrets;

const app: Application = express();
const port = PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
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
