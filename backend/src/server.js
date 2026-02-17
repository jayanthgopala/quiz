import { app } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";

async function bootstrap() {
  await connectDb(env.mongoUri);
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", err);
  process.exit(1);
});
