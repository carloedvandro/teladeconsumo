export function formatConsumption(value: number) {
  return String(Number(value.toFixed(2)));
}

export function simulatedUsage(percent: number, allowance: number, carried: number) {
  return (Math.max(0, Math.min(100, percent)) / 100) * (allowance + carried);
}