import { createContext } from 'react';
import { UserType } from './UserType';

export const UserContext = createContext<UserType | null>(null);
