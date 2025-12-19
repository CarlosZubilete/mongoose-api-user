// it will be logic server .
import express, { Application } from "express";
import morgan from "morgan";

const app: Application = express();

// Middlewares
app.use(express.json()); // to recognize the incoming Request Object as a JSON Object
app.use(morgan("dev")); // to log requests to the console

export default app;
