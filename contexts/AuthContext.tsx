import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const PREMIUM_KEY = 'effective_day_tracker_premium';
const INVITE_CODE = 'Ashish';

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthState {
  user: AuthUser | null;
  isPremium: boolean;
  isLoading: boolean;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const authQuery = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      console.log('[AuthContext] Checking auth session...');

      const premiumStored = await AsyncStorage.getItem(PREMIUM_KEY);
      if (premiumStored === 'true') {
        setIsPremium(true);
      }

      if (!supabase) {
        console.log('[AuthContext] Supabase not configured');
        setIsInitialized(true);
        return null;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.log('[AuthContext] Get session error:', error.message);
          setIsInitialized(true);
          return null;
        }

        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
          };
          setUser(authUser);
          console.log('[AuthContext] Session restored for:', authUser.email);

          await checkPremiumStatus(authUser.id);
          setIsInitialized(true);
          return authUser;
        }
      } catch (e) {
        console.log('[AuthContext] Session check failed:', e);
      }

      setIsInitialized(true);
      return null;
    },
  });

  const checkPremiumStatus = async (userId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('is_premium')
        .eq('user_id', userId)
        .single();

      if (!error && data?.is_premium) {
        setIsPremium(true);
        await AsyncStorage.setItem(PREMIUM_KEY, 'true');
        console.log('[AuthContext] User is premium');
      } else {
        const localPremium = await AsyncStorage.getItem(PREMIUM_KEY);
        setIsPremium(localPremium === 'true');
      }
    } catch (e) {
      console.log('[AuthContext] Premium check failed:', e);
      const localPremium = await AsyncStorage.getItem(PREMIUM_KEY);
      setIsPremium(localPremium === 'true');
    }
  };

  const signUpMutation = useMutation({
    mutationFn: async ({ email, password, inviteCode }: { email: string; password: string; inviteCode?: string }) => {
      if (!supabase) throw new Error('Supabase not configured');

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('Sign up failed');

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || '',
      };

      const premium = inviteCode?.trim() === INVITE_CODE;

      try {
        await supabase.from('user_profiles').upsert({
          user_id: data.user.id,
          email: data.user.email,
          is_premium: premium,
          created_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      } catch (e) {
        console.log('[AuthContext] Profile creation failed (non-critical):', e);
      }

      if (premium) {
        await AsyncStorage.setItem(PREMIUM_KEY, 'true');
        setIsPremium(true);
      }

      setUser(authUser);
      return authUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-session'] });
    },
  });

  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      if (!supabase) throw new Error('Supabase not configured');

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('Sign in failed');

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || '',
      };

      await checkPremiumStatus(data.user.id);
      setUser(authUser);
      return authUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-session'] });
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      if (supabase) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setIsPremium(false);
      await AsyncStorage.removeItem(PREMIUM_KEY);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-session'] });
    },
  });

  const redeemInviteCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      if (code.trim() !== INVITE_CODE) {
        throw new Error('Invalid invite code');
      }

      if (user && supabase) {
        try {
          await supabase.from('user_profiles').upsert({
            user_id: user.id,
            is_premium: true,
          }, { onConflict: 'user_id' });
        } catch (e) {
          console.log('[AuthContext] Premium upsert failed:', e);
        }
      }

      await AsyncStorage.setItem(PREMIUM_KEY, 'true');
      setIsPremium(true);
      return true;
    },
  });

  const { mutateAsync: signUpAsync } = signUpMutation;
  const { mutateAsync: signInAsync } = signInMutation;
  const { mutateAsync: signOutAsync } = signOutMutation;
  const { mutateAsync: redeemAsync } = redeemInviteCodeMutation;

  const signUp = useCallback((email: string, password: string, inviteCode?: string) => {
    return signUpAsync({ email, password, inviteCode });
  }, [signUpAsync]);

  const signIn = useCallback((email: string, password: string) => {
    return signInAsync({ email, password });
  }, [signInAsync]);

  const signOut = useCallback(() => {
    return signOutAsync();
  }, [signOutAsync]);

  const redeemInviteCode = useCallback((code: string) => {
    return redeemAsync(code);
  }, [redeemAsync]);

  return {
    user,
    isPremium,
    isAuthenticated: !!user,
    isInitialized,
    isLoading: authQuery.isLoading || signUpMutation.isPending || signInMutation.isPending,
    signUp,
    signIn,
    signOut,
    redeemInviteCode,
    signUpError: signUpMutation.error?.message || null,
    signInError: signInMutation.error?.message || null,
    redeemError: redeemInviteCodeMutation.error?.message || null,
  };
});
