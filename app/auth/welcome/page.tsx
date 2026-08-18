'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// No longer used now that onboarded admins get a temp-password email
// instead of a Clerk invite redirect - kept as a redirect for any stale link.
export default function WelcomePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/auth/login');
  }, [router]);
  return null;
}
