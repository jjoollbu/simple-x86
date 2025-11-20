/**
 * Componente de Trace de Execução
 * Mostra histórico das últimas instruções executadas
 */

import type { CPU } from "../../core/cpu";

type ExecutionTraceProps = {
  cpu: CPU;
};

export function ExecutionTrace({ cpu }: ExecutionTraceProps) {
  const formatHex = (value: number, padding: number = 4) => {
    return `0x${value.toString(16).toUpperCase().padStart(padding, "0")}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Trace de Execução
      </h2>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {cpu.trace
          .slice(-10)
          .reverse()
          .map((trace, index) => (
            <div
              key={cpu.trace.length - index}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-mono text-sm text-blue-600">
                  {trace.addressCalculations[0] &&
                    formatHex(trace.addressCalculations[0].physical, 5)}
                </div>
                <div className="text-xs text-gray-500">
                  Instrução #{cpu.trace.length - index}
                </div>
              </div>

              <div className="text-sm font-semibold text-gray-800 mb-2">
                {trace.instructionText}
              </div>

              <div className="text-sm text-gray-600 mb-2">
                {trace.description}
              </div>

              {trace.addressCalculations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    Cálculos de Endereçamento:
                  </div>
                  <div className="space-y-1">
                    {trace.addressCalculations.map((calc, idx) => (
                      <div
                        key={idx}
                        className="font-mono text-xl bg-purple-50 text-gray-900 px-3 py-2 rounded border border-purple-200"
                      >
                        {calc.formula}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

        {cpu.trace.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            Nenhuma instrução executada ainda
          </div>
        )}
      </div>
    </div>
  );
}
