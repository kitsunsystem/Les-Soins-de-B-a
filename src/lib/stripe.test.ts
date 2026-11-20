import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { verifyStripeSignature } = await import("./stripe");

const secret = "whsec_test";
const payload = JSON.stringify({ type: "checkout.session.completed", data: { object: { id: "cs_1" } } });
const sign = (t: number, body = payload, key = secret) => createHmac("sha256", key).update(`${t}.${body}`).digest("hex");

describe("verifyStripeSignature", () => {
  const now = 1_800_000_000_000;
  const t = Math.floor(now / 1000);
  it("accepte une notification signée par Stripe", () => {
    expect(verifyStripeSignature(payload, `t=${t},v1=${sign(t)}`, secret, now)).toBe(true);
  });
  it("refuse une signature fausse, un contenu modifié ou une notification trop ancienne", () => {
    expect(verifyStripeSignature(payload, `t=${t},v1=${sign(t, payload, "autre")}`, secret, now)).toBe(false);
    expect(verifyStripeSignature(payload.replace("cs_1", "cs_2"), `t=${t},v1=${sign(t)}`, secret, now)).toBe(false);
    expect(verifyStripeSignature(payload, `t=${t - 600},v1=${sign(t - 600)}`, secret, now)).toBe(false);
    expect(verifyStripeSignature(payload, null, secret, now)).toBe(false);
  });
});
