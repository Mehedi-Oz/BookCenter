import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import { BackHandler, Platform } from 'react-native';

// Storage keys
const K_UNLOCKED = 'bc_auth_unlocked';
const K_ATTEMPTS = 'bc_auth_attempts';
const K_BLOCKED = 'bc_auth_blocked';
const K_LOCK_NEXT = 'bc_auth_lock_next';

const MAX_ATTEMPTS = 10;

// Obfuscated password: "_hasan#0-0#brothers_"
function getExpectedPassword(): string {
  const codes = [95, 104, 97, 115, 97, 110, 35, 48, 45, 48, 35, 98, 114, 111, 116, 104, 101, 114, 115, 95];
  return String.fromCharCode(...codes);
}

export type AuthState = {
  unlocked: boolean;
  blocked: boolean;
  attemptsLeft: number;
  loading: boolean;
  unlock: (input: string) => Promise<boolean>;
  lockApp: () => Promise<void>;
  resetAuth: () => Promise<void>;
};

export const [AuthProvider, useAuth] = createContextHook<AuthState>(() => {
  const [unlocked, setUnlocked] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load persisted state
  useEffect(() => {
    (async () => {
      try {
        const [u, a, b, lockNext] = await Promise.all([
          AsyncStorage.getItem(K_UNLOCKED),
          AsyncStorage.getItem(K_ATTEMPTS),
          AsyncStorage.getItem(K_BLOCKED),
          AsyncStorage.getItem(K_LOCK_NEXT),
        ]);

        const nextLock = lockNext === '1';
        if (nextLock) {
          await AsyncStorage.multiRemove([K_LOCK_NEXT, K_UNLOCKED]);
          setUnlocked(false);
        } else {
          setUnlocked(u === '1');
        }
        setAttempts(Number(a || '0'));
        const isBlocked = b === '1';
        setBlocked(isBlocked);

        // If blocked, auto-exit
        if (isBlocked && Platform.OS === 'android') {
          setTimeout(() => BackHandler.exitApp(), 400);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const attemptsLeft = useMemo(() => Math.max(0, MAX_ATTEMPTS - attempts), [attempts]);

  const unlock = async (input: string) => {
    if (blocked) return false;
    const expected = getExpectedPassword();
    if (input === expected) {
      await AsyncStorage.setItem(K_UNLOCKED, '1');
      await AsyncStorage.setItem(K_ATTEMPTS, '0');
      setUnlocked(true);
      setAttempts(0);
      return true;
    }

    const next = attempts + 1;
    setAttempts(next);
    await AsyncStorage.setItem(K_ATTEMPTS, String(next));
    if (next >= MAX_ATTEMPTS) {
      setBlocked(true);
      await AsyncStorage.setItem(K_BLOCKED, '1');
      if (Platform.OS === 'android') {
        setTimeout(() => BackHandler.exitApp(), 400);
      }
    }
    return false;
  };

  const lockApp = async () => {
    await AsyncStorage.setItem(K_LOCK_NEXT, '1');
  };

  const resetAuth = async () => {
    await AsyncStorage.multiRemove([K_UNLOCKED, K_ATTEMPTS, K_BLOCKED, K_LOCK_NEXT]);
    setUnlocked(false);
    setAttempts(0);
    setBlocked(false);
  };

  return {
    unlocked,
    blocked,
    attemptsLeft,
    loading,
    unlock,
    lockApp,
    resetAuth,
  };
});
