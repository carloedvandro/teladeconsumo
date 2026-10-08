export function formatConsumption(value: number) {
  // Regra do usuário: número inteiro nos extremos exatos (0, 100);
  // qualquer outro valor sempre com duas casas decimais e ponto (18.96, 745.61).
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

export function simulatedUsage(percent: number, allowance: number, carried: number) {
  return (Math.max(0, Math.min(100, percent)) / 100) * (allowance + carried);
}
