import { describe, expect, it } from "vitest";
import { round, roundDown, roundUp, toInteger } from "./utils";

describe("utils", () => {
  it("rounds to the nearest multiple", () => {
    expect(round(23, 10)).toBe(20);
    expect(round(27, 10)).toBe(30);
  });

  it("rounds down and up to multiples", () => {
    expect(roundDown(23, 10)).toBe(20);
    expect(roundUp(23, 10)).toBe(30);
  });

  it("coerces values to integers with a minimum", () => {
    expect(toInteger(4.6)).toBe(5);
    expect(toInteger(0.4, 2)).toBe(2);
    expect(toInteger(Number.NaN, 3)).toBe(3);
    expect(toInteger(Number.POSITIVE_INFINITY, 4)).toBe(4);
    expect(toInteger(5, Number.NaN)).toBeNaN();
  });
});
