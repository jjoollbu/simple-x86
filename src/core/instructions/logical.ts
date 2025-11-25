// instruções lógicas 

import { InstructionContext } from ".";

export function executeAND(ctx: InstructionContext): string {
  const { instruction } = ctx;

  // pega registrador destino, por isso a string
  const dst = instruction.args[0] as string;

  // segundo operando
  const src = instruction.args[1];

  // operação AND entre os dois valores
  const val = ctx.readRegister(dst) & ctx.getOperandValue(src);

  // masca para 16 bits
  const final = val & 0xffff;

  // escreve o resultado
  ctx.writeRegister(dst, final);

  // updateFlags
  ctx.updateFlags(final, false);

  // registrar alterações
  ctx.markRegChanged(dst);

  // flags potencialmente afetadas
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

  // operação OR entre os dois valores
  const result = ctx.readRegister(dst) | ctx.getOperandValue(src);

  const final = result & 0xffff;

  ctx.writeRegister(dst, final);

  // flags
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

  // XOR zera bits iguais e mantém bits diferentes
  const result = ctx.readRegister(dst) ^ ctx.getOperandValue(src);

  const final = result & 0xffff;

  ctx.writeRegister(dst, final);

  // flags
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

  // inverte todos os bits (1→0, 0→1)
  const result = ~ctx.readRegister(reg) & 0xffff;

  ctx.writeRegister(reg, result);

  // NOT não envolve flags por padrão
  ctx.markRegChanged(reg);

  ctx.nextIP();

  return `NOT ${reg} → ${reg} = 0x${result.toString(16).toUpperCase()}`;
}

export function executeCMP(ctx: InstructionContext): string {
  const { instruction } = ctx;

  // pega os dois operandos
  const op1 = instruction.args[0];
  const op2 = instruction.args[1];

  // lê os valores dos operandos — não altera registradores
  const v1 = ctx.getOperandValue(op1);
  const v2 = ctx.getOperandValue(op2);

  // subtração apenas para efeito de flags
  const res = v1 - v2;

  // res & 0xffff mantém coerência de tamanho
  ctx.updateFlags(res & 0xffff, res < 0);

  // CMP altera apenas estado de flags
  ctx.markFlagChanged("ZF");
  ctx.markFlagChanged("SF");
  ctx.markFlagChanged("CF");

  ctx.nextIP();

  return `CMP ${ctx.formatOperand(op1)}, ${ctx.formatOperand(
    op2
  )} → Flags atualizadas`;
}
