/**
 * Componente de Visualização da CPU
 * Mostra os valores de todos os registradores com edição inline
 */

import { useState } from "react";
import type { CPU } from "../../core/cpu";
import type { CPUState } from "../../core/types";

type CPUViewProps = {
  cpu: CPU;
  highlightedRegisters?: Set<string>;
};

export function CPUView({ cpu, highlightedRegisters }: CPUViewProps) {
  const state = cpu.state;
  const [editingRegister, setEditingRegister] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const formatHex = (value: number, padding: number = 4) => {
    return `0x${value.toString(16).toUpperCase().padStart(padding, "0")}`;
  };

  const handleStartEdit = (name: string, value: number) => {
    setEditingRegister(name);
    setEditValue(value.toString(16).toUpperCase());
  };

  const handleSaveEdit = (
    name: string,
    type: "general" | "pointer" | "segment" | "IP"
  ) => {
    const parsedValue = parseInt(editValue, 16);
    if (!isNaN(parsedValue) && parsedValue >= 0 && parsedValue <= 0xffff) {
      if (type === "general") {
        state.registers.general[name as keyof typeof state.registers.general] =
          parsedValue;
      } else if (type === "pointer") {
        state.registers.pointer[name as keyof typeof state.registers.pointer] =
          parsedValue;
      } else if (type === "segment") {
        state.registers.segment[name as keyof typeof state.registers.segment] =
          parsedValue;
      } else if (type === "IP") {
        state.registers.IP = parsedValue;
      }
    }
    setEditingRegister(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingRegister(null);
    setEditValue("");
  };

  const EditableRegisterGroup: React.FC<{
    title: string;
    registers: Record<string, number>;
    type: "general" | "pointer" | "segment" | "IP";
  }> = ({ title, registers, type }) => (
    <div className="mb-4">
      <h3 className="font-semibold text-gray-700 mb-2">{title}</h3>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(registers).map(([name, value]) => {
          const isHighlighted = highlightedRegisters?.has(name);
          const isEditing = editingRegister === name;

          return (
            <div
              key={name}
              className={`flex justify-between items-center p-2 rounded ${
                isHighlighted ? "bg-slate-200 text-slate-900" : "bg-slate-50"
              }`}
            >
              <span className="font-mono font-semibold">{name}:</span>
              {isEditing ? (
                <div className="flex gap-1 items-center">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit(name, type);
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                    className="w-20 px-1 py-0.5 text-sm font-mono border border-slate-400 rounded focus:outline-none focus:ring-1 focus:ring-slate-500"
                    autoFocus
                    placeholder="FFFF"
                  />
                  <button
                    onClick={() => handleSaveEdit(name, type)}
                    className="px-1 py-0.5 text-xs bg-white text-slate-900 border border-slate-300 rounded hover:bg-slate-100"
                  >
                    ✓
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-1 py-0.5 text-xs bg-slate-900 text-white rounded hover:bg-slate-800"
                  >
                    ✗
                  </button>
                </div>
              ) : (
                <span
                  className={
                    "font-mono cursor-pointer hover:bg-slate-100 px-2 py-1 rounded " +
                    (isHighlighted ? "font-bold" : "text-slate-700")
                  }
                  onClick={() => handleStartEdit(name, value)}
                  title="Clique para editar"
                >
                  {formatHex(value)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const FlagsView: React.FC<{ flags: CPUState["flags"] }> = ({ flags }) => (
    <div>
      <h3 className="font-semibold text-gray-700 mb-2">Flags</h3>
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(flags).map(([flag, value]) => (
          <div
            key={flag}
            className={`flex justify-between items-center p-2 rounded ${
              value
                ? "bg-white text-slate-900 border border-slate-300"
                : "bg-slate-900 text-white"
            }`}
          >
            <span className="font-mono font-semibold">{flag}:</span>
            <span className="font-mono">{value ? "1" : "0"}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // Separar registradores gerais dos de ponteiro/deslocamento
  const generalRegs = {
    AX: state.registers.general.AX,
    BX: state.registers.general.BX,
    CX: state.registers.general.CX,
    DX: state.registers.general.DX,
  };
  const offsetRegs = {
    SP: state.registers.pointer.SP,
    BP: state.registers.pointer.BP,
    SI: state.registers.pointer.SI,
    DI: state.registers.pointer.DI,
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Estado da CPU
      </h2>

      <div className="space-y-4">
        <EditableRegisterGroup
          title="Registradores Gerais"
          registers={generalRegs}
          type="general"
        />
        <EditableRegisterGroup
          title="Registradores de Deslocamento"
          registers={offsetRegs}
          type="pointer"
        />
        <EditableRegisterGroup
          title="Registradores de Segmento"
          registers={state.registers.segment}
          type="segment"
        />
        <EditableRegisterGroup
          title="Registradores Especiais"
          registers={{ IP: state.registers.IP }}
          type="IP"
        />
        <FlagsView flags={state.flags} />

        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Estado:</span>
            <span
              className={`px-2 py-1 rounded text-sm ${
                state.halted
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-900 border border-slate-300"
              }`}
            >
              {state.halted ? "PARADO" : "EXECUTANDO"}
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Ciclos: <span className="font-mono">{state.cycles}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
