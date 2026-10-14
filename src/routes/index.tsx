import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <main>
      <h1>RCP</h1>
      <p>Your recipes, with their ingredients, steps and nutrition. Nothing is stored yet.</p>
    </main>
  );
}
