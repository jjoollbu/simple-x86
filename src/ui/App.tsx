/**
 * Aplicação Principal - Simulador x86 em Modo Real
 * Versão Simplificada e Organizada
 */

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
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [renderTick, setRenderTick] = useState(0);
  const [highlightedRegisters, setHighlightedRegisters] = useState<Set<string>>(
    new Set()
  );
  const [currentBusOps, setCurrentBusOps] = useState<BusFlowOperation[]>([]);
  const [memoryHighlights, setMemoryHighlights] = useState<Set<number>>(
    new Set()
  );

  const forceUpdate = () => setRenderTick((t) => t + 1);

  const handleLoad = () => {
    try {
      setErrors([]);
      setCurrentBusOps([]);
      setHighlightedRegisters(new Set());
      setMemoryHighlights(new Set());

      const parseResult = parseAssembly(code);

      if (parseResult.errors.length > 0) {
        setErrors(parseResult.errors);
        return;
      }

      cpu.loadProgram(parseResult.instructions);

      const instructionAddresses = new Set<number>();
      parseResult.instructions.forEach((instr) => {
        if (instr.address !== undefined) {
          for (let i = 0; i < instr.size; i++) {
            instructionAddresses.add(instr.address + i);
          }
        }
      });
      setMemoryHighlights(instructionAddresses);

      forceUpdate();

      console.log("✅ Programa carregado com sucesso!");
      console.log(`📊 ${parseResult.instructions.length} instruções`);
    } catch (error) {
      setErrors([
        {
          line: 0,
          message: `Erro ao carregar: ${(error as Error).message}`,
          code: "",
        },
      ]);
    }
  };

  const handleStep = () => {
    if (cpu.state.halted) return;

    try {
      const trace = cpu.step();

      if (trace) {
        const changedRegs = new Set([
          ...trace.changedRegisters,
          ...trace.changedFlags,
        ]);
        setHighlightedRegisters(changedRegs);

        const busOps: BusFlowOperation[] = [];

        let stepCounter = 1;

        trace.busOperations.forEach((op) => {
          if (op.busType === "ADDRESS") {
            busOps.push({
              step: stepCounter++,
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
              step: stepCounter++,
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

        setCurrentBusOps(busOps);

        const memAddrs = new Set<number>();

        if (trace.instruction.address !== undefined) {
          for (let i = 0; i < trace.instruction.size; i++) {
            memAddrs.add(trace.instruction.address + i);
          }
        }

        trace.memoryAccesses.forEach((access) => {
          memAddrs.add(access.address);
        });

        setMemoryHighlights(memAddrs);

        console.log("▶️ Step executado:", trace.instructionText);
        console.log("   Descrição:", trace.description);
      }

      forceUpdate();
    } catch (error) {
      console.error("❌ Erro na execução:", error);
      cpu.state.halted = true;
      forceUpdate();
    }
  };

  const handleReset = () => {
    cpu.reset();
    if (cpu.program.length > 0) {
      cpu.loadProgram(cpu.program);
    }
    setCurrentBusOps([]);
    setHighlightedRegisters(new Set());
    setMemoryHighlights(new Set());
    forceUpdate();
    console.log("🔄 CPU resetada");
  };

  return (
    <div className="min-h-screen bg-slate-800 p-6" data-render={renderTick}>
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

        {errors.length > 0 && (
          <div className="bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded mb-6">
            {errors.map((err, idx) => (
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
              onLoad={handleLoad}
              disabled={false}
            />

            <Controls
              onStep={handleStep}
              onReset={handleReset}
              isHalted={cpu.state.halted}
              disabled={!code.trim()}
            />
          </div>

          <div>
            <BusFlow operations={currentBusOps} />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <div className="xl:col-span-1">
            <CPUView cpu={cpu} highlightedRegisters={highlightedRegisters} />
          </div>

          <div className="xl:col-span-2">
            <MemoryView cpu={cpu} highlightedAddresses={memoryHighlights} />
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
