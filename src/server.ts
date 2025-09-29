import "dotenv/config";
import { buildApp } from "./app";
import { loadConfig } from "./services/config";

async function main() {
  try {
    console.log("server: starting");

    // Load SSM Parameter Store values once at startup
    await loadConfig();
    console.log("server: config loaded");

    const app = buildApp();
    console.log("server: app built, about to listen");

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`API listening on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Fatal startup error:", err);
    process.exit(1);
  }
}

main();