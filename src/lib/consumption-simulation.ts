export function formatConsumption(value: number) {
  // Regra do usuário: número inteiro quando não há fração (0, 50, 100);
  // quando há diferença, sempre um decimal com ponto (5.1, 0.3, 10.8).
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function simulatedUsage(percent: number, allowance: number, carried: number) {
  return (Math.max(0, Math.min(100, percent)) / 100) * (allowance + carried);
}
