import { describe, it, expect } from "bun:test";
import { simulatedUsage } from "./consumption-simulation";

describe("consumption simulator", () => {
  it("starts with no usage at zero", () => {
    expect(simulatedUsage(0, 70, 48.8)).toBe(0);
  });
  it("progressively consumes the allowance and carried balance", () => {
    expect(simulatedUsage(50, 70, 48.8)).toBe(59.4);
  });
  it("reaches both allowances at 100 percent", () => {
    expect(simulatedUsage(100, 70, 48.8)).toBe(118.8);
  });
});