import type { User } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const mockUsers: User[] = [
  {
    id: 'mock-user-1',
    email: 'test@cushion.app',
    password: bcrypt.hashSync('password123', 10),
    name: '김테스트',
    profileImage: null,
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastLoginAt: new Date('2024-01-20'),
  },
  {
    id: 'mock-user-2',
    email: 'admin@cushion.app',
    password: bcrypt.hashSync('admin123', 10),
    name: '관리자',
    profileImage: null,
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastLoginAt: new Date('2024-01-19'),
  },
];