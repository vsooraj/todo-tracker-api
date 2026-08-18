const { getAuth } = require("@clerk/express");

function currentUser(req) {
  if (req.basicUser) {
    return {
      id: req.basicUser.id,
      name: req.basicUser.name,
      email: req.basicUser.email,
    };
  }

  const auth = getAuth(req);
  return {
    id: auth.userId,
    name: auth.username || "User",
    email: auth.email || "",
  };
}

module.exports = { currentUser };
