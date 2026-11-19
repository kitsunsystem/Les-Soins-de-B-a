import { describe, expect, it } from "vitest";
import { phoneKey } from "./phone";

describe("phoneKey", () => {
  it("ramène les différents formats au même numéro", () => {
    for (const v of ["06 11 22 33 44", "06.11.22.33.44", "0611223344", "+33 6 11 22 33 44", "0033611223344", "+33 (0)6 11 22 33 44".replace("(0)", "")]) {
      expect(phoneKey(v)).toBe("0611223344");
    }
  });
  it("ignore les saisies trop courtes", () => {
    expect(phoneKey("12")).toBe("");
    expect(phoneKey("")).toBe("");
  });
});
