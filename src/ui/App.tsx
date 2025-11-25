// App principal do simulador x86

import { useState } from "react";
import { CPU } from "../core/cpu";
import { parseAssembly } from "../core/parser";
import { CPUView } from "./components/CPUView";
import { CodeInput } from "./components/CodeInput";
import { Controls } from "./components/Controls";
import { BusFlow } from "./components/BusFlow";
import { ExecutionTrace } from "./components/ExecutionTrace";
import { MemoryView } from "./components/MemoryView";
import type { ParseError } from "../core/types";

interface BusFlowOperation {
  step: number;
  address: string;
  data: string;
  type: "BUS END" | "BUS DADOS" | "INSTRUÇÃO";
  direction: "→" | "←" | "";
  description: string;
}

const DEFAULT_CODE = `; Exemplo: Soma com Loop
; Calcula a soma de 1 + 2 + 3 + 4 + 5

MOV AX, 0      ; Inicializa resultado em 0
MOV CX, 5      ; Contador = 5
MOV BX, 1      ; Valor inicial = 1

LOOP_START:
  ADD AX, BX   ; AX = AX + BX
  INC BX       ; BX++
  LOOP LOOP_START

HLT            ; Para a execução`;

export function App() {
  const [cpu] = useState(() => new CPU());
  const [code, setCode] = useState(DEFAULT_CODE);
  const [uiState, setUiState] = useState({
    errors: [] as ParseError[],
    highlightedRegisters: new Set<string>(),
    currentBusOps: [] as BusFlowOperation[],
    memoryHighlights: new Set<number>(),
    isHalted: false,
  });

  const loadCodeIntoMemory = () => {
    try {
      const parseResult = parseAssembly(code);

      if (parseResult.errors.length > 0) {
        setUiState((s) => ({ ...s, errors: parseResult.errors }));
        return;
      }

      cpu.loadProgram(parseResult.instructions);

      // marca os endereços das instruções na memória pra destacar
      const instructionAddresses = new Set<number>();
      parseResult.instructions.forEach((instr) => {
        if (instr.address !== undefined) {
          for (let i = 0; i < instr.size; i++) {
            instructionAddresses.add(instr.address + i);
          }
        }
      });

      setUiState({
        errors: [],
        currentBusOps: [],
        highlightedRegisters: new Set(),
        memoryHighlights: instructionAddresses,
        isHalted: cpu.state.halted,
      });

      console.log(
        `Loaded ${parseResult.instructions.length} instructions into memory`
      );
    } catch (error) {
      setUiState((s) => ({
        ...s,
        errors: [
          {
            line: 0,
            message: `Erro ao carregar: ${(error as Error).message}`,
            code: "",
          },
        ],
      }));
    }
  };

  const executeSingleStep = () => {
    if (cpu.state.halted) return;

    try {
      const trace = cpu.step();

      if (trace) {
        // pega registradores e flags que mudaram
        const changedRegs = new Set([
          ...trace.changedRegisters,
          ...trace.changedFlags,
        ]);

        const busOps: BusFlowOperation[] = [];
        let step = 1;

        // monta lista de operações do barramento pra exibir
        trace.busOperations.forEach((op) => {
          if (op.busType === "ADDRESS") {
            busOps.push({
              step: step++,
              address: `0x${op.address
                .toString(16)
                .toUpperCase()
                .padStart(5, "0")}`,
              data: "",
              type: "BUS END",
              direction: "→",
              description: op.description,
            });
          } else if (op.busType === "DATA") {
            busOps.push({
              step: step++,
              address: "",
              data:
                op.data !== undefined
                  ? `0x${op.data.toString(16).toUpperCase().padStart(2, "0")}`
                  : "",
              type: "BUS DADOS",
              direction: op.direction,
              description: op.description,
            });
          }
        });

        const memAddrs = new Set<number>();
        if (trace.instruction.address !== undefined) {
          for (let i = 0; i < trace.instruction.size; i++) {
            memAddrs.add(trace.instruction.address + i);
          }
        }
        trace.memoryAccesses.forEach((access) => {
          memAddrs.add(access.address);
        });

        setUiState((s) => ({
          ...s,
          highlightedRegisters: changedRegs,
          currentBusOps: busOps,
          memoryHighlights: memAddrs,
          isHalted: cpu.state.halted,
        }));

        console.log("▶️ Step executado:", trace.instructionText);
        console.log("   Descrição:", trace.description);
      } else {
        // Se não houver trace, apenas atualiza o estado de halted
        setUiState((s) => ({ ...s, isHalted: cpu.state.halted }));
      }
    } catch (error) {
      console.error("❌ Erro na execução:", error);
      cpu.state.halted = true;
      setUiState((s) => ({ ...s, isHalted: true }));
    }
  };

  const resetSystem = () => {
    cpu.reset();
    if (cpu.program.length > 0) {
      cpu.loadProgram(cpu.program);
    }
    setUiState({
      errors: [],
      currentBusOps: [],
      highlightedRegisters: new Set(),
      memoryHighlights: new Set(),
      isHalted: cpu.state.halted,
    });
    console.log("🔄 CPU resetada");
  };

  return (
    <div className="min-h-screen bg-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            Simulador x86 - Modo Real
          </h1>
          <p className="text-slate-200">
            Simulador de execução de instruções assembly com visualização em
            tempo real
          </p>
        </header>

        {uiState.errors.length > 0 && (
          <div className="bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded mb-6">
            {uiState.errors.map((err, idx) => (
              <div key={idx}>
                Linha {err.line}: {err.message}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-6">
            <CodeInput
              code={code}
              onChange={setCode}
              onLoad={loadCodeIntoMemory}
              disabled={false}
            />

            <Controls
              onStep={executeSingleStep}
              onReset={resetSystem}
              isHalted={uiState.isHalted}
              disabled={!code.trim()}
            />
          </div>

          <div>
            <BusFlow operations={uiState.currentBusOps} />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <div className="xl:col-span-1">
            <CPUView
              cpu={cpu}
              highlightedRegisters={uiState.highlightedRegisters}
            />
          </div>

          <div className="xl:col-span-2">
            <MemoryView
              cpu={cpu}
              highlightedAddresses={uiState.memoryHighlights}
            />
          </div>
        </div>

        <div className="mb-6">
          <ExecutionTrace cpu={cpu} />
        </div>
      </div>
    </div>
  );
}

export default App;
