import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types';

interface UserContextType {
  user: UserProfile | null;
  login: (user: UserProfile) => void;
  logout: () => void;
  updateUser: (user: UserProfile) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('bremiAI_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (newUser: UserProfile) => {
    setUser(newUser);
    localStorage.setItem('bremiAI_user', JSON.stringify(newUser));
  };

  const logout = () => {
    localStorage.removeItem('bremiAI_user');
    setUser(null);
  };

  const updateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('bremiAI_user', JSON.stringify(updatedUser));
  };

  return (
    <UserContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
