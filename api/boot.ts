import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";
import brandsRest from "./rest/brands";
import influencersRest from "./rest/influencers";
import campaignsRest from "./rest/campaigns";
import paymentsRest from "./rest/payments";
import bartersRest from "./rest/barters";
import consentsRest from "./rest/consents";
import matchesRest from "./rest/matches";
import affiliatesRest from "./rest/affiliates";
import roisRest from "./rest/rois";
import adminRest from "./rest/admin";
import instagramsRest from "./rest/instagrams";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get(Paths.oauthCallback, createOAuthCallbackHandler());

// REST API routes (migration away from tRPC)
app.route("/api/rest/brands", brandsRest);
app.route("/api/rest/influencers", influencersRest);
app.route("/api/rest/campaigns", campaignsRest);
app.route("/api/rest/payments", paymentsRest);
app.route("/api/rest/barters", bartersRest);
app.route("/api/rest/consents", consentsRest);
app.route("/api/rest/matches", matchesRest);
app.route("/api/rest/affiliates", affiliatesRest);
app.route("/api/rest/rois", roisRest);
app.route("/api/rest/admin", adminRest);
app.route("/api/rest/instagrams", instagramsRest);

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
