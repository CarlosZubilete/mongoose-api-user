// it will contain all the routes of the application
import { UserRepository } from "@repositories/userRepositories";
import { UserService } from "@services/userServices";
import { Router, Response, Request } from "express";
import { IUserRepository, User, IUserService } from "types/UserTypes";

const router: Router = Router();

const userRepository: IUserRepository = new UserRepository();
const userService: IUserService = new UserService(userRepository);

export default () => {
  router.get("/healthy", (req: Request, res: Response) => {
    res.send("Api is healthy");
  });

  router.get("/users", async (req: Request, res: Response) => {
    const users: User[] = await userService.findUsers(); // * maybe it could called getUsers().
    res.json(users);
  });

  router.post("/users", async (req: Request, res: Response) => {
    const user: User = await userService.createUser(req.body);
    res.json(user);
  });

  return router;
};
