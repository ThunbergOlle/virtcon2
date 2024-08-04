import { createContext, useContext } from 'react';
import { UserType } from './UserType';

export const UserContext = createContext<UserType | null>(null);

export const useUser = () => {
  const user = useContext(UserContext);
  if (!user) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return user;
};
