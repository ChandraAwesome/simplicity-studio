import { createFileRoute } from '@tanstack/react-router';
import { ForgeWorkspace } from '@/components/workspace/forge-workspace';

export const Route = createFileRoute('/forge')({
  head: () => ({ meta: [
    { title: 'Image to Sketch — Forge design' },
    { name: 'description', content: 'Connect Onshape, trace an image into editable shapes, review side by side and import to your Part Studio.' },
    { property: 'og:title', content: 'Image to Sketch — Forge design' },
    { property: 'og:description', content: 'Full-featured image-to-sketch workspace with tracing controls, shape review and Part Studio import.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: ForgeWorkspace,
});
