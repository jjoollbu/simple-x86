/**
 * Dispatcher Central de Execução
 * Delega a execução para os handlers de instrução específicos
 */

import * as Arithmetic from "./arithmetic";
import * as Logical from "./logical";
import * as Control from "./control";
import * as DataTransfer from "./data-transfer";
import { InstructionContext } from ".";


function tryHandleArithmetic(ctx: InstructionContext): string | null {
  const opcode = ctx.instruction.op.toUpperCase();

  switch (opcode) {
    case "ADD":
      return Arithmetic.executeADD(ctx);
    case "SUB":
      return Arithmetic.executeSUB(ctx);
    case "INC":
      return Arithmetic.executeINC(ctx);
    case "DEC":
      return Arithmetic.executeDEC(ctx);
    case "MUL":
      return Arithmetic.executeMUL(ctx);
    case "DIV":
      return Arithmetic.executeDIV(ctx);
    case "NEG":
      return Arithmetic.executeNEG(ctx);
    default:
      return null;
  }
}


function tryHandleLogical(ctx: InstructionContext): string | null {
  const opcode = ctx.instruction.op.toUpperCase();

  switch (opcode) {
    case "AND":
      return Logical.executeAND(ctx);
    case "OR":
      return Logical.executeOR(ctx);
    case "XOR":
      return Logical.executeXOR(ctx);
    case "NOT":
      return Logical.executeNOT(ctx);
    case "CMP":
      return Logical.executeCMP(ctx);
    default:
      return null;
  }
}


function tryHandleControl(
  ctx: InstructionContext,
  push: (value: number) => void,
  pop: () => number
): string | null {
  const opcode = ctx.instruction.op.toUpperCase();

  switch (opcode) {
    case "JMP":
      return Control.executeJMP(ctx);
    case "JE":
    case "JZ":
      return Control.executeJE(ctx);
    case "JNE":
    case "JNZ":
      return Control.executeJNE(ctx);
    case "JG":
      return Control.executeJG(ctx);
    case "JGE":
      return Control.executeJGE(ctx);
    case "JL":
      return Control.executeJL(ctx);
    case "JLE":
      return Control.executeJLE(ctx);
    case "CALL":
      return Control.executeCALL(ctx, push);
    case "RET":
      return Control.executeRET(ctx, pop);
    case "LOOP":
      return Control.executeLOOP(ctx);
    case "NOP":
      return Control.executeNOP(ctx);
    case "HLT":
      return Control.executeHLT(ctx);
    default:
      return null;
  }
}


function tryHandleDataTransfer(
  ctx: InstructionContext,
  push: (value: number) => void,
  pop: () => number
): string | null {
  const opcode = ctx.instruction.op.toUpperCase();

  switch (opcode) {
    case "MOV":
      return DataTransfer.executeMOV(ctx);
    case "PUSH":
      return DataTransfer.executePUSH(ctx, push);
    case "POP":
      return DataTransfer.executePOP(ctx, pop);
    default:
      return null;
  }
}


export function executeInstruction(
  ctx: InstructionContext,
  push: (value: number) => void,
  pop: () => number
): string {
  // Tenta cada categoria de instrução
  let result: string | null = null;

  result = tryHandleArithmetic(ctx);
  if (result !== null) return result;

  result = tryHandleLogical(ctx);
  if (result !== null) return result;

  result = tryHandleControl(ctx, push, pop);
  if (result !== null) return result;

  result = tryHandleDataTransfer(ctx, push, pop);
  if (result !== null) return result;

  // Instrução desconhecida
  ctx.nextIP();
  return `Instrução desconhecida: ${ctx.instruction.op}`;
}
