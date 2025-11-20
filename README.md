# Simulador x86 em Modo Real

Simulador educacional de processador x86 operando em modo real (16 bits), com visualização detalhada de barramentos, registradores e memória. Implementado em TypeScript com interface React.

## Visão Geral

Este projeto simula o funcionamento de um processador x86 simplificado, demonstrando os conceitos fundamentais de arquitetura de computadores:

- Ciclo de busca-decodificação-execução (fetch-decode-execute)
- Sistema de barramentos (endereço, dados e controle)
- Gerenciamento de registradores e flags
- Cálculo de endereços físicos em modo real
- Execução passo a passo com rastreamento completo

## Estrutura do Projeto

```
simple2/
├── src/
│   ├── core/                    # Núcleo do simulador
│   │   ├── cpu.ts              # Implementação da CPU
│   │   ├── memory.ts           # Sistema de memória
│   │   ├── parser.ts           # Parser assembly
│   │   ├── types.ts            # Tipos TypeScript
│   │   └── instructions/       # Implementação de instruções
│   │       ├── arithmetic.ts   # ADD, SUB, INC, DEC, etc.
│   │       ├── logical.ts      # AND, OR, XOR, NOT
│   │       ├── control.ts      # JMP, JZ, LOOP, CALL, RET
│   │       ├── data-transfer.ts# MOV, PUSH, POP
│   │       └── execute.ts      # Executor modular
│   └── ui/                     # Interface do usuário
│       ├── App.tsx             # Componente principal
│       ├── index.css           # Estilos globais
│       └── components/         # Componentes React
│           ├── CPUView.tsx     # Visualização da CPU
│           ├── MemoryView.tsx  # Visualização da memória
│           ├── BusFlow.tsx     # Fluxo de barramentos
│           ├── CodeInput.tsx   # Editor de código
│           ├── Controls.tsx    # Controles de execução
│           └── ExecutionTrace.tsx # Histórico de execução
├── main.tsx                    # Ponto de entrada
├── index.html                  # HTML principal
├── vite.config.ts             # Configuração Vite
├── tsconfig.json              # Configuração TypeScript
└── tailwind.config.js         # Configuração Tailwind CSS
```

## Fluxo de Barramentos

O simulador implementa o modelo de três barramentos da arquitetura x86:

### 1. Barramento de Endereço (Address Bus)

Transporta endereços de memória do processador para a memória.

- Largura: 20 bits (modo real)
- Direção: CPU → Memória
- Capacidade: 1 MB (2^20 bytes)
- Cálculo: Endereço Físico = (Segmento << 4) + Offset

**Exemplo:**

```
CS = 0x1000, IP = 0x0050
Endereço Físico = (0x1000 << 4) + 0x0050 = 0x10050
```

### 2. Barramento de Dados (Data Bus)

Transporta dados entre CPU e memória (bidirecional).

- Largura: 8 bits (1 byte por transferência)
- Direção: CPU ↔ Memória
- Operações: Leitura (READ) e Escrita (WRITE)

**Exemplo de Leitura:**

```
Passo 1: CPU coloca endereço 0x10050 no barramento de endereço
Passo 2: CPU envia sinal READ no barramento de controle
Passo 3: Memória coloca byte no barramento de dados
Passo 4: CPU lê o byte do barramento de dados
```

### 3. Barramento de Controle (Control Bus)

Transporta sinais de controle e sincronização.

- Sinais principais:
  - READ: Leitura da memória
  - WRITE: Escrita na memória
  - FETCH: Busca de instrução
  - DECODE: Decodificação

### Ciclo de Execução de Instrução

Cada instrução passa por três fases principais, com múltiplas operações de barramento:

#### Fase 1: FETCH (Busca)

```
1. CPU → Barramento Endereço: Endereço da instrução (CS:IP)
2. CPU → Barramento Controle: Sinal FETCH
3. Memória → Barramento Dados: Opcode da instrução
4. CPU lê opcode do barramento de dados
```

#### Fase 2: DECODE (Decodificação)

```
1. CPU analisa o opcode
2. Determina operandos necessários
3. Se operando na memória:
   - CPU → Barramento Endereço: Endereço do operando
   - CPU → Barramento Controle: Sinal READ
   - Memória → Barramento Dados: Valor do operando
```

#### Fase 3: EXECUTE (Execução)

```
1. CPU executa a operação na ALU
2. Atualiza registradores
3. Atualiza flags (ZF, CF, SF, OF)
4. Se escrita na memória:
   - CPU → Barramento Endereço: Endereço destino
   - CPU → Barramento Dados: Valor a escrever
   - CPU → Barramento Controle: Sinal WRITE
```

### Exemplo Completo: Instrução MOV BX, AX

```assembly
MOV BX, AX  ; Copia valor de AX para memória apontada por BX
```


**Sequência de barramento:**

```
[FETCH]
1. Barramento Endereço: 0x10000 (CS:IP)
   Barramento Controle: FETCH
   Barramento Dados: ← 0x89 (opcode MOV)

2. Barramento Endereço: 0x10001 (próximo byte)
   Barramento Controle: FETCH
   Barramento Dados: ← 0x07 (mod/rm byte)

[DECODE]
3. CPU calcula endereço destino:
   Endereço = (DS << 4) + BX
   Endereço = (0x2000 << 4) + 0x0100
   Endereço = 0x20100

[EXECUTE]
4. Barramento Endereço: 0x20100
   Barramento Dados: → 0x34 (byte baixo de AX)
   Barramento Controle: WRITE

5. Barramento Endereço: 0x20101
   Barramento Dados: → 0x12 (byte alto de AX)
   Barramento Controle: WRITE
```

## Sistema de Memória

### Modo Real (16 bits)

O processador opera em modo real, usando segmentação para acessar 1 MB de memória:

- Registradores de segmento: CS, DS, SS, ES (16 bits cada)
- Registradores de offset: IP, SP, BP, SI, DI, etc. (16 bits)
- Endereço físico de 20 bits: (Segmento << 4) + Offset

### Acesso à Memória

O simulador rastreia todos os acessos:

```typescript
interface MemoryAccess {
  type: "READ" | "WRITE";
  address: number;
  value: number;
  timestamp: number;
}
```

## Registradores

### Registradores de Propósito Geral (16 bits)

- **AX** (Accumulator): Acumulador, usado em operações aritméticas
- **BX** (Base): Ponteiro base, usado em endereçamento
- **CX** (Counter): Contador, usado em loops
- **DX** (Data): Dados, usado em operações de I/O

### Registradores Ponteiros (16 bits)

- **SP** (Stack Pointer): Ponteiro do topo da pilha
- **BP** (Base Pointer): Ponteiro base da pilha
- **SI** (Source Index): Índice fonte para operações de string
- **DI** (Destination Index): Índice destino para operações de string

### Registradores de Segmento (16 bits)

- **CS** (Code Segment): Segmento de código
- **DS** (Data Segment): Segmento de dados
- **SS** (Stack Segment): Segmento de pilha
- **ES** (Extra Segment): Segmento extra

### Registrador de Controle

- **IP** (Instruction Pointer): Ponteiro de instrução (Program Counter)

### Flags de Estado

- **ZF** (Zero Flag): Define se resultado é zero
- **CF** (Carry Flag): Define se houve carry/borrow
- **SF** (Sign Flag): Define o sinal do resultado
- **OF** (Overflow Flag): Define se houve overflow aritmético

## Instruções Suportadas

### Transferência de Dados

```assembly
MOV dest, src    ; Move dados entre registradores/memória
PUSH src         ; Empilha valor
POP dest         ; Desempilha valor
XCHG op1, op2    ; Troca valores
```

### Aritmética

```assembly
ADD dest, src    ; dest = dest + src
SUB dest, src    ; dest = dest - src
INC dest         ; dest = dest + 1
DEC dest         ; dest = dest - 1
MUL src          ; AX = AL * src (8 bits) ou DX:AX = AX * src (16 bits)
DIV src          ; AL = AX / src, AH = AX % src
```

### Lógica

```assembly
AND dest, src    ; dest = dest AND src
OR dest, src     ; dest = dest OR src
XOR dest, src    ; dest = dest XOR src
NOT dest         ; dest = NOT dest
```

### Controle de Fluxo

```assembly
JMP label        ; Salta incondicionalmente
JZ label         ; Salta se ZF = 1 (resultado zero)
JNZ label        ; Salta se ZF = 0 (resultado não-zero)
JC label         ; Salta se CF = 1 (houve carry)
JNC label        ; Salta se CF = 0 (não houve carry)
LOOP label       ; Decrementa CX e salta se CX != 0
CALL label       ; Chama sub-rotina
RET              ; Retorna de sub-rotina
HLT              ; Para execução
```

### Comparação

```assembly
CMP op1, op2     ; Compara op1 com op2 (subtração sem guardar resultado)
```

## Rastreamento de Execução

O simulador registra cada passo da execução:

```typescript
interface ExecutionTrace {
  instructionText: string; // Texto da instrução
  description: string; // Descrição da operação
  stateBefore: CPUState; // Estado antes da execução
  stateAfter: CPUState; // Estado após execução
  changedRegisters: RegisterName[]; // Registradores modificados
  changedFlags: FlagName[]; // Flags modificadas
  busOperations: BusOperation[]; // Operações de barramento
  addressCalculations: AddressCalculation[]; // Cálculos de endereço
  memoryAccesses: MemoryAccess[]; // Acessos à memória
}
```

## Tecnologias Utilizadas

### Core

- **TypeScript 5.6**: Linguagem principal
- **Arquitetura Modular**: Separação clara entre CPU, memória e instruções

### Interface

- **React 18**: Biblioteca de UI
- **Vite 6**: Build tool e dev server
- **Tailwind CSS 3**: Framework de estilos
- **PostCSS**: Processamento de CSS

## Instalação e Uso

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:5173

### Build de Produção

```bash
npm run build
```

Os arquivos serão gerados em `dist/`.

### Visualização do Build

```bash
npm run preview
```

## Uso do Simulador

### 1. Escrever Código Assembly

Digite ou cole código assembly no editor. Exemplo:

```assembly
; Calcula 5 + 3
MOV AX, 5
MOV BX, 3
ADD AX, BX
HLT
```

### 2. Carregar Programa

Clique em "Carregar Programa" para parsear e carregar na memória.

### 3. Executar

- **Step**: Executa uma instrução por vez
- **Run**: Executa automaticamente (pode pausar)
- **Reset**: Reinicia o estado da CPU

### 4. Visualizar

- **Registradores**: Valores atuais destacados quando modificados
- **Flags**: Estado das flags de condição
- **Memória**: Visualização hexadecimal com destaques
- **Barramentos**: Sequência de operações em cada instrução
- **Trace**: Histórico completo de execução

## Autor

Projeto educacional para disciplina de Arquitetura de Computadores

---

Desenvolvido com TypeScript, React, Tailwind e Vite
