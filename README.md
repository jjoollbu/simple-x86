# Simulador x86 em Modo Real

Simulador básico de processador x86 em modo real (16 bits). Mostra como funciona os barramentos, registradores e memória.

Feito em TypeScript + React.

## O que faz

- Executa instruções assembly x86 básicas
- Mostra ciclo fetch-decode-execute
- Visualiza barramentos (endereço, dados, controle)
- Execução passo a passo pra ver o que tá acontecendo

**Nota**: É um simulador simplificado pra fins educacionais, não implementa tudo do x86 real.

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

## Estrutura do Projeto

```
src/
├── core/           # lógica do simulador
│   ├── cpu.ts      # implementação da CPU
│   ├── memory.ts   # sistema de memória
│   ├── parser.ts   # parser assembly
│   └── instructions/  # implementação das instruções
└── ui/             # interface React
    └── components/ # componentes visuais
```

## Como funciona

### Barramentos

O simulador tem 3 barramentos:

**Barramento de Endereço**: CPU envia endereços pra memória (20 bits no modo real)

- Cálculo: endereço físico = (segmento \* 16) + offset

**Barramento de Dados**: carrega dados entre CPU e memória (bidirecional)

**Barramento de Controle**: sinais tipo READ, WRITE, FETCH

### Ciclo fetch-decode-execute

Cada instrução passa por 3 fases:

1. **FETCH**: CPU busca instrução da memória (usa CS:IP)
2. **DECODE**: CPU decodifica o opcode e operandos
3. **EXECUTE**: Executa a operação, atualiza registradores e flags

### Registradores

**Propósito geral**: AX, BX, CX, DX
**Ponteiros**: SP (stack), BP, SI, DI  
**Segmentos**: CS, DS, SS, ES
**IP**: instruction pointer

### Flags

ZF (zero), CF (carry), SF (sign), OF (overflow)

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

### Como usar

1. Escreve o código assembly na caixa de texto
2. Clica em "Carregar Programa"
3. Usa "Step" pra executar instrução por instrução (ou "Run" pra rodar tudo)
4. Vê os registradores, memória e barramentos mudando

## Instruções suportadas

- **Dados**: MOV, PUSH, POP
- **Aritmética**: ADD, SUB, INC, DEC, MUL, DIV, NEG
- **Lógica**: AND, OR, XOR, NOT, CMP
- **Controle**: JMP, JE, JNE, JG, JL, CALL, RET, LOOP
- **Outras**: NOP, HLT

## Rodando o projeto

```bash
npm install
npm run dev
```

## TODO

- [ ] Implementar XCHG
- [ ] Melhorar parser de operandos de memória
- [ ] Adicionar mais exemplos
- [ ] Overflow flag não tá 100% correto
- [ ] LocalStorage pra salvar programas

---

Projeto feito pra matéria de Arquitetura de Computadores
