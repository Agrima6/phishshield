'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Self-serve sign-up is now the public /register + onboarding flow, not a
// direct account sign-up page - redirect there.
export default function SignUpPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/register');
  }, [router]);
  return null;
}
