import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export function DesignSwitcher({ studio = false }: { studio?: boolean }) {
  return <nav aria-label="Design versions" className="flex shrink-0 items-center gap-1 rounded-md border bg-secondary p-1">
    <Button asChild variant={studio ? 'ghost' : 'surface'} size="sm" className="h-6 px-2 text-[10px]"><Link to="/" aria-current={!studio ? 'page' : undefined}>Original</Link></Button>
    <Button asChild variant={studio ? 'surface' : 'ghost'} size="sm" className="h-6 px-2 text-[10px]"><Link to="/studio" aria-current={studio ? 'page' : undefined}>Studio</Link></Button>
  </nav>;
}