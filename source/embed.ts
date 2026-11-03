/** Embed support for Content Studio. Runs in Instagram frames, not the parent app.
 * Does not read credentials, fetch media, or transmit page data.
 */
export function installEmbedControls(doc: Document = document): () => void {
    if (!/\/(?:p|reel|reels|tv)\/[\w-]+\/embed\/?/.test(doc.location.pathname)) return () => {};
    const win = doc.defaultView!;
    let parentOrigin = '';
    try { const origin = new URL(doc.referrer).origin; if (['http://127.0.0.1:8765','http://localhost:8765'].includes(origin)) parentOrigin = origin; } catch { /* Not a Studio frame. */ }
    function report(state: 'playable' | 'unavailable') {
        if (parentOrigin && win.parent !== win) win.parent.postMessage({type:'studio-instagram-player',state},parentOrigin);
    }
    let unavailableTimer: number | undefined;
    let video: HTMLVideoElement | null = null;
    const host = doc.createElement('div');
    host.id = 'vci-embed-controls';
    host.style.cssText = 'position:fixed;z-index:2147483647;box-sizing:border-box;display:none;color:white;font:12px system-ui;background:rgba(20,20,24,.94);border-radius:7px;padding:7px;box-shadow:0 2px 10px #0006';
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>
      *{box-sizing:border-box} .row{display:flex;align-items:center;gap:8px}
      button,select{font:inherit;color:white;background:#33333c;border:1px solid #666;border-radius:4px;padding:5px;cursor:pointer}
      button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid #b6a0ff;outline-offset:2px}
      input{min-width:0;accent-color:#a88bff;cursor:pointer} #seek{width:100%;margin:0 0 6px}
      #time{font-variant-numeric:tabular-nums;white-space:nowrap;flex:1} #volume{width:48px} label{display:flex;align-items:center;gap:3px}
      @media(max-width:320px){#volume,.skip{display:none}.row{gap:5px}}
    </style><input id="seek" type="range" min="0" max="100" step="0.1" value="0" aria-label="Seek video" disabled>
    <div class="row"><button id="play" aria-label="Play video">▶</button><button class="skip" id="back" aria-label="Back five seconds">−5s</button><span id="time">0:00 / —</span>
    <label><span>Speed</span><select id="speed" aria-label="Playback speed">${[.5,.75,1,1.25,1.5,2].map(n=>`<option value="${n}" ${n===1?'selected':''}>${n}×</option>`).join('')}</select></label>
    <button id="mute" aria-label="Unmute video">♪</button><input id="volume" type="range" min="0" max="1" step=".05" value="1" aria-label="Volume"></div>`;
    const get = <T extends HTMLElement>(id: string) => root.getElementById(id) as T;
    const seek = get<HTMLInputElement>('seek'), speed = get<HTMLSelectElement>('speed');
    const play = get<HTMLButtonElement>('play'), mute = get<HTMLButtonElement>('mute');
    const volume = get<HTMLInputElement>('volume');
    const format = (n: number) => Number.isFinite(n) ? `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2,'0')}` : '—';
    function position() {
        if (!video?.isConnected) { host.style.display = 'none'; return; }
        const r = video.getBoundingClientRect(), width = Math.min(r.width, win.innerWidth);
        if (width < 100 || r.bottom < 0 || r.top > win.innerHeight) { host.style.display = 'none'; return; }
        host.style.display = 'block';
        host.style.width = `${width}px`;
        host.style.left = `${Math.max(0,Math.min(r.left,win.innerWidth-width))}px`;
        host.style.top = `${Math.max(r.top, Math.min(r.bottom, win.innerHeight)-host.offsetHeight)}px`;
    }
    function sync() {
        if (!video) return;
        const duration = video.duration;
        seek.disabled = !Number.isFinite(duration) || duration <= 0;
        seek.max = String(Number.isFinite(duration) && duration > 0 ? duration : 100);
        seek.value = String(video.currentTime || 0);
        get('time').textContent = `${format(video.currentTime)} / ${format(duration)}`;
        play.textContent = video.paused ? '▶' : 'Ⅱ';
        play.setAttribute('aria-label',video.paused ? 'Play video' : 'Pause video');
        mute.textContent = video.muted ? '♪' : '♫';
        mute.setAttribute('aria-label',video.muted ? 'Unmute video' : 'Mute video');
        volume.value = String(video.volume);
        speed.value = String(video.playbackRate);
        position();
    }
    const events = ['loadedmetadata','durationchange','timeupdate','play','pause','volumechange','ratechange','emptied'];
    const resize = new win.ResizeObserver(position);
    function detect() {
        const candidates = Array.from(doc.querySelectorAll('video'));
        const next = candidates.find(v => { const r=v.getBoundingClientRect(); return r.width>0 && r.height>0; }) || candidates[0] || null;
        if (next === video) return;
        if (video) { events.forEach(e=>video!.removeEventListener(e,sync)); resize.unobserve(video); }
        video = next;
        if (video) report('playable');
        if (video) { events.forEach(e=>video!.addEventListener(e,sync)); resize.observe(video); }
        sync(); position();
    }
    play.onclick = () => { if (!video) return; if (video.paused) video.play().catch(()=>{play.textContent='Retry';}); else video.pause(); };
    get('back').onclick = () => { if(video) video.currentTime=Math.max(0,video.currentTime-5); };
    seek.oninput = () => { if(video && !seek.disabled) {video.currentTime=Number(seek.value); sync();} };
    speed.onchange = () => { if(video) video.playbackRate=Number(speed.value); };
    mute.onclick = () => { if(video) video.muted=!video.muted; };
    volume.oninput = () => { if(video) {video.volume=Number(volume.value);video.muted=video.volume===0;} };
    // Stop clicks reaching Instagram's full-video play/pause overlay.
    ['click','pointerdown','pointerup','keydown'].forEach(e=>host.addEventListener(e,event=>event.stopPropagation()));
    const observer = new win.MutationObserver(records => {
        if(records.some(r=>Array.from(r.addedNodes).concat(Array.from(r.removedNodes)).some(n=>n instanceof win.Element && (n.matches('video') || n.querySelector('video'))))) detect();
    });
    function start() {
        doc.documentElement.append(host); observer.observe(doc.documentElement,{childList:true,subtree:true}); detect();
        unavailableTimer = win.setTimeout(() => { detect(); if (!video) report('unavailable'); }, 6000);
    }
    if(doc.readyState==='loading') doc.addEventListener('DOMContentLoaded',start,{once:true}); else start();
    win.addEventListener('resize',position); win.addEventListener('scroll',position,true);
    return () => { win.clearTimeout(unavailableTimer); doc.removeEventListener('DOMContentLoaded',start);observer.disconnect();resize.disconnect();if(video)events.forEach(e=>video!.removeEventListener(e,sync));win.removeEventListener('resize',position);win.removeEventListener('scroll',position,true);host.remove(); };
}
if(typeof document!=='undefined') installEmbedControls();
