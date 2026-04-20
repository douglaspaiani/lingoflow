import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('admin', 10)
  const defaultPassword = await bcrypt.hash('123456', 10)

  // Criar Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@app.com' },
    update: {},
    create: {
      email: 'admin@app.com',
      username: 'admin',
      name: 'Super Admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  // Criar Turma
  const classRoom = await prisma.classRoom.upsert({
    where: { code: 'TRM-001' },
    update: {},
    create: {
      name: 'Turma Iniciante A',
      code: 'TRM-001',
      adminId: admin.id,
    },
  })

  // Criar Alunos Iniciais (from data.json)
  const studentsData = [
    { name: 'Douglas', username: 'douglaspaiani', email: 'douglas@test.com', points: 1250, streak: 5, level: 3, xp: 450, energy: 5, avatar: 'https://picsum.photos/seed/douglas/200', coverPhoto: 'https://picsum.photos/seed/douglas_cover/800/400' },
    { name: 'Maria', username: 'maria_study', email: 'maria@test.com', points: 980, streak: 2, level: 2, xp: 120, energy: 5, avatar: 'https://picsum.photos/seed/maria/200', coverPhoto: 'https://picsum.photos/seed/maria_cover/800/400' },
    { name: 'João', username: 'joao_polyglot', email: 'joao@test.com', points: 2100, streak: 15, level: 5, xp: 800, energy: 5, avatar: 'https://picsum.photos/seed/joao/200', coverPhoto: 'https://picsum.photos/seed/joao_cover/800/400' },
    { name: 'Ana', username: 'ana_learning', email: 'ana@test.com', points: 850, streak: 3, level: 2, xp: 350, energy: 5, avatar: 'https://picsum.photos/seed/ana/200' }
  ]

  for (const student of studentsData) {
    await prisma.user.upsert({
      where: { username: student.username },
      update: {},
      create: {
        ...student,
        password: defaultPassword,
        role: 'ALUNO',
        classRoomId: classRoom.id
      }
    })
  }

  // Criar Nível e Lições
  const level1 = await prisma.level.create({
    data: {
      title: 'Saudações & Básico',
      description: 'Aprenda o básico de como se apresentar.',
      difficulty: 1,
      lessons: {
        create: [
          {
            title: 'Olá e Tchau',
            exercises: {
              create: [
                { type: 'translate', question: 'How are you?', answer: 'Como você está?', options: JSON.stringify(['Como está você?', 'Oi tudo bem?', 'Como você está?', 'Qual seu nome?']), xp: 10 },
                { type: 'select', question: 'Hello', answer: 'Olá', options: JSON.stringify(['Olá', 'Tchau', 'Bom dia', 'Noite']), xp: 10 },
                { type: 'match', question: 'Combine os pares', answer: 'completed', options: '[]', pairs: JSON.stringify([{ left: 'Olá', right: 'Hello' }, { left: 'Tchau', right: 'Goodbye' }]), xp: 20 },
                { type: 'reorder', question: 'Suas amigas são muito engraçadas.', answer: 'Your friends are really funny', options: JSON.stringify(['are', 'friends', 'funny', 'in', 'really', 'there', 'what', 'Your']), xp: 25 }
              ]
            }
          }
        ]
      }
    }
  })

  console.log('Seed executed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
