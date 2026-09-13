import assert from "node:assert/strict";
import test from "node:test";
import { createHmac, createPublicKey, createVerify, generateKeyPairSync, sign } from "node:crypto";

function restCanonical(method: string, path: string, timestamp: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${timestamp}\n${method.toUpperCase()}\n${p}`;
}

function hmacHex(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

test("REST HMAC canonical verifies GET without body", () => {
  const secret = "b".repeat(32);
  const ts = String(Math.floor(Date.now() / 1000));
  const path = "/api/platform/overview";
  const canonical = restCanonical("GET", path, ts);
  const hex = hmacHex(secret, canonical);
  assert.equal(hex.length, 64);
  assert.equal(hmacHex(secret, canonical), hex);
  assert.notEqual(hmacHex("c".repeat(32), canonical), hex);
});

test("REST HMAC of X-Bridge-Path matches even if request URL is rewritten", () => {
  const secret = "d".repeat(32);
  const ts = "1710000000";
  const signedPath = "/api/platform/whoami";
  const hex = hmacHex(secret, restCanonical("GET", signedPath, ts));
  const rewritten = restCanonical("GET", "/_server/api/platform/whoami", ts);
  assert.notEqual(hmacHex(secret, rewritten), hex);
  assert.equal(hmacHex(secret, restCanonical("GET", signedPath, ts)), hex);
});

test("webhook ping body HMAC is sha256 hex of raw JSON", () => {
  const secret = "e".repeat(32);
  const raw = JSON.stringify({ type: "ping", payload: {}, ts: "x", source: "governance" });
  const hex = hmacHex(secret, raw);
  assert.match(hex, /^[0-9a-f]{64}$/);
  assert.equal(`sha256=${hex}`.startsWith("sha256="), true);
});

test("matching RSA keypair verifies RS256 JWT the Casino way", () => {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: "tols-governance",
    aud: "tols-casino",
    sub: "tols-governance",
    iat: now,
    exp: now + 300,
    jti: "testjti1",
    role: "platform",
  };
  const encode = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const input = `${encode(header)}.${encode(claims)}`;
  const sig = sign("RSA-SHA256", Buffer.from(input), privateKey);
  const pem = publicKey.export({ type: "spki", format: "pem" }).toString();
  const key = createPublicKey(pem);
  const verifier = createVerify("RSA-SHA256");
  verifier.update(input);
  verifier.end();
  assert.equal(verifier.verify(key, sig), true);
});

test("mismatched RSA public key fails verify", () => {
  const a = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const b = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const now = Math.floor(Date.now() / 1000);
  const encode = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const input = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ iss: "tols-governance", aud: "tols-casino", iat: now, exp: now + 300 })}`;
  const sig = sign("RSA-SHA256", Buffer.from(input), a.privateKey);
  const key = createPublicKey(b.publicKey.export({ type: "spki", format: "pem" }).toString());
  const verifier = createVerify("RSA-SHA256");
  verifier.update(input);
  verifier.end();
  assert.equal(verifier.verify(key, sig), false);
});

test("derived public key from private key verifies the JWT", () => {
  const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const now = Math.floor(Date.now() / 1000);
  const encode = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const input = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ iss: "tols-governance", aud: "tols-casino", iat: now, exp: now + 300, jti: "x" })}`;
  const sig = sign("RSA-SHA256", Buffer.from(input), pair.privateKey);
  const derived = createPublicKey(pair.privateKey).export({ type: "spki", format: "pem" }).toString();
  const key = createPublicKey(derived);
  const verifier = createVerify("RSA-SHA256");
  verifier.update(input);
  verifier.end();
  assert.equal(verifier.verify(key, sig), true);
});
