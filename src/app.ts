// it will be responsible for starting our application.
import app from "@server/server";
import dotenv from "dotenv";
import routes from "@routes/routes";

// Load environment variables from .env file
dotenv.config();

const PORT: string | number = process.env.PORT || 4000;

app.use("/api/v1", routes());

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
