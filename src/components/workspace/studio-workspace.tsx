import { useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, Check, FileImage, Grid2X2, ImagePlus, Layers, Link2, LoaderCircle, PenTool, RotateCcw, Settings2, ShieldCheck, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { DesignSwitcher } from './design-switcher';
import chairImage from '@/assets/chair-reference.jpg';

const initial = { strength: 85, sharpen: 30, brightness: 0, contrast: 20 };

export function StudioWorkspace() {
  const input = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState(chairImage);
  const [fileName, setFileName] = useState('shell-chair.png');
  const [settings, setSettings] = useState(initial);
  const [mode, setMode] = useState('outline');
  const [preset, setPreset] = useState('balanced');
  const [background, setBackground] = useState(true);
  const [grid, setGrid] = useState(true);
  const [target, setTarget] = useState('');
  const [width, setWidth] = useState('100');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(true);
  const [notice, setNotice] = useState('');
  const [help, setHelp] = useState(false);
  const load = (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) { setNotice('Choose a PNG, JPG, WebP or SVG image.'); return; }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') { setSource(reader.result); setFileName(file.name); setReady(false); } };
    reader.readAsDataURL(file);
  };
  const convert = () => { setBusy(true); window.setTimeout(() => { setReady(true); setBusy(false); setNotice('Sketch preview updated.'); }, 650); };
  return <div className="studio-design min-h-screen">
    <svg width="0" height="0" className="absolute" aria-hidden="true"><defs><filter id="studio-outline" colorInterpolationFilters="sRGB"><feColorMatrix type="saturate" values="0"/><feConvolveMatrix order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" divisor={Math.max(.3, 2 - settings.strength / 60)} bias="1"/><feComponentTransfer><feFuncR type="discrete" tableValues="0 1"/><feFuncG type="discrete" tableValues="0 1"/><feFuncB type="discrete" tableValues="0 1"/></feComponentTransfer></filter></defs></svg>
    <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-3 sm:px-8">
      <div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground"><PenTool size={17}/></span><span className="font-display text-sm font-bold">Image to Sketch<span className="ml-2 text-primary">/ Studio</span></span></div>
      <DesignSwitcher studio/>
    </header>
    <main className="studio-shell fade-in">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-[11px] text-muted-foreground">Untitled sketch</p><h1 className="text-2xl font-semibold">Image to Sketch</h1></div><span className="flex items-center gap-2 text-[11px] text-muted-foreground"><span className="status-dot"/>Design preview</span></div>
      <section aria-label="Target Part Studio" className="studio-target mb-6 grid items-center gap-4 border-y py-4">
        <div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent text-primary"><Link2 size={17}/></span><div><label htmlFor="studio-target" className="block text-xs font-semibold">Target Part Studio</label><span className="text-[10px] text-muted-foreground">Part Studio URL</span></div></div>
        <input id="studio-target" type="url" className="field-input" placeholder="https://cad.onshape.com/documents/…" value={target} onChange={e => setTarget(e.target.value)}/>
        <Button variant="outline" className="h-9 text-xs" onClick={() => setHelp(true)}><Link2 size={14}/>Connect to Onshape</Button>
      </section>
      <div className="studio-main">
        <aside aria-label="Image and sketch controls" className="studio-controls">
          <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-xs font-semibold"><Settings2 size={14}/>Image settings</h2><Button variant="ghost" size="icon" className="h-7 w-7" title="Reset settings" aria-label="Reset settings" onClick={() => { setSettings(initial); setMode('outline'); setPreset('balanced'); setBackground(true); setWidth('100'); }}><RotateCcw size={13}/></Button></div>
          <div className="upload-zone mb-5" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); load(e.dataTransfer.files[0]); }}><Button variant="ghost" className="h-auto w-full justify-start gap-3 whitespace-normal p-3" onClick={() => input.current?.click()}><Upload size={18} className="text-primary"/><span className="min-w-0 text-left"><span className="block text-xs">Upload image</span><span className="block truncate text-[10px] font-normal text-muted-foreground">{fileName}</span></span><ImagePlus size={14} className="ml-auto"/></Button></div>
          <input ref={input} type="file" className="hidden" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e => load(e.target.files?.[0])}/>
          <label className="field-label mb-2 block">Sketch style</label><div className="mb-4 grid grid-cols-2 gap-1 rounded-md bg-secondary p-1">{['outline','color'].map(style => <Button key={style} size="sm" variant={mode === style ? 'surface' : 'ghost'} aria-pressed={mode === style} onClick={() => setMode(style)} className="text-[11px]">{style === 'outline' ? <PenTool size={13}/> : <Layers size={13}/>} {style === 'outline' ? 'Outline' : 'Full color'}</Button>)}</div>
          <label htmlFor="studio-preset" className="field-label mb-2 block">Detail preset</label><select id="studio-preset" className="field-input mb-4" value={preset} onChange={e => setPreset(e.target.value)}><option value="balanced">Balanced</option><option value="minimal">Minimal</option><option value="detailed">High detail</option></select>
          <div className="mb-5 flex items-center justify-between gap-2"><label htmlFor="studio-background" className="text-xs">Remove background</label><Switch id="studio-background" checked={background} onCheckedChange={setBackground}/></div>
          <div className="space-y-4 border-t pt-5">{(['strength','sharpen','brightness','contrast'] as const).map(key => <div key={key}><div className="mb-2 flex justify-between text-[11px]"><label htmlFor={`studio-${key}`} className="capitalize">{key}</label><span className="tabular-nums text-muted-foreground">{settings[key]}{key === 'strength' ? '%' : ''}</span></div><Slider id={`studio-${key}`} aria-label={key} min={key === 'brightness' ? -50 : 0} max={100} value={[settings[key]]} onValueChange={v => setSettings(s => ({...s, [key]:v[0] ?? 0}))}/></div>)}</div>
          <div className="studio-convert mt-6 flex items-end gap-3 border-t pt-4"><div className="min-w-0 flex-1"><label htmlFor="studio-width" className="mb-2 block text-[10px] text-muted-foreground">Target width (mm)</label><input id="studio-width" className="field-input" type="number" min="1" value={width} onChange={e => setWidth(e.target.value)}/></div><Button className="h-9 text-xs" onClick={convert} disabled={busy}>{busy ? <LoaderCircle className="animate-spin"/> : <PenTool size={14}/>}Convert</Button></div>
        </aside>
        <section className="min-w-0" aria-label="Image comparison">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-xs font-semibold">Image comparison</h2><Button variant={grid ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" title="Toggle grid" aria-label="Toggle grid" aria-pressed={grid} onClick={() => setGrid(!grid)}><Grid2X2 size={14}/></Button></div>
          <div className="preview-grid">{['original','sketch'].map(kind => <article className="preview-panel" key={kind}><div className="flex h-11 items-center gap-2 border-b px-3 text-[11px] font-medium">{kind === 'original' ? <FileImage size={13}/> : <PenTool size={13} className="text-primary"/>}{kind === 'original' ? 'Original image' : 'Sketch preview'}</div><div className={`preview-canvas ${kind === 'sketch' && mode === 'outline' ? 'studio-outline' : ''}`} data-grid={grid}>{kind === 'sketch' && !ready ? <p className="text-xs text-muted-foreground">Awaiting conversion</p> : <img src={source} alt={kind === 'original' ? 'Source image' : 'Sketch preview'} width={1024} height={1024}/>}</div><div className="flex h-9 items-center justify-between gap-2 border-t px-3 text-[10px] text-muted-foreground"><span className="truncate">{kind === 'original' ? fileName : mode === 'outline' ? 'Outline' : 'Full color'}</span>{kind === 'sketch' && <span className="flex items-center gap-1"><span className="status-dot"/>{ready ? 'Ready' : 'Pending'}</span>}</div></article>)}</div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground"><ShieldCheck size={12}/>Images stay on your device</div>
          <div className="mb-3 mt-6 flex items-center justify-between"><h2 className="flex items-center gap-2 text-xs font-semibold"><Layers size={14}/>Detected geometry</h2><span className="text-[10px] text-muted-foreground">Sample data</span></div>
          <div className="grid grid-cols-3 border-y">{[['50','Closed shapes'],['0','Open paths'],['0','Warnings']].map(([value,label]) => <div key={label} className="border-r py-3 pl-3 last:border-r-0"><p className="text-xl font-semibold text-primary">{value}</p><p className="mt-1 text-[10px] text-muted-foreground">{label}</p></div>)}</div>
          <div className="mt-3 divide-y border-b">{['Outer contour','Seat detail','Leg detail'].map((label,i) => <div key={label} className="flex items-center justify-between py-2.5 text-[11px]"><span className="flex items-center gap-3"><span className="text-muted-foreground">0{i+1}</span>{label}</span><Check size={12} className="text-primary"/></div>)}</div>
          <div className="studio-import mt-5 flex flex-wrap items-center justify-end gap-3"><Button variant="ghost" size="sm" className="text-[11px]" disabled={!ready} onClick={() => setNotice('SVG export is available in the Original design. This Studio design is a preview.')}><ArrowDownToLine size={13}/>Export</Button><Button className="text-xs" disabled={!ready || busy} onClick={() => setNotice(target.trim() ? 'CAD import is not connected in this design preview.' : 'Add a Target Part Studio URL above.')}><ArrowRight size={14}/>Import to Part Studio</Button></div>
        </section>
      </div>
      {notice && <div role="status" className="mt-5 flex items-center justify-between gap-3 rounded-md border bg-accent px-4 py-3 text-xs text-primary">{notice}<Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={13}/></Button></div>}
    </main>
    {help && <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 px-4" onClick={() => setHelp(false)}><section role="dialog" aria-modal="true" aria-labelledby="studio-help" className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg" onClick={e => e.stopPropagation()}><h2 id="studio-help" className="text-lg font-semibold">Connect to Onshape</h2><p className="my-4 text-sm text-muted-foreground">This is a design preview. Onshape connection, CAD import, production tracing and background removal are not connected.</p><Button variant="outline" className="w-full" onClick={() => setHelp(false)}>Back to workspace</Button></section></div>}
  </div>;
}