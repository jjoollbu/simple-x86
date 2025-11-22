/**
 * Utilitário para formatar instruções completas
 */

import type { Instruction } from "../types";
import { formatOperand } from "./formatOperand";


export function formatInstruction(instr: Instruction): string {
  const args = instr.args
    .filter((a) => a !== null && a !== undefined)
    .map((a) => formatOperand(a))
    .join(", ");
  return `${instr.op}${args ? " " + args : ""}`;
}
