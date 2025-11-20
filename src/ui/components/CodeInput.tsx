/**
 * Componente de Entrada de Código Assembly
 */

type CodeInputProps = {
  code: string;
  onChange: (code: string) => void;
  onLoad: () => void;
  disabled: boolean;
};

export function CodeInput({
  code,
  onChange,
  onLoad,
  disabled,
}: CodeInputProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Código Assembly
      </h2>
      <div className="space-y-4">
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`; Digite seu código assembly aqui\n; Exemplo:\nMOV AX, 1234H\nMOV BX, AX\nADD AX, BX`}
          className="w-full h-64 p-4 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={disabled}
        />
        <button
          onClick={onLoad}
          disabled={disabled || !code.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Carregar Código
        </button>
      </div>
    </div>
  );
}
