const { clerkMiddleware } = require("@clerk/express");

function configureAuthentication(app) {
  // Enabling this only when configured lets the API run locally before Clerk keys are added.
  if (process.env.CLERK_SECRET_KEY) {
    app.use(clerkMiddleware());
  }
}

module.exports = { configureAuthentication };
