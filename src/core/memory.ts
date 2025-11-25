// sistema de memória pra o simulador x86
// modo real = 1MB de RAM (20 bits de endereço)

import type { MemoryAccess } from "./types";

export const MEMORY_SIZE = 0x100000; // 1MB

// calcula endereço físico: (segmento * 16) + offset
export function physicalAddress(segment: number, offset: number): number {
  return (segment * 16 + offset) & 0xfffff; // mask 20 bits
}

export function formatAddressCalculation(
  segment: number,
  offset: number
): string {
  const physical = physicalAddress(segment, offset);
  return `(${segment
    .toString(16)
    .toUpperCase()
    .padStart(4, "0")} * 16) + ${offset
    .toString(16)
    .toUpperCase()
    .padStart(4, "0")} = ${physical
    .toString(16)
    .toUpperCase()
    .padStart(5, "0")}`;
}

export class Memory {
  public data: Uint8Array; // Público para visualização
  public size: number;
  public accessLog: MemoryAccess[] = [];
  public maxLogSize: number = 1000;

  constructor(size: number = MEMORY_SIZE) {
    this.data = new Uint8Array(size);
    this.size = size;
  }

  readByte(address: number): number {
    const addr = address & 0xfffff; // garante 20 bits
    const value = this.data[addr] ?? 0;

    // log de acesso pra debug
    this.accessLog.push({
      type: "READ",
      address: addr,
      value,
      size: 1,
    });

    if (this.accessLog.length > this.maxLogSize) {
      this.accessLog.shift(); // remove o mais antigo
    }

    return value;
  }

  writeByte(address: number, value: number): void {
    const addr = address & 0xfffff;
    const val = value & 0xff; // 8 bits

    this.data[addr] = val;

    this.accessLog.push({
      type: "WRITE",
      address: addr,
      value: val,
      size: 1,
    });

    if (this.accessLog.length > this.maxLogSize) {
      this.accessLog.shift();
    }
  }

  readWord(address: number): number {
    const low = this.readByte(address);
    const high = this.readByte(address + 1);
    return (high << 8) | low;
  }

  writeWord(address: number, value: number): void {
    const val = value & 0xffff;
    this.writeByte(address, val & 0xff);
    this.writeByte(address + 1, (val >> 8) & 0xff);
  }

  peekByte(address: number): number {
    return this.data[address & 0xfffff] ?? 0;
  }

  peekWord(address: number): number {
    const addr = address & 0xfffff;
    const low = this.data[addr] ?? 0;
    const high = this.data[(addr + 1) & 0xfffff] ?? 0;
    return (high << 8) | low;
  }

  clearAccessLog(): void {
    this.accessLog = [];
  }

  reset(): void {
    this.data.fill(0);
    this.accessLog = [];
  }

  getRange(start: number, length: number): Uint8Array {
    const startAddr = start & 0xfffff;
    const endAddr = Math.min(startAddr + length, this.data.length);
    return this.data.slice(startAddr, endAddr);
  }

  loadData(address: number, data: number[]): void {
    let addr = address & 0xfffff;
    for (const byte of data) {
      this.data[addr] = byte & 0xff;
      addr = (addr + 1) & 0xfffff;
    }
  }
}
