'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { api } from '@/lib/api';

export function useSession() {
  const clerk = useClerk();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [role, setRole] = useState<string>('admin');
  const [tenant, setTenant] = useState<string>('provana');
  const [tenantName, setTenantName] = useState<string>('Provana Corp');
  const [loginTenant, setLoginTenant] = useState<string>('provana');
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Check if SSO callback query params exist in URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get('token');
      const emailParam = params.get('email');
      const roleParam = params.get('role');
      const tenantParam = params.get('tenant');
      const tenantNameParam = params.get('tenant_name');

      if (tokenParam && emailParam) {
        localStorage.setItem('phish_session_token', tokenParam);
        localStorage.setItem('phish_username', emailParam);
        if (roleParam) localStorage.setItem('phish_role', roleParam);
        if (tenantParam) {
          localStorage.setItem('phish_tenant', tenantParam);
          localStorage.setItem('phish_login_tenant', tenantParam);
        }
        if (tenantNameParam) localStorage.setItem('phish_tenant_name', tenantNameParam);
        
        // Clear params from address bar
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }

    const sessionToken = localStorage.getItem('phish_session_token');
    const storedUsername = localStorage.getItem('phish_username') || 'admin@provana.com';
    const storedRole = localStorage.getItem('phish_role') || 'admin';
    const storedTenant = localStorage.getItem('phish_tenant') || 'provana';
    const storedTenantName = localStorage.getItem('phish_tenant_name') || 'Provana Corp';
    const storedLoginTenant = localStorage.getItem('phish_login_tenant') || storedTenant;

    if (sessionToken) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
      setRole(storedRole);
      setTenant(storedTenant);
      setTenantName(storedTenantName);
      setLoginTenant(storedLoginTenant);
    } else {
      setIsLoggedIn(false);
    }
    setLoading(false);
  }, []);

  const login = (token: string, email: string, roleVal: string, tenantVal: string, tenantNameVal: string) => {
    localStorage.setItem('phish_session_token', token);
    localStorage.setItem('phish_username', email);
    localStorage.setItem('phish_role', roleVal);
    localStorage.setItem('phish_tenant', tenantVal);
    localStorage.setItem('phish_tenant_name', tenantNameVal);
    localStorage.setItem('phish_login_tenant', tenantVal);
    
    setIsLoggedIn(true);
    setUsername(email);
    setRole(roleVal);
    setTenant(tenantVal);
    setTenantName(tenantNameVal);
    setLoginTenant(tenantVal);
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // ignore
    }
    try {
      // Must end the Clerk-level session too — otherwise /auth/login's
      // auto-restore (needed for single-session-mode) immediately re-signs
      // you back in the instant you land there, making logout a no-op.
      await clerk.signOut();
    } catch {
      // ignore
    }
    localStorage.removeItem('phish_session_token');
    localStorage.removeItem('phish_username');
    localStorage.removeItem('phish_role');
    localStorage.removeItem('phish_tenant');
    localStorage.removeItem('phish_tenant_name');
    localStorage.removeItem('phish_login_tenant');
    setIsLoggedIn(false);
    setUsername('');
    router.push('/auth/login');
  };

  const changeTenant = (newTenant: string, newTenantName = '') => {
    localStorage.setItem('phish_tenant', newTenant);
    if (newTenantName) {
      localStorage.setItem('phish_tenant_name', newTenantName);
      setTenantName(newTenantName);
    }
    setTenant(newTenant);
  };

  return {
    isLoggedIn,
    username,
    role,
    tenant,
    tenantName,
    loginTenant,
    loading,
    login,
    logout,
    changeTenant,
  };
}
