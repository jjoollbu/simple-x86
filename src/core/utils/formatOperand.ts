/**
 * Utilitário para formatar operandos de instruções
 */


export function formatOperand(
  operand: string | number | null | undefined
): string {
  if (operand === null || operand === undefined) return "null";
  if (typeof operand === "number") {
    return `0x${operand.toString(16).toUpperCase()}`;
  }
  return operand;
}
