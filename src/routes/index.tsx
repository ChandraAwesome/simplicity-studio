import { createFileRoute } from '@tanstack/react-router';
import { SketchWorkspace } from '@/components/workspace/sketch-workspace';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'Image to Sketch — Creative workspace' },
    { name: 'description', content: 'Refine your image and compare the original with your sketch in a clean creative workspace.' },
    { property: 'og:title', content: 'Image to Sketch — Creative workspace' },
    { property: 'og:description', content: 'A focused workspace for comparing, refining and exporting sketch previews.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: SketchWorkspace,
});
