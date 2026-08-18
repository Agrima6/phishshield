'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// No longer used now that login is custom email/password instead of Clerk
// OAuth - kept as a redirect so any stale bookmarked/cached link still lands
// somewhere sensible instead of a broken page.
export default function SsoCallbackPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/auth/login');
  }, [router]);
  return null;
}
