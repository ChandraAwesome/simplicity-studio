import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DesignSwitcher } from './design-switcher';
import chair from '@/assets/chair-reference.jpg';
import { loadImageData, parseStudioUrl, render, trace, type Accuracy, type TraceMode, type TraceResult } from './trace-engine';

const DEMO_STUDIOS = [
  { name: 'Chair concept — Part Studio 1', url: 'https://cad.onshape.com/documents/7a1c2e9f4b/w/3d8e0b11aa/e/91fc02d4e7' },
  { name: 'Chair concept — Frame', url: 'https://cad.onshape.com/documents/7a1c2e9f4b/w/3d8e0b11aa/e/c22be8a015' },
];
const ACCEPT = '.svg,.png,.webp,.jpg,.jpeg,image/svg+xml,image/png,image/webp,image/jpeg';

function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { v: T; l: string }[]; label: string }) {
  return <div role="radiogroup" aria-label={label} className="grid grid-flow-col auto-cols-fr gap-1 rounded-md bg-secondary p-1">
    {options.map((o) => <button key={o.v} type="button" role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)}
      className={`h-8 rounded text-xs font-semibold transition ${value === o.v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{o.l}</button>)}
  </div>;
}

function Section({ step, title, children, aside }: { step: number; title: string; children: ReactNode; aside?: ReactNode }) {
  return <section className="forge-card p-4">
    <div className="mb-3 flex items-center gap-2"><span className="forge-step">{step}</span><h2 className="font-display text-sm font-bold">{title}</h2><div className="ml-auto">{aside}</div></div>
    {children}
  </section>;
}

function SliderRow({ label, value, unit = '', min, max, step = 1, hint, onChange }: { label: string; value: number; unit?: string; min: number; max: number; step?: number; hint: string; onChange: (v: number) => void }) {
  return <div className="space-y-2">
    <div className="flex justify-between text-xs"><Label className="text-xs">{label}</Label><span className="font-mono font-semibold">{value}{unit}</span></div>
    <Slider aria-label={label} value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0] ?? value)} />
    <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>
  </div>;
}

export function ForgeWorkspace() {
  // Connection + destination
  const [connected, setConnected] = useState(false);
  const [studioUrl, setStudioUrl] = useState('');
  const [showIds, setShowIds] = useState(false);
  const ids = parseStudioUrl(studioUrl);
  // File
  const [src, setSrc] = useState<string>(chair);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // Engine + options
  const [engine, setEngine] = useState<'classic' | 'ai'>('classic');
  const aiUsed = true;
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [removeBg, setRemoveBg] = useState(false);
  const [mode, setMode] = useState<TraceMode>('outline');
  const [accuracy, setAccuracy] = useState<Accuracy>('medium');
  const [fineTune, setFineTune] = useState(false);
  const [colorDetail, setColorDetail] = useState(5);
  const [noise, setNoise] = useState(8);
  const [colors, setColors] = useState(16);
  const [reduce, setReduce] = useState(6);
  const [smoothness, setSmoothness] = useState(0.75);
  // Result
  const [result, setResult] = useState<TraceResult | null>(null);
  const [converting, setConverting] = useState(false);
  const [view, setView] = useState<'original' | 'traced'>('traced');
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [hiddenLayers, setHiddenLayers] = useState<Set<number>>(new Set());
  const [applied, setApplied] = useState(false);
  const [importState, setImportState] = useState<'idle' | 'uploading' | 'done'>('idle');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgDataRef = useRef<ImageData | null>(null);
  // Feedback / support
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [fbType, setFbType] = useState('suggestion');
  const [fbText, setFbText] = useState('');
  const [fbSent, setFbSent] = useState(false);
  const [email, setEmail] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  const opts = { mode, accuracy, fineTune, colorDetail, noise, colors, reduce, smoothness, removeBg };

  const runTrace = async () => {
    if (!imgDataRef.current) imgDataRef.current = await loadImageData(src);
    const r = trace(imgDataRef.current, opts);
    setResult(r); setMarked(new Set()); setHiddenLayers(new Set()); setApplied(false); setImportState('idle');
  };

  const convert = async () => {
    if (engine === 'ai' && aiUsed) { setUpgradeOpen(true); return; }
    setConverting(true);
    await new Promise((r) => setTimeout(r, 450));
    await runTrace();
    setConverting(false); setView('traced');
  };

  // Live retrace while dragging once a result exists
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => { void runTrace(); }, 120);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, accuracy, fineTune, colorDetail, noise, colors, reduce, smoothness, removeBg]);

  useEffect(() => { imgDataRef.current = null; setResult(null); }, [src]);

  useEffect(() => {
    if (result && canvasRef.current && view === 'traced') render(canvasRef.current, result, mode, marked);
  }, [result, marked, view, mode]);

  const tune = (set: (v: number) => void) => (v: number) => { set(v); setFineTune(true); };

  const handleFile = (f?: File | null) => {
    if (!f) return;
    if (!/\.(svg|png|webp|jpe?g)$/i.test(f.name)) return;
    setFileName(f.name); setSrc(URL.createObjectURL(f));
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!result) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * result.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * result.height);
    const sid = result.shapeOf[y * result.width + x];
    if (sid == null || sid < 0 || result.labels[y * result.width + x] === result.background) return;
    setMarked((m) => { const n = new Set(m); n.has(sid) ? n.delete(sid) : n.add(sid); return n; });
    setApplied(false);
  };

  const layers = useMemo(() => {
    if (!result) return [];
    const map = new Map<number, number>();
    result.shapes.forEach((s) => map.set(s.layer, (map.get(s.layer) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([layer, count]) => ({ layer, count, rgb: result.palette[layer] }));
  }, [result]);

  const toggleLayer = (layer: number) => {
    if (!result) return;
    const hide = !hiddenLayers.has(layer);
    setHiddenLayers((h) => { const n = new Set(h); hide ? n.add(layer) : n.delete(layer); return n; });
    setMarked((m) => { const n = new Set(m); result.shapes.filter((s) => s.layer === layer).forEach((s) => hide ? n.add(s.id) : n.delete(s.id)); return n; });
    setApplied(false);
  };

  const remaining = result ? result.shapes.filter((s) => !marked.has(s.id)) : [];
  const closed = remaining.filter((s) => !s.touchesEdge).length;
  const open = remaining.filter((s) => s.touchesEdge).length;
  const warnings = remaining.filter((s) => s.size < 6).length;
  const canImport = connected && !!ids && !!result && applied && importState !== 'uploading';

  const doImport = async () => {
    setImportState('uploading');
    await new Promise((r) => setTimeout(r, 1400));
    setImportState('done');
  };

  const importHint = !connected ? 'Connect to Onshape first' : !ids ? 'Add a Part Studio URL' : !result ? 'Convert a file first' : !applied ? 'Review shapes, then Apply & Continue' : importState === 'done' ? 'Imported as “SVG Import” feature' : 'Ready to import';

  return <div className="forge-design">
    <header className="forge-ink">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary font-display text-sm font-extrabold text-primary-foreground">I→S</span>
          <div><h1 className="font-display text-base font-extrabold leading-tight">Image → Sketch</h1>
            <p className="forge-hide-sm text-[11px] opacity-70">Prepare an image, inspect the parse, send an editable sketch to Part Studio.</p></div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-current/20 px-2.5 py-1 text-[11px]">
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-success' : 'bg-primary'}`} />{connected ? 'Onshape connected' : 'Not connected'}
          </span>
          {connected
            ? <Button size="sm" variant="secondary" className="h-8" onClick={() => { setConnected(false); setImportState('idle'); }}>Disconnect</Button>
            : <Button size="sm" className="h-8" onClick={() => setConnected(true)}>Connect to Onshape</Button>}
          <div className="text-foreground"><DesignSwitcher current="forge" /></div>
        </div>
      </div>
    </header>

    <main className="forge-grid">
      <aside className="space-y-4">
        <Section step={1} title="Target Part Studio" aside={<label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">Show IDs<Switch checked={showIds} onCheckedChange={setShowIds} aria-label="Show IDs" /></label>}>
          <Label htmlFor="studio-url" className="text-xs">Part Studio URL</Label>
          <Input id="studio-url" className="mt-1.5 h-9 text-xs" placeholder="https://cad.onshape.com/documents/…" value={studioUrl} onChange={(e) => setStudioUrl(e.target.value)} />
          {connected && !ids && <div className="mt-3 space-y-1.5">
            <p className="text-[11px] font-semibold">Multiple Part Studios found — pick one:</p>
            {DEMO_STUDIOS.map((s) => <button key={s.url} type="button" onClick={() => setStudioUrl(s.url)} className="block w-full rounded-md border bg-secondary px-2.5 py-1.5 text-left text-xs hover:border-primary">{s.name}</button>)}
          </div>}
          {!connected && !ids && <p className="mt-2 text-[11px] text-muted-foreground">Not auto-detected — paste your Part Studio URL above.</p>}
          {studioUrl && !ids && <p className="mt-2 text-[11px] text-destructive">This doesn’t look like a Part Studio URL.</p>}
          {showIds && <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 rounded-md bg-secondary p-2 font-mono text-[10px]">
            <dt className="text-muted-foreground">documentId</dt><dd className="truncate">{ids?.documentId ?? '–'}</dd>
            <dt className="text-muted-foreground">workspaceId</dt><dd className="truncate">{ids?.workspaceId ?? '–'}</dd>
            <dt className="text-muted-foreground">elementId</dt><dd className="truncate">{ids?.elementId ?? '–'}</dd>
          </dl>}
        </Section>

        <Section step={2} title="Upload file">
          <div data-over={dragOver} className="forge-drop rounded-lg border-2 border-dashed p-4 text-center transition"
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}>
            <p className="truncate text-xs font-semibold">{fileName ?? 'No file chosen — using sample'}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Drag & drop, or choose · SVG · PNG · WEBP · JPEG</p>
            <Button size="sm" variant="outline" className="mt-3 h-8" onClick={() => fileRef.current?.click()}>Choose file</Button>
            <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" aria-label="Upload file" onChange={(e) => handleFile(e.target.files?.[0])} />
          </div>
        </Section>

        <Section step={3} title="Trace settings">
          <div className="space-y-4">
            <div className="space-y-1.5"><Label className="text-xs">Engine</Label>
              <Segmented label="Engine" value={engine} onChange={setEngine} options={[{ v: 'classic', l: 'Classic' }, { v: 'ai', l: 'AI' }]} />
              {engine === 'classic'
                ? <p className="text-[11px] text-muted-foreground">Traces entirely in your browser — nothing is uploaded until you convert.</p>
                : <p className="rounded-md bg-accent p-2 text-[11px]">Free plan includes one AI conversion — you’ve used it. <button className="font-semibold text-primary underline" onClick={() => setUpgradeOpen(true)}>Upgrade – $1/mo</button> for unlimited.</p>}
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Output</Label>
              <Segmented label="Output mode" value={mode} onChange={setMode} options={[{ v: 'outline', l: 'Outline (B/W)' }, { v: 'color', l: 'Full Color' }]} />
            </div>

          </div>
        </Section>
      </aside>

      <section className="forge-results min-w-0 space-y-4">
        <div className="forge-card overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
            <span className="forge-step">4</span><h2 className="font-display text-sm font-bold">Detected geometry</h2>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${result ? 'bg-accent text-primary' : 'bg-secondary text-muted-foreground'}`}>{converting ? 'Tracing…' : result ? (applied ? 'Applied' : 'Review') : 'Not ready'}</span>
            <div className="ml-auto w-52"><Segmented label="Preview" value={view} onChange={setView} options={[{ v: 'original', l: 'Original' }, { v: 'traced', l: 'Traced' }]} /></div>
          </div>
          <div className="forge-compare">
            <div className="forge-pane">
              <p className="px-4 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Original</p>
              <div className="forge-paper"><img src={src} alt="Original upload" /></div>
            </div>
            <div className="forge-pane">
              <p className="px-4 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{view === 'traced' ? 'Traced — click a shape to mark for removal' : 'Original (full view)'}</p>
              <div className="forge-paper">
                {view === 'original' ? <img src={src} alt="Original enlarged" />
                  : result ? <canvas ref={canvasRef} onClick={onCanvasClick} aria-label="Traced preview" />
                  : <p className="max-w-[220px] text-center text-xs text-muted-foreground">{converting ? 'Tracing…' : 'Convert a file to see the traced geometry here.'}</p>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 border-t text-center">
            {[{ n: closed, l: 'closed shapes', s: 'will import' }, { n: open, l: 'open paths', s: 'skipped' }, { n: warnings, l: 'warnings', s: 'to review' }].map((s, i) =>
              <div key={s.l} className={`py-3 ${i ? 'border-l' : ''}`}><p className="font-display text-xl font-extrabold">{s.n}</p><p className="text-[11px] font-semibold">{s.l}</p><p className="text-[10px] text-muted-foreground">{s.s}</p></div>)}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="forge-card p-4">
              <div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-bold">Color layers</h3><span className="text-[11px] text-muted-foreground">{marked.size} of {result?.shapes.length ?? 0} marked</span></div>
              <p className="mb-3 text-[11px] text-muted-foreground">Hide a layer to mark every shape in it for removal.</p>
              <div className="flex max-h-40 flex-wrap gap-2 overflow-auto">
                {layers.length === 0 && <p className="text-[11px] text-muted-foreground">No layers yet.</p>}
                {layers.map((l) => <button key={l.layer} type="button" onClick={() => toggleLayer(l.layer)} aria-pressed={hiddenLayers.has(l.layer)} title={`${l.count} shape${l.count === 1 ? '' : 's'}`}
                  className={`relative h-12 w-12 shrink-0 rounded-md border-2 transition ${hiddenLayers.has(l.layer) ? 'border-border opacity-40' : 'border-transparent hover:border-primary'}`}
                  style={{ background: `rgb(${(l.rgb ?? [255, 255, 255]).map(Math.round).join(',')})` }}>
                  <span className="absolute -bottom-1.5 -right-1.5 rounded-full border bg-card px-1 text-[9px] font-semibold leading-tight text-foreground">{l.count}</span>
                </button>)}
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="h-8" disabled={!marked.size} onClick={() => { setMarked(new Set()); setHiddenLayers(new Set()); setApplied(false); }}>Clear marks</Button>
                <Button size="sm" className="h-8" disabled={!result} onClick={() => setApplied(true)}>Apply & Continue</Button>
              </div>
            </div>
          </div>
          <details className="forge-card p-4">
            <summary className="cursor-pointer text-xs font-bold">Raw result and parser messages</summary>
            <pre className="mt-3 max-h-40 overflow-auto rounded-md bg-secondary p-2 font-mono text-[10px]">{result ? [...result.log, `marked=${marked.size}`, `closed=${closed} open=${open} warnings=${warnings}`].join('\n') : '—'}</pre>
          </details>
        </div>

        <div className="forge-card flex flex-wrap items-center gap-3 p-4">
          <div className="mr-auto"><p className="text-xs font-bold">Help us keep the importer sharp</p><p className="text-[11px] text-muted-foreground">Feedback and support stay close to the job.</p></div>
          <Button size="sm" variant="outline" className="h-8" onClick={() => { setFbSent(false); setFeedbackOpen(true); }}>Send feedback</Button>
          <Button size="sm" variant="outline" className="h-8" onClick={() => { setSupportSent(false); setSupportOpen(true); }}>Contact support</Button>
        </div>
      </section>

      <aside className="forge-tuning space-y-4">
        <Section step={5} title="Tuning controls" aside={<span className="text-[10px] text-muted-foreground">Live</span>}>
          <div className="space-y-5">
            {mode === 'outline' ? <>
              <SliderRow label="Color detail" value={colorDetail} min={2} max={10} onChange={tune(setColorDetail)} hint="Higher values create more distinct color layers." />
              <SliderRow label="Noise filter" value={noise} unit="px" min={1} max={20} onChange={tune(setNoise)} hint="Higher values remove smaller regions." />
            </> : <>
              <SliderRow label="Colors" value={colors} min={2} max={32} onChange={tune(setColors)} hint="Maximum distinct color layers in the output." />
              <SliderRow label="Detail / auto-reduce" value={reduce} unit="px" min={1} max={20} onChange={tune(setReduce)} hint="Higher values merge away more small regions." />
            </>}
            <SliderRow label="Smoothness" value={smoothness} min={0} max={1.5} step={0.05} onChange={setSmoothness} hint="Higher values smooth curves; lower values preserve corners." />
            <p className="text-[11px] text-muted-foreground">Changes retrace live while you drag.</p>
            <div className="border-t pt-4">
              <h3 className="mb-2 text-xs font-bold">Background removal</h3>
              <label className="flex items-center justify-between gap-3 text-xs font-medium">Remove background before tracing<Switch checked={removeBg} onCheckedChange={setRemoveBg} aria-label="Remove background" /></label>
              <p className="mt-2 text-[11px] text-muted-foreground">Helps prevent stray background colors from becoming separate layers.</p>
            </div>
          </div>
        </Section>
      </aside>
    </main>

    <footer className="forge-actionbar">
      <Button className="min-w-36" onClick={convert} disabled={converting}>{converting ? 'Converting…' : '↻ Convert'}</Button>
      <p className="forge-hide-sm text-center text-[11px] text-muted-foreground">{importState === 'uploading' ? 'Finalizing and uploading…' : importHint}<br />Plane, size and position can be adjusted later via “SVG Import” in Onshape.</p>
      <Button variant="outline" className="border-primary text-primary" disabled={!canImport} onClick={doImport} title={importHint}>
        {importState === 'uploading' ? 'Uploading…' : importState === 'done' ? '✓ Imported' : 'Import to Part Studio'}
      </Button>
    </footer>

    <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
      <DialogContent><DialogHeader><DialogTitle>Unlimited AI conversions</DialogTitle><DialogDescription>Your free AI conversion is used. Upgrade for $1/month, or switch to the Classic engine.</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="outline" onClick={() => { setEngine('classic'); setUpgradeOpen(false); }}>Use Classic</Button><Button onClick={() => setUpgradeOpen(false)}>Upgrade – $1/mo</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
      <DialogContent><DialogHeader><DialogTitle>Send feedback</DialogTitle><DialogDescription>Tell us what would make this import easier.</DialogDescription></DialogHeader>
        {fbSent ? <p className="text-sm text-success">✓ Thanks — your feedback is queued for review.</p> : <div className="space-y-3">
          <Label className="text-xs">Feedback type</Label>
          <Select value={fbType} onValueChange={setFbType}><SelectTrigger aria-label="Feedback type"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="suggestion">Suggestion</SelectItem><SelectItem value="bug">Something went wrong</SelectItem><SelectItem value="question">Question</SelectItem></SelectContent></Select>
          <Label htmlFor="fb" className="text-xs">What happened?</Label><Textarea id="fb" value={fbText} onChange={(e) => setFbText(e.target.value)} />
        </div>}
        <DialogFooter><Button variant="outline" onClick={() => setFeedbackOpen(false)}>{fbSent ? 'Close' : 'Cancel'}</Button>{!fbSent && <Button disabled={!fbText.trim()} onClick={() => { setFbSent(true); setFbText(''); }}>Send feedback</Button>}</DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
      <DialogContent><DialogHeader><DialogTitle>Contact support</DialogTitle><DialogDescription>Include the file or Part Studio context if it helps us reproduce the issue.</DialogDescription></DialogHeader>
        {supportSent ? <p className="text-sm text-success">✓ Message ready — we’ll follow up by email.</p> : <div className="space-y-3">
          <Label htmlFor="em" className="text-xs">Reply-to email</Label><Input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Label htmlFor="sm" className="text-xs">Message</Label><Textarea id="sm" value={supportMsg} onChange={(e) => setSupportMsg(e.target.value)} />
        </div>}
        <DialogFooter><Button variant="outline" onClick={() => setSupportOpen(false)}>{supportSent ? 'Close' : 'Cancel'}</Button>{!supportSent && <Button disabled={!/\S+@\S+\.\S+/.test(email) || !supportMsg.trim()} onClick={() => { setSupportSent(true); setSupportMsg(''); }}>Send message</Button>}</DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
