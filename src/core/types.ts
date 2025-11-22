/**
 * Tipos para o Simulador x86 em Modo Real
 * Versão organizada com foco em didática e visualização
 */

// ============================================================================
// REGISTRADORES
// ============================================================================

export type GeneralRegister = "AX" | "BX" | "CX" | "DX";
export type PointerRegister = "SP" | "BP" | "SI" | "DI";
export type SegmentRegister = "CS" | "DS" | "SS" | "ES";
export type RegisterName =
  | GeneralRegister
  | PointerRegister
  | SegmentRegister
  | "IP";

export interface Registers {
  general: {
    AX: number;
    BX: number;
    CX: number;
    DX: number;
  };
  pointer: {
    SP: number;
    BP: number;
    SI: number;
    DI: number;
  };
  segment: {
    CS: number;
    DS: number;
    SS: number;
    ES: number;
  };
  IP: number;
}

// ============================================================================
// FLAGS
// ============================================================================

export interface Flags {
  ZF: boolean; // Zero Flag
  CF: boolean; // Carry Flag
  SF: boolean; // Sign Flag
  OF: boolean; // Overflow Flag
}

export type FlagName = keyof Flags;

// ============================================================================
// INSTRUÇÕES
// ============================================================================

export interface Instruction {
  op: string;
  args: (string | number | null)[];
  address?: number; 
  bytes: number[]; 
  size: number; 
}

// ============================================================================
// BARRAMENTO
// ============================================================================

export type BusOperationType = "FETCH" | "READ" | "WRITE" | "DECODE";
export type BusType = "ADDRESS" | "DATA" | "CONTROL";

export interface BusOperation {
  step: number;
  type: BusOperationType;
  busType: BusType;
  address: number;
  data?: number;
  description: string;
  direction: "→" | "←"; // CPU → Memória ou Memória → CPU
}

// ============================================================================
// ENDEREÇAMENTO
// ============================================================================

export interface AddressCalculation {
  segment: number;
  offset: number;
  physical: number;
  formula: string; // Ex: "CS:IP = 0x1000:0x0000 = 0x10000"
}

// ============================================================================
// MEMÓRIA
// ============================================================================

export interface MemoryAccess {
  type: "READ" | "WRITE";
  address: number;
  value: number;
  size: number; 
}

// ============================================================================
// ESTADO DA CPU
// ============================================================================

export interface CPUState {
  registers: Registers;
  flags: Flags;
  halted: boolean;
  cycles: number;
}

// ============================================================================
// TRACE DE EXECUÇÃO
// ============================================================================

export interface ExecutionTrace {
  instruction: Instruction;
  instructionText: string;

  // Estado antes e depois
  stateBefore: CPUState;
  stateAfter: CPUState;

  // Registradores modificados
  changedRegisters: RegisterName[];
  changedFlags: FlagName[];

  // Operações de barramento
  busOperations: BusOperation[];

  // Cálculo de endereçamento
  addressCalculations: AddressCalculation[];

  // Acessos à memória
  memoryAccesses: MemoryAccess[];

  description: string;
}

// ============================================================================
// RESULTADO DE PARSE
// ============================================================================

export interface ParseResult {
  instructions: Instruction[];
  labels: Map<string, number>;
  errors: ParseError[];
}

export interface ParseError {
  line: number;
  message: string;
  code: string;
}

// ============================================================================
// INTERFACE DA CPU
// ============================================================================

export interface MemoryInterface {
  data: Uint8Array;
  size: number;
  readByte(address: number): number;
  writeByte(address: number, value: number): void;
  readWord(address: number): number;
  writeWord(address: number, value: number): void;
}

export interface ICPU {
  state: CPUState;
  memory: MemoryInterface;
  program: Instruction[];
  trace: ExecutionTrace[];

  loadProgram(instructions: Instruction[]): void;
  step(): ExecutionTrace | null;
  run(maxSteps?: number): void;
  reset(): void;

  getMemoryByte(address: number): number;
  setMemoryByte(address: number, value: number): void;
  getMemoryWord(address: number): number;
  setMemoryWord(address: number, value: number): void;
}
