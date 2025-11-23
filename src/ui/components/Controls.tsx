/**
 * Componente de Controles de Execução
 */

interface ControlsProps {
  onStep: () => void;
  onReset: () => void;
  isHalted: boolean;
  disabled: boolean;
}

export function Controls({
  onStep,
  onReset,
  isHalted,
  disabled,
}: ControlsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Controles</h2>

      <div className="space-y-4">
        <button
          onClick={onStep}
          disabled={disabled || isHalted}
          className="w-full bg-slate-900 text-white py-3 px-4 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed font-semibold"
        >
          Executar Passo
        </button>

        <button
          onClick={onReset}
          className="w-full bg-white text-slate-900 border-2 border-slate-900 py-3 px-4 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:bg-slate-200 disabled:cursor-not-allowed font-semibold"
        >
          Resetar CPU
        </button>

        <div className="pt-4 border-t border-slate-200">
          <div className="text-sm text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Estado:</span>
              <span
                className={`font-semibold ${
                  isHalted ? "text-slate-900" : "text-slate-700"
                }`}
              >
                {isHalted ? "Parado" : "Pronto"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
