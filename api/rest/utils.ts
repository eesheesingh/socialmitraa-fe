import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { authenticateRequest } from "../kimi/auth";
import type { User } from "@db/schema";

export async function getUser(req: Request): Promise<User | undefined> {
  try {
    return await authenticateRequest(req.headers);
  } catch {
    return undefined;
  }
}

export function requireAuth(user?: User): User {
  if (!user) {
    throw new HTTPException(401, { message: "Authentication required" });
  }
  return user;
}

export function requireRole(user: User, role: string): User {
  if (user.role !== role) {
    throw new HTTPException(403, { message: "Insufficient permissions" });
  }
  return user;
}

export function handleError(c: Context, error: unknown) {
  if (error instanceof HTTPException) {
    return c.json({ error: error.message }, error.status);
  }
  const message = error instanceof Error ? error.message : "Internal server error";
  console.error("[REST]", error);
  return c.json({ error: message }, 500);
}
