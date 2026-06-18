"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import BodyFigure from "./BodyFigure";
import s from "./atlas.module.css";
import { getNote, saveNote } from "@/lib/notesApi";
import { getCoordOverrides, saveCoord } from "@/lib/acupointsApi";
import {
  MERIDIAN_COLORS,
  POINTS,
  SYMPTOM_CATEGORIES,
  SYMPTOM_GROUPS,
  type Point,
} from "@/lib/acupoints";

// Where the "back to Workspace" button sends the user. Overridable per
// environment via NEXT_PUBLIC_WORKSPACE_URL; defaults to the Gateway origin.
const WORKSPACE_URL =
  process.env.NEXT_PUBLIC_WORKSPACE_URL ?? "https://workspace-gateway.vercel.app/";

type View = "body" | "symptom";
type Side = "front" | "back";

type XY = { x: number; y: number };

// Acupoint coordinates are stored directly in the atlas' 0–400 × 0–600 space,
// calibrated to the line-art figure in BodyFigure. Calibration mode (?cal=1)
// can still drag any point and export updated values.
function remap(x: number, y: number): XY {
  return { x, y };
}

// Trailing number of a point id is its sequence along the meridian
// (e.g. GB14 → 14), used to order points when drawing meridian lines.
function seq(id: string): number {
  const m = id.match(/(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : 0;
}

export default function AcupointAtlas() {
  const [view, setView] = useState<View>("body");
  const [side, setSide] = useState<Side>("front");
  const [meridian, setMeridian] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSymptomId, setSelectedSymptomId] = useState<string | null>(null);

  // ---- Calibration (admin-only) + zoom / pan ----
  const { data: session } = useSession();
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "hychanga@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin =
    !!session?.user?.email &&
    adminEmails.includes(session.user.email.toLowerCase());

  const [calibrate, setCalibrate] = useState(false);
  // Calibrated coordinates fetched from the backend (global, shared by all).
  const [serverCoords, setServerCoords] = useState<Record<string, XY>>({});
  // Local unsaved drags, pending a save to the database.
  const [pending, setPending] = useState<Record<string, XY>>({});
  const [saving, setSaving] = useState(false);
  const [calStatus, setCalStatus] = useState("");

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<XY>({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement>(null);
  const dragId = useRef<string | null>(null);
  const panRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(
    null
  );
  // Mirror of zoom/pan for event handlers (avoids stale closures).
  const viewRef = useRef({ zoom: 1, pan: { x: 0, y: 0 } });
  viewRef.current = { zoom, pan };

  // Calibration is only truly active for an admin.
  const calOn = calibrate && isAdmin;

  // Load global calibrated coordinates once.
  useEffect(() => {
    getCoordOverrides()
      .then(setServerCoords)
      .catch(() => {});
  }, []);

  // Honour ?cal=1 (the toolbar toggle also drives `calibrate`).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("cal") === "1") setCalibrate(true);
  }, []);

  const resolve = useCallback(
    (p: Point): XY => pending[p.id] ?? serverCoords[p.id] ?? remap(p.x, p.y),
    [pending, serverCoords]
  );

  function svgCoords(clientX: number, clientY: number): XY {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const r = pt.matrixTransform(m.inverse());
    return { x: Math.round(r.x), y: Math.round(r.y) };
  }

  const clampPan = useCallback((p: XY, z: number): XY => {
    const w = 400 / z;
    const h = 600 / z;
    return {
      x: Math.min(Math.max(0, p.x), 400 - w),
      y: Math.min(Math.max(0, p.y), 600 - h),
    };
  }, []);

  const applyZoom = useCallback(
    (nextZoom: number, focal?: { relX: number; relY: number }) => {
      const z0 = viewRef.current.zoom;
      const p0 = viewRef.current.pan;
      const z = Math.min(6, Math.max(1, Math.round(nextZoom * 100) / 100));
      const fx = focal?.relX ?? 0.5;
      const fy = focal?.relY ?? 0.5;
      // Keep the focal point fixed on screen while zooming.
      const sx = p0.x + fx * (400 / z0);
      const sy = p0.y + fy * (600 / z0);
      setZoom(z);
      setPan(
        z === 1
          ? { x: 0, y: 0 }
          : clampPan({ x: sx - fx * (400 / z), y: sy - fy * (600 / z) }, z)
      );
    },
    [clampPan]
  );

  // Wheel-to-zoom about the cursor (non-passive so we can preventDefault).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width;
      const relY = (e.clientY - rect.top) / rect.height;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      applyZoom(viewRef.current.zoom * factor, { relX, relY });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [applyZoom]);

  function onPointDown(e: React.PointerEvent, id: string) {
    // Always stop the press reaching the SVG: when zoomed in the SVG would
    // start a pan and capture the pointer, swallowing the point's click.
    e.stopPropagation();
    if (!calOn) return;
    dragId.current = id;
    svgRef.current?.setPointerCapture(e.pointerId);
  }

  function onSvgPointerDown(e: React.PointerEvent) {
    // Background press → pan (only meaningful when zoomed in).
    if (dragId.current || viewRef.current.zoom <= 1) return;
    panRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      px: viewRef.current.pan.x,
      py: viewRef.current.pan.y,
    };
    svgRef.current?.setPointerCapture(e.pointerId);
  }

  function onSvgMove(e: React.PointerEvent) {
    if (dragId.current) {
      const id = dragId.current;
      const xy = svgCoords(e.clientX, e.clientY);
      setPending((prev) => ({ ...prev, [id]: xy }));
      return;
    }
    if (panRef.current) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const z = viewRef.current.zoom;
      const dx = ((e.clientX - panRef.current.sx) / rect.width) * (400 / z);
      const dy = ((e.clientY - panRef.current.sy) / rect.height) * (600 / z);
      setPan(clampPan({ x: panRef.current.px - dx, y: panRef.current.py - dy }, z));
    }
  }

  function onSvgUp(e: React.PointerEvent) {
    if (dragId.current || panRef.current) {
      svgRef.current?.releasePointerCapture(e.pointerId);
    }
    dragId.current = null;
    panRef.current = null;
  }

  const pendingIds = Object.keys(pending);

  async function saveCalibration() {
    if (!pendingIds.length) return;
    setSaving(true);
    setCalStatus("儲存中⋯");
    try {
      for (const id of pendingIds) {
        const p = POINTS.find((x) => x.id === id);
        if (!p) continue;
        const xy = pending[id];
        await saveCoord(id, p.view, xy.x, xy.y);
      }
      setServerCoords((prev) => ({ ...prev, ...pending }));
      setPending({});
      setCalStatus(`已儲存 ${pendingIds.length} 筆座標到資料庫`);
    } catch {
      setCalStatus("儲存失敗（需管理員權限，或網路問題）");
    } finally {
      setSaving(false);
    }
  }

  function revertCalibration() {
    setPending({});
    setCalStatus("已還原未儲存的變更");
  }

  function resetZoom() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  const calBtn: React.CSSProperties = {
    padding: "6px 12px",
    border: "1px solid #2b2620",
    borderRadius: 16,
    background: "transparent",
    fontSize: 12,
    cursor: "pointer",
  };

  const term = search.trim().toLowerCase();

  const matchesPoint = useCallback(
    (p: Point) => {
      if (p.view !== side) return false;
      const meridianOk = meridian === "ALL" || p.meridian === meridian;
      const searchOk =
        !term ||
        [p.name, p.py, p.id, p.indications, p.location, p.meridian].some((f) =>
          f.toLowerCase().includes(term)
        );
      return meridianOk && searchOk;
    },
    [side, meridian, term]
  );

  function jumpToPoint(pointId: string) {
    const p = POINTS.find((x) => x.id === pointId);
    if (!p) return;
    setView("body");
    setMeridian("ALL");
    setSearch("");
    setSide(p.view);
    setSelectedId(pointId);
  }

  function switchView(next: View) {
    setView(next);
    setSearch("");
    setSelectedId(null);
    setSelectedSymptomId(null);
  }

  return (
    <div className={s.root}>
      <header className={s.header}>
        <h1>
          穴道<span>圖典</span>
        </h1>
        <p>互動經絡圖 · 全身穴位與症狀方劑對照</p>
        <a className={s.workspaceBtn} href={WORKSPACE_URL}>
          ← 回工作區
        </a>
        <div className={s.tabs}>
          <button
            className={`${s.tabBtn} ${view === "body" ? s.active : ""}`}
            onClick={() => switchView("body")}
          >
            穴道地圖
          </button>
          <button
            className={`${s.tabBtn} ${view === "symptom" ? s.active : ""}`}
            onClick={() => switchView("symptom")}
          >
            症狀與方劑
          </button>
        </div>
      </header>

      <div className={s.layout}>
        {/* sidebar */}
        <aside className={s.sidebar}>
          {view === "body" ? (
            <>
              <h2>經絡 Meridians</h2>
              {["ALL", ...Object.keys(MERIDIAN_COLORS)].map((m) => (
                <button
                  key={m}
                  className={`${s.meridianBtn} ${meridian === m ? s.active : ""}`}
                  onClick={() => setMeridian(m)}
                >
                  <span
                    className={s.dot}
                    style={{
                      background: m === "ALL" ? "#2B2620" : MERIDIAN_COLORS[m],
                    }}
                  />
                  {m === "ALL" ? "全部穴位" : m}
                </button>
              ))}
            </>
          ) : (
            <>
              <h2>病徵分類 Categories</h2>
              {["ALL", ...Object.keys(SYMPTOM_CATEGORIES)].map((c) => (
                <button
                  key={c}
                  className={`${s.meridianBtn} ${category === c ? s.active : ""}`}
                  onClick={() => setCategory(c)}
                >
                  <span
                    className={s.dot}
                    style={{
                      background: c === "ALL" ? "#2B2620" : SYMPTOM_CATEGORIES[c],
                    }}
                  />
                  {c === "ALL" ? "全部病徵" : c}
                </button>
              ))}
            </>
          )}
        </aside>

        {/* stage */}
        <section className={s.stage}>
          <div className={s.stageToolbar}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                view === "body"
                  ? "搜尋穴位名稱、代號或主治⋯ 例如：合谷"
                  : "搜尋病徵或方劑名稱⋯ 例如：失眠 / 葛根湯"
              }
            />
            {view === "body" && (
              <div className={s.viewToggle}>
                <button
                  className={side === "front" ? s.active : ""}
                  onClick={() => setSide("front")}
                >
                  正面
                </button>
                <button
                  className={side === "back" ? s.active : ""}
                  onClick={() => setSide("back")}
                >
                  背面
                </button>
              </div>
            )}
            {view === "body" && isAdmin && (
              <button
                className={`${s.calToggle} ${calOn ? s.active : ""}`}
                onClick={() => {
                  setCalibrate((c) => !c);
                  setCalStatus("");
                }}
              >
                {calOn ? "結束校準" : "校準"}
              </button>
            )}
          </div>

          {view === "body" ? (
            <>
              <div className={`${s.chartArea} ${calOn ? s.calibrating : ""}`}>
                <div className={s.zoomControls}>
                  <button
                    type="button"
                    onClick={() => applyZoom(zoom + 0.5)}
                    aria-label="放大"
                  >
                    ＋
                  </button>
                  <span className={s.zoomLevel}>{Math.round(zoom * 100)}%</span>
                  <button
                    type="button"
                    onClick={() => applyZoom(zoom - 0.5)}
                    aria-label="縮小"
                  >
                    －
                  </button>
                  <button
                    type="button"
                    onClick={resetZoom}
                    aria-label="重設縮放"
                    disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
                  >
                    ⟲
                  </button>
                </div>
                <svg
                  ref={svgRef}
                  className={s.bodyChart}
                  viewBox={`${pan.x.toFixed(2)} ${pan.y.toFixed(2)} ${(
                    400 / zoom
                  ).toFixed(2)} ${(600 / zoom).toFixed(2)}`}
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    touchAction: "none",
                    cursor: calOn ? "default" : zoom > 1 ? "grab" : "default",
                  }}
                  onPointerDown={onSvgPointerDown}
                  onPointerMove={onSvgMove}
                  onPointerUp={onSvgUp}
                  onPointerCancel={onSvgUp}
                >
                  <BodyFigure side={side} />
                <g style={{ pointerEvents: "none" }}>
                  {(() => {
                    const groups: Record<string, Point[]> = {};
                    for (const p of POINTS) {
                      if (p.view !== side || p.meridian === "經外奇穴") continue;
                      (groups[p.meridian] ||= []).push(p);
                    }
                    return Object.entries(groups)
                      .map(([name, pts]) => ({
                        name,
                        pts: pts.slice().sort((a, b) => seq(a.id) - seq(b.id)),
                      }))
                      .filter((g) => g.pts.length >= 2)
                      .map((g) => {
                        const d = g.pts
                          .map((p, i) => {
                            const c = resolve(p);
                            return `${i ? "L" : "M"} ${c.x} ${c.y}`;
                          })
                          .join(" ");
                        const isSel = meridian === g.name;
                        return (
                          <path
                            key={g.name}
                            d={d}
                            fill="none"
                            stroke={MERIDIAN_COLORS[g.name] || "#8A8273"}
                            strokeWidth={isSel ? 2.2 : 1.3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity={meridian === "ALL" ? 0.3 : isSel ? 0.85 : 0.05}
                          />
                        );
                      });
                  })()}
                </g>
                <g>
                  {POINTS.filter((p) => p.view === side).map((p) => {
                    // In calibration mode show every point, unless a meridian is
                    // selected — then only that meridian, so you calibrate it
                    // without the other points getting in the way.
                    const visible = calOn
                      ? meridian === "ALL" || p.meridian === meridian
                      : matchesPoint(p);
                    const c = resolve(p);
                    return (
                      <g
                        key={p.id}
                        className={`${s.point} ${
                          p.id === selectedId ? s.selected : ""
                        }`}
                        // Counter-scale the marker by 1/zoom so the dot and
                        // label keep a constant on-screen size while zooming.
                        transform={`translate(${c.x} ${c.y}) scale(${1 / zoom})`}
                        style={{
                          opacity: visible ? 1 : 0.15,
                          pointerEvents: visible ? "auto" : "none",
                          cursor: calOn ? "grab" : "pointer",
                        }}
                        onClick={() => setSelectedId(p.id)}
                        onPointerDown={(e) => onPointDown(e, p.id)}
                      >
                        <circle className={s.halo} cx={0} cy={0} r={5} />
                        <circle className={s.core} cx={0} cy={0} r={3} />
                        <text
                          x={c.x < 200 ? -12 : 12}
                          y={4}
                          textAnchor={c.x < 200 ? "end" : "start"}
                        >
                          {p.name}
                        </text>
                      </g>
                    );
                  })}
                </g>
                </svg>
              </div>
              <p className={s.stageHint}>
                點擊紅點查看穴位資料（選取後變綠）。用右上角 ＋／－ 或滑鼠滾輪縮放，放大後可拖曳圖面平移，方便精準點選。
              </p>
              {calOn && (
                <div className={s.calPanel}>
                  <strong>校準模式（管理員）</strong>：拖曳紅點到正確穴位（目前
                  {side === "front" ? "正面" : "背面"}）。放開後加入待儲存清單，按
                  「儲存到資料庫」即更新全站座標。放大後校準更精準。
                  <div className={s.calRow}>
                    <button
                      type="button"
                      onClick={saveCalibration}
                      disabled={saving || pendingIds.length === 0}
                      style={calBtn}
                    >
                      儲存到資料庫
                      {pendingIds.length ? `（${pendingIds.length}）` : ""}
                    </button>
                    <button
                      type="button"
                      onClick={revertCalibration}
                      disabled={saving || pendingIds.length === 0}
                      style={calBtn}
                    >
                      還原未儲存
                    </button>
                  </div>
                  {calStatus && <div className={s.calStatus}>{calStatus}</div>}
                  {pendingIds.length > 0 && (
                    <div className={s.calList}>
                      待儲存：
                      {pendingIds
                        .map((id) => POINTS.find((p) => p.id === id)?.name ?? id)
                        .join("、")}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={s.symptomGrid}>
              {(() => {
                const list = SYMPTOM_GROUPS.filter((s2) => {
                  const catOk = category === "ALL" || s2.category === category;
                  const searchOk =
                    !term ||
                    [
                      s2.name,
                      s2.description,
                      s2.category,
                      ...s2.formulas.flatMap((f) => [
                        f.name,
                        f.composition,
                        f.pattern,
                      ]),
                    ].some((f) => f.toLowerCase().includes(term));
                  return catOk && searchOk;
                });
                if (list.length === 0)
                  return (
                    <p className={s.favEmpty}>沒有符合的病徵，請調整搜尋或分類。</p>
                  );
                return list.map((g) => (
                  <button
                    key={g.id}
                    className={`${s.symptomCard} ${
                      g.id === selectedSymptomId ? s.selected : ""
                    }`}
                    onClick={() => setSelectedSymptomId(g.id)}
                  >
                    <span
                      className={s.catTag}
                      style={{ background: SYMPTOM_CATEGORIES[g.category] }}
                    >
                      {g.category}
                    </span>
                    <h4>{g.name}</h4>
                    <p>{g.description}</p>
                    <p
                      style={{
                        marginTop: 6,
                        color: "var(--cinnabar)",
                        fontSize: "11.5px",
                      }}
                    >
                      {g.formulas.map((f) => f.name).join(" ／ ")}
                    </p>
                  </button>
                ));
              })()}
            </div>
          )}
        </section>

        {/* detail */}
        <aside className={s.detail}>
          {view === "symptom" ? (
            <SymptomDetail
              selectedSymptomId={selectedSymptomId}
              onJump={jumpToPoint}
            />
          ) : !selectedId && meridian !== "ALL" ? (
            <MeridianDetail meridian={meridian} onJump={jumpToPoint} />
          ) : (
            <PointDetail selectedId={selectedId} />
          )}
        </aside>
      </div>
    </div>
  );
}

function MeridianDetail({
  meridian,
  onJump,
}: {
  meridian: string;
  onJump: (pointId: string) => void;
}) {
  const color = MERIDIAN_COLORS[meridian] || "#8A8273";
  const pts = POINTS.filter((p) => p.meridian === meridian).sort(
    (a, b) => seq(a.id) - seq(b.id)
  );
  const front = pts.filter((p) => p.view === "front").length;
  const back = pts.length - front;

  return (
    <>
      <h2>經絡資料</h2>
      <div className={s.pointCard}>
        <p className={s.nameCn}>{meridian}</p>
        <span className={s.meridianTag} style={{ background: color }}>
          本經 {pts.length} 穴
        </span>
        <section>
          <h3>循行穴位（依序）</h3>
          <div className={s.relatedPoints}>
            {pts.map((p) => (
              <button key={p.id} onClick={() => onJump(p.id)}>
                {p.name} {p.id}
              </button>
            ))}
          </div>
        </section>
        <p className={s.emptyState} style={{ paddingTop: 0 }}>
          圖面上同色連線即為本經循行路徑（正面 {front} 穴 · 背面 {back} 穴）。
          點選任一穴位即可查看定位、功效與主治。
        </p>
      </div>
    </>
  );
}

function PointDetail({ selectedId }: { selectedId: string | null }) {
  const p = POINTS.find((pt) => pt.id === selectedId) ?? null;
  const { status: authStatus } = useSession();
  const authed = authStatus === "authenticated";
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    setNote("");
    setStatus("");
    if (p && authed) {
      getNote(p.id).then((value) => {
        if (active) setNote(value);
      });
    }
    return () => {
      active = false;
    };
  }, [p, authed]);

  if (!p) {
    return (
      <>
        <h2>穴位資料</h2>
        <div className={s.emptyState}>
          <span className={s.seal}>未選取</span>
          <br />
          請於人形圖上點選一個穴位，即可顯示名稱、定位、主治與個人筆記。
        </div>
      </>
    );
  }

  const color = MERIDIAN_COLORS[p.meridian] || "#8A8273";

  function onChange(value: string) {
    setNote(value);
    setStatus("儲存中⋯");
    if (debounce.current) clearTimeout(debounce.current);
    const id = p!.id;
    debounce.current = setTimeout(async () => {
      try {
        await saveNote(id, value);
        setStatus("已儲存");
        setTimeout(() => setStatus(""), 1200);
      } catch {
        setStatus("儲存失敗");
      }
    }, 500);
  }

  return (
    <>
      <h2>穴位資料</h2>
      <div className={s.pointCard}>
        <p className={s.nameCn}>{p.name}</p>
        <p className={s.namePy}>{p.py}</p>
        <span className={s.code}>{p.id}</span>
        <span className={s.meridianTag} style={{ background: color }}>
          {p.meridian}
        </span>
        {p.special && (
          <div className={s.specialRow}>
            {p.special.split(" · ").map((seg) => (
              <span key={seg} className={s.specialTag}>
                {seg}
              </span>
            ))}
          </div>
        )}
        <section>
          <h3>定位 Location</h3>
          <p>{p.location}</p>
        </section>
        <section>
          <h3>功效 Action</h3>
          <p>{p.action}</p>
        </section>
        <section>
          <h3>主治 Indications</h3>
          <p>{p.indications}</p>
        </section>
        {p.genderNote && (
          <div className={s.genderNote}>
            <span aria-hidden="true">⚥</span>
            <span>
              <b>男女有別：</b>
              {p.genderNote}
            </span>
          </div>
        )}
        <div className={s.noteBox}>
          <h3>我的筆記</h3>
          {authed ? (
            <>
              <textarea
                value={note}
                onChange={(e) => onChange(e.target.value)}
                placeholder="記錄個人按壓心得、症狀反應或提醒事項⋯"
              />
              <div className={s.noteStatus}>{status}</div>
            </>
          ) : (
            <p className={s.noteStatus} style={{ height: "auto", lineHeight: 1.8 }}>
              <button
                type="button"
                onClick={() => signIn("google")}
                style={{
                  color: "var(--cinnabar)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  font: "inherit",
                  textDecoration: "underline",
                }}
              >
                以 Google 登入
              </button>
              {" "}後即可記錄個人筆記（每人各自儲存）。
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function SymptomDetail({
  selectedSymptomId,
  onJump,
}: {
  selectedSymptomId: string | null;
  onJump: (pointId: string) => void;
}) {
  const g = SYMPTOM_GROUPS.find((x) => x.id === selectedSymptomId) ?? null;

  if (!g) {
    return (
      <>
        <h2>病徵與方劑</h2>
        <div className={s.emptyState}>
          <span className={s.seal}>未選取</span>
          <br />
          請於左側選擇病徵分類，並點選中間的病徵卡片，即可看到依證型分類的多個方劑選項。
        </div>
        <div className={s.disclaimer}>
          本資料僅供中醫藥知識教育參考，不能取代醫師診斷與處方。實際用藥請務必諮詢合格中醫師，依個人體質辨證調整。
        </div>
      </>
    );
  }

  const color = SYMPTOM_CATEGORIES[g.category];

  return (
    <>
      <h2>病徵與方劑</h2>
      <div className={`${s.pointCard} ${s.formulaList}`}>
        <p className={s.nameCn}>{g.name}</p>
        <span className={s.meridianTag} style={{ background: color }}>
          {g.category}
        </span>
        <section>
          <h3>概述</h3>
          <p>{g.description}</p>
        </section>
        <section>
          <h3>依證型選方</h3>
          {g.formulas.map((f) => (
            <div className={s.formulaItem} key={f.name}>
              <h4>{f.name}</h4>
              <span className={s.patternTag}>辨證：{f.pattern}</span>
              <div className={s.fRow}>
                <b>組成</b>
                {f.composition}
              </div>
              <div className={s.fRow}>
                <b>用法</b>
                {f.usage}
              </div>
              <div className={s.fRow}>
                <b>注意</b>
                {f.notes}
              </div>
            </div>
          ))}
        </section>
        <section>
          <h3>建議配合穴位</h3>
          <div className={s.relatedPoints}>
            {g.points.map((pid) => {
              const p = POINTS.find((x) => x.id === pid);
              return p ? (
                <button key={pid} onClick={() => onJump(pid)}>
                  {p.name} {p.id}
                </button>
              ) : null;
            })}
          </div>
        </section>
        <div className={s.disclaimer}>
          本資料僅供中醫藥知識教育參考，不能取代醫師診斷與處方。實際用藥請務必諮詢合格中醫師，依個人體質辨證調整。
        </div>
      </div>
    </>
  );
}
