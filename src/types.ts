export interface Exercise {
  id: string;
  type: 'translate' | 'select' | 'listen' | 'speak' | 'match' | 'reorder';
  question: string;
  answer: string;
  options?: string[];
  pairs?: { left: string; right: string }[];
  xp: number;
}

export interface Lesson {
  id: string;
  title: string;
  exercises: Exercise[];
}

export interface Level {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  lessons: Lesson[];
}

export interface User {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  coverPhoto?: string;
  points: number;
  streak: number;
  level: number;
  xp: number;
  energy: number;
  completedLessons: string[];
  following: string[]; // List of user IDs being followed
  followers: string[]; // List of user IDs following this user
  lastActivityDate?: string; // ISO date
}

export interface AdminUser {
  id: string;
  email: string;
  password?: string;
  name: string;
}

export interface Room {
  id: string;
  name: string;
  studentIds: string[]; // List of user IDs in the room
  code: string; // 5-digit numeric registration code
}

export interface GlobalSettings {
  defaultDailyEnergy: number;
}

export interface AppData {
  users: User[];
  levels: Level[];
  admins: AdminUser[];
  rooms: Room[];
  settings: GlobalSettings;
}
