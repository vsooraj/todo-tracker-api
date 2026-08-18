const crypto = require("crypto");

function credentialsMatch(value, expected) {
  const valueBuffer = Buffer.from(value || "");
  const expectedBuffer = Buffer.from(expected);
  return valueBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(valueBuffer, expectedBuffer);
}

function requireBasicAuth(req, res, next) {
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

  req.basicUser = { id: "local-demo-user", email: expectedEmail, name: "Demo User", authentication: "basic" };
  return next();
}

module.exports = { requireBasicAuth };
