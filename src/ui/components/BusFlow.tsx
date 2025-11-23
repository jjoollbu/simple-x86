/**
 * Componente de Fluxo de Barramentos
 * Visualização detalhada das operações nos barramentos de endereço e dados
 */

interface BusOperation {
  step: number;
  address: string;
  data: string;
  type: "BUS END" | "BUS DADOS" | "INSTRUÇÃO";
  direction: "→" | "←" | "";
  description: string;
}

type BusFlowProps = {
  operations: BusOperation[];
};

export function BusFlow({ operations }: BusFlowProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Fluxo de Barramentos
      </h2>

      <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50 max-h-[600px] overflow-y-auto">
        {operations.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">Aguardando execução de instrução...</p>
            <p className="text-xs mt-2">
              Execute uma instrução para ver o fluxo dos barramentos
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {operations.map((op, index) => (
              <div key={index}>
                {op.type === "INSTRUÇÃO" ? (
                  <div className="bg-linear-to-r from-purple-100 to-purple-50 border-2 border-purple-400 rounded-lg p-4 mb-3">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-slate-800 mb-1">
                        📋 INSTRUÇÃO EXECUTADA
                      </div>
                      <div className="text-2xl font-bold text-slate-900 font-mono mb-2">
                        {op.data}
                      </div>
                      <div className="text-xs text-slate-600 italic">
                        {op.description}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center py-3">
                      <div className="w-8 shrink-0">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold">
                          {op.step}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-col gap-1">
                          <div className="text-center">
                            {op.type === "BUS DADOS" &&
                            op.description.includes("Opcode:") ? (
                              <div>
                                <div className="font-mono text-lg font-bold text-gray-800">
                                  {op.description.split(" ")[0]}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {op.data}
                                </div>
                              </div>
                            ) : (
                              <span className="font-mono text-lg font-bold text-gray-800">
                                {op.address || op.data}
                              </span>
                            )}
                          </div>

                          <div className="text-center">
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded ${
                                op.type === "BUS END"
                                  ? "bg-white text-slate-900 border border-slate-300"
                                  : "bg-slate-200 text-slate-900"
                              }`}
                            >
                              {op.type}
                            </span>
                          </div>
                          <div className="flex items-center justify-center">
                            <div className="flex items-center w-full max-w-md">
                              <span className="text-xs text-gray-600 w-16 text-right">
                                CPU
                              </span>
                              <div className="flex-1 mx-2 relative">
                                <div className="h-0.5 bg-gray-400 w-full"></div>
                                {op.direction === "→" ? (
                                  <svg
                                    className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M10 3l7 7-7 7V3z" />
                                  </svg>
                                ) : (
                                  <svg
                                    className="absolute left-0 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M10 3l-7 7 7 7V3z" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-xs text-gray-600 w-16 text-left">
                                Memória
                              </span>
                            </div>
                          </div>

                          <div className="text-center">
                            <span className="text-xs text-gray-500 italic">
                              {/* Se já mostrou o nome da instrução acima, mostrar só "MOV (Opcode: 0xB8)" */}
                              {op.type === "BUS DADOS" &&
                              op.description.includes("Opcode:") ? (
                                <span>
                                  {
                                    op.description
                                      .split(" (Opcode:")[0]
                                      ?.split(" ")[0]
                                  }{" "}
                                  (Opcode: {op.data})
                                </span>
                              ) : (
                                op.description
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {index < operations.length - 1 && (
                      <div className="border-b border-gray-300"></div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Legenda:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
          <div>
            <span className="font-semibold text-slate-600">BUS END:</span>{" "}
            Barramento de endereços (sempre CPU → Memória)
          </div>
          <div>
            <span className="font-semibold text-slate-600">BUS DADOS:</span>{" "}
            Barramento de dados (→ WRITE / ← READ)
          </div>
        </div>
      </div>
    </div>
  );
}

export default BusFlow;
