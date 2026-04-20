import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'data.json');

async function ensureDataFile() {
  const initialData = {
    users: [
      { 
        id: '1', 
        name: 'Douglas', 
        username: 'douglaspaiani',
        avatar: 'https://picsum.photos/seed/douglas/200',
        coverPhoto: 'https://picsum.photos/seed/douglas_cover/800/400',
        points: 1250, 
        streak: 5, 
        level: 3, 
        xp: 450, 
        energy: 5,
        completedLessons: ['l1'],
        following: [],
        followers: [] 
      },
      { 
        id: '2', 
        name: 'Maria', 
        username: 'maria_study',
        avatar: 'https://picsum.photos/seed/maria/200',
        coverPhoto: 'https://picsum.photos/seed/maria_cover/800/400',
        points: 980, 
        streak: 2, 
        level: 2, 
        xp: 120, 
        completedLessons: [],
        following: [],
        followers: []
      },
      { 
        id: '3', 
        name: 'João', 
        username: 'joao_polyglot',
        avatar: 'https://picsum.photos/seed/joao/200',
        coverPhoto: 'https://picsum.photos/seed/joao_cover/800/400',
        points: 2100, 
        streak: 15, 
        level: 5, 
        xp: 800, 
        completedLessons: ['l1', 'l2'],
        following: [],
        followers: []
      },
      { 
        id: '4', 
        name: 'Ana', 
        username: 'ana_learning',
        avatar: 'https://picsum.photos/seed/ana/200',
        points: 850, 
        streak: 3, 
        level: 2, 
        xp: 350, 
        completedLessons: [],
        following: [],
        followers: []
      },
      { 
        id: '5', 
        name: 'Carlos', 
        username: 'carlos_br',
        avatar: 'https://picsum.photos/seed/carlos/200',
        points: 720, 
        streak: 1, 
        level: 2, 
        xp: 220, 
        following: [],
        followers: []
      },
      { 
        id: '6', 
        name: 'Beatriz', 
        username: 'bia_langs',
        avatar: 'https://picsum.photos/seed/bia/200',
        points: 600, 
        streak: 7, 
        level: 1, 
        xp: 400, 
        following: [],
        followers: []
      },
      { 
        id: '7', 
        name: 'Pedro', 
        username: 'ph_study',
        avatar: 'https://picsum.photos/seed/pedro/200',
        points: 450, 
        streak: 0, 
        level: 1, 
        xp: 150, 
        following: [],
        followers: []
      }
    ],
    levels: [
      {
        id: '1',
        title: 'Saudações & Básico',
        description: 'Aprenda o básico de como se apresentar.',
        difficulty: 1,
        lessons: [
          {
            id: 'l1',
            title: 'Olá e Tchau',
            exercises: [
              { id: 'e1', type: 'translate', question: 'How are you?', answer: 'Como você está?', options: ['Como está você?', 'Oi tudo bem?', 'Como você está?', 'Qual seu nome?'], xp: 10 },
              { id: 'e2', type: 'select', question: 'Hello', answer: 'Olá', options: ['Olá', 'Tchau', 'Bom dia', 'Noite'], xp: 10 },
              { id: 'e3-match', type: 'match', question: 'Combine os pares', answer: 'completed', xp: 20, pairs: [
                { left: 'Olá', right: 'Hello' },
                { left: 'Tchau', right: 'Goodbye' },
                { left: 'Obrigado', right: 'Thank you' },
                { left: 'Sim', right: 'Yes' },
                { left: 'Não', right: 'No' }
              ] },
              { id: 'e4-reorder', type: 'reorder', question: 'Suas amigas são muito engraçadas.', answer: 'Your friends are really funny', options: ['are', 'friends', 'funny', 'in', 'really', 'there', 'what', 'Your'], xp: 25 }
            ]
          },
          {
            id: 'l1-2',
            title: 'Meu Nome É...',
            exercises: [
              { id: 'e1-2', type: 'translate', question: 'What is your name?', answer: 'Qual é o seu nome?', options: ['Como você está?', 'Qual é o seu nome?', 'De onde você é?', 'Tudo bem?'], xp: 10 }
            ]
          }
        ]
      },
      {
        id: '2',
        title: 'Viagem & Direções',
        description: 'Essencial para quem vai para fora.',
        difficulty: 2,
        lessons: [
          {
            id: 'l2',
            title: 'No Aeroporto',
            exercises: [
              { id: 'e3', type: 'translate', question: 'Where is my passport?', answer: 'Onde está meu passaporte?', options: ['Cadê minha mala?', 'Onde está meu passaporte?', 'Quero um café', 'Onde fica o hotel?'], xp: 15 }
            ]
          }
        ]
      }
    ],
    admins: [
      { id: 'admin1', email: 'admin@app.com', password: 'admin', name: 'Super Admin' }
    ],
    rooms: [],
    settings: {
      defaultDailyEnergy: 5
    }
  };

  try {
    const existingRaw = await fs.readFile(DATA_FILE, 'utf-8');
    const existing = JSON.parse(existingRaw);
    if (!existing.admins) existing.admins = initialData.admins;
    if (!existing.rooms) existing.rooms = [];
    if (!existing.settings) existing.settings = initialData.settings;
    
    // Migrate existing users to have energy
    existing.users = existing.users.map((u: any) => ({
      ...u,
      energy: u.energy !== undefined ? u.energy : existing.settings.defaultDailyEnergy
    }));

    await fs.writeFile(DATA_FILE, JSON.stringify(existing, null, 2));
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
}

async function startServer() {
  await ensureDataFile();
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/data', async (req, res) => {
    const rawData = await fs.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(rawData);
    res.json(data);
  });

  // Admin Auth
  app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8'));
    const admin = data.admins.find((a: any) => a.email === email && a.password === password);
    if (admin) {
      res.json({ success: true, admin });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  });

  app.post('/api/admin/add', async (req, res) => {
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8'));
    const newAdmin = { ...req.body, id: Date.now().toString() };
    if (!data.admins) data.admins = [];
    data.admins.push(newAdmin);
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    res.json(newAdmin);
  });

  app.post('/api/admin/update', async (req, res) => {
    const { id, name, email, password } = req.body;
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8'));
    const adminIndex = data.admins.findIndex((a: any) => a.id === id);
    if (adminIndex === -1) return res.status(404).json({ error: 'Admin not found' });
    
    data.admins[adminIndex] = { ...data.admins[adminIndex], name, email };
    if (password) data.admins[adminIndex].password = password;
    
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    res.json(data.admins[adminIndex]);
  });

  app.post('/api/admin/delete', async (req, res) => {
    const { id } = req.body;
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8'));
    data.admins = data.admins.filter((a: any) => a.id !== id);
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  });

  // Content Management
  app.post('/api/admin/update-content', async (req, res) => {
    const { levels } = req.body;
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8'));
    data.levels = levels;
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  });

  // User Management
  app.post('/api/admin/update-users', async (req, res) => {
    const { users } = req.body;
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8'));
    data.users = users;
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  });

  app.post('/api/admin/update-rooms', async (req, res) => {
    const { rooms } = req.body;
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8'));
    data.rooms = rooms;
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  });

  app.post('/api/admin/update-settings', async (req, res) => {
    const { settings } = req.body;
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8'));
    data.settings = settings;
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  });

  app.post('/api/admin/energy-combo', async (req, res) => {
    const { roomId, amount } = req.body;
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8'));
    const room = data.rooms.find((r: any) => r.id === roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    data.users = data.users.map((u: any) => {
      if (room.studentIds.includes(u.id)) {
        return { ...u, energy: (u.energy || 0) + amount };
      }
      return u;
    });

    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  });

  // Rest of the existing endpoints...
  app.post('/api/user/follow', async (req, res) => {
    const { userId, targetId } = req.body;
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8'));
    const user = data.users.find((u: any) => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.following) user.following = [];
    const index = user.following.indexOf(targetId);
    if (index === -1) {
      user.following.push(targetId);
    } else {
      user.following.splice(index, 1);
    }
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    res.json(user);
  });

  app.post('/api/update-progress', async (req, res) => {
    const { userId, xpToAdd, lessonId } = req.body;
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8'));
    const user = data.users.find((u: any) => u.id === userId);
    if (user) {
      if (user.energy <= 0) return res.status(403).json({ error: 'Sem energia suficiente para completar lição' });
      
      user.energy -= 1;
      user.points += xpToAdd;
      user.xp += xpToAdd;
      
      if (lessonId && !user.completedLessons.includes(lessonId)) {
        user.completedLessons.push(lessonId);
      }
    }
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    res.json(user);
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
