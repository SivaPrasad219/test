// healthCheck.js
const Router = require("koa-router");
const router = new Router(); // No prefix, so endpoint is /health

async function checkDependencies() {
  return { system: "UP" }; // Simple check, no DB dependency
}

router.get("/health", async (ctx) => {
  console.log("Health endpoint called"); // Debug log
  try {
    const dependencies = await checkDependencies();
    const isHealthy = Object.values(dependencies).every(
      (status) => status === "UP"
    );

    ctx.status = isHealthy ? 200 : 500;
    ctx.body = {
      service: "Asset Manager",
      status: isHealthy ? "UP" : "DOWN",
      uptime: process.uptime(),
      timestamp: new Date(),
      dependencies,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      service: "Asset Manager",
      status: "DOWN",
      uptime: process.uptime(),
      timestamp: new Date(),
      error: error.message,
    };
  }
});

module.exports = router;
