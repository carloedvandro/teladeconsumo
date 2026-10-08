import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { simulatedUsage } from "./consumption-simulation";

describe("consumption simulator", () => {
  it("starts with no usage at zero", () => {
    assert.equal(simulatedUsage(0, 70, 48.8), 0);
  });
  it("progressively consumes the allowance and carried balance", () => {
    assert.equal(simulatedUsage(50, 70, 48.8), 59.4);
  });
  it("reaches both allowances at 100 percent", () => {
    assert.equal(simulatedUsage(100, 70, 48.8), 118.8);
  });
});