import { auth } from "@/auth";
import { SignJWT } from "jose";

export const dynamic = "force-dynamic";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";
const sharedSecret = new TextEncoder().encode(
  process.env.AUTH_SHARED_SECRET ??
    "dev-local-shared-secret-please-change-0123456789"
);

// Backend-for-frontend proxy: authenticate the session, mint a short-lived
// HS256 JWT for the logged-in user, and forward the request to the Spring Boot
// API. The browser never sees the backend token.
async function proxy(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ message: "未登入，請先以 Google 登入" }, { status: 401 });
  }

  const { path } = await ctx.params;
  const search = new URL(req.url).search;
  const target = `${API_BASE_URL}/api/${path.join("/")}${search}`;

  const token = await new SignJWT({
    email: session.user?.email ?? undefined,
    name: session.user?.name ?? undefined,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("2m")
    .sign(sharedSecret);

  const headers: Record<string, string> = { authorization: `Bearer ${token}` };
  const contentType = req.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    cache: "no-store",
  });

  const body = await upstream.arrayBuffer();
  const respHeaders = new Headers();
  const ct = upstream.headers.get("content-type");
  if (ct) respHeaders.set("content-type", ct);
  return new Response(body, { status: upstream.status, headers: respHeaders });
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as DELETE,
  proxy as PATCH,
};
