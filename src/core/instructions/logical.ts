// instruções lógicas bitwise

import { InstructionContext } from ".";

export function executeAND(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const dst = instruction.args[0] as string;
  const src = instruction.args[1];
  const val = ctx.readRegister(dst) & ctx.getOperandValue(src);
  const final = val & 0xffff;

  ctx.writeRegister(dst, final);
  ctx.updateFlags(final, false);

  ctx.markRegChanged(dst);
  ctx.markFlagChanged("ZF");
  ctx.markFlagChanged("SF");
  ctx.markFlagChanged("CF");
  ctx.nextIP();

  return `AND ${dst}, ${ctx.formatOperand(src)} → ${dst} = 0x${final
    .toString(16)
    .toUpperCase()}`;
}

export function executeOR(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const dst = instruction.args[0] as string;
  const src = instruction.args[1];
  const result = ctx.readRegister(dst) | ctx.getOperandValue(src);
  const final = result & 0xffff;

  ctx.writeRegister(dst, final);
  ctx.updateFlags(final, false);

  ctx.markRegChanged(dst);
  ctx.markFlagChanged("ZF");
  ctx.markFlagChanged("SF");
  ctx.markFlagChanged("CF");
  ctx.nextIP();

  return `OR ${dst}, ${ctx.formatOperand(src)} → ${dst} = 0x${final
    .toString(16)
    .toUpperCase()}`;
}

export function executeXOR(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const dst = instruction.args[0] as string;
  const src = instruction.args[1];
  const result = ctx.readRegister(dst) ^ ctx.getOperandValue(src);
  const final = result & 0xffff;

  ctx.writeRegister(dst, final);
  ctx.updateFlags(final, false);

  ctx.markRegChanged(dst);
  ctx.markFlagChanged("ZF");
  ctx.markFlagChanged("SF");
  ctx.markFlagChanged("CF");
  ctx.nextIP();

  return `XOR ${dst}, ${ctx.formatOperand(src)} → ${dst} = 0x${final
    .toString(16)
    .toUpperCase()}`;
}

export function executeNOT(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const reg = instruction.args[0] as string;
  const result = ~ctx.readRegister(reg) & 0xffff;

  ctx.writeRegister(reg, result);
  ctx.markRegChanged(reg);
  ctx.nextIP();

  return `NOT ${reg} → ${reg} = 0x${result.toString(16).toUpperCase()}`;
}

export function executeCMP(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const op1 = instruction.args[0];
  const op2 = instruction.args[1];
  const v1 = ctx.getOperandValue(op1);
  const v2 = ctx.getOperandValue(op2);
  const res = v1 - v2; // subtração sem guardar o resultado

  ctx.updateFlags(res & 0xffff, res < 0);

  ctx.markFlagChanged("ZF");
  ctx.markFlagChanged("SF");
  ctx.markFlagChanged("CF");
  ctx.nextIP();

  return `CMP ${ctx.formatOperand(op1)}, ${ctx.formatOperand(
    op2
  )} → Flags atualizadas`;
}
