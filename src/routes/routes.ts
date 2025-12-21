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

  // get all users
  router.get("/users", async (req: Request, res: Response) => {
    const users: User[] = await userService.findUsers();
    res.json(users);
  });

  // get user by id
  router.get("/users/:id", async (req: Request, res: Response) => {
    const user: User | null = await userService.findUserById(req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  });

  // create a new user
  router.post("/users", async (req: Request, res: Response) => {
    const user: User = await userService.createUser(req.body);
    res.json(user);
  });

  // update user by id
  router.put("/users/:id", async (req: Request, res: Response) => {
    const user: User | null = await userService.updateUser(
      req.params.id,
      req.body
    );
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  });

  // delete user by id
  router.delete("/users/:id", async (req: Request, res: Response) => {
    const success: boolean = await userService.deleteUser(req.params.id);
    if (success) {
      res.json({ message: "User deleted successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  });

  return router;
};
