import { PrismaClient } from '@prisma/client'

type ClientePrismaComPlayground = PrismaClient & {
  playgroundJogo?: unknown
  conquista?: unknown
  recompensaBauTrilhaAluno?: unknown
}

const globalParaPrisma = globalThis as unknown as {
  prisma: ClientePrismaComPlayground | undefined
}

function criarClientePrisma() {
  return new PrismaClient() as ClientePrismaComPlayground
}

function clienteTemModelosPlayground(cliente: ClientePrismaComPlayground | undefined) {
  if (!cliente) return false
  return (
    typeof cliente.playgroundJogo !== 'undefined' &&
    typeof cliente.conquista !== 'undefined' &&
    typeof cliente.recompensaBauTrilhaAluno !== 'undefined'
  )
}

function obterClientePrisma() {
  if (process.env.NODE_ENV === 'production') {
    return globalParaPrisma.prisma ?? criarClientePrisma()
  }

  const clienteGlobalAtual = globalParaPrisma.prisma
  if (clienteTemModelosPlayground(clienteGlobalAtual)) {
    return clienteGlobalAtual
  }

  // Em desenvolvimento, após alterar o schema, pode ficar um cliente antigo em memória sem os novos delegates.
  // Nesse caso recriamos para evitar erros como "Cannot read properties of undefined (reading 'findUnique')".
  if (clienteGlobalAtual) {
    clienteGlobalAtual.$disconnect().catch(() => undefined)
  }

  const novoCliente = criarClientePrisma()
  globalParaPrisma.prisma = novoCliente
  return novoCliente
}

export const prisma = obterClientePrisma()

if (process.env.NODE_ENV !== 'production') {
  globalParaPrisma.prisma = prisma
}
