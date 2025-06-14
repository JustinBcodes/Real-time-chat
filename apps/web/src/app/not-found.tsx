import Link from 'next/link';
import { Button } from '../components/ui/button';

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Page not found
      </p>
      <Button asChild className="mt-4">
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  );
} 