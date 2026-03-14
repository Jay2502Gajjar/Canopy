'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn, getInitials } from '@/lib/utils';
import { Search, ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';
import { mockEmployees, mockDepartments } from '@/lib/mock-data';

interface Node {
  id: string;
  name: string;
  department: string;
  type: 'employee' | 'department';
  risk?: string;
  sentiment?: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null;
  fy?: number | null;
  radius: number;
}

interface Edge { source: string; target: string; }

interface OrgGraphContentProps {
  title?: string;
  filterDepts?: string[];
}

export function OrgGraphContent({ title = 'Org Memory Graph', filterDepts }: OrgGraphContentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const animRef = useRef<number>(0);
  const zoomRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const hoveredRef = useRef<string | null>(null);
  const selectedRef = useRef<string | null>(null);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [search, setSearch] = useState('');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragInfo = useRef<{ nodeId: string | null; isPan: boolean; startX: number; startY: number; offsetStart: { x: number; y: number } }>({ nodeId: null, isPan: false, startX: 0, startY: 0, offsetStart: { x: 0, y: 0 } });

  const departments = filterDepts ? mockDepartments.filter((d) => filterDepts.includes(d.name)) : mockDepartments;
  const employees = filterDepts ? mockEmployees.filter((e) => filterDepts.includes(e.department)) : mockEmployees;

  const riskColor = (risk?: string) =>
    risk === 'critical' ? '#EF4444' : risk === 'concern' ? '#F59E0B' : risk === 'watch' ? '#3B82F6' : '#22C55E';

  // Keep refs in sync
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { offsetRef.current = offset; }, [offset]);

  // Initialize
  useEffect(() => {
    const cx = 400, cy = 300;
    const deptNodes: Node[] = departments.map((d, i) => {
      const angle = (2 * Math.PI * i) / departments.length - Math.PI / 2;
      return {
        id: `dept-${d.id}`, name: d.name, department: d.name, type: 'department',
        x: cx + Math.cos(angle) * 170, y: cy + Math.sin(angle) * 170,
        vx: 0, vy: 0, radius: 26,
      };
    });
    const empNodes: Node[] = employees.map((e) => {
      const di = departments.findIndex((d) => d.name === e.department);
      const dn = deptNodes[di >= 0 ? di : 0];
      const empInDept = employees.filter((x) => x.department === e.department);
      const ei = empInDept.indexOf(e);
      const angle = (2 * Math.PI * ei) / empInDept.length;
      const r = 55 + (ei % 3) * 15;
      return {
        id: e.id, name: e.name, department: e.department, type: 'employee',
        risk: e.riskTier, sentiment: e.sentimentScore,
        x: dn.x + Math.cos(angle) * r, y: dn.y + Math.sin(angle) * r,
        vx: 0, vy: 0, radius: 8,
      };
    });
    nodesRef.current = [...deptNodes, ...empNodes];
    edgesRef.current = employees.map((e) => {
      const di = departments.findIndex((d) => d.name === e.department);
      return { source: e.id, target: `dept-${departments[di >= 0 ? di : 0].id}` };
    });
  }, [departments.length, employees.length]);

  // Canvas resize
  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current, ct = containerRef.current;
      if (!c || !ct) return;
      const dpr = window.devicePixelRatio || 1;
      c.width = ct.clientWidth * dpr;
      c.height = ct.clientHeight * dpr;
      c.style.width = `${ct.clientWidth}px`;
      c.style.height = `${ct.clientHeight}px`;
      const ctx = c.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Render loop with gentle physics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tick = () => {
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const nodeMap: Record<string, Node> = {};
      nodes.forEach((n) => { nodeMap[n.id] = n; });
      const z = zoomRef.current;
      const off = offsetRef.current;
      const hId = hoveredRef.current;
      const sId = selectedRef.current;

      // Gentle force sim — very low alpha for smooth settling
      const alpha = 0.008;
      for (const n of nodes) {
        if (n.fx != null) { n.x = n.fx; n.vx = 0; }
        if (n.fy != null) { n.y = n.fy; n.vy = 0; }
        // Weak center gravity
        n.vx += (400 - n.x) * 0.0005;
        n.vy += (300 - n.y) * 0.0005;
      }
      // Soft repulsion — only close neighbors
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = (a.radius + b.radius) * 2;
          if (dist < minDist) {
            const f = (minDist - dist) / dist * alpha;
            a.vx -= dx * f; a.vy -= dy * f;
            b.vx += dx * f; b.vy += dy * f;
          }
        }
      }
      // Spring edges
      for (const e of edges) {
        const s = nodeMap[e.source], t = nodeMap[e.target];
        if (!s || !t) continue;
        const dx = t.x - s.x, dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = (dist - 65) / dist * alpha * 0.5;
        s.vx += dx * f; s.vy += dy * f;
        t.vx -= dx * f; t.vy -= dy * f;
      }
      // High damping for smoothness
      for (const n of nodes) {
        if (n.fx != null || n.fy != null) continue;
        n.vx *= 0.92; n.vy *= 0.92;
        n.x += n.vx; n.y += n.vy;
      }

      // Draw
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr, h = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(off.x + w / 2, off.y + h / 2);
      ctx.scale(z, z);
      ctx.translate(-w / 2, -h / 2);

      const connSet = new Set<string>();
      if (hId) edges.forEach((e) => { if (e.source === hId) connSet.add(e.target); if (e.target === hId) connSet.add(e.source); });

      // Edges
      for (const e of edges) {
        const s = nodeMap[e.source], t = nodeMap[e.target];
        if (!s || !t) continue;
        const lit = hId && (e.source === hId || e.target === hId);
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = lit ? '#0F766E' : '#64748B';
        ctx.lineWidth = lit ? 1.5 : 0.35;
        ctx.globalAlpha = hId ? (lit ? 0.7 : 0.06) : 0.2;
        ctx.stroke(); ctx.globalAlpha = 1;
      }

      // Get CSS colors
      const cs = getComputedStyle(document.documentElement);
      const cardBg = cs.getPropertyValue('--surface-card').trim() || '#1A2332';
      const fgColor = cs.getPropertyValue('--foreground').trim() || '#F8FAFC';

      // Nodes — all names visible (#4)
      for (const n of nodes) {
        const isH = hId === n.id;
        const isC = connSet.has(n.id);
        const dim = hId && !isH && !isC;
        const isSel = sId === n.id;
        ctx.globalAlpha = dim ? 0.12 : 1;

        if (n.type === 'department') {
          ctx.beginPath();
          ctx.arc(n.x, n.y, isH ? 30 : n.radius, 0, Math.PI * 2);
          ctx.fillStyle = cardBg; ctx.fill();
          ctx.strokeStyle = '#0F766E'; ctx.lineWidth = isSel ? 3 : 1.5; ctx.stroke();
          ctx.fillStyle = '#0F766E';
          ctx.font = `bold ${Math.max(8, 9 * z)}px Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(n.name.slice(0, 4).toUpperCase(), n.x, n.y);
          // Department name below
          ctx.font = `600 ${Math.max(7, 9)}px Inter, system-ui, sans-serif`;
          ctx.fillStyle = fgColor;
          ctx.fillText(n.name, n.x, n.y + 38);
        } else {
          ctx.beginPath();
          ctx.arc(n.x, n.y, isH ? 12 : n.radius, 0, Math.PI * 2);
          ctx.fillStyle = riskColor(n.risk); ctx.fill();
          if (isSel) { ctx.strokeStyle = '#0F766E'; ctx.lineWidth = 2; ctx.stroke(); }
          // Always show name (#4 — mention names of all dots)
          ctx.fillStyle = fgColor;
          ctx.font = `500 ${Math.max(6, 7)}px Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(n.name.split(' ')[0], n.x, n.y - 13);
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const screenToGraph = useCallback((sx: number, sy: number) => {
    const c = canvasRef.current;
    if (!c) return { x: sx, y: sy };
    const dpr = window.devicePixelRatio || 1;
    const w = c.width / dpr, h = c.height / dpr;
    const z = zoomRef.current, off = offsetRef.current;
    return {
      x: (sx - off.x - w / 2) / z + w / 2,
      y: (sy - off.y - h / 2) / z + h / 2,
    };
  }, []);

  const nodeAt = useCallback((sx: number, sy: number): Node | null => {
    const g = screenToGraph(sx, sy);
    for (let i = nodesRef.current.length - 1; i >= 0; i--) {
      const n = nodesRef.current[i];
      const dx = g.x - n.x, dy = g.y - n.y;
      if (dx * dx + dy * dy <= (n.radius + 6) * (n.radius + 6)) return n;
    }
    return null;
  }, [screenToGraph]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const node = nodeAt(x, y);
    if (node) {
      dragInfo.current = { nodeId: node.id, isPan: false, startX: e.clientX, startY: e.clientY, offsetStart: { ...offsetRef.current } };
      node.fx = node.x; node.fy = node.y;
    } else {
      dragInfo.current = { nodeId: null, isPan: true, startX: e.clientX, startY: e.clientY, offsetStart: { ...offsetRef.current } };
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const d = dragInfo.current;

    if (d.nodeId) {
      const g = screenToGraph(x, y);
      const n = nodesRef.current.find((n) => n.id === d.nodeId);
      if (n) { n.fx = g.x; n.fy = g.y; n.x = g.x; n.y = g.y; }
    } else if (d.isPan) {
      const newOff = { x: d.offsetStart.x + (e.clientX - d.startX), y: d.offsetStart.y + (e.clientY - d.startY) };
      setOffset(newOff); offsetRef.current = newOff;
    } else {
      const node = nodeAt(x, y);
      hoveredRef.current = node?.id || null;
      if (canvasRef.current) canvasRef.current.style.cursor = node ? 'grab' : 'default';
    }
  };

  const handlePointerUp = () => {
    const d = dragInfo.current;
    if (d.nodeId) {
      const n = nodesRef.current.find((n) => n.id === d.nodeId);
      if (n) { n.fx = null; n.fy = null; }
    }
    dragInfo.current = { nodeId: null, isPan: false, startX: 0, startY: 0, offsetStart: { x: 0, y: 0 } };
  };

  const handleClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const node = nodeAt(e.clientX - rect.left, e.clientY - rect.top);
    selectedRef.current = node?.id || null;
    setSelectedNode(node);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const d = e.deltaY > 0 ? -0.06 : 0.06;
    const newZ = Math.max(0.3, Math.min(3, zoomRef.current + d));
    setZoom(newZ); zoomRef.current = newZ;
  };

  const resetView = () => {
    setZoom(1); zoomRef.current = 1;
    setOffset({ x: 0, y: 0 }); offsetRef.current = { x: 0, y: 0 };
    setSelectedNode(null); selectedRef.current = null;
    setSearch('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold font-heading">{title}</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
              className="h-8 pl-8 pr-3 rounded-lg bg-surface border border-border text-xs outline-none focus:border-primary w-36" />
          </div>
          <div className="flex items-center gap-1 border border-border rounded-lg">
            <button onClick={() => { const z = Math.max(0.3, zoomRef.current - 0.15); setZoom(z); zoomRef.current = z; }} className="w-7 h-7 flex items-center justify-center hover:bg-surface rounded-l-lg"><ZoomOut size={13} /></button>
            <span className="text-[10px] text-text-muted w-9 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => { const z = Math.min(3, zoomRef.current + 0.15); setZoom(z); zoomRef.current = z; }} className="w-7 h-7 flex items-center justify-center hover:bg-surface rounded-r-lg"><ZoomIn size={13} /></button>
          </div>
          <button onClick={resetView} className="w-7 h-7 flex items-center justify-center border border-border rounded-lg hover:bg-surface" title="Reset"><RotateCcw size={13} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div ref={containerRef} className="lg:col-span-3 bg-surface-card border border-border rounded-xl overflow-hidden relative" style={{ height: 520 }}>
          <canvas ref={canvasRef}
            onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}
            onClick={handleClick} onWheel={handleWheel}
            className="w-full h-full touch-none" />
          <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-surface-card/90 border border-border rounded-lg px-3 py-1.5">
            {[{ l: 'Safe', c: '#22C55E' }, { l: 'Watch', c: '#3B82F6' }, { l: 'Concern', c: '#F59E0B' }, { l: 'Critical', c: '#EF4444' }].map((x) => (
              <div key={x.l} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: x.c }} />
                <span className="text-[10px] text-text-muted">{x.l}</span>
              </div>
            ))}
          </div>
          <div className="absolute top-3 left-3 text-[10px] text-text-muted bg-surface-card/80 border border-border rounded-lg px-2 py-1">
            Drag nodes · Scroll zoom · Pan background
          </div>
        </div>

        <div className="bg-surface-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold font-heading mb-3 flex items-center gap-1.5"><Info size={14} className="text-primary" /> Details</h3>
          {selectedNode ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold',
                  selectedNode.type === 'department' ? 'bg-primary/10 text-primary' : 'bg-surface')}>
                  {selectedNode.type === 'department' ? selectedNode.name.slice(0, 2).toUpperCase() : getInitials(selectedNode.name)}
                </div>
                <div>
                  <p className="font-bold text-sm">{selectedNode.name}</p>
                  <p className="text-xs text-text-muted">{selectedNode.type === 'department' ? 'Department' : selectedNode.department}</p>
                </div>
              </div>
              {selectedNode.type === 'employee' && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex justify-between text-sm"><span className="text-text-muted">Risk</span>
                    <span className={cn('text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full',
                      selectedNode.risk === 'critical' ? 'bg-danger/10 text-danger' : selectedNode.risk === 'concern' ? 'bg-warning/10 text-warning' : selectedNode.risk === 'watch' ? 'bg-secondary/10 text-secondary' : 'bg-success/10 text-success')}>
                      {selectedNode.risk}
                    </span></div>
                  <div className="flex justify-between text-sm"><span className="text-text-muted">Sentiment</span><span className="font-medium">{selectedNode.sentiment}/100</span></div>
                </div>
              )}
              {selectedNode.type === 'department' && (() => {
                const dept = mockDepartments.find((d) => d.name === selectedNode.name);
                return dept ? (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex justify-between text-sm"><span className="text-text-muted">Employees</span><span className="font-medium">{dept.employeeCount}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-text-muted">Engagement</span><span className="font-medium">{dept.engagementScore}/100</span></div>
                  </div>
                ) : null;
              })()}
            </div>
          ) : (
            <div className="text-center py-6 text-text-muted"><p className="text-sm">Click a node for details</p><p className="text-xs mt-1">Drag to move · Scroll to zoom</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
