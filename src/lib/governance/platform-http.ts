import {
  PLATFORM_CORS,
  requirePlatformAuth,
  requirePlatformScope,
  type PlatformJwtClaims,
} from "@/lib/governance/platform-jwt";

export const platformCors = PLATFORM_CORS;

export const platformOptions = async () => new Response(null, { status: 204, headers: PLATFORM_CORS });

export function jsonOk(data: unknown, status = 200) {
  return Response.json({ success: true, data }, { status, headers: PLATFORM_CORS });
}

export function jsonErr(error: string, status: number) {
  return Response.json({ success: false, error }, { status, headers: PLATFORM_CORS });
}

export async function withPlatformAuth(
  request: Request,
  scope: string | null,
  fn: (claims: PlatformJwtClaims) => Promise<unknown>,
): Promise<Response> {
  const auth = scope ? requirePlatformScope(request, scope) : requirePlatformAuth(request);
  if ("response" in auth) return auth.response;
  try {
    return jsonOk(await fn(auth.claims));
  } catch (e) {
    return jsonErr(e instanceof Error ? e.message : String(e), 500);
  }
}
