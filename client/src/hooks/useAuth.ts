import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

export type User = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // On component mount, check if a user is logged in
    const token = localStorage.getItem('carflow_token');
    const savedUser = localStorage.getItem('carflow_user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing user data', error);
      }
    }
    
    setLoading(false);
  }, []);

  const login = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('carflow_token', token);
    localStorage.setItem('carflow_user', JSON.stringify(userData));
  };

  const logout = () => {
    localStorage.removeItem('carflow_token');
    localStorage.removeItem('carflow_user');
    setUser(null);
    setLocation('/login');
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  return {
    user,
    loading,
    isLoggedIn: !!user,
    isAdmin: isAdmin(),
    login,
    logout
  };
}