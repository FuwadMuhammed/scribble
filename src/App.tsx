import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

type Note = {
  id: string
  color: string
  text: string
  rotate: number
  x: number
  y: number
  z: number
}

type PaletteColor = {
  id: string
  hex: string
  tint: string
}

const palette: PaletteColor[] = [
  { id: 'sky', hex: '#BDEBFF', tint: 'rgba(189,235,255,0.55)' },
  { id: 'lavender', hex: '#C9C7FF', tint: 'rgba(201,199,255,0.55)' },
  { id: 'blush', hex: '#F6B7C7', tint: 'rgba(246,183,199,0.55)' },
  { id: 'lemon', hex: '#FAF1A5', tint: 'rgba(250,241,165,0.55)' },
  { id: 'mint', hex: '#BFF4DA', tint: 'rgba(191,244,218,0.55)' },
  { id: 'peach', hex: '#FAD3B3', tint: 'rgba(250,211,179,0.55)' },
  { id: 'violet', hex: '#D9B7FF', tint: 'rgba(217,183,255,0.55)' },
  { id: 'sage', hex: '#CFECC2', tint: 'rgba(207,236,194,0.55)' },
]

const CANVAS_W = 2600
const CANVAS_H = 1600
const NOTE_SIZE = 260
const MIN_ZOOM = 0.6
const MAX_ZOOM = 1.6
const NOTE_OVERLAP_MAX_AREA_RATIO = 0.09
const NOTE_OVERLAP_MAX_EDGE_PX = 66

const initialNotes: Note[] = [
  {
    id: 'n1',
    color: '#BDEBFF',
    rotate: -1.4,
    x: 120,
    y: 80,
    z: 1,
    text: "i hope you remember how\nstrong you had to be during\nthis time. there were days\nyou wanted to give up, but\nyou didn't. i hope you're\nliving a life that feels\nlighter and more peaceful\nnow.",
  },
  {
    id: 'n2',
    color: '#C9C7FF',
    rotate: 1.2,
    x: 430,
    y: 92,
    z: 2,
    text: "Today I chose not to be too\nhard on myself. I completed\nsomething I had been\navoiding for days. it may\nseem small, but it felt like\nprogress.",
  },
  {
    id: 'n3',
    color: '#FAF1A5',
    rotate: -0.7,
    x: 805,
    y: 70,
    z: 3,
    text: "You don't owe everyone an\nexplanation for your\nboundaries.\n\nProtecting your energy is\nnot selfish. it's necessary.",
  },
  {
    id: 'n4',
    color: '#BFF4DA',
    rotate: 1.0,
    x: 1120,
    y: 88,
    z: 4,
    text: "I overthink a lot. I replay\nconversations in my head\nand wonder if i said the\nwrong thing. Even small\nsituations feel bigger in my\nmind than they probably are.",
  },
  {
    id: 'n5',
    color: '#F6B7C7',
    rotate: -1.6,
    x: 150,
    y: 410,
    z: 5,
    text: "watching Frozen felt more\nemotional than I expected.\nAt first, it seemed like just\na beautiful animated movie\nwith snow, magic, and songs.\nBut as the story unfolded, it\njust blew my mind!",
  },
  {
    id: 'n6',
    color: '#FAD3B3',
    rotate: 0.9,
    x: 470,
    y: 450,
    z: 6,
    text: "Not every silence means\nsomething is wrong.\n\nSometimes people are just\ntired or busy. I'm trying not\nto assume the worst\nanymore.",
  },
  {
    id: 'n7',
    color: '#F6B7C7',
    rotate: -0.4,
    x: 690,
    y: 360,
    z: 7,
    text: "I'm grateful for the few\npeople who truly listen when\nI speak. They make me feel\nseen and understood. That\nkind of connection is rare.",
  },
  {
    id: 'n8',
    color: '#C9C7FF',
    rotate: 1.6,
    x: 910,
    y: 520,
    z: 8,
    text: "A security smiled at me\ntoday while I was passing by.\nFelt unexpectedly warm. In\nthe middle of a busy day,\nthat simple smile made\neverything feel a little\nlighter.\n\nshow kindness!",
  },
  {
    id: 'n9',
    color: '#CFECC2',
    rotate: -1.2,
    x: 1210,
    y: 430,
    z: 9,
    text: "If you haven't watched Five\nFeet Apart, go watch it\nright now. I just finished it,\nand i honestly don't even\nknow what to say. it broke\nmy heart in the softest way\npossible, & i'm still sitting\nhere trying to process\neverything.",
  },
]

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

type DbNote = {
  id: string
  color: string
  text: string
  rotate: number
  x: number
  y: number
  z: number
}

let supabaseSingleton: SupabaseClient | null = null

function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  if (supabaseSingleton) return supabaseSingleton
  supabaseSingleton = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return supabaseSingleton
}

function toNote(row: DbNote): Note {
  return {
    id: row.id,
    color: row.color,
    text: row.text,
    rotate: row.rotate,
    x: row.x,
    y: row.y,
    z: row.z,
  }
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

const prompts = [
  { text: 'What made you smile today?', className: 'left-[8%] top-[18%] hidden md:flex' },
  { text: 'Drop a thought.', className: 'left-[16%] top-[34%] hidden md:flex' },
  { text: "Something you're grateful for?", className: 'left-[12%] top-[56%] hidden md:flex' },
  { text: 'A confession?', className: 'left-[20%] top-[70%] hidden md:flex' },
  { text: 'A message to your future self', className: 'right-[10%] top-[18%] hidden md:flex' },
  { text: 'A small win?', className: 'right-[18%] top-[40%] hidden md:flex' },
  { text: 'An unpopular opinion?', className: 'right-[12%] top-[54%] hidden md:flex' },
  { text: 'About your favorite movie', className: 'right-[14%] top-[70%] hidden md:flex' },
]

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function getNotesBounds(notes: Array<Pick<Note, 'x' | 'y'>>) {
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const n of notes) {
    minX = Math.min(minX, n.x)
    minY = Math.min(minY, n.y)
    maxX = Math.max(maxX, n.x + NOTE_SIZE)
    maxY = Math.max(maxY, n.y + NOTE_SIZE)
  }

  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, cx: 0, cy: 0 }
  }

  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  return { minX, minY, maxX, maxY, cx, cy }
}

function centerNotesInCanvas(notes: Note[]) {
  const b = getNotesBounds(notes)
  const dx = CANVAS_W / 2 - b.cx
  const dy = CANVAS_H / 2 - b.cy
  return notes.map((n) => ({
    ...n,
    x: clamp(Math.round(n.x + dx), 0, CANVAS_W - NOTE_SIZE),
    y: clamp(Math.round(n.y + dy), 0, CANVAS_H - NOTE_SIZE),
  }))
}

function randomRotate() {
  return (Math.random() * 4 - 2) * 0.9
}

function intersect(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  const x1 = Math.max(a.x, b.x)
  const y1 = Math.max(a.y, b.y)
  const x2 = Math.min(a.x + a.w, b.x + b.w)
  const y2 = Math.min(a.y + a.h, b.y + b.h)
  const w = Math.max(0, x2 - x1)
  const h = Math.max(0, y2 - y1)
  return { w, h, area: w * h }
}

function isPlacementOk(id: string, x: number, y: number, notes: Note[]) {
  const a = { x, y, w: NOTE_SIZE, h: NOTE_SIZE }
  const maxArea = NOTE_SIZE * NOTE_SIZE * NOTE_OVERLAP_MAX_AREA_RATIO

  for (const n of notes) {
    if (n.id === id) continue
    const b = { x: n.x, y: n.y, w: NOTE_SIZE, h: NOTE_SIZE }
    const it = intersect(a, b)
    if (it.area <= 0) continue
    if (it.area > maxArea) return false
    if (Math.min(it.w, it.h) > NOTE_OVERLAP_MAX_EDGE_PX) return false
  }

  return true
}

function resolvePlacement(id: string, desiredX: number, desiredY: number, notes: Note[]) {
  const baseX = clamp(desiredX, 0, CANVAS_W - NOTE_SIZE)
  const baseY = clamp(desiredY, 0, CANVAS_H - NOTE_SIZE)
  if (isPlacementOk(id, baseX, baseY, notes)) return { x: baseX, y: baseY }

  const steps = 22
  for (let r = 16; r <= 520; r += 16) {
    for (let i = 0; i < steps; i += 1) {
      const t = (i / steps) * Math.PI * 2
      const x = clamp(baseX + Math.cos(t) * r, 0, CANVAS_W - NOTE_SIZE)
      const y = clamp(baseY + Math.sin(t) * r, 0, CANVAS_H - NOTE_SIZE)
      if (isPlacementOk(id, x, y, notes)) return { x, y }
    }
  }

  return { x: baseX, y: baseY }
}

function spreadNotes(notes: Note[]) {
  const out: Note[] = []
  for (const n of notes.slice().sort((a, b) => a.z - b.z)) {
    const placed = resolvePlacement(n.id, n.x, n.y, out)
    out.push({ ...n, x: placed.x, y: placed.y })
  }
  return out
}

function App() {
  const supabase = getSupabaseClient()
  const supabaseRef = useRef<SupabaseClient | null>(supabase)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [isCreditsOpen, setIsCreditsOpen] = useState(false)
  const [notes, setNotes] = useState<Note[]>(() =>
    supabase ? [] : centerNotesInCanvas(initialNotes),
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedColorId, setSelectedColorId] = useState(palette[2].id)
  const [draftText, setDraftText] = useState('')
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(1)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const creditsRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{
    id: string
    dx: number
    dy: number
    pointerId: number
  } | null>(null)
  const rafRef = useRef<number | null>(null)
  const panRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    startScrollLeft: number
    startScrollTop: number
  } | null>(null)
  const pinchRef = useRef<{
    pointers: Map<number, { x: number; y: number }>
    aId: number | null
    bId: number | null
    startDist: number
    startZoom: number
    startCanvasX: number
    startCanvasY: number
    isPinching: boolean
  }>({
    pointers: new Map(),
    aId: null,
    bId: null,
    startDist: 1,
    startZoom: 1,
    startCanvasX: 0,
    startCanvasY: 0,
    isPinching: false,
  })

  const selected = useMemo(() => {
    return palette.find((c) => c.id === selectedColorId) ?? palette[0]
  }, [selectedColorId])

  const maxZ = useMemo(() => {
    return notes.reduce((m, n) => Math.max(m, n.z), 0)
  }, [notes])

  function closeModal() {
    setIsModalOpen(false)
  }

  function openModal() {
    setIsCreditsOpen(false)
    setIsModalOpen(true)
  }

  useEffect(() => {
    if (!isCreditsOpen) return
    function onPointerDown(e: PointerEvent) {
      const root = creditsRef.current
      if (!root) return
      if (root.contains(e.target as Node)) return
      setIsCreditsOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [isCreditsOpen])

  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  function clientToCanvas(clientX: number, clientY: number) {
    const vp = viewportRef.current
    if (!vp) return null
    const rect = vp.getBoundingClientRect()
    const z = zoomRef.current
    const x = (clientX - rect.left + vp.scrollLeft) / z
    const y = (clientY - rect.top + vp.scrollTop) / z
    return { x, y }
  }

  function startDrag(e: ReactPointerEvent<HTMLDivElement>, noteId: string) {
    if (isModalOpen) return
    if (pinchRef.current.isPinching) return
    const p = clientToCanvas(e.clientX, e.clientY)
    if (!p) return
    const n = notes.find((x) => x.id === noteId)
    if (!n) return

    dragRef.current = { id: noteId, dx: p.x - n.x, dy: p.y - n.y, pointerId: e.pointerId }

    setNotes((prev) =>
      prev.map((x) => (x.id === noteId ? { ...x, z: maxZ + 1 } : x)),
    )
    const sb = supabaseRef.current
    if (sb) {
      void sb.from('notes').update({ z: maxZ + 1 }).eq('id', noteId)
    }

    if (e.pointerType !== 'touch') {
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const pr = pinchRef.current
      if (pr.pointers.has(e.pointerId)) {
        pr.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      }

      if (pr.isPinching && pr.aId != null && pr.bId != null) {
        const a = pr.pointers.get(pr.aId)
        const b = pr.pointers.get(pr.bId)
        const vp = viewportRef.current
        if (!a || !b || !vp) return

        const dx = a.x - b.x
        const dy = a.y - b.y
        const dist = Math.max(1, Math.hypot(dx, dy))
        const nextZoom = clamp(pr.startZoom * (dist / pr.startDist), MIN_ZOOM, MAX_ZOOM)

        const rect = vp.getBoundingClientRect()
        const midClientX = (a.x + b.x) / 2
        const midClientY = (a.y + b.y) / 2
        const offsetX = midClientX - rect.left
        const offsetY = midClientY - rect.top

        zoomRef.current = nextZoom
        setZoom(nextZoom)
        vp.scrollLeft = pr.startCanvasX * nextZoom - offsetX
        vp.scrollTop = pr.startCanvasY * nextZoom - offsetY
        return
      }

      const pan = panRef.current
      if (pan && e.pointerId === pan.pointerId) {
        const vp = viewportRef.current
        if (!vp) return
        vp.scrollLeft = pan.startScrollLeft - (e.clientX - pan.startX)
        vp.scrollTop = pan.startScrollTop - (e.clientY - pan.startY)
        return
      }

      const d = dragRef.current
      if (!d || e.pointerId !== d.pointerId) return
      const vp = viewportRef.current
      if (!vp) return
      const rect = vp.getBoundingClientRect()
      const z = zoomRef.current
      const p = {
        x: (e.clientX - rect.left + vp.scrollLeft) / z,
        y: (e.clientY - rect.top + vp.scrollTop) / z,
      }

      const nx = clamp(p.x - d.dx, 0, CANVAS_W - NOTE_SIZE)
      const ny = clamp(p.y - d.dy, 0, CANVAS_H - NOTE_SIZE)

      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        setNotes((prev) => prev.map((n) => (n.id === d.id ? { ...n, x: nx, y: ny } : n)))
      })
    }

    function onUp(e: PointerEvent) {
      const pr = pinchRef.current
      if (pr.pointers.has(e.pointerId)) {
        pr.pointers.delete(e.pointerId)
      }
      if (pr.isPinching && pr.pointers.size < 2) {
        pr.isPinching = false
        pr.aId = null
        pr.bId = null
      }

      const pan = panRef.current
      if (pan && e.pointerId === pan.pointerId) {
        panRef.current = null
      }

      const d = dragRef.current
      if (d && e.pointerId === d.pointerId) {
        dragRef.current = null
        const sb = supabaseRef.current
        setNotes((prev) => {
          const target = prev.find((n) => n.id === d.id)
          if (!target) return prev
          const resolved = resolvePlacement(d.id, target.x, target.y, prev)
          if (resolved.x === target.x && resolved.y === target.y) return prev
          if (sb) {
            void sb
              .from('notes')
              .update({ x: resolved.x, y: resolved.y, z: target.z })
              .eq('id', d.id)
          }
          return prev.map((n) => (n.id === d.id ? { ...n, x: resolved.x, y: resolved.y } : n))
        })
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('pointercancel', onUp, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])

  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return

    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey) return
      const v = viewportRef.current
      if (!v) return
      e.preventDefault()

      const rect = v.getBoundingClientRect()
      const startZoom = zoomRef.current
      const factor = Math.exp(-e.deltaY * 0.002)
      const nextZoom = clamp(startZoom * factor, MIN_ZOOM, MAX_ZOOM)
      if (Math.abs(nextZoom - startZoom) < 0.0005) return

      const canvasX = (e.clientX - rect.left + v.scrollLeft) / startZoom
      const canvasY = (e.clientY - rect.top + v.scrollTop) / startZoom

      zoomRef.current = nextZoom
      setZoom(nextZoom)
      v.scrollLeft = canvasX * nextZoom - (e.clientX - rect.left)
      v.scrollTop = canvasY * nextZoom - (e.clientY - rect.top)
    }

    vp.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      vp.removeEventListener('wheel', onWheel)
    }
  }, [])

  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    requestAnimationFrame(() => {
      const z = zoomRef.current
      vp.scrollLeft = Math.max(0, CANVAS_W * z / 2 - vp.clientWidth / 2)
      vp.scrollTop = Math.max(0, CANVAS_H * z / 2 - vp.clientHeight / 2)
    })
  }, [])

  useEffect(() => {
    const sb = supabaseRef.current
    if (!sb) return

    let cancelled = false

    async function load() {
      const { data, error } = await sb!
        .from('notes')
        .select('id,color,text,rotate,x,y,z')
        .order('z', { ascending: true })

      if (cancelled) return
      if (error || !data) {
        setSyncError(`Supabase load failed: ${error?.message ?? 'unknown error'}`)
        return
      }

      const loaded = (data as unknown as DbNote[]).map(toNote)
      const spread = spreadNotes(loaded)
      setSyncError(null)
      setNotes((prev) => {
        if (prev.length === 0) return spread
        const map = new Map<string, Note>()
        for (const n of prev) map.set(n.id, n)
        for (const n of spread) map.set(n.id, n)
        return Array.from(map.values()).sort((a, b) => a.z - b.z)
      })

      const vp = viewportRef.current
      if (!vp) return
      requestAnimationFrame(() => {
        const z = zoomRef.current
        const b = getNotesBounds(spread)
        const cx = Number.isFinite(b.cx) ? b.cx : CANVAS_W / 2
        const cy = Number.isFinite(b.cy) ? b.cy : CANVAS_H / 2
        vp.scrollLeft = Math.max(0, cx * z - vp.clientWidth / 2)
        vp.scrollTop = Math.max(0, cy * z - vp.clientHeight / 2)
      })
    }

    void load()

    const channel = sb!
      .channel('notes-wall')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes' },
        (payload) => {
          const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            const row = payload.new as unknown as DbNote
            setNotes((prev) => {
              const exists = prev.some((n) => n.id === row.id)
              const next = toNote(row)
              if (!exists) {
                const placed = resolvePlacement(next.id, next.x, next.y, prev)
                return [...prev, { ...next, x: placed.x, y: placed.y }]
              }
              return prev.map((n) => (n.id === row.id ? { ...n, ...next } : n))
            })
          } else if (eventType === 'DELETE') {
            const row = payload.old as unknown as { id: string }
            setNotes((prev) => prev.filter((n) => n.id !== row.id))
          }
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      void sb.removeChannel(channel)
    }
  }, [])

  function onViewportPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (isModalOpen) return
    const pr = pinchRef.current
    pr.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pr.pointers.size >= 2 && !pr.isPinching) {
      const ids = Array.from(pr.pointers.keys()).slice(0, 2)
      pr.aId = ids[0] ?? null
      pr.bId = ids[1] ?? null
      const a = pr.aId != null ? pr.pointers.get(pr.aId) : null
      const b = pr.bId != null ? pr.pointers.get(pr.bId) : null
      const vp = viewportRef.current
      if (!a || !b || !vp) return

      pr.isPinching = true
      pr.startZoom = zoomRef.current
      pr.startDist = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y))

      const midClientX = (a.x + b.x) / 2
      const midClientY = (a.y + b.y) / 2
      const rect = vp.getBoundingClientRect()
      pr.startCanvasX = (midClientX - rect.left + vp.scrollLeft) / pr.startZoom
      pr.startCanvasY = (midClientY - rect.top + vp.scrollTop) / pr.startZoom

      dragRef.current = null
      panRef.current = null
      return
    }

    if (e.pointerType === 'touch') {
      const target = e.target as HTMLElement
      if (target.closest('[data-note="true"]')) return
      const vp = viewportRef.current
      if (!vp) return
      panRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startScrollLeft: vp.scrollLeft,
        startScrollTop: vp.scrollTop,
      }
    }
  }

  function addToWall() {
    const trimmed = draftText.trim()
    if (!trimmed) return

    const sb = supabaseRef.current

    const vp = viewportRef.current
    const z = zoomRef.current
    const centerX = vp ? (vp.scrollLeft + vp.clientWidth / 2) / z : CANVAS_W / 2
    const centerY = vp ? (vp.scrollTop + vp.clientHeight / 2) / z : CANVAS_H / 2
    const desiredX = centerX - NOTE_SIZE / 2 + (Math.random() * 80 - 40)
    const desiredY = centerY - NOTE_SIZE / 2 + (Math.random() * 80 - 40)

    const id = sb ? crypto.randomUUID() : `n-${Date.now()}`

    const next: Note = {
      id,
      color: selected.hex,
      text: trimmed,
      rotate: randomRotate(),
      x: 0,
      y: 0,
      z: maxZ + 1,
    }

    const placed = resolvePlacement(next.id, desiredX, desiredY, notes)
    setNotes((prev) => {
      return [...prev, { ...next, x: placed.x, y: placed.y }]
    })

    if (sb) {
      void sb
        .from('notes')
        .insert({
          id: next.id,
          color: next.color,
          text: next.text,
          rotate: next.rotate,
          x: placed.x,
          y: placed.y,
          z: next.z,
        } satisfies DbNote)
        .then(({ error }) => {
          if (!error) return
          setSyncError(`Supabase insert failed: ${error.message}`)
        })
    }

    setDraftText('')
    setSelectedColorId(palette[2].id)
    closeModal()
  }

  return (
    <div className="relative h-screen w-screen bg-[#F4F4F4]">
      {syncError ? (
        <div className="pointer-events-auto fixed left-1/2 top-4 z-30 w-[min(760px,92vw)] -translate-x-1/2 rounded-[14px] bg-[#111111] px-4 py-3 font-hand text-[16px] leading-[1.15] text-white shadow-float">
          <div className="flex items-start justify-between gap-3">
            <div>{syncError}</div>
            <button
              type="button"
              className="shrink-0 rounded-full px-2 py-0.5 text-white/80 transition-colors hover:text-white"
              onClick={() => setSyncError(null)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
      <div
        ref={viewportRef}
        className="absolute inset-0 overflow-auto touch-none overscroll-none"
        onPointerDown={onViewportPointerDown}
      >
        <div
          className="relative"
          style={{
            width: `${CANVAS_W * zoom}px`,
            height: `${CANVAS_H * zoom}px`,
          }}
        >
          <div
            className="wall-bg relative"
            style={{
              width: `${CANVAS_W}px`,
              height: `${CANVAS_H}px`,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
          >
            {notes.map((note) => (
              <div
                key={note.id}
                data-note="true"
                className="absolute h-[260px] w-[260px] select-none rounded-[10px] p-5 font-hand text-[18px] leading-[1.25] text-[#2F2F2F] shadow-note active:cursor-grabbing md:cursor-grab"
                style={{
                  backgroundColor: note.color,
                  transform: `rotate(${note.rotate}deg)`,
                  left: `${note.x}px`,
                  top: `${note.y}px`,
                  zIndex: note.z,
                  touchAction: 'none',
                }}
                onPointerDown={(e) => startDrag(e, note.id)}
              >
                <div className="whitespace-pre-wrap">{note.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-[calc(12px+env(safe-area-inset-bottom))] left-1/2 z-20 w-[calc(100vw-24px)] max-w-[calc(100vw-24px)] -translate-x-1/2 md:w-fit">
        <div className="pointer-events-auto flex items-center justify-between gap-0 rounded-xl bg-[#ffffff] px-1.5 py-1.5 font-hand text-black shadow-float md:justify-start md:gap-2 md:px-2 md:py-2">
          <div
            ref={creditsRef}
            className="relative group"
            onMouseLeave={() => setIsCreditsOpen(false)}
          >
            <button
              type="button"
              className="relative z-10 flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#F6B7C7] shadow-note transition-transform duration-200 ease-out group-hover:-translate-y-0.5 md:h-12 md:w-12"
              onClick={() => setIsCreditsOpen((v) => !v)}
              aria-label="Credits"
            >
              <div className="font-hand text-[11px] leading-[1] text-[#2F2F2F] md:text-[12px]">
                <div>MY</div>
                <div>NOTES</div>
              </div>
            </button>

            <div
              className={`pointer-events-auto absolute left-0 bottom-12 z-10 w-[min(250px,calc(100vw-24px))] origin-bottom-left -rotate-[2deg] translate-y-3 scale-90 opacity-0 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.18,0.9,0.2,1)] group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 ${
                isCreditsOpen ? 'translate-y-0 scale-100 opacity-100' : ''
              }`}
            >
              <div className="rounded-[10px] bg-[#FAF1A5] p-4 shadow-note">
                <div className="flex items-center gap-2 text-[12px] text-[#2F2F2F]/80">
                  <InstagramIcon className="h-4 w-4" />
                  <div>
                    Designed by{' '}
                    <a
                      className="text-[#2F2F2F] underline-offset-4 hover:underline"
                      href="https://www.instagram.com/ayshashabadesigns/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Aysha Shaba
                    </a>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2 text-[12px] text-[#2F2F2F]/80">
                  <InstagramIcon className="h-4 w-4" />
                  <div>
                    Made by{' '}
                    <a
                      className="text-[#2F2F2F] underline-offset-4 hover:underline"
                      href="https://www.instagram.com/fuwad.design"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Fuwad.design
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-1 hidden h-8 w-px bg-black/15 md:block" />

          <div className="flex items-center rounded-full px-0.5 text-[14px] md:px-1 md:text-[16px]">
            <button
              type="button"
              className="h-7 w-7 rounded-full transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 md:h-8 md:w-8"
              onClick={() => setZoom((z) => clamp(Number((z - 0.1).toFixed(2)), MIN_ZOOM, MAX_ZOOM))}
              aria-label="Zoom out"
            >
              −
            </button>
            <div className="px-1 text-[12px] tabular-nums text-black/70 sm:px-2 sm:text-[14px]">
              {Math.round(zoom * 100)}%
            </div>
            <button
              type="button"
              className="h-7 w-7 rounded-full transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 md:h-8 md:w-8"
              onClick={() => setZoom((z) => clamp(Number((z + 0.1).toFixed(2)), MIN_ZOOM, MAX_ZOOM))}
              aria-label="Zoom in"
            >
              +
            </button>
          </div>

          <div className="mx-1 h-8 w-px bg-black/15 md:mx-1.5" />

          <button
            type="button"
            onClick={openModal}
            className="shrink-0 rounded-xl bg-black px-3 py-2 text-[15px] text-white shadow-float transition-transform duration-200 hover:-translate-y-1 active:translate-y-0 sm:px-4 sm:text-[16px] md:px-7 md:py-3 md:text-[18px]"
          >
            Add A Note
          </button>
        </div>
      </div>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm fade-in"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative h-full w-full">
            {prompts.map((p, i) => (
              <div
                key={p.text}
                className={`absolute ${p.className} items-center rounded-full bg-[#1B1B1B] px-4 py-2 font-hand text-[16px] text-white shadow-prompt prompt-in`}
                style={{ animationDelay: `${60 + i * 45}ms` }}
              >
                {p.text}
              </div>
            ))}

            <div className="absolute left-1/2 bottom-0 w-[min(520px,92vw)] -translate-x-1/2 pb-[calc(14px+env(safe-area-inset-bottom))] md:top-1/2 md:bottom-auto md:w-[420px] md:max-w-[90vw] md:-translate-y-1/2 md:pb-0">
              <div
                className="max-h-[82vh] overflow-auto rounded-[20px] bg-white p-5 font-modal text-[#2F2F2F] shadow-modal pop-in md:max-h-none md:p-7"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between">
                  <div className="text-[22px] leading-[1] text-[#1F1F1F] md:text-[26px]">
                    create a New Note
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full px-2 py-1 text-[22px] leading-[1] text-[#1F1F1F]/70 transition-colors hover:text-[#1F1F1F]"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-5">
                  <div className="font-hand text-[12px] font-medium tracking-wide text-[#2F2F2F]/60">
                    choose a color
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {palette.map((c) => {
                      const isSelected = c.id === selectedColorId
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedColorId(c.id)}
                          className={`relative h-8 w-8 rounded-full transition-transform duration-150 hover:-translate-y-0.5 md:h-9 md:w-9 ${
                            isSelected ? 'ring-2 ring-[#1F1F1F]' : ''
                          }`}
                          style={{ backgroundColor: c.hex }}
                          aria-label={`Select ${c.id}`}
                        >
                          {isSelected ? (
                            <div className="absolute inset-0 flex items-center justify-center text-[18px] text-[#1F1F1F]">
                              ✓
                            </div>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="font-hand text-[12px] font-medium tracking-wide text-[#2F2F2F]/60">
                    Add your thoughts
                  </div>
                  <textarea
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    placeholder="What’s on your mind?"
                    className="mt-3 h-[200px] w-full resize-none rounded-[12px] p-4 text-[18px] leading-[1.2] text-[#2F2F2F] outline-none placeholder:text-[#2F2F2F]/40 md:h-[280px] md:text-[20px]"
                    style={{ background: selected.tint }}
                  />
                </div>

                <button
                  type="button"
                  onClick={addToWall}
                  disabled={!draftText.trim()}
                  className="mt-5 w-full rounded-full bg-[#111111] px-6 py-3 text-[18px] text-white shadow-float transition-transform duration-200 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 md:px-7 md:py-4 md:text-[20px]"
                >
                  Add to wall
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default App
