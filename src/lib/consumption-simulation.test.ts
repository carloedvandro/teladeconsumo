import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { formatConsumption, simulatedUsage } from "./consumption-simulation";

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

describe("consumption formatting", () => {
  it("shows exact extremes without decimals", () => {
    assert.equal(formatConsumption(0), "0");
    assert.equal(formatConsumption(50), "50");
    assert.equal(formatConsumption(100), "100");
  });
  it("always keeps two decimal places when there is a fraction", () => {
    assert.equal(formatConsumption(5.1), "5.10");
    assert.equal(formatConsumption(18.96), "18.96");
    assert.equal(formatConsumption(0.3), "0.30");
    assert.equal(formatConsumption(745.61), "745.61");
    assert.equal(formatConsumption(53.78), "53.78");
  });
  it("rounds tiny fractions to the nearest hundredth", () => {
    assert.equal(formatConsumption(0.004), "0");
    assert.equal(formatConsumption(99.996), "100");
  });
});
