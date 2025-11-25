// visualiza memória em formato hex dump
// mostra só as partes usadas pra não ficar gigante

import type { CPU } from "../../core/cpu";

type MemoryViewProps = {
  cpu: CPU;
  highlightedAddresses?: Set<number>;
};

export function MemoryView({ cpu, highlightedAddresses }: MemoryViewProps) {
  const bytesPerRow = 16;

  const formatHex = (value: number, padding: number = 4) => {
    return value.toString(16).toUpperCase().padStart(padding, "0");
  };

  // acha endereços que tem algo (não são zero)
  const getOccupiedRanges = () => {
    const occupied: { address: number; value: number }[] = [];

    for (let i = 0; i < cpu.memory.size; i++) {
      const val = cpu.memory.data[i];
      if (val !== undefined && val !== 0) {
        occupied.push({
          address: i,
          value: val,
        });
      }
    }

    return occupied;
  };

  // Agrupa endereços ocupados em linhas de 16 bytes
  const getMemoryRows = () => {
    const occupied = getOccupiedRanges();
    if (occupied.length === 0) return [];

    const rows: { startAddr: number; bytes: (number | null)[] }[] = [];
    const addressSet = new Set(occupied.map((o) => o.address));

    // Encontra o menor e maior endereço ocupado
    const minAddr = Math.min(...occupied.map((o) => o.address));
    const maxAddr = Math.max(...occupied.map((o) => o.address));

    // Alinha para múltiplos de 16
    const startAddr = Math.floor(minAddr / bytesPerRow) * bytesPerRow;
    const endAddr = Math.ceil((maxAddr + 1) / bytesPerRow) * bytesPerRow;

    // Cria linhas apenas para regiões com dados
    for (let addr = startAddr; addr < endAddr; addr += bytesPerRow) {
      const bytes: (number | null)[] = [];
      let hasData = false;

      for (let i = 0; i < bytesPerRow; i++) {
        const currentAddr = addr + i;
        if (addressSet.has(currentAddr)) {
          const value = cpu.memory.data[currentAddr];
          bytes.push(value !== undefined ? value : 0);
          hasData = true;
        } else {
          bytes.push(null);
        }
      }

      if (hasData) {
        rows.push({ startAddr: addr, bytes });
      }
    }

    return rows;
  };

  const memoryRows = getMemoryRows();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Memória RAM</h2>
        <div className="text-sm text-gray-600">
          {memoryRows.length > 0
            ? `${memoryRows.length} linha(s) ocupada(s)`
            : "Memória vazia"}
        </div>
      </div>

      <div className="font-mono text-sm">
        {/* Header */}
        <div className="flex mb-2 pb-2 border-b border-gray-200">
          <div className="w-20 text-gray-500">Endereço</div>
          <div className="flex-1 grid grid-cols-16 gap-1">
            {Array.from({ length: 16 }, (_, i) => (
              <div key={i} className="text-center text-gray-500 text-xs">
                +{i.toString(16).toUpperCase()}
              </div>
            ))}
          </div>
        </div>

        {/* Memory Rows - Apenas endereços ocupados */}
        {memoryRows.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Nenhum byte ocupado na memória
          </div>
        ) : (
          memoryRows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="flex items-center py-1 hover:bg-gray-50"
            >
              <div className="w-20 text-slate-700 font-semibold">
                {formatHex(row.startAddr, 5)}
              </div>
              <div className="flex-1 grid grid-cols-16 gap-1">
                {row.bytes.map((byteValue, col) => {
                  const currentAddr = row.startAddr + col;
                  const isHighlighted = highlightedAddresses?.has(currentAddr);
                  const isEmpty = byteValue === null;

                  return (
                    <div
                      key={col}
                      className={`text-center px-1 py-0.5 rounded ${
                        isEmpty
                          ? "text-slate-300"
                          : isHighlighted
                          ? "bg-slate-200 text-slate-900 font-bold border border-slate-400"
                          : "text-slate-700"
                      }`}
                      title={
                        isEmpty
                          ? `Endereço: ${formatHex(currentAddr, 5)} | Vazio`
                          : `Endereço: ${formatHex(
                              currentAddr,
                              5
                            )} | Valor: ${formatHex(byteValue, 2)}`
                      }
                    >
                      {isEmpty ? "--" : formatHex(byteValue, 2)}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
