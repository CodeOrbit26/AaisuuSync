import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Simple hash function for passwords (NOT for production — use bcrypt in real apps)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'h_' + Math.abs(hash).toString(36);
}

const SUPERUSER = {
  id: 'u_superuser_abhay',
  name: 'Abhay Gupta',
  email: 'abhaygupta26nov11@gmail.com',
  initials: 'AG',
  passwordHash: simpleHash('@bhay2611'),
  plan: 'AaisuuSync Pro Ultra',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function getUsers() {
  try {
    const raw = localStorage.getItem('aaisu_users');
    let users = raw ? JSON.parse(raw) : [];
    
    const superIdx = users.findIndex(u => u.email === SUPERUSER.email);
    if (superIdx === -1) {
      users.push(SUPERUSER);
    } else {
      users[superIdx] = {
        ...users[superIdx],
        name: SUPERUSER.name,
        passwordHash: SUPERUSER.passwordHash,
        plan: SUPERUSER.plan
      };
    }
    localStorage.setItem('aaisu_users', JSON.stringify(users));
    return users;
  } catch {
    return [SUPERUSER];
  }
}


function saveUsers(users) {
  localStorage.setItem('aaisu_users', JSON.stringify(users));
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const session = localStorage.getItem('aaisu_session');
      if (session) {
        const parsed = JSON.parse(session);
        // Verify user still exists
        const users = getUsers();
        const exists = users.find(u => u.id === parsed.id);
        if (exists) return parsed;
      }
    } catch {}
    return null;
  });

  const [authError, setAuthError] = useState('');

  const isAuthenticated = !!currentUser;

  // Persist session
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('aaisu_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('aaisu_session');
    }
  }, [currentUser]);

  const signup = (name, email, password) => {
    setAuthError('');
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      setAuthError('All fields are required.');
      return false;
    }

    if (password.length < 4) {
      setAuthError('Password must be at least 4 characters.');
      return false;
    }

    const users = getUsers();
    if (users.find(u => u.email === trimmedEmail)) {
      setAuthError('An account with this email already exists.');
      return false;
    }

    const initials = trimmedName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const newUser = {
      id: 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      name: trimmedName,
      email: trimmedEmail,
      initials,
      passwordHash: simpleHash(password),
      plan: 'AaisuuSync Pro',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    // Migrate any existing unprefixed data to this user
    migrateUnprefixedData(newUser.id);

    const sessionUser = { id: newUser.id, name: newUser.name, email: newUser.email, initials: newUser.initials, plan: newUser.plan };
    setCurrentUser(sessionUser);
    return true;
  };

  const login = (email, password) => {
    setAuthError('');
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setAuthError('Email and password are required.');
      return false;
    }

    const users = getUsers();
    const user = users.find(u => u.email === trimmedEmail);

    if (!user) {
      setAuthError('No account found with this email.');
      return false;
    }

    if (user.passwordHash !== simpleHash(password)) {
      setAuthError('Incorrect password.');
      return false;
    }

    const sessionUser = { id: user.id, name: user.name, email: user.email, initials: user.initials, plan: user.plan };
    setCurrentUser(sessionUser);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    setAuthError('');
  };

  const value = {
    currentUser,
    isAuthenticated,
    authError,
    setAuthError,
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Migrate old unprefixed localStorage data to the first user
function migrateUnprefixedData(userId) {
  const keysToMigrate = [
    'aaisu_api_keys_v2',
    'aaisu_connected_accounts_v2',
    'aaisu_blueprints_v2',
    'aaisu_linkedin_scheduled',
    'aaisu_linkedin_published',
  ];

  keysToMigrate.forEach(key => {
    const oldData = localStorage.getItem(key);
    if (oldData) {
      const newKey = `${userId}_${key}`;
      // Only migrate if the new key doesn't already exist
      if (!localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, oldData);
      }
      // Remove old unprefixed key
      localStorage.removeItem(key);
    }
  });

  // Also migrate reel-specific keys
  const reelKeys = [
    'aaisuu_system_on',
    'aaisuu_agent_captions',
    'aaisuu_agent_rules',
    'aaisuu_blueprint_prompts',
    'aaisuu_selected_account',
  ];

  reelKeys.forEach(key => {
    const oldData = localStorage.getItem(key);
    if (oldData) {
      const newKey = `${userId}_${key}`;
      if (!localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, oldData);
      }
      localStorage.removeItem(key);
    }
  });
}

export default AuthContext;
