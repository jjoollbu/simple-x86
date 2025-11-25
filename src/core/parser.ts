// parser pra assembly x86 simples
import type { ParseResult, ParseError, Instruction } from "./types";

// lista de registradores suportados
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
  "DH",
];

// instruções que a gente suporta
const VALID_INSTRUCTIONS = [
  "MOV",
  "PUSH",
  "POP",
  "XCHG", // faltando a lógica em instructions/arithmetic.ts
  "ADD",
  "SUB",
  "INC",
  "DEC",
  "MUL",
  "DIV",
  "NEG",
  "AND",
  "OR",
  "XOR",
  "NOT",
  "CMP",
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

  // processar cada linha
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const rawLine = lines[lineNum];
    if (!rawLine) continue;

    // remove comentarios (tudo depois de ;)
    const lineWithoutComment = rawLine.split(";")[0];
    if (!lineWithoutComment) continue;

    const trimmed = lineWithoutComment.trim();
    if (!trimmed) continue;

    // checa se é um label (termina com :)
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

      // label duplicado?
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
      // verifica se tem labels nos argumentos que precisam ser resolvidos depois
      for (let i = 0; i < parseResult.instruction.args.length; i++) {
        const arg = parseResult.instruction.args[i];
        if (
          typeof arg === "string" &&
          !REGISTER_NAMES.includes(arg.toUpperCase())
        ) {
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

  // calcula endereços das instruções
  let currentOffset = 0;
  for (const instr of instructions) {
    instr.address = currentOffset;
    currentOffset += instr.size;
  }

  // mapeia labels pra offsets
  const labelOffsets = new Map<string, number>();
  for (const [labelName, instructionIndex] of labels.entries()) {
    const instruction = instructions[instructionIndex];
    if (instruction && instruction.address !== undefined) {
      labelOffsets.set(labelName, instruction.address);
    }
  }

  // resolve as referencias de labels
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
  // separa opcode dos argumentos
  const firstSpace = line.indexOf(" ");
  const opcode = firstSpace === -1 ? line : line.slice(0, firstSpace);
  const argsText = firstSpace === -1 ? "" : line.slice(firstSpace + 1).trim();

  const opcodeUpper = opcode.toUpperCase();

  // valida se é uma instrução conhecida
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
  if (!text) return { value: null };

  const upper = text.toUpperCase();

  if (REGISTER_NAMES.includes(upper)) {
    return { value: upper };
  }

  // numero decimal
  if (/^[0-9]+$/.test(text)) {
    const value = parseInt(text, 10);
    if (value > 0xffff) {
      return { error: `Valor muito grande: ${text}` };
    }
    return { value: value & 0xffff };
  }

  // hexadecimal (0x...)
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
    case "MOV": {
      // MOV reg, imm
      if (
        args.length === 2 &&
        typeof args[0] === "string" &&
        typeof args[1] === "number"
      ) {
        const reg = args[0];
        const imm = args[1];

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
          bytes.push(imm & 0xff);
          bytes.push((imm >> 8) & 0xff);
        } else {
          // fallback pra AX
          bytes.push(0xb8);
          bytes.push(imm & 0xff);
          bytes.push((imm >> 8) & 0xff);
        }
      } else {
        // MOV reg, reg ou outras formas
        bytes.push(0x89);
        bytes.push(0xc0);
      }
      break;
    }

    case "ADD":
      bytes.push(0x01);
      bytes.push(0xc0);
      break;

    case "SUB":
      bytes.push(0x29);
      bytes.push(0xc0);
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
      // jump com offset de 16 bits (calcula depois)
      bytes.push(0xe9);
      bytes.push(0x00);
      bytes.push(0x00);
      break;

    case "RET":
      bytes.push(0xc3);
      break;

    case "NOP":
      bytes.push(0x90);
      break;

    case "HLT":
      bytes.push(0xf4);
      break;

    case "AND":
      bytes.push(0x21);
      bytes.push(0xc0);
      break;

    case "OR":
      bytes.push(0x09);
      bytes.push(0xc0);
      break;

    case "XOR":
      bytes.push(0x31);
      bytes.push(0xc0);
      break;

    case "NOT":
      bytes.push(0xf7);
      bytes.push(0xd0);
      break;

    case "CMP":
      bytes.push(0x39);
      bytes.push(0xc0);
      break;

    case "MUL":
      bytes.push(0xf7);
      bytes.push(0xe0);
      break;

    case "DIV":
      bytes.push(0xf7);
      bytes.push(0xf0);
      break;

    case "NEG":
      bytes.push(0xf7);
      bytes.push(0xd8);
      break;

    case "XCHG":
      bytes.push(0x87);
      bytes.push(0xc0);
      break;

    default:
      // se não reconhecer, usa NOP
      bytes.push(0x90);
  }

  return bytes;
}

// converte instrução de volta pra string (pra debug)
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
