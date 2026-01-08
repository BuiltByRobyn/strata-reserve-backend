import { User } from '../models/userModel';

// Mock database
const users: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Doe', email: 'jane@example.com' },
];

export const UserService = {
  getAllUsers: (): User[] => {
    return users;
  },

  getUserById: (id: string): User | undefined => {
    return users.find((user) => user.id === id);
  },

  createUser: (user: Omit<User, 'id'>): User => {
    const newUser: User = {
      id: String(users.length + 1),
      ...user,
    };
    users.push(newUser);
    return newUser;
  },
};
