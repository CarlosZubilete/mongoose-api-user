import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoURI: string = process.env.MONGODB_URL_STRING as string;

export default (async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB successfully.");
  } catch (error) {
    console.error("Error connecting to MongoDB: >> ", error);
    process.exit(1);
  }
})();
