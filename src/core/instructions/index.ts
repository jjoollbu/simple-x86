/**
 * Instruções x86 - Exportação Centralizada
 * Organização modular por categoria
 */

import { Instruction, CPUState, FlagName } from "../types";

export interface InstructionContext {
  instruction: Instruction;
  state: CPUState;
  readRegister: (name: string | number) => number;
  writeRegister: (name: string, value: number) => void;
  updateFlags: (value: number, carry?: boolean) => void;
  markRegChanged: (reg: string) => void;
  markFlagChanged: (flag: FlagName) => void;
  nextIP: () => void;
  getOperandValue: (operand: string | number | null | undefined) => number;
  formatOperand: (operand: string | number | null | undefined) => string;
}

export * from "./arithmetic";
export * from "./logical";
export * from "./control";
export * from "./data-transfer";
export { executeInstruction } from "./execute";
