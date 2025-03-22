import dotenv from "dotenv";
dotenv.config();

export const secrets = {
  MONGO_URI: process.env.MONGO_URI,
  PORT: process.env.PORT,
};
