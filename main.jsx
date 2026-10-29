import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import QRCode from 'qrcode'
import {
  Camera, Download, RotateCcw, Heart, Sparkles, Upload, Timer,
  Zap, QrCode, X, Check, ImagePlus, Radio, Aperture, Trash2
} from 'lucide-react'
import './styles.css'

const FILTERS = [
  { id: 'original', label: 'ORIGINAL', css: 'none' },
  { id: 'chrome', label: 'CHROME', css: 'contrast(1.12) saturate(.82) brightness(1.05)' },
  { id: 'mono', label: 'MONO', css: 'grayscale(1) contrast(1.08)' },
  { id: 'dream', label: 'DREAM', css: 'brightness(1.12) saturate(.72) contrast(.92)' },
  { id: 'warm', label: 'WARM', css: 'sepia(.18) saturate(1.15) brightness(1.04)' },
]
const THEMES = [
  { id: 'chrome', name: 'Liquid chrome', color: '#d9dde7', ink: '#343744', accent: '#b4b9cb' },
  { id: 'pink', name: 'Cyber pink', color: '#f5d7e7', ink: '#553a54', accent: '#e8a9d0' },
  { id: 'blue', name: 'Ice blue', color: '#d8eff8', ink: '#2e4c60', accent: '#8fc9e5' },
  { id: 'black', name: 'Night mode', color: '#292b38', ink: '#f5f2ff', accent: '#8d8ee6' },
]
const STICKERS = ['♡', '☆', '✦', '✧', '🦋', '💿', '🎀', '☻', '⚡', '🪩', '☁', '✿', '💗', '★', '♬', '☾']
const STRIP_W = 360
const STRIP_PAD = 20
const PHOTO_W = 320
const PHOTO_H = 150
const GAP = 10
const STRIP_H = STRIP_PAD * 2 + PHOTO_H * 4 + GAP * 3 + 61

function App() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const exportRef = useRef(null)
  const fileInputRef = useRef(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [shots, setShots] = useState([])
  const [themeId, setThemeId] = useState('chrome')
  const [filterId, setFilterId] = useState('chrome')
  const [timerSeconds, setTimerSeconds] = useState(3)
  const [countdown, setCountdown] = useState(null)
  const [busy, setBusy] = useState(false)
  const [bursting, setBursting] = useState(false)
  const [status, setStatus] = useState('Ready when you are. Start camera or upload your pics.')
  const [stickers, setStickers] = useState([])
  const [showStickerTray, setShowStickerTray] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [qrData, setQrData] = useState('')
  const [draggingId, setDraggingId] = useState(null)

  const theme = THEMES.find(t => t.id === themeId) || THEMES[0]
  const filter = FILTERS.find(f => f.id === filterId) || FILTERS[0]

  const stopCamera = useCallback(() => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraOn(false)
  }, [])

  useEffect(() => () => {
    stopCamera()
    if (timerRef.current) window.clearTimeout(timerRef.current)
  }, [stopCamera])

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('Camera unavailable in this browser context. Open via HTTPS or localhost.')
      return
    }
    try {
      setStatus('Requesting camera access…')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraOn(true)
      setStatus('Camera connected. You look iconic already ✦')
    } catch (err) {
      setStatus(err?.name === 'NotAllowedError'
        ? 'Camera permission denied. Allow camera access in your browser settings and try again.'
        : 'Could not start camera. Check permissions or close other apps using the camera.')
    }
  }

  const captureOne = () => {
    const video = videoRef.current
    if (!video || video.readyState < 2 || !cameraOn) throw new Error('Camera is not ready')
    const canvas = document.createElement('canvas')
    const vw = video.videoWidth || 640
    const vh = video.videoHeight || 480
    canvas.width = 640
    canvas.height = Math.round(640 * vh / vw)
    const ctx = canvas.getContext('2d')
    ctx.filter = filter.css
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.filter = 'none'
    return { id: `${Date.now()}-${Math.random()}`, canvas, source: 'camera' }
  }

  const runCaptureSequence = async (isBurst = false) => {
    if (!cameraOn || busy || shots.length >= 4) return
    setBusy(true)
    setBursting(isBurst)
    const available = 4 - shots.length
    const target = isBurst ? available : 1
    try {
      let nextShots = [...shots]
      for (let i = 0; i < target; i += 1) {
        let remaining = timerSeconds
        if (i === 0 || !isBurst) {
          setCountdown(remaining)
          while (remaining > 0) {
            await new Promise(resolve => { timerRef.current = window.setTimeout(resolve, 1000) })
            remaining -= 1
            setCountdown(remaining > 0 ? remaining : '✦')
          }
          await new Promise(resolve => { timerRef.current = window.setTimeout(resolve, 300) })
        } else {
          setCountdown('✦')
          await new Promise(resolve => { timerRef.current = window.setTimeout(resolve, 850) })
        }
        nextShots.push(captureOne())
        nextShots = nextShots.slice(0, 4)
        setShots([...nextShots])
        setCountdown(i === target - 1 ? null : '✦')
      }
      setStatus(nextShots.length >= 4 ? 'Four frames. One iconic memory. Save your strip!' : `Shot ${nextShots.length}/4 captured. Next pose!`)
    } catch (err) {
      setStatus(err?.message || 'Capture failed. Try again.')
    } finally {
      setCountdown(null)
      setBusy(false)
      setBursting(false)
    }
  }

  const importImages = async (event) => {
    const files = Array.from(event.target.files || []).filter(file => file.type.startsWith('image/'))
    if (!files.length) return
    try {
      const room = Math.max(0, 4 - shots.length)
      const picked = files.slice(0, room)
      const loaded = await Promise.all(picked.map(file => new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const scale = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight))
          canvas.width = Math.round(img.naturalWidth * scale)
          canvas.height = Math.round(img.naturalHeight * scale)
          const ctx = canvas.getContext('2d')
          ctx.filter = filter.css
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          URL.revokeObjectURL(url)
          resolve({ id: `${Date.now()}-${Math.random()}`, canvas, source: 'upload', name: file.name })
        }
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`Could not read ${file.name}`)) }
        img.src = url
      })))
      setShots(prev => [...prev, ...loaded].slice(0, 4))
      setStatus(`${loaded.length} photo${loaded.length === 1 ? '' : 's'} added from your gallery.`)
    } catch {
      setStatus('One or more images could not be opened. Try another file.')
    } finally {
      event.target.value = ''
    }
  }

  const resetAll = () => {
    setShots([])
    setStickers([])
    setCountdown(null)
    setBusy(false)
    setStatus('Fresh roll loaded. Make some new memories ✦')
  }
  const undoLast = () => {
    setShots(prev => prev.slice(0, -1))
    setStatus('Last frame removed.')
  }

  const addSticker = (emoji) => {
    setStickers(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`, emoji,
      x: 45 + Math.random() * 265,
      y: 55 + Math.random() * (STRIP_H - 130),
      size: 25 + Math.floor(Math.random() * 10),
    }])
    setShowStickerTray(false)
  }

  const moveSticker = (event) => {
    if (!draggingId) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(STRIP_W, ((event.clientX - rect.left) / rect.width) * STRIP_W))
    const y = Math.max(0, Math.min(STRIP_H, ((event.clientY - rect.top) / rect.height) * STRIP_H))
    setStickers(prev => prev.map(s => s.id === draggingId ? { ...s, x, y } : s))
  }

  const drawExport = useCallback(async () => {
    const canvas = exportRef.current
    if (!canvas) return null
    canvas.width = STRIP_W * 2
    canvas.height = STRIP_H * 2
    const ctx = canvas.getContext('2d')
    ctx.scale(2, 2)
    ctx.fillStyle = theme.color
    ctx.fillRect(0, 0, STRIP_W, STRIP_H)
    if (shots.length === 0) {
      ctx.fillStyle = theme.ink
      ctx.textAlign = 'center'
      ctx.font = '15px Space Grotesk, sans-serif'
      ctx.fillText('your memories go here ✦', STRIP_W / 2, STRIP_H / 2)
      return canvas
    }
    for (let i = 0; i < shots.length; i += 1) {
      const shot = shots[i]
      const img = await new Promise((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = reject
        image.src = shot.canvas.toDataURL('image/png')
      })
      const x = STRIP_PAD
      const y = STRIP_PAD + i * (PHOTO_H + GAP)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x - 3, y - 3, PHOTO_W + 6, PHOTO_H + 6)
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, y, PHOTO_W, PHOTO_H)
      ctx.clip()
      const scale = Math.max(PHOTO_W / img.width, PHOTO_H / img.height)
      const dw = img.width * scale
      const dh = img.height * scale
      ctx.drawImage(img, x + (PHOTO_W - dw) / 2, y + (PHOTO_H - dh) / 2, dw, dh)
      ctx.restore()
    }
    stickers.forEach(s => {
      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `${s.size}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`
      ctx.shadowColor = '#25263155'
      ctx.shadowBlur = 3
      ctx.fillText(s.emoji, s.x, s.y)
      ctx.restore()
    })
    ctx.fillStyle = theme.ink
    ctx.textAlign = 'center'
    ctx.font = '600 14px "Unbounded", sans-serif'
    ctx.fillText("Ho'oH memories ✦", STRIP_W / 2, STRIP_H - 32)
    ctx.font = '8px "DM Mono", monospace'
    ctx.fillText('DIGITAL PHOTO CLUB · VOL. 001', STRIP_W / 2, STRIP_H - 15)
    return canvas
  }, [shots, stickers, theme])

  useEffect(() => { drawExport() }, [drawExport])

  const downloadStrip = async () => {
    if (!shots.length) return
    try {
      const canvas = await drawExport()
      canvas.toBlob(blob => {
        if (!blob) { setStatus('Could not export image. Please try again.'); return }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'hooh-memories-photo-strip.png'
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
        setStatus('Saved! Your memory is now in your gallery ✦')
      }, 'image/png')
    } catch {
      setStatus('Could not export the strip. Please try again.')
    }
  }

  const openShare = async () => {
    try {
      const url = window.location.href
      const data = await QRCode.toDataURL(url, { width: 220, margin: 1, color: { dark: '#282a36', light: '#ffffff' } })
      setQrData(data)
      setShareOpen(true)
    } catch {
      setStatus('Could not create QR code. Copy the page URL from your browser instead.')
    }
  }

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setStatus('Website link copied to clipboard.')
    } catch {
      setStatus(`Share this page URL: ${window.location.href}`)
    }
  }

  return <div className="site-shell">
    <div className="ticker"><div className="ticker-track"><span>✦ DIGITAL MEMORIES CLUB</span><b>✧</b><span>NO BAD ANGLES</span><b>✦</b><span>Y2K FOREVER</span><b>✧</b><span>YOU LOOK SO GOOD</span><b>✦</b><span>DIGITAL MEMORIES CLUB</span><b>✧</b><span>NO BAD ANGLES</span><b>✦</b><span>Y2K FOREVER</span></div></div>
    <header className="topbar">
      <a className="wordmark" href="#" aria-label="Ho'oH Memories home"><span className="wordmark-star">✳</span> Ho'oH <em>Memories</em><span className="wordmark-spark">✦</span></a>
      <div className="top-meta"><span className="online"><i/> ONLINE STUDIO</span><span className="edition">EST. MMXXV</span></div>
    </header>

    <main>
      <section className="hero">
        <div className="hero-sticker hero-sticker-left">★彡</div>
        <div className="hero-copy"><div className="micro-label"><span>✧</span> YOUR PERSONAL PHOTO BOOTH <span>✧</span></div>
          <h1>Make it<br/><span className="chrome-text">a memory.</span></h1>
          <p>Four frames. One vibe. <strong>All you.</strong></p>
          <div className="hero-buttons"><a className="pill-button pill-dark" href="#studio"><Camera size={15}/> ENTER THE BOOTH <span>↘</span></a><span className="hero-note">♡ FREE TO USE · JUST FOR FUN</span></div>
        </div>
        <div className="hero-disc"><div className="disc-ring ring-one"/><div className="disc-ring ring-two"/><div className="disc-center"><span>H</span><small>MEMORIES<br/>ON REPEAT</small></div><span className="disc-star">✦</span><span className="disc-spark">✧</span></div>
        <div className="hero-bottom"><span>VOL. 001 — PHOTO MEMORIES</span><span>SCROLL TO CREATE <b>↓</b></span></div>
      </section>

      <section id="studio" className="studio-section">
        <div className="section-intro"><div><span className="index-label">01 / THE STUDIO</span><h2>Strike a <span>pose.</span></h2></div><p>Plug in your best energy.<br/>The camera loves you back.</p></div>
        <div className="studio-grid">
          <div className="camera-column">
            <div className={`camera-stage ${cameraOn ? 'live' : ''}`}>
              <div className="camera-topline"><span><i className={cameraOn ? 'live-dot' : ''}/>{cameraOn ? 'REC / LIVE' : 'HOOH CAM 01'}</span><span>● ● ●</span></div>
              <video ref={videoRef} className="camera-video" autoPlay muted playsInline style={{ filter: filter.css, display: cameraOn ? 'block' : 'none' }}/>
              {!cameraOn && <div className="camera-empty"><div className="camera-icon"><Camera size={37}/><span>✦</span></div><div className="camera-empty-title">Your close-up era<br/>starts <i>now.</i></div><p>Enable camera or upload pics from your gallery.</p><button className="action-button dark" onClick={startCamera}><Camera size={15}/> START CAMERA</button></div>}
              {countdown !== null && <div className="countdown"><strong>{countdown}</strong><span>{bursting ? 'BURST MODE · SAY CHEESE' : 'GET READY · POSE!'}</span></div>}
              <div className="camera-cross cross-a">+</div><div className="camera-cross cross-b">+</div>
              <div className="camera-caption">YOU LOOK GOOD IN EVERY FRAME ✦</div>
            </div>
            <div className="camera-controls">
              <button className="action-button dark capture-button" onClick={() => runCaptureSequence(false)} disabled={!cameraOn || busy || shots.length >= 4}><Camera size={16}/>{busy && !bursting ? 'COUNTDOWN…' : shots.length >= 4 ? 'ROLL COMPLETE' : 'TAKE A PIC'}<span>{shots.length}/4</span></button>
              <button className="action-button silver" onClick={() => runCaptureSequence(true)} disabled={!cameraOn || busy || shots.length >= 4}><Zap size={15}/>{bursting ? 'BURSTING…' : 'BURST MODE'}</button>
            </div>
            <div className="timer-row"><div className="timer-label"><Timer size={15}/><span>SELF TIMER</span></div><div className="timer-options">{[3,5,10].map(n => <button key={n} className={timerSeconds === n ? 'selected' : ''} onClick={() => setTimerSeconds(n)} disabled={busy}>{n}s</button>)}</div><span className="timer-caption">take your time ↗</span></div>
            <div className="upload-row"><button className="action-button outline" onClick={() => fileInputRef.current?.click()} disabled={shots.length >= 4}><Upload size={15}/> UPLOAD FROM GALLERY</button><input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={importImages}/><button className="icon-action" title="Turn camera off" aria-label="Turn camera off" onClick={stopCamera} disabled={!cameraOn}><Radio size={16}/></button><button className="icon-action" title="Retake all photos" aria-label="Retake all photos" onClick={resetAll}><RotateCcw size={16}/></button></div>
            <p className="status-message" aria-live="polite"><span>✳</span>{status}</p>
          </div>

          <aside className="control-column">
            <div className="control-card">
              <div className="card-title"><div><span className="control-number">A.</span><h3>Pick your finish</h3></div><span className="tiny-mono">COLOR LAB</span></div>
              <div className="theme-grid">{THEMES.map(t => <button key={t.id} className={`theme-choice ${themeId === t.id ? 'chosen' : ''}`} onClick={() => setThemeId(t.id)} aria-pressed={themeId === t.id}><span className="theme-swatch" style={{ background: t.color }}><span>✦</span></span><span>{t.name}</span></button>)}</div>
              <div className="hairline"/>
              <div className="card-title"><div><span className="control-number">B.</span><h3>Filter mood</h3></div><span className="tiny-mono">FX / 05</span></div>
              <div className="filter-options">{FILTERS.map(f => <button key={f.id} className={filterId === f.id ? 'active' : ''} onClick={() => setFilterId(f.id)}>{f.label}</button>)}</div>
              <div className="hairline"/>
              <div className="card-title"><div><span className="control-number">C.</span><h3>Sticker overload</h3></div><span className="tiny-mono">DECORATE</span></div>
              <p className="helper-copy">Add a little sparkle to your strip. Drag stickers to move them.</p>
              <div className="sticker-row">{['☆','♡','🦋','💿','✧'].map(s => <button key={s} onClick={() => addSticker(s)} className="sticker-button">{s}</button>)}<button className="sticker-more" onClick={() => setShowStickerTray(v => !v)} aria-expanded={showStickerTray}><Sparkles size={14}/> ALL</button></div>
              {showStickerTray && <div className="sticker-tray">{STICKERS.map(s => <button key={s} onClick={() => addSticker(s)}>{s}</button>)}</div>}
              {stickers.length > 0 && <button className="clear-stickers" onClick={() => setStickers([])}><Trash2 size={12}/> CLEAR STICKERS ({stickers.length})</button>}
            </div>
            <div className="spec-card"><div className="spec-icon"><Aperture size={21}/></div><div><strong>YOUR CAMERA ROLL, YOUR RULES.</strong><p>Photos are processed in your browser and never uploaded to a server.</p></div><span className="spec-stamp">100%<br/>YOU</span></div>
          </aside>
        </div>
      </section>

      <section className="result-section">
        <div className="result-heading"><div><span className="index-label">02 / YOUR MASTERPIECE</span><h2>The memory <span>strip.</span></h2><p>Curated by you. Iconic by default.</p></div><div className="shot-counter"><strong>{String(shots.length).padStart(2,'0')}</strong><span>/ 04 FRAMES</span></div></div>
        <div className="result-grid">
          <div className="strip-area" onPointerMove={e => { if (draggingId) { const rect=e.currentTarget.getBoundingClientRect(); const x=Math.max(0,Math.min(STRIP_W,((e.clientX-rect.left)/rect.width)*STRIP_W)); const y=Math.max(0,Math.min(STRIP_H,((e.clientY-rect.top)/rect.height)*STRIP_H)); setStickers(prev=>prev.map(s=>s.id===draggingId?{...s,x,y}:s)) } }} onPointerUp={() => setDraggingId(null)} onPointerCancel={() => setDraggingId(null)}>
            <div className="area-label">LIVE PREVIEW <span>✧</span></div>
            <div className="photo-strip" style={{ background: theme.color, aspectRatio: `${STRIP_W}/${STRIP_H}` }}>
              {shots.length === 0 ? <div className="strip-empty"><div className="empty-disc"><Aperture size={26}/></div><strong>NO MEMORIES YET</strong><span>Your four-cut strip will appear here.</span><small>HOOH / DIGITAL PHOTO CLUB</small></div> : <div className="strip-photos">{shots.map((shot,i)=><div className="strip-photo" key={shot.id}><img src={shot.canvas.toDataURL('image/jpeg', .9)} alt={`Photo ${i+1}`} /></div>)}</div>}
              {stickers.map(s => <button key={s.id} className="placed-sticker" style={{ left: `${s.x/STRIP_W*100}%`, top: `${s.y/STRIP_H*100}%`, fontSize: `${s.size}px` }} onPointerDown={e => { e.currentTarget.setPointerCapture?.(e.pointerId); setDraggingId(s.id) }} onPointerUp={() => setDraggingId(null)} title="Drag to move sticker" aria-label={`Move ${s.emoji}`}>{s.emoji}</button>)}
              {shots.length > 0 && <div className="strip-footer" style={{ color: theme.ink }}><strong>Ho'oH memories ✦</strong><small>ONE ROLL · FOUR MOMENTS · FOREVER</small></div>}
            </div>
            <span className="strip-deco deco-one">✳</span><span className="strip-deco deco-two">✧</span>
          </div>
          <div className="export-panel"><div className="export-top"><span className="export-icon"><Download size={17}/></span><span className="tiny-mono">EXPORT CENTER</span></div><h3>Save the<br/><em>good stuff.</em></h3><p>Your strip is ready to live rent-free in your camera roll.</p><button className="action-button dark export-button" onClick={downloadStrip} disabled={!shots.length}><Download size={16}/> DOWNLOAD PHOTO STRIP</button><button className="action-button silver share-button" onClick={openShare}><QrCode size={16}/> SHARE WITH QR CODE</button><div className="export-divider"/><div className="export-meta"><span>FILE FORMAT</span><strong>PNG · HIGH RES</strong></div><div className="export-meta"><span>YOUR FRAMES</span><strong>{shots.length} / 4 SELECTED</strong></div><div className="export-meta"><span>PRIVACY</span><strong><Check size={12}/> LOCAL ONLY</strong></div><button className="undo-link" onClick={undoLast} disabled={!shots.length}><RotateCcw size={12}/> Undo last shot</button></div>
        </div>
      </section>

      <section className="end-card"><span className="end-star">✦</span><div><span className="index-label">THAT'S A WRAP</span><h2>Stay weird.<br/><em>Stay iconic.</em></h2></div><p>Thanks for making memories<br/>with Ho'oH. Come back anytime.</p><a href="#studio">BACK TO THE BOOTH ↑</a></section>
    </main>
    <footer><a className="footer-logo" href="#">✳ Ho'oH <em>Memories</em></a><span>MADE OF PIXELS & FEELINGS © 2025</span><span className="footer-icons">✦ ☆ ♡</span></footer>
    <canvas ref={exportRef} className="hidden-export" aria-hidden="true"/>

    {shareOpen && <div className="modal-backdrop" role="presentation" onClick={e => { if(e.target === e.currentTarget) setShareOpen(false) }}><div className="share-modal" role="dialog" aria-modal="true" aria-labelledby="share-title"><button className="modal-close" onClick={() => setShareOpen(false)} aria-label="Close"><X size={18}/></button><div className="modal-kicker">PASS THE VIBE AROUND ✦</div><h2 id="share-title">Share the <em>studio.</em></h2><p>This QR code links to the current website URL. Deploy first to share the public site.</p>{qrData && <img className="qr-image" src={qrData} alt="QR code for the current website URL"/>}<div className="modal-url">{window.location.host || 'local preview'}</div><button className="action-button dark modal-copy" onClick={copyUrl}>COPY WEBSITE LINK</button><button className="modal-dismiss" onClick={() => setShareOpen(false)}>CLOSE WINDOW</button></div></div>}
  </div>
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>)
