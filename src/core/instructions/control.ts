// Instruções de controle de fluxo — essas instruções afetam para onde a CPU
// vai continuar a execução do código (saltos, chamadas de função, loops, etc)

import { InstructionContext } from ".";

export function executeJMP(ctx: InstructionContext): string {
  const { instruction } = ctx;

  // pega o argumento da instrução
  // e converte esse operando em um valor numérico real de destino
  // isso permite que o operand seja registrador ou memória
  const target = ctx.getOperandValue(instruction.args[0]);

  // define o registrador IP (Instruction Pointer) para o endereço de destino
  // ou seja: a próxima instrução será lida a partir daí, target sendo o estado da CPU do jmp
  ctx.state.registers.IP = target;

  // informa ao sistema visual/debug que o IP mudou
  ctx.markRegChanged("IP");

  // expressão pro log
  return `JMP ${ctx.formatOperand(instruction.args[0])} → IP = 0x${target
    .toString(16)
    .toUpperCase()}`;
}

export function executeJE(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const target = ctx.getOperandValue(instruction.args[0]);

  // JE = Jump if Equal
  // o salto acontece SOMENTE se o flag ZF (Zero Flag) estiver ativado.
  // ZF é ativado quando alguma operação anterior resultou em zero.
  if (ctx.state.flags.ZF) {
    // IP recebe o endereço alvo do salto
    ctx.state.registers.IP = target;
    ctx.markRegChanged("IP");

    return `JE ${ctx.formatOperand(
      instruction.args[0]
    )} → Saltou para 0x${target.toString(16).toUpperCase()}`;
  } else {
    // se não saltar, segue para a próxima instrução sequencial
    ctx.nextIP();
    return `JE ${ctx.formatOperand(instruction.args[0])} → Não saltou (ZF=0)`;
  }
}

export function executeJNE(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const target = ctx.getOperandValue(instruction.args[0]);

  // JNE = Jump if Not Equal (ou Jump if ZF=0)
  if (!ctx.state.flags.ZF) {
    ctx.state.registers.IP = target;
    ctx.markRegChanged("IP");
    return `JNE ${ctx.formatOperand(
      instruction.args[0]
    )} → Saltou para 0x${target.toString(16).toUpperCase()}`;
  } else {
    ctx.nextIP();
    return `JNE ${ctx.formatOperand(instruction.args[0])} → Não saltou (ZF=1)`;
  }
}

export function executeJG(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const target = ctx.getOperandValue(instruction.args[0]);

  // JG = Jump if Greater
  // em aritmética signed, isso é verdadeiro quando:
  // - o resultado anterior NÃO foi zero (ZF=0)
  // - SF é igual a OF
  // isso indica que o resultado é positivamente maior em comparação signed
  if (!ctx.state.flags.ZF && ctx.state.flags.SF === ctx.state.flags.OF) {
    ctx.state.registers.IP = target;
    ctx.markRegChanged("IP");
    return `JG ${ctx.formatOperand(instruction.args[0])} → Saltou`;
  } else {
    ctx.nextIP();
    return `JG ${ctx.formatOperand(instruction.args[0])} → Não saltou`;
  }
}

export function executeJL(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const target = ctx.getOperandValue(instruction.args[0]);

  // JL = Jump if Less
  // condição: SF ≠ OF
  // significa que houve cruzamento inconsistente entre sinal e overflow,
  // indicando número negativo no contexto signed.
  if (ctx.state.flags.SF !== ctx.state.flags.OF) {
    ctx.state.registers.IP = target;
    ctx.markRegChanged("IP");
    return `JL ${ctx.formatOperand(instruction.args[0])} → Saltou`;
  } else {
    ctx.nextIP();
    return `JL ${ctx.formatOperand(instruction.args[0])} → Não saltou`;
  }
}

export function executeJGE(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const target = ctx.getOperandValue(instruction.args[0]);

  // JGE = Jump if Greater or Equal
  // Condição: SF == OF
  // ou seja, não houve sinal inconsistente — resultado é >= 0
  if (ctx.state.flags.SF === ctx.state.flags.OF) {
    ctx.state.registers.IP = target;
    ctx.markRegChanged("IP");
    return `JGE ${ctx.formatOperand(instruction.args[0])} → Saltou`;
  } else {
    ctx.nextIP();
    return `JGE ${ctx.formatOperand(instruction.args[0])} → Não saltou`;
  }
}

export function executeJLE(ctx: InstructionContext): string {
  const { instruction } = ctx;
  const target = ctx.getOperandValue(instruction.args[0]);

  // JLE = Jump if Less or Equal
  // condição verdadeira quando:
  // - resultado foi zero (ZF = 1)
  // - OU quando SF ≠ OF (resultado negativo)
  if (ctx.state.flags.ZF || ctx.state.flags.SF !== ctx.state.flags.OF) {
    ctx.state.registers.IP = target;
    ctx.markRegChanged("IP");
    return `JLE ${ctx.formatOperand(instruction.args[0])} → Saltou`;
  } else {
    ctx.nextIP();
    return `JLE ${ctx.formatOperand(instruction.args[0])} → Não saltou`;
  }
}

export function executeCALL(
  ctx: InstructionContext,
  push: (value: number) => void
): string {
  const { instruction } = ctx;

  // CALL funciona como chamada de função
  // primeiro obtém o endereço da função de destino
  const target = ctx.getOperandValue(instruction.args[0]);

  // calcula o endereço para onde retornar após a função terminar
  // csse endereço é o endereço da instrução seguinte à CALL
  const returnAddr = (ctx.state.registers.IP + instruction.size) & 0xffff;

  // empilha o endereço de retorno na stack
  push(returnAddr);

  // IP agora salta para o destino da função
  ctx.state.registers.IP = target;

  ctx.markRegChanged("SP");
  ctx.markRegChanged("IP");

  return `CALL ${ctx.formatOperand(instruction.args[0])} → IP = 0x${target
    .toString(16)
    .toUpperCase()}, retorno em 0x${returnAddr.toString(16).toUpperCase()}`;
}

export function executeRET(ctx: InstructionContext, pop: () => number): string {
  // RET volta para o endereço salvo pela CALL
  const returnAddr = pop();

  // IP agora aponta novamente para depois da CALL original
  ctx.state.registers.IP = returnAddr;

  ctx.markRegChanged("SP");
  ctx.markRegChanged("IP");

  return `RET → IP = 0x${returnAddr.toString(16).toUpperCase()}`;
}

export function executeLOOP(ctx: InstructionContext): string {
  const { instruction } = ctx;

  // LOOP usa automaticamente CX como contador
  // sempre decrementa CX antes do teste
  const target = ctx.getOperandValue(instruction.args[0]);
  const cx = (ctx.readRegister("CX") - 1) & 0xffff;

  // atualiza CX com o valor decrementado
  ctx.writeRegister("CX", cx);
  ctx.markRegChanged("CX");

  // se CX ainda não chegou a zero, continua o loop
  if (cx !== 0) {
    ctx.state.registers.IP = target;
    ctx.markRegChanged("IP");
    return `LOOP ${ctx.formatOperand(
      instruction.args[0]
    )} → CX = ${cx}, saltou`;
  } else {
    // se CX chegou a zero, sai do loop e segue execução normal
    ctx.nextIP();
    return `LOOP ${ctx.formatOperand(
      instruction.args[0]
    )} → CX = 0, fim do loop`;
  }
}

export function executeNOP(ctx: InstructionContext): string {
  // NOP = No Operation
  // Literalmente não faz nada além de avançar o IP
  ctx.nextIP();
  return "NOP → Nenhuma operação";
}

export function executeHLT(ctx: InstructionContext): string {
  // HLT faz a CPU parar → nenhum ciclo adicional será executado
  ctx.state.halted = true;
  return "HLT → CPU parada";
}
