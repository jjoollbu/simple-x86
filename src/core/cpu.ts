/**
 * CPU x86 Simplificada - Modo Real
 * Implementa execução passo a passo com trace detalhado de barramentos e memória
 */

import type {
  CPUState,
  Instruction,
  ExecutionTrace,
  BusOperation,
  AddressCalculation,
  RegisterName,
  FlagName,
  ICPU,
} from "./types";
import { Memory, physicalAddress } from "./memory";
import {
  executeInstruction as executeModular,
  InstructionContext,
} from "./instructions";

export class CPU implements ICPU {
  public state: CPUState;
  public memory: Memory; // Expor Memory completa ao invés de apenas data
  public program: Instruction[] = [];
  public trace: ExecutionTrace[] = [];
  private instructionMap: Map<number, Instruction> = new Map(); // Mapeia endereço físico → instrução

  constructor() {
    this.memory = new Memory();
    this.state = this.createInitialState();
  }

  private createInitialState(): CPUState {
    return {
      registers: {
        general: {
          AX: 0,
          BX: 0,
          CX: 0,
          DX: 0,
        },
        pointer: {
          SP: 0xfffe,
          BP: 0,
          SI: 0,
          DI: 0,
        },
        segment: { CS: 0, DS: 0, SS: 0, ES: 0 },
        IP: 0,
      },
      flags: { ZF: false, CF: false, SF: false, OF: false },
      halted: false,
      cycles: 0,
    };
  }

  public reset(): void {
    this.state = this.createInitialState();
    this.memory.reset();
    this.trace = [];
    this.program = [];
    this.instructionMap.clear();
  }

  public loadProgram(instructions: Instruction[]): void {
    // Limpar apenas memória e programa, mantendo registradores
    this.memory.reset();
    this.trace = [];
    this.program = instructions.slice();
    this.instructionMap.clear();

    // Resetar flags e estado de execução
    this.state.halted = false;
    this.state.cycles = 0;
    this.state.registers.IP = 0;

    // Carregar bytes das instruções na memória sequencialmente
    let currentOffset = 0;
    const CS = this.state.registers.segment.CS;

    for (const instruction of instructions) {
      // O parser já definiu instruction.address como offset
      // Calcular endereço físico com CS
      const physAddr = physicalAddress(CS, currentOffset);

      // Guardar mapeamento endereço → instrução
      this.instructionMap.set(physAddr, instruction);

      // Atualizar address com o físico calculado
      instruction.address = physAddr;

      // Escrever bytes da instrução na memória
      for (let i = 0; i < instruction.bytes.length; i++) {
        const byte = instruction.bytes[i];
        if (byte !== undefined) {
          this.memory.writeByte(physAddr + i, byte);
        }
      }

      // Avançar para próxima instrução
      currentOffset += instruction.size;
    }
  }

  // ============================================================================
  // ACESSO A REGISTRADORES
  // ============================================================================

  private readRegister(name: string | number): number {
    if (typeof name === "number") return name & 0xffff;

    const { general, pointer, segment, IP } = this.state.registers;

    if (name in general) return general[name as keyof typeof general] & 0xffff;
    if (name in pointer) return pointer[name as keyof typeof pointer] & 0xffff;
    if (name in segment) return segment[name as keyof typeof segment] & 0xffff;
    if (name === "IP") return IP & 0xffff;

    throw new Error(`Registrador desconhecido: ${name}`);
  }

  private writeRegister(name: string, value: number): void {
    const val = value & 0xffff;
    const { general, pointer, segment } = this.state.registers;

    if (name in general) {
      general[name as keyof typeof general] = val;
      return;
    }
    if (name in pointer) {
      pointer[name as keyof typeof pointer] = val;
      return;
    }
    if (name in segment) {
      segment[name as keyof typeof segment] = val;
      return;
    }
    if (name === "IP") {
      this.state.registers.IP = val;
      return;
    }

    throw new Error(`Registrador desconhecido: ${name}`);
  }

  // ============================================================================
  // ACESSO À MEMÓRIA (COM TRACE)
  // ============================================================================

  public getMemoryByte(address: number): number {
    return this.memory.readByte(address);
  }

  public setMemoryByte(address: number, value: number): void {
    this.memory.writeByte(address, value);
  }

  public getMemoryWord(address: number): number {
    return this.memory.readWord(address);
  }

  public setMemoryWord(address: number, value: number): void {
    this.memory.writeWord(address, value);
  }

  // ============================================================================
  // FLAGS
  // ============================================================================

  private updateFlags(value: number, carry?: boolean): void {
    const val = value & 0xffff;
    this.state.flags.ZF = val === 0;
    this.state.flags.SF = (val & 0x8000) !== 0;
    if (carry !== undefined) {
      this.state.flags.CF = carry;
    }
  }

  // ============================================================================
  // STACK
  // ============================================================================

  private push(value: number): void {
    const sp = this.state.registers.pointer.SP;
    const newSP = (sp - 2) & 0xffff;
    this.state.registers.pointer.SP = newSP;

    const physical = physicalAddress(this.state.registers.segment.SS, newSP);
    this.setMemoryWord(physical, value);
  }

  private pop(): number {
    const sp = this.state.registers.pointer.SP;
    const physical = physicalAddress(this.state.registers.segment.SS, sp);
    const value = this.getMemoryWord(physical);

    this.state.registers.pointer.SP = (sp + 2) & 0xffff;
    return value;
  }

  // ============================================================================
  // EXECUÇÃO DE INSTRUÇÕES
  // ============================================================================

  private getOperandValue(operand: string | number | null | undefined): number {
    if (operand === null || operand === undefined) return 0;
    return this.readRegister(operand);
  }

  public step(): ExecutionTrace | null {
    if (this.state.halted) return null;

    const CS = this.state.registers.segment.CS;
    const IP = this.state.registers.IP;

    // Calcular endereço físico da instrução
    const fetchAddr = physicalAddress(CS, IP);

    // Buscar instrução pelo endereço físico
    const instruction = this.instructionMap.get(fetchAddr);
    if (!instruction) {
      this.state.halted = true;
      return null;
    }

    const stateBefore = this.cloneState();

    // Limpar log de memória antes da execução
    this.memory.clearAccessLog();

    const busOperations: BusOperation[] = [];
    const addressCalculations: AddressCalculation[] = [];
    let stepCounter = 1;

    // Fase 1: BUS END - CPU envia endereço do opcode
    busOperations.push({
      step: stepCounter++,
      type: "FETCH",
      busType: "ADDRESS",
      address: fetchAddr,
      description: `CPU envia endereço`,
      direction: "→",
    });

    // Fase 2: BUS DADOS - Memória envia opcode
    const opcodeByte = instruction.bytes[0] ?? 0;

    // Formatar texto da instrução para exibição
    const instrText = this.formatInstruction(instruction);

    busOperations.push({
      step: stepCounter++,
      type: "FETCH",
      busType: "DATA",
      address: fetchAddr,
      data: opcodeByte,
      description: `${instrText} (Opcode: 0x${opcodeByte
        .toString(16)
        .toUpperCase()
        .padStart(2, "0")})`,
      direction: "←",
    });

    addressCalculations.push({
      segment: CS,
      offset: IP,
      physical: fetchAddr,
      formula: `CS:IP = (0x${CS.toString(
        16
      ).toUpperCase()} × 16) + 0x${IP.toString(
        16
      ).toUpperCase()} = 0x${fetchAddr.toString(16).toUpperCase()}`,
    });

    // Se a instrução tem operandos imediatos (ex: MOV AX, 1111h), buscar da memória
    if (instruction.size > 1) {
      // Endereço do operando imediato
      const operandAddr = fetchAddr + 1;

      // Ler palavra de 16 bits (low byte + high byte)
      const lowByte = instruction.bytes[1] ?? 0;
      const highByte = instruction.bytes[2] ?? 0;
      const operandValue = lowByte | (highByte << 8);

      // BUS END - CPU busca operando
      busOperations.push({
        step: stepCounter++,
        type: "FETCH",
        busType: "ADDRESS",
        address: operandAddr,
        description: `CPU envia endereço`,
        direction: "→",
      });

      // BUS DADOS - Memória envia operando
      busOperations.push({
        step: stepCounter++,
        type: "FETCH",
        busType: "DATA",
        address: operandAddr,
        data: operandValue,
        description: `Ler palavra (16 bits)`,
        direction: "←",
      });

      addressCalculations.push({
        segment: CS,
        offset: IP + 1,
        physical: operandAddr,
        formula: `Endereço: 0x${operandAddr
          .toString(16)
          .toUpperCase()} | Valor: 0x${operandValue
          .toString(16)
          .toUpperCase()}`,
      });
    }

    // Executar instrução
    const changedRegs = new Set<RegisterName>();
    const changedFlags = new Set<FlagName>();
    let description = "";

    try {
      description = this.executeInstruction(
        instruction,
        changedRegs,
        changedFlags
      );
    } catch (error) {
      this.state.halted = true;
      description = `ERRO: ${(error as Error).message}`;
    }

    const stateAfter = this.cloneState();
    this.state.cycles++;

    // Adicionar operações de memória ao bus (padrão: BUS END → BUS DADOS)
    for (const access of this.memory.accessLog) {
      // Fase 1: BUS END - CPU envia endereço
      busOperations.push({
        step: stepCounter++,
        type: access.type,
        busType: "ADDRESS",
        address: access.address,
        description: `CPU envia endereço`,
        direction: "→",
      });

      // Fase 2: BUS DADOS - transferência de dados
      const isRead = access.type === "READ";
      const sizeDesc =
        access.size === 1 ? "byte (8 bits)" : "palavra (16 bits)";
      busOperations.push({
        step: stepCounter++,
        type: access.type,
        busType: "DATA",
        address: access.address,
        data: access.value,
        description: isRead ? `Ler ${sizeDesc}` : `Escrever ${sizeDesc}`,
        direction: isRead ? "←" : "→",
      });
    }

    const trace: ExecutionTrace = {
      instruction,
      instructionText: this.formatInstruction(instruction),
      stateBefore,
      stateAfter,
      changedRegisters: Array.from(changedRegs),
      changedFlags: Array.from(changedFlags),
      busOperations,
      addressCalculations,
      memoryAccesses: this.memory.accessLog.slice(),
      description,
    };

    this.trace.push(trace);
    return trace;
  }

  private executeInstruction(
    instr: Instruction,
    changedRegs: Set<RegisterName>,
    changedFlags: Set<FlagName>
  ): string {
    const ctx: InstructionContext = {
      instruction: instr,
      state: this.state,
      readRegister: this.readRegister.bind(this),
      writeRegister: this.writeRegister.bind(this),
      updateFlags: this.updateFlags.bind(this),
      markRegChanged: (reg: string) => changedRegs.add(reg as RegisterName),
      markFlagChanged: (flag: FlagName) => changedFlags.add(flag),
      nextIP: () => {
        // Incrementar IP pelo tamanho da instrução (bytes reais)
        this.state.registers.IP =
          (this.state.registers.IP + instr.size) & 0xffff;
        changedRegs.add("IP");
      },
      getOperandValue: this.getOperandValue.bind(this),
      formatOperand: this.formatOperand.bind(this),
    };

    // Delegar para o dispatcher modular
    return executeModular(ctx, this.push.bind(this), this.pop.bind(this));
  }

  public run(maxSteps: number = 10000): void {
    let steps = 0;
    while (!this.state.halted && steps < maxSteps) {
      this.step();
      steps++;
    }
  }

  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================

  private cloneState(): CPUState {
    return JSON.parse(JSON.stringify(this.state));
  }

  private formatOperand(operand: string | number | null | undefined): string {
    if (operand === null || operand === undefined) return "null";
    if (typeof operand === "number") {
      return `0x${operand.toString(16).toUpperCase()}`;
    }
    return operand;
  }

  private formatInstruction(instr: Instruction): string {
    const args = instr.args
      .filter((a) => a !== null && a !== undefined)
      .map((a) => this.formatOperand(a))
      .join(", ");
    return `${instr.op}${args ? " " + args : ""}`;
  }
}
