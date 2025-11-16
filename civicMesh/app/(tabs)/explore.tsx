import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function TabTwoScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to post-for-help screen
    router.replace('/post-for-help');
  }, [router]);

  return null;
}
