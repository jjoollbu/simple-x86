// instruções de movimentação de dados
// MOV, PUSH, POP
// faltou XCHG

import { InstructionContext } from ".";

export function executeMOV(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const dest = instruction.args[0];
  const src = instruction.args[1];
  const value = ctx.getOperandValue(src);

  // só funciona com registradores por enquanto
  if (typeof dest === "string") {
    ctx.writeRegister(dest, value);
    ctx.markRegChanged(dest);
  }

  ctx.nextIP();
  return `MOV ${ctx.formatOperand(dest)}, ${ctx.formatOperand(
    src
  )} → ${dest} = 0x${value.toString(16).toUpperCase()}`;
}

export function executePUSH(
  ctx: InstructionContext,
  push: (value: number) => void
): string {
  const { instruction } = ctx;
  const value = ctx.getOperandValue(instruction.args[0]);

  push(value);
  ctx.markRegChanged("SP");
  ctx.nextIP();

  return `PUSH ${ctx.formatOperand(instruction.args[0])} → Stack: 0x${value
    .toString(16)
    .toUpperCase()}`;
}

export function executePOP(ctx: InstructionContext, pop: () => number): string {
  const { instruction } = ctx;
  const dest = instruction.args[0];
  const value = pop();

  if (typeof dest === "string") {
    ctx.writeRegister(dest, value);
    ctx.markRegChanged(dest);
    ctx.markRegChanged("SP");
  }

  ctx.nextIP();
  return `POP ${ctx.formatOperand(dest)} → ${dest} = 0x${value
    .toString(16)
    .toUpperCase()}`;
}
