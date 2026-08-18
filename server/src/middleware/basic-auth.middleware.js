const crypto = require("crypto");
const userRepository = require("../repositories/user.repository");

function credentialsMatch(value, expected) {
  const valueBuffer = Buffer.from(value || "");
  const expectedBuffer = Buffer.from(expected);
  return valueBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(valueBuffer, expectedBuffer);
}

async function requireBasicAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Basic ")) {
      res.set("WWW-Authenticate", 'Basic realm="Kairos"');
      return res.status(401).json({ error: "Basic authentication is required." });
    }

    const [email, password] = Buffer.from(header.slice(6), "base64").toString("utf8").split(":");
    const expectedEmail = process.env.BASIC_AUTH_EMAIL || "demo@todotracker.local";
    const expectedPassword = process.env.BASIC_AUTH_PASSWORD || "Password123!";
    if (!credentialsMatch(email, expectedEmail) || !credentialsMatch(password, expectedPassword)) {
      res.set("WWW-Authenticate", 'Basic realm="Kairos"');
      return res.status(401).json({ error: "Email or password is incorrect." });
    }

    const user = await userRepository.findOrCreateByEmail(expectedEmail, "Demo User");
    req.basicUser = {
      id: user.id,
      email: user.email,
      name: user.name || "Demo User",
      authentication: "basic",
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { requireBasicAuth };
