import { Instruction, CPUState, FlagName } from "../types";


type RegisterOrValue = string | number;
type Operand = string | number | null | undefined;

// Funções de acesso a registradores
type ReadRegister = (name: RegisterOrValue) => number;
type WriteRegister = (name: string, value: number) => void;

// Funções de controle de flags
type UpdateFlags = (value: number, carry?: boolean) => void;
type MarkRegChanged = (reg: string) => void;
type MarkFlagChanged = (flag: FlagName) => void;

// Função de controle de fluxo
type NextIP = () => void;

// Funções de formatação e operandos
type GetOperandValue = (operand: Operand) => number;
type FormatOperand = (operand: Operand) => string;

/**
 * Contexto de execução de instruções
 * Contém estado e funções auxiliares para executar uma instrução
 * a lógica(contexto nmrl) se repetirá em todas as instruções, mantendo tudo padronizado
 */
export interface InstructionContext {
  instruction: Instruction;
  state: CPUState;
  readRegister: ReadRegister;
  writeRegister: WriteRegister;
  updateFlags: UpdateFlags;
  markRegChanged: MarkRegChanged;
  markFlagChanged: MarkFlagChanged;
  nextIP: NextIP;
  getOperandValue: GetOperandValue;
  formatOperand: FormatOperand;
}

export * from "./arithmetic";
export * from "./logical";
export * from "./control";
export * from "./data-transfer";
export { executeInstruction } from "./execute";
