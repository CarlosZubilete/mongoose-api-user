// it will contain all the routes of the application
import { Router, Response, Request } from "express";

const router: Router = Router();

export default () => {
  router.get("/healthy", (req: Request, res: Response) => {
    res.send("Api is healthy");
  });

  return router;
};
