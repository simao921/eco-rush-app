import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setAuthError(null);
        fetchProfile(session.user.id);
      } else {
        setAuthError({ type: 'auth_required' });
        setIsLoadingAuth(false);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setAuthError(null);
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setAuthError({ type: 'auth_required' });
        setIsLoadingAuth(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error: profileError } = await supabase
        .from('User')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      if (!data) {
        setAuthError({ type: 'user_not_registered' });
        setProfile(null);
        return;
      }

      setProfile(data);
      setUser(prev => ({ ...prev, ...data }));
      setAuthError(null);
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error?.code === 'PGRST116') {
        setProfile(null);
        setAuthError({ type: 'user_not_registered' });
      } else {
        setAuthError({ type: 'auth_failed', message: error?.message || 'Erro ao validar utilizador.' });
      }
    } finally {
      setIsLoadingAuth(false);
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      session, 
      loading, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      login, 
      logout,
      isAdmin,
      navigateToLogin: () => { window.location.assign('/login'); }
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
