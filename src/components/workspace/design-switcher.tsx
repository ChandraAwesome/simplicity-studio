import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

type Version = 'original' | 'studio' | 'forge';

export function DesignSwitcher({ studio = false, current }: { studio?: boolean; current?: Version }) {
  const active: Version = current ?? (studio ? 'studio' : 'original');
  const items = [
    { to: '/' as const, id: 'original', label: 'Original' },
    { to: '/studio' as const, id: 'studio', label: 'Studio' },
    { to: '/forge' as const, id: 'forge', label: 'Forge' },
  ];
  return <nav aria-label="Design versions" className="flex shrink-0 items-center gap-1 rounded-md border bg-secondary p-1">
    {items.map((i) => <Button key={i.id} asChild variant={active === i.id ? 'surface' : 'ghost'} size="sm" className="h-6 px-2 text-[10px]">
      <Link to={i.to} aria-current={active === i.id ? 'page' : undefined}>{i.label}</Link>
    </Button>)}
  </nav>;
}
