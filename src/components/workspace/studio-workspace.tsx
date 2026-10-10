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
    <header className="studio-topbar">
      <div className="flex items-center gap-3"><span className="studio-logo"><PenTool size={19}/></span><div><h1 className="text-sm font-semibold">Image to Sketch</h1><p className="text-[10px] text-muted-foreground">STUDIO / Untitled sketch</p></div></div>
      <DesignSwitcher studio/>
    </header>
    <main className="studio-shell fade-in">
      <section aria-label="Target Part Studio" className="studio-destination">
        <Link2 size={16} className="text-primary"/><label htmlFor="studio-target" className="shrink-0 text-xs font-medium">Target Part Studio</label>
        <input id="studio-target" type="url" className="field-input" placeholder="https://cad.onshape.com/documents/…" value={target} onChange={e => setTarget(e.target.value)}/>
        <Button variant="outline" className="text-xs" onClick={() => setHelp(true)}>Connect to Onshape<ArrowRight size={13}/></Button>
      </section>
      <section className="studio-artboard" aria-label="Image comparison">
        <div className="studio-canvas-toolbar"><span className="text-xs font-medium">{fileName}</span><div className="flex items-center gap-3"><span className="text-[10px] text-muted-foreground">Design preview</span><Button variant={grid ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" title="Toggle grid" aria-label="Toggle grid" aria-pressed={grid} onClick={() => setGrid(!grid)}><Grid2X2 size={14}/></Button></div></div>
        <div className="studio-comparison">{['original','sketch'].map(kind => <article className="studio-image" key={kind}>
          <div className="studio-image-label"><span className="studio-index">{kind === 'original' ? '01' : '02'}</span><h2 className="text-xs font-medium">{kind === 'original' ? 'Original image' : 'Sketch preview'}</h2>{kind === 'sketch' && <span className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="status-dot"/>{ready ? 'Ready' : 'Pending'}</span>}</div>
          <div className={`studio-paper ${kind === 'sketch' && mode === 'outline' ? 'studio-outline' : ''}`} data-grid={grid}>{kind === 'sketch' && !ready ? <p className="text-xs text-muted-foreground">Awaiting conversion</p> : <img src={source} alt={kind === 'original' ? 'Source image' : 'Sketch preview'} width={1024} height={1024}/>}</div>
          <div className="studio-image-footer"><span>{kind === 'original' ? 'SOURCE' : mode === 'outline' ? 'OUTLINE' : 'FULL COLOR'}</span><span>{kind === 'original' ? fileName : 'sketch-preview.svg'}</span></div>
        </article>)}</div>
        <div className="studio-geometry"><span className="flex items-center gap-2"><Layers size={13}/>Geometry <span className="text-muted-foreground">/ Sample</span></span><span><strong>50</strong> closed shapes</span><span><strong>0</strong> open paths</span><span className="flex items-center gap-1"><Check size={12}/>0 warnings</span></div>
      </section>
      <section className="studio-adjustments" aria-label="Image and sketch controls">
        <div className="studio-input-controls">
          <div className="flex items-center justify-between"><h2 className="studio-control-title">Source & style</h2><Button variant="ghost" size="icon" className="h-6 w-6" title="Reset settings" aria-label="Reset settings" onClick={() => { setSettings(initial); setMode('outline'); setPreset('balanced'); setBackground(true); setWidth('100'); }}><RotateCcw size={12}/></Button></div>
          <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); load(e.dataTransfer.files[0]); }}><Button variant="outline" className="mb-3 h-9 w-full justify-start text-xs" onClick={() => input.current?.click()}><Upload size={14}/>Replace image<ImagePlus size={13} className="ml-auto"/></Button></div>
          <input ref={input} type="file" className="hidden" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e => load(e.target.files?.[0])}/>
          <div className="grid grid-cols-2 gap-1 rounded-md bg-secondary p-1">{['outline','color'].map(style => <Button key={style} size="sm" variant={mode === style ? 'surface' : 'ghost'} aria-pressed={mode === style} onClick={() => setMode(style)} className="text-[11px]">{style === 'outline' ? <PenTool size={13}/> : <Layers size={13}/>} {style === 'outline' ? 'Outline' : 'Color'}</Button>)}</div>
        </div>
        <div className="studio-sliders"><h2 className="studio-control-title">Image adjustments</h2><div className="studio-slider-grid">{(['strength','sharpen','brightness','contrast'] as const).map(key => <div key={key}><div className="mb-3 flex justify-between text-[11px]"><label htmlFor={`studio-${key}`} className="capitalize">{key}</label><span className="tabular-nums text-primary">{settings[key]}{key === 'strength' ? '%' : ''}</span></div><Slider id={`studio-${key}`} aria-label={key} min={key === 'brightness' ? -50 : 0} max={100} value={[settings[key]]} onValueChange={v => setSettings(s => ({...s, [key]:v[0] ?? 0}))}/></div>)}</div></div>
        <div className="studio-output-controls"><h2 className="studio-control-title">Output</h2><div className="mb-3 grid grid-cols-2 gap-3"><div><label htmlFor="studio-preset" className="mb-2 block text-[10px] text-muted-foreground">Detail preset</label><select id="studio-preset" className="field-input" value={preset} onChange={e => setPreset(e.target.value)}><option value="balanced">Balanced</option><option value="minimal">Minimal</option><option value="detailed">High detail</option></select></div><div><label htmlFor="studio-width" className="mb-2 block text-[10px] text-muted-foreground">Width (mm)</label><input id="studio-width" className="field-input" type="number" min="1" value={width} onChange={e => setWidth(e.target.value)}/></div></div><div className="flex items-center justify-between gap-2"><label htmlFor="studio-background" className="text-[11px]">Remove background</label><Switch id="studio-background" checked={background} onCheckedChange={setBackground}/></div></div>
      </section>
      {notice && <div role="status" className="flex items-center justify-between gap-3 border-t bg-accent px-4 py-3 text-xs text-primary">{notice}<Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={13}/></Button></div>}
    </main>
    <footer className="studio-actionbar"><Button className="studio-convert h-10 text-xs" onClick={convert} disabled={busy}>{busy ? <LoaderCircle className="animate-spin"/> : <PenTool size={14}/>}Convert<ArrowRight size={14}/></Button><span className="studio-privacy flex items-center gap-2 text-[10px] text-muted-foreground"><ShieldCheck size={13}/>Images stay on your device</span><div className="flex items-center gap-2"><Button variant="ghost" size="icon" title="Export preview" aria-label="Export preview" disabled={!ready} onClick={() => setNotice('SVG export is available in the Original design. This Studio design is a preview.')}><ArrowDownToLine size={15}/></Button><Button variant="outline" className="studio-import h-10 text-xs" disabled={!ready || busy} onClick={() => setNotice(target.trim() ? 'CAD import is not connected in this design preview.' : 'Add a Target Part Studio URL above.')}><ArrowRight size={14}/>Import to Part Studio</Button></div></footer>
    {help && <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 px-4" onClick={() => setHelp(false)}><section role="dialog" aria-modal="true" aria-labelledby="studio-help" className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg" onClick={e => e.stopPropagation()}><h2 id="studio-help" className="text-lg font-semibold">Connect to Onshape</h2><p className="my-4 text-sm text-muted-foreground">This is a design preview. Onshape connection, CAD import, production tracing and background removal are not connected.</p><Button variant="outline" className="w-full" onClick={() => setHelp(false)}>Back to workspace</Button></section></div>}
  </div>;
}