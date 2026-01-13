// Switch to admin database
db = db.getSiblingDB("admin");

// Create application user (optional, root already exists)
db.createUser({
  user: "api-user_user",
  pwd: "apiuserpassword",
  roles: [{ role: "readWrite", db: "api-user_db" }],
});

// Switch to your app database
db = db.getSiblingDB("api-user_db");

// Create collection with initial data
db.createCollection("roles");
// Insert initial data into the collection

db.roles.insertMany([
  {
    name: "user",
    permissions: ["posts_read", "posts_write", "posts_update", "posts_delete"],
  },
  {
    name: "admin",
    permissions: ["admin_granted"],
  },
  {
    name: "manager",
    permissions: [
      "posts_read",
      "posts_write",
      "posts_update",
      "posts_delete",
      "users_write",
      "users_read",
      "users_update",
    ],
  },
  {
    name: "guest",
    permissions: ["posts_read"],
  },
]);
