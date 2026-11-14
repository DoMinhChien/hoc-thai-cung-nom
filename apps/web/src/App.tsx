import { APP_NAME } from '@nom/core';
import { Button } from '@/components/ui/button';

export function App() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">{APP_NAME}</h1>
      <Button className="mt-4">OK</Button>
    </main>
  );
}
