'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const input = $('files'), drop = $('drop');
  const supported = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const MAX_FILES = 20, MAX_BYTES = 40 * 1024 * 1024;
  let items = [], busy = false, previousFocus = null;
  const fmt = (n) => {
    if (!Number.isFinite(n)) return '—';
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(2) + ' MB';
  };
  const safeName = (s) => s.replace(/[<>:"\/\\|?*\x00-\x1F]/g, '_').replace(/\s+/g, '_');
  const mode = () => $('format').value;
  function status(message) { $('status').textContent = message; }
  function dimensions(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => { const value = { width: img.naturalWidth, height: img.naturalHeight }; URL.revokeObjectURL(url); resolve(value); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This image could not be read by your browser.')); };
      img.src = url;
    });
  }
  function updateSummary() {
    const successful = items.filter((x) => x.output);
    $('selected').textContent = items.length ? `${items.length} image(s) selected · ${successful.length} processed` : 'No images selected yet.';
    $('originalTotal').textContent = successful.length ? fmt(successful.reduce((s, x) => s + x.file.size, 0)) : '—';
    $('outputTotal').textContent = successful.length ? fmt(successful.reduce((s, x) => s + x.output.size, 0)) : '—';
    if (!successful.length) $('savedTotal').textContent = '—';
    else {
      const before = successful.reduce((s, x) => s + x.file.size, 0), after = successful.reduce((s, x) => s + x.output.size, 0);
      const pct = before ? ((before - after) / before) * 100 : 0;
      $('savedTotal').textContent = pct > 0 ? `${pct.toFixed(1)}% smaller` : pct < 0 ? `${Math.abs(pct).toFixed(1)}% larger` : 'No change';
    }
    $('zip').disabled = !successful.length || busy;
    renderQueue();
    render();
  }
  function renderQueue() {
    const root = $('queue'), wrap = $('queueWrap');
    root.replaceChildren();
    wrap.hidden = items.length === 0;
    $('queueCount').textContent = `${items.length} ${items.length === 1 ? 'file' : 'files'}`;
    items.forEach((item, index) => {
      const card = document.createElement('article'); card.className = 'upload-card';
      const thumb = document.createElement('img'); thumb.className = 'upload-thumb'; thumb.src = item.preview; thumb.alt = 'Uploaded preview: ' + item.file.name;
      const details = document.createElement('div'); details.className = 'upload-details';
      const name = document.createElement('div'); name.className = 'upload-name'; name.textContent = item.file.name; name.title = item.file.name;
      const meta = document.createElement('div'); meta.className = 'upload-meta'; meta.textContent = item.width ? `${fmt(item.file.size)} · ${item.width} × ${item.height} px` : fmt(item.file.size);
      const state = document.createElement('div'); state.className = 'upload-state' + (item.error ? ' error' : item.output ? ' done' : '');
      state.textContent = item.error ? 'Needs attention' : item.output ? 'Compression ready' : 'Ready to compress';
      details.append(name, meta, state);
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn upload-remove'; remove.textContent = 'Remove image'; remove.disabled = busy;
      remove.addEventListener('click', () => { if (busy) return; dispose(item); items.splice(index, 1); updateSummary(); });
      card.append(thumb, details, remove); root.append(card);
    });
  }
  function createCompare(item, parent) {
    const wrap = document.createElement('div'); wrap.className = 'compare'; wrap.style.setProperty('--split', '50%');
    const before = document.createElement('img'); before.src = item.preview; before.alt = 'Original image'; before.draggable = false;
    const afterClip = document.createElement('div'); afterClip.className = 'after-clip';
    const after = document.createElement('img'); after.src = item.outputUrl; after.alt = 'Compressed image'; after.draggable = false; afterClip.append(after);
    const left = document.createElement('span'); left.className = 'compare-label before'; left.textContent = 'ORIGINAL';
    const right = document.createElement('span'); right.className = 'compare-label after'; right.textContent = 'OUTPUT';
    const divider = document.createElement('span'); divider.className = 'compare-divider';
    const handle = document.createElement('span'); handle.className = 'compare-handle'; handle.textContent = '↔';
    const slider = document.createElement('input'); slider.type = 'range'; slider.min = '0'; slider.max = '100'; slider.value = '50'; slider.setAttribute('aria-label', 'Slide to compare original and compressed image');
    slider.addEventListener('input', () => wrap.style.setProperty('--split', slider.value + '%'));
    wrap.append(before, afterClip, left, right, divider, handle, slider);
    const caption = document.createElement('p'); caption.className = 'compare-caption'; caption.textContent = 'Drag the slider to compare before and after.';
    parent.append(wrap, caption);
    wrap.addEventListener('dblclick', () => openLightbox(item));
    return wrap;
  }
  function render() {
    const root = $('results'); root.replaceChildren();
    items.forEach((item, index) => {
      const card = document.createElement('article'); card.className = 'filecard';
      const thumb = document.createElement('img'); thumb.className = 'preview'; thumb.src = item.preview; thumb.alt = 'Preview: ' + item.file.name;
      const info = document.createElement('div'); info.className = 'fileinfo';
      const name = document.createElement('div'); name.className = 'filename'; name.textContent = item.file.name; info.append(name);
      const meta = document.createElement('p'); meta.textContent = item.width ? `${item.width} × ${item.height} px · ${fmt(item.file.size)}` : fmt(item.file.size); info.append(meta);
      if (item.error) { const err = document.createElement('p'); err.textContent = item.error; info.append(err); }
      if (item.output) {
        const out = document.createElement('p'); out.textContent = `Output: ${item.outWidth} × ${item.outHeight} px · ${fmt(item.output.size)} · ${item.output.type.split('/')[1].toUpperCase()}`; info.append(out);
        const delta = ((item.file.size - item.output.size) / item.file.size) * 100;
        const badge = document.createElement('span'); badge.className = 'badge' + (delta < 0 ? ' warning' : '');
        badge.textContent = delta > 0 ? `${delta.toFixed(1)}% smaller` : delta < 0 ? `${Math.abs(delta).toFixed(1)}% larger — no reduction` : 'Same file size'; info.append(badge);
        if (item.output.size >= item.file.size) {
          const note = document.createElement('p'); note.textContent = 'Try a lower quality, smaller dimensions, or another format for a smaller file.'; info.append(note);
        }
        const actions = document.createElement('div'); actions.className = 'file-actions';
        const dl = document.createElement('button'); dl.type = 'button'; dl.className = 'btn'; dl.textContent = 'Download'; dl.addEventListener('click', () => download(item.output, item.outputName));
        const compare = document.createElement('button'); compare.type = 'button'; compare.className = 'btn'; compare.textContent = 'Full-screen compare'; compare.addEventListener('click', () => openLightbox(item));
        actions.append(dl, compare); info.append(actions);
      }
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn'; remove.textContent = 'Remove'; remove.disabled = busy;
      remove.addEventListener('click', () => { if (busy) return; dispose(item); items.splice(index, 1); updateSummary(); }); info.append(remove);
      card.append(thumb, info);
      if (item.output) createCompare(item, card);
      root.append(card);
    });
  }
  function dispose(item) {
    if (item.preview) URL.revokeObjectURL(item.preview);
    if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
  }
  async function addFiles(fileList) {
    let rejected = 0;
    for (const file of Array.from(fileList)) {
      if (items.length >= MAX_FILES || !supported.has(file.type) || file.size <= 0 || file.size > MAX_BYTES) { rejected++; continue; }
      if (items.some((x) => x.file.name === file.name && x.file.size === file.size && x.file.lastModified === file.lastModified)) continue;
      const item = { file, preview: URL.createObjectURL(file), output: null, outputUrl: '', error: '', width: 0, height: 0 };
      items.push(item);
      try { const d = await dimensions(file); item.width = d.width; item.height = d.height; }
      catch (err) { item.error = err.message; }
    }
    updateSummary();
    status(rejected ? `${rejected} file(s) skipped. Use JPG, PNG or WebP images up to 40 MB, with a maximum of 20 files.` : '');
  }
  function download(blob, name) {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  function outputName(name, type) {
    const ext = type === 'image/jpeg' ? 'jpg' : type === 'image/png' ? 'png' : 'webp';
    return safeName(name.replace(/\.[^.]+$/, '')) + '-compressed.' + ext;
  }
  function canvasBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Your browser could not encode this format. Try another output format.')), type, quality));
  }
  async function processItem(item) {
    item.output = null; if (item.outputUrl) URL.revokeObjectURL(item.outputUrl); item.outputUrl = ''; item.error = '';
    const bitmap = await createImageBitmap(item.file);
    try {
      const rawW = $('maxWidth').value.trim(), rawH = $('maxHeight').value.trim();
      const mw = rawW ? Number(rawW) : bitmap.width, mh = rawH ? Number(rawH) : bitmap.height;
      if (!Number.isInteger(mw) || !Number.isInteger(mh) || mw < 1 || mh < 1 || mw > 20000 || mh > 20000) throw new Error('Maximum width and height must be whole numbers from 1 to 20,000.');
      const scale = Math.min(1, mw / bitmap.width, mh / bitmap.height);
      const w = Math.max(1, Math.round(bitmap.width * scale)), h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d', { alpha: true }); if (!ctx) throw new Error('Canvas is unavailable in this browser.');
      const type = mode();
      if (type === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
      ctx.drawImage(bitmap, 0, 0, w, h);
      const quality = Number($('quality').value) / 100;
      const blob = await canvasBlob(canvas, type, quality);
      if (!blob || !blob.size) throw new Error('The browser produced an empty image.');
      item.output = blob; item.outputUrl = URL.createObjectURL(blob); item.outputName = outputName(item.file.name, type); item.outWidth = w; item.outHeight = h;
    } finally { bitmap.close(); }
  }
  function openLightbox(item) {
    previousFocus = document.activeElement;
    const content = $('lightboxContent'); content.replaceChildren();
    const title = document.createElement('p'); title.className = 'lightbox-title'; title.textContent = item.file.name + ' — before and after';
    content.append(title); createCompare(item, content);
    $('lightbox').hidden = false; $('closeLightbox').focus(); document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    $('lightbox').hidden = true; $('lightboxContent').replaceChildren(); document.body.style.overflow = '';
    if (previousFocus && previousFocus.focus) previousFocus.focus();
  }
  $('browse').addEventListener('click', () => input.click());
  input.addEventListener('change', async () => { await addFiles(input.files); input.value = ''; });
  ['dragenter', 'dragover'].forEach((eventName) => drop.addEventListener(eventName, (event) => { event.preventDefault(); drop.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach((eventName) => drop.addEventListener(eventName, (event) => { event.preventDefault(); drop.classList.remove('drag'); }));
  drop.addEventListener('drop', (event) => addFiles(event.dataTransfer.files));
  $('quality').addEventListener('input', () => $('qValue').textContent = $('quality').value + '%');
  $('format').addEventListener('change', () => {
    $('formatHint').textContent = mode() === 'image/png' ? 'PNG preserves transparency; browser-native encoding may not reduce size.' : mode() === 'image/jpeg' ? 'JPG is widely compatible. Transparent pixels are filled white.' : 'WebP often provides a strong balance of quality and size.';
  });
  $('clear').addEventListener('click', () => {
    if (busy) return; items.forEach(dispose); items = []; input.value = ''; $('bar').style.width = '0%'; status('All images cleared.'); updateSummary();
  });
  $('process').addEventListener('click', async () => {
    if (busy) return;
    if (!items.length) { status('Choose at least one image first.'); return; }
    busy = true; $('process').disabled = true; $('clear').disabled = true; $('zip').disabled = true;
    const overlay = $('processingOverlay'); overlay.hidden = false;
    $('processingTitle').textContent = 'Optimizing your images';
    $('processingMessage').textContent = 'Balancing image quality and file size locally on your device.';
    $('processingBar').style.width = '0%'; $('processingPercent').textContent = '0%';
    let done = 0, errors = 0;
    try {
      for (const item of items) {
        $('processingMessage').textContent = 'Processing ' + item.file.name;
        try { await processItem(item); } catch (err) { item.error = err instanceof Error ? err.message : 'Unable to process this image.'; errors++; }
        done++;
        const pct = Math.round(done / items.length * 100);
        $('bar').style.width = pct + '%'; $('processingBar').style.width = pct + '%';
        $('processingPercent').textContent = pct + '%'; $('processingCount').textContent = `${done} of ${items.length} images`;
        status(`Processing ${done} of ${items.length} images…`);
        updateSummary(); await new Promise((resolve) => setTimeout(resolve, 0));
      }
      $('processingTitle').textContent = errors ? 'Finished with a few issues' : 'Your images are ready!';
      $('processingMessage').textContent = errors ? `${done - errors} image(s) completed. Review files marked Needs attention.` : 'Your optimized files are ready to review and download.';
      $('processingCount').textContent = `${done} of ${items.length} images complete`;
      await new Promise((resolve) => setTimeout(resolve, 650));
      status(`Finished: ${done - errors} processed${errors ? `, ${errors} failed — check each file's message` : ''}.`);
    } finally {
      overlay.hidden = true; busy = false; $('process').disabled = false; $('clear').disabled = false; updateSummary();
      $('resultsPanel').scrollIntoView({behavior:'smooth',block:'start'});
    }
  });
  $('zip').addEventListener('click', async () => {
    const successful = items.filter((x) => x.output); if (!successful.length) return;
    const button = $('zip'); button.disabled = true; button.textContent = 'Preparing ZIP…';
    try {
      const { default: JSZip } = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
      const zip = new JSZip(); successful.forEach((item) => zip.file(item.outputName, item.output));
      const blob = await zip.generateAsync({ type: 'blob' }); download(blob, 'prbsolver-compressed-images.zip'); status('ZIP download is ready.');
    } catch (err) { status('ZIP library could not load. Please use individual downloads or check your connection.'); }
    finally { button.textContent = 'Download all as ZIP'; button.disabled = !items.some((x) => x.output) || busy; }
  });
  $('closeLightbox').addEventListener('click', closeLightbox);
  $('lightbox').addEventListener('click', (event) => { if (event.target === $('lightbox')) closeLightbox(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !$('lightbox').hidden) closeLightbox(); });
  updateSummary();
})();