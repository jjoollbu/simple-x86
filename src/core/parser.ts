/**
 * Parser de Assembly x86 Simplificado
 * Suporta labels, comentários, e instruções básicas
 */

import type { ParseResult, ParseError, Instruction } from "./types";

const REGISTER_NAMES = [
  "AX",
  "BX",
  "CX",
  "DX",
  "SP",
  "BP",
  "SI",
  "DI",
  "CS",
  "DS",
  "SS",
  "ES",
  "IP",
  "AL",
  "AH",
  "BL",
  "BH",
  "CL",
  "CH",
  "DL",
  "DH", // Registradores de 8 bits
];

const VALID_INSTRUCTIONS = [
  // Transferência de dados
  "MOV",
  "PUSH",
  "POP",
  "XCHG",

  // Aritmética
  "ADD",
  "SUB",
  "INC",
  "DEC",
  "MUL",
  "DIV",
  "NEG",

  // Lógica
  "AND",
  "OR",
  "XOR",
  "NOT",
  "CMP",

  // Controle de fluxo
  "JMP",
  "JE",
  "JZ",
  "JNE",
  "JNZ",
  "JG",
  "JGE",
  "JL",
  "JLE",
  "CALL",
  "RET",
  "LOOP",

  // Outras
  "NOP",
  "HLT",
];

interface LabelReference {
  instructionIndex: number;
  argIndex: number;
  label: string;
  line: number;
}

export function parseAssembly(source: string): ParseResult {
  const lines = source.split(/\r?\n/);
  const instructions: Instruction[] = [];
  const labels = new Map<string, number>();
  const errors: ParseError[] = [];
  const pendingReferences: LabelReference[] = [];

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const rawLine = lines[lineNum];
    if (!rawLine) continue;

    const lineWithoutComment = rawLine.split(";")[0];
    if (!lineWithoutComment) continue;

    const trimmed = lineWithoutComment.trim();
    if (!trimmed) continue;

    // Detectar label (termina com :)
    if (trimmed.endsWith(":")) {
      const labelName = trimmed.slice(0, -1).trim().toUpperCase();

      if (!isValidLabel(labelName)) {
        errors.push({
          line: lineNum + 1,
          message: `Label inválido: "${labelName}"`,
          code: rawLine,
        });
        continue;
      }

      if (labels.has(labelName)) {
        errors.push({
          line: lineNum + 1,
          message: `Label duplicado: "${labelName}"`,
          code: rawLine,
        });
        continue;
      }

      labels.set(labelName, instructions.length);
      continue;
    }

    const parseResult = parseInstructionLine(trimmed, lineNum + 1, rawLine);

    if (parseResult.error) {
      errors.push(parseResult.error);
      continue;
    }

    if (parseResult.instruction) {
      for (let i = 0; i < parseResult.instruction.args.length; i++) {
        const arg = parseResult.instruction.args[i];
        if (
          typeof arg === "string" &&
          !REGISTER_NAMES.includes(arg.toUpperCase())
        ) {
          // Pode ser um label
          pendingReferences.push({
            instructionIndex: instructions.length,
            argIndex: i,
            label: arg.toUpperCase(),
            line: lineNum + 1,
          });
        }
      }

      instructions.push(parseResult.instruction);
    }
  }

  let currentOffset = 0;
  for (const instr of instructions) {
    instr.address = currentOffset;
    currentOffset += instr.size;
  }

  const labelOffsets = new Map<string, number>();
  for (const [labelName, instructionIndex] of labels.entries()) {
    const instruction = instructions[instructionIndex];
    if (instruction && instruction.address !== undefined) {
      labelOffsets.set(labelName, instruction.address);
    }
  }

  for (const ref of pendingReferences) {
    const labelOffset = labelOffsets.get(ref.label);

    if (labelOffset === undefined) {
      errors.push({
        line: ref.line,
        message: `Label não encontrado: "${ref.label}"`,
        code: "",
      });
      continue;
    }

    const instruction = instructions[ref.instructionIndex];
    if (instruction && instruction.args[ref.argIndex] !== undefined) {
      instruction.args[ref.argIndex] = labelOffset;
    }
  }

  return { instructions, labels, errors };
}

function parseInstructionLine(
  line: string,
  lineNumber: number,
  originalCode: string
): { instruction?: Instruction; error?: ParseError } {
  const firstSpace = line.indexOf(" ");
  const opcode = firstSpace === -1 ? line : line.slice(0, firstSpace);
  const argsText = firstSpace === -1 ? "" : line.slice(firstSpace + 1).trim();

  const opcodeUpper = opcode.toUpperCase();

  if (!VALID_INSTRUCTIONS.includes(opcodeUpper)) {
    return {
      error: {
        line: lineNumber,
        message: `Instrução desconhecida: "${opcode}"`,
        code: originalCode,
      },
    };
  }

  const args: (string | number | null)[] = [];

  if (argsText) {
    const argParts = argsText.split(",").map((a) => a.trim());

    for (const argText of argParts) {
      const parseResult = parseArgument(argText);

      if (parseResult.error) {
        return {
          error: {
            line: lineNumber,
            message: parseResult.error,
            code: originalCode,
          },
        };
      }

      args.push(parseResult.value ?? null);
    }
  }

  const bytes = generateInstructionBytes(opcodeUpper, args);

  return {
    instruction: {
      op: opcodeUpper,
      args,
      bytes: bytes,
      size: bytes.length,
    },
  };
}

function parseArgument(text: string): {
  value?: string | number | null;
  error?: string;
} {
  if (!text) {
    return { value: null };
  }

  const upper = text.toUpperCase();

  if (REGISTER_NAMES.includes(upper)) {
    return { value: upper };
  }

  if (/^[0-9]+$/.test(text)) {
    const value = parseInt(text, 10);
    if (value > 0xffff) {
      return { error: `Valor muito grande: ${text}` };
    }
    return { value: value & 0xffff };
  }

  if (/^0x[0-9a-fA-F]+$/.test(text)) {
    const value = parseInt(text, 16);
    if (value > 0xffff) {
      return { error: `Valor muito grande: ${text}` };
    }
    return { value: value & 0xffff };
  }

  if (/^[0-9a-fA-F]+[hH]$/.test(text)) {
    const value = parseInt(text.slice(0, -1), 16);
    if (value > 0xffff) {
      return { error: `Valor muito grande: ${text}` };
    }
    return { value: value & 0xffff };
  }

  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(text)) {
    return { value: upper };
  }

  return { error: `Argumento inválido: "${text}"` };
}

function isValidLabel(name: string): boolean {
  if (!name) return false;
  if (REGISTER_NAMES.includes(name)) return false;
  if (VALID_INSTRUCTIONS.includes(name)) return false;
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}


function generateInstructionBytes(
  op: string,
  args: (string | number | null)[]
): number[] {
  const bytes: number[] = [];

  switch (op) {
    // MOV reg16, imm16
    case "MOV": {
      if (
        args.length === 2 &&
        typeof args[0] === "string" &&
        typeof args[1] === "number"
      ) {
        const reg = args[0];
        const imm = args[1];

        // MOV AX, imm16 → 0xB8 + low byte + high byte
        // MOV BX, imm16 → 0xBB + low byte + high byte
        // MOV CX, imm16 → 0xB9 + low byte + high byte
        // MOV DX, imm16 → 0xBA + low byte + high byte
        const regOpcodes: Record<string, number> = {
          AX: 0xb8,
          BX: 0xbb,
          CX: 0xb9,
          DX: 0xba,
          SP: 0xbc,
          BP: 0xbd,
          SI: 0xbe,
          DI: 0xbf,
        };

        const opcode = regOpcodes[reg];
        if (opcode !== undefined) {
          bytes.push(opcode);
          bytes.push(imm & 0xff); // Low byte
          bytes.push((imm >> 8) & 0xff); // High byte
        } else {
          bytes.push(0xb8);
          bytes.push(imm & 0xff);
          bytes.push((imm >> 8) & 0xff);
        }
      } else {
        // MOV reg, reg ou outras formas → opcode genérico
        bytes.push(0x89); // MOV r/m16, r16
        bytes.push(0xc0); // ModR/M placeholder
      }
      break;
    }

    case "ADD":
      bytes.push(0x01); // ADD r/m16, r16
      bytes.push(0xc0); // ModR/M placeholder
      break;

    case "SUB":
      bytes.push(0x29); // SUB r/m16, r16
      bytes.push(0xc0); // ModR/M placeholder
      break;

    case "INC": {
      const reg = args[0] as string;
      const regOpcodes: Record<string, number> = {
        AX: 0x40,
        BX: 0x43,
        CX: 0x41,
        DX: 0x42,
        SP: 0x44,
        BP: 0x45,
        SI: 0x46,
        DI: 0x47,
      };
      bytes.push(regOpcodes[reg] ?? 0x40);
      break;
    }

    case "DEC": {
      const reg = args[0] as string;
      const regOpcodes: Record<string, number> = {
        AX: 0x48,
        BX: 0x4b,
        CX: 0x49,
        DX: 0x4a,
        SP: 0x4c,
        BP: 0x4d,
        SI: 0x4e,
        DI: 0x4f,
      };
      bytes.push(regOpcodes[reg] ?? 0x48);
      break;
    }

    case "PUSH": {
      const reg = args[0] as string;
      const regOpcodes: Record<string, number> = {
        AX: 0x50,
        BX: 0x53,
        CX: 0x51,
        DX: 0x52,
        SP: 0x54,
        BP: 0x55,
        SI: 0x56,
        DI: 0x57,
      };
      bytes.push(regOpcodes[reg] ?? 0x50);
      break;
    }

    case "POP": {
      const reg = args[0] as string;
      const regOpcodes: Record<string, number> = {
        AX: 0x58,
        BX: 0x5b,
        CX: 0x59,
        DX: 0x5a,
        SP: 0x5c,
        BP: 0x5d,
        SI: 0x5e,
        DI: 0x5f,
      };
      bytes.push(regOpcodes[reg] ?? 0x58);
      break;
    }

    case "JMP":
    case "JE":
    case "JZ":
    case "JNE":
    case "JNZ":
    case "JG":
    case "JGE":
    case "JL":
    case "JLE":
    case "CALL":
    case "LOOP":
      // Jump com offset de 16 bits
      bytes.push(0xe9); // JMP near
      bytes.push(0x00); // Low byte do offset (será calculado depois)
      bytes.push(0x00); // High byte do offset
      break;

    case "RET":
      bytes.push(0xc3); // RET near
      break;

    case "NOP":
      bytes.push(0x90); // NOP
      break;

    case "HLT":
      bytes.push(0xf4); // HLT
      break;

    case "AND":
      bytes.push(0x21); // AND r/m16, r16
      bytes.push(0xc0);
      break;

    case "OR":
      bytes.push(0x09); // OR r/m16, r16
      bytes.push(0xc0);
      break;

    case "XOR":
      bytes.push(0x31); // XOR r/m16, r16
      bytes.push(0xc0);
      break;

    case "NOT":
      bytes.push(0xf7); // NOT r/m16
      bytes.push(0xd0);
      break;

    case "CMP":
      bytes.push(0x39); // CMP r/m16, r16
      bytes.push(0xc0);
      break;

    case "MUL":
      bytes.push(0xf7); // MUL r/m16
      bytes.push(0xe0);
      break;

    case "DIV":
      bytes.push(0xf7); // DIV r/m16
      bytes.push(0xf0);
      break;

    case "NEG":
      bytes.push(0xf7); // NEG r/m16
      bytes.push(0xd8);
      break;

    case "XCHG":
      bytes.push(0x87); // XCHG r16, r/m16
      bytes.push(0xc0);
      break;

    default:
      // Instrução desconhecida → opcode genérico
      bytes.push(0x90); // NOP como fallback
  }

  return bytes;
}

/**
 * Desassembla uma instrução para string legível
 */
export function disassemble(instruction: Instruction): string {
  const args = instruction.args
    .filter((a) => a !== null && a !== undefined)
    .map((a) => {
      if (typeof a === "number") {
        return `0x${a.toString(16).toUpperCase().padStart(4, "0")}`;
      }
      return a;
    })
    .join(", ");

  return `${instruction.op}${args ? " " + args : ""}`;
}
