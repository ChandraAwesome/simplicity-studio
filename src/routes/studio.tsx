import { createFileRoute } from '@tanstack/react-router';
import { StudioWorkspace } from '@/components/workspace/studio-workspace';

export const Route = createFileRoute('/studio')({
  head: () => ({ meta: [
    { title: 'Image to Sketch — Studio design' },
    { name: 'description', content: 'Compare image and sketch previews in the alternate Studio workspace with a Target Part Studio destination.' },
    { property: 'og:title', content: 'Image to Sketch — Studio design' },
    { property: 'og:description', content: 'An alternate image-to-sketch design with side-by-side previews and Part Studio controls.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: StudioWorkspace,
});