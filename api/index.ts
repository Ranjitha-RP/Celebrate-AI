import type { IncomingMessage, ServerResponse } from "http";
import { getExpressApiApp } from "../server.ts";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getExpressApiApp();
  return app(req as never, res as never);
}
