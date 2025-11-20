/**
 * Instruções de Controle de Fluxo
 * JMP, JE/JZ, JNE/JNZ, JG, JL, CALL, RET, LOOP, NOP, HLT
 */

import { InstructionContext } from ".";

export function executeJMP(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const target = ctx.getOperandValue(instruction.args[0]);

  ctx.state.registers.IP = target;
  ctx.markRegChanged("IP");

  return `JMP ${ctx.formatOperand(instruction.args[0])} → IP = 0x${target
    .toString(16)
    .toUpperCase()}`;
}

export function executeJE(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const target = ctx.getOperandValue(instruction.args[0]);

  if (ctx.state.flags.ZF) {
    ctx.state.registers.IP = target;
    ctx.markRegChanged("IP");
    return `JE ${ctx.formatOperand(
      instruction.args[0]
    )} → Saltou para 0x${target.toString(16).toUpperCase()}`;
  } else {
    ctx.nextIP();
    return `JE ${ctx.formatOperand(instruction.args[0])} → Não saltou (ZF=0)`;
  }
}

export function executeJNE(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const target = ctx.getOperandValue(instruction.args[0]);

  if (!ctx.state.flags.ZF) {
    ctx.state.registers.IP = target;
    ctx.markRegChanged("IP");
    return `JNE ${ctx.formatOperand(
      instruction.args[0]
    )} → Saltou para 0x${target.toString(16).toUpperCase()}`;
  } else {
    ctx.nextIP();
    return `JNE ${ctx.formatOperand(instruction.args[0])} → Não saltou (ZF=1)`;
  }
}

export function executeJG(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const target = ctx.getOperandValue(instruction.args[0]);

  if (!ctx.state.flags.ZF && ctx.state.flags.SF === ctx.state.flags.OF) {
    ctx.state.registers.IP = target;
    ctx.markRegChanged("IP");
    return `JG ${ctx.formatOperand(instruction.args[0])} → Saltou`;
  } else {
    ctx.nextIP();
    return `JG ${ctx.formatOperand(instruction.args[0])} → Não saltou`;
  }
}

export function executeJL(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const target = ctx.getOperandValue(instruction.args[0]);

  if (ctx.state.flags.SF !== ctx.state.flags.OF) {
    ctx.state.registers.IP = target;
    ctx.markRegChanged("IP");
    return `JL ${ctx.formatOperand(instruction.args[0])} → Saltou`;
  } else {
    ctx.nextIP();
    return `JL ${ctx.formatOperand(instruction.args[0])} → Não saltou`;
  }
}

export function executeJGE(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const target = ctx.getOperandValue(instruction.args[0]);

  // JGE: Salta se maior ou igual (SF = OF)
  if (ctx.state.flags.SF === ctx.state.flags.OF) {
    ctx.state.registers.IP = target;
    ctx.markRegChanged("IP");
    return `JGE ${ctx.formatOperand(instruction.args[0])} → Saltou`;
  } else {
    ctx.nextIP();
    return `JGE ${ctx.formatOperand(instruction.args[0])} → Não saltou`;
  }
}

export function executeJLE(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const target = ctx.getOperandValue(instruction.args[0]);

  // JLE: Salta se menor ou igual (ZF = 1 OU SF != OF)
  if (ctx.state.flags.ZF || ctx.state.flags.SF !== ctx.state.flags.OF) {
    ctx.state.registers.IP = target;
    ctx.markRegChanged("IP");
    return `JLE ${ctx.formatOperand(instruction.args[0])} → Saltou`;
  } else {
    ctx.nextIP();
    return `JLE ${ctx.formatOperand(instruction.args[0])} → Não saltou`;
  }
}

export function executeCALL(
  ctx: InstructionContext,
  push: (value: number) => void
): string {
  const { instruction } = ctx;
  const target = ctx.getOperandValue(instruction.args[0]);
  // Endereço de retorno = IP atual + tamanho da instrução CALL
  const returnAddr = (ctx.state.registers.IP + instruction.size) & 0xffff;

  push(returnAddr);
  ctx.state.registers.IP = target;

  ctx.markRegChanged("SP");
  ctx.markRegChanged("IP");

  return `CALL ${ctx.formatOperand(instruction.args[0])} → IP = 0x${target
    .toString(16)
    .toUpperCase()}, retorno em 0x${returnAddr.toString(16).toUpperCase()}`;
}

export function executeRET(ctx: InstructionContext, pop: () => number): string {
  const returnAddr = pop();

  ctx.state.registers.IP = returnAddr;

  ctx.markRegChanged("SP");
  ctx.markRegChanged("IP");

  return `RET → IP = 0x${returnAddr.toString(16).toUpperCase()}`;
}

export function executeLOOP(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const target = ctx.getOperandValue(instruction.args[0]);
  const cx = (ctx.readRegister("CX") - 1) & 0xffff;

  ctx.writeRegister("CX", cx);
  ctx.markRegChanged("CX");

  if (cx !== 0) {
    ctx.state.registers.IP = target;
    ctx.markRegChanged("IP");
    return `LOOP ${ctx.formatOperand(
      instruction.args[0]
    )} → CX = ${cx}, saltou`;
  } else {
    ctx.nextIP();
    return `LOOP ${ctx.formatOperand(
      instruction.args[0]
    )} → CX = 0, fim do loop`;
  }
}

export function executeNOP(ctx: InstructionContext): string {
  ctx.nextIP();
  return "NOP → Nenhuma operação";
}

export function executeHLT(ctx: InstructionContext): string {
  ctx.state.halted = true;
  return "HLT → CPU parada";
}
