/**
 * Utilitário para clonar estado da CPU
 */

import type { CPUState } from "../types";


export function cloneState(state: CPUState): CPUState {
  return JSON.parse(JSON.stringify(state));
}
