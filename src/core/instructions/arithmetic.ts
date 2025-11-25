// instruções aritméticas básicas
// ADD, SUB, INC, DEC, MUL, DIV, NEG

import { InstructionContext } from ".";

export function executeADD(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const dst = instruction.args[0] as string;
  const src = instruction.args[1];
  const v1 = ctx.readRegister(dst);
  const v2 = ctx.getOperandValue(src);
  const result = v1 + v2;
  const final = result & 0xffff; // mask pra 16 bits

  ctx.writeRegister(dst, final);
  ctx.updateFlags(final, result > 0xffff);

  ctx.markRegChanged(dst);
  ctx.markFlagChanged("ZF");
  ctx.markFlagChanged("SF");
  ctx.markFlagChanged("CF");
  ctx.nextIP();

  return `ADD ${dst}, ${ctx.formatOperand(src)} → ${dst} = 0x${final
    .toString(16)
    .toUpperCase()}`;
}

export function executeSUB(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const dst = instruction.args[0] as string;
  const src = instruction.args[1];
  const v1 = ctx.readRegister(dst);
  const v2 = ctx.getOperandValue(src);
  const result = v1 - v2;
  const final = result & 0xffff;

  ctx.writeRegister(dst, final);
  ctx.updateFlags(final, result < 0);

  ctx.markRegChanged(dst);
  ctx.markFlagChanged("ZF");
  ctx.markFlagChanged("SF");
  ctx.markFlagChanged("CF");
  ctx.nextIP();

  return `SUB ${dst}, ${ctx.formatOperand(src)} → ${dst} = 0x${final
    .toString(16)
    .toUpperCase()}`;
}

export function executeINC(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const reg = instruction.args[0] as string;
  const value = (ctx.readRegister(reg) + 1) & 0xffff;

  ctx.writeRegister(reg, value);
  ctx.updateFlags(value);

  ctx.markRegChanged(reg);
  ctx.markFlagChanged("ZF");
  ctx.markFlagChanged("SF");
  ctx.nextIP();

  return `INC ${reg} → ${reg} = 0x${value.toString(16).toUpperCase()}`;
}

export function executeDEC(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const reg = instruction.args[0] as string;
  const value = (ctx.readRegister(reg) - 1) & 0xffff;

  ctx.writeRegister(reg, value);
  ctx.updateFlags(value);

  ctx.markRegChanged(reg);
  ctx.markFlagChanged("ZF");
  ctx.markFlagChanged("SF");
  ctx.nextIP();

  return `DEC ${reg} → ${reg} = 0x${value.toString(16).toUpperCase()}`;
}

export function executeMUL(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const src = instruction.args[0];
  const ax = ctx.readRegister("AX");
  const value = ctx.getOperandValue(src);
  const result = ax * value;

  ctx.writeRegister("AX", result & 0xffff);
  ctx.writeRegister("DX", (result >> 16) & 0xffff);

  ctx.updateFlags(result & 0xffff, result > 0xffff);

  ctx.markRegChanged("AX");
  ctx.markRegChanged("DX");
  ctx.markFlagChanged("CF");
  ctx.markFlagChanged("OF");
  ctx.nextIP();

  return `MUL ${ctx.formatOperand(src)} → AX:DX = 0x${result
    .toString(16)
    .toUpperCase()}`;
}

export function executeDIV(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const src = instruction.args[0];
  const divisor = ctx.getOperandValue(src);


  if (divisor === 0) {
    throw new Error("Divisão por zero");
  }

  const ax = ctx.readRegister("AX");
  const dx = ctx.readRegister("DX");
  const dividend = (dx << 16) | ax;

  const quotient = Math.floor(dividend / divisor) & 0xffff;
  const remainder = dividend % divisor & 0xffff;

  ctx.writeRegister("AX", quotient);
  ctx.writeRegister("DX", remainder);

  ctx.markRegChanged("AX");
  ctx.markRegChanged("DX");
  ctx.nextIP();

  return `DIV ${ctx.formatOperand(src)} → AX = 0x${quotient
    .toString(16)
    .toUpperCase()}, DX = 0x${remainder.toString(16).toUpperCase()}`;
}

export function executeNEG(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const reg = instruction.args[0] as string;
  const value = -ctx.readRegister(reg) & 0xffff;

  ctx.writeRegister(reg, value);
  ctx.updateFlags(value);

  ctx.markRegChanged(reg);
  ctx.markFlagChanged("ZF");
  ctx.markFlagChanged("SF");
  ctx.nextIP();

  return `NEG ${reg} → ${reg} = 0x${value.toString(16).toUpperCase()}`;
}
