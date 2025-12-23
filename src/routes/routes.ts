// it will contain all the routes of the application
import { Router, Response } from "express";
import {
  createUser,
  deleteUser,
  findUserById,
  findUsers,
  updateUser,
} from "@controllers/usersController";
import {
  createRole,
  deleteRole,
  findRoleById,
  findRoles,
  updateRole,
} from "@controllers/rolesController";

const router: Router = Router();

export default () => {
  router.get("/healthy", (_, res: Response) => {
    res.send("Api is healthy");
  });
  // * user routes
  router.get("/users", findUsers);
  router.get("/users/:id", findUserById);
  router.post("/users", createUser);
  router.put("/users/:id", updateUser);
  router.delete("/users/:id", deleteUser);

  // * role routes
  router.get("/roles", findRoles);
  router.get("/roles/:id", findRoleById);
  router.post("/roles", createRole);
  router.put("/roles/:id", updateRole);
  router.delete("/roles/:id", deleteRole);

  return router;
};
