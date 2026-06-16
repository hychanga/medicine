"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import BodyFigure from "./BodyFigure";
import s from "./atlas.module.css";
import { getNote, saveNote } from "@/lib/notesApi";
import {
  MERIDIAN_COLORS,
  POINTS,
  SYMPTOM_CATEGORIES,
  SYMPTOM_GROUPS,
  type Point,
} from "@/lib/acupoints";

type View = "body" | "symptom";
type Side = "front" | "back";

type XY = { x: number; y: number };

// Transitional: the old acupoint coordinates were tuned to a 0–400 × 0–900
// hand-drawn figure. The new photo fills a 0–400 × 0–600 space, so we map the
// old coords in as a rough starting position; calibration mode then lets the
// points be dragged to their exact spots before the values are baked in.
function remap(x: number, y: number): XY {
  const nx = Math.min(394, Math.max(6, 200 + (x - 200) * 1.5));
  const ny = Math.min(594, Math.max(6, 8 + (y - 15) * (584 / 869)));
  return { x: Math.round(nx), y: Math.round(ny) };
}

export default function AcupointAtlas() {
  const [view, setView] = useState<View>("body");
  const [side, setSide] = useState<Side>("front");
  const [meridian, setMeridian] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSymptomId, setSelectedSymptomId] = useState<string | null>(null);

  // Calibration mode (opt-in via ?cal=1): drag points onto the new figure.
  const [calibrate, setCalibrate] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, XY>>({});
  const [exportText, setExportText] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);
  const dragId = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setCalibrate(params.get("cal") === "1");
    try {
      const saved = localStorage.getItem("acu-cal");
      if (saved) setOverrides(JSON.parse(saved));
    } catch {}
  }, []);

  const resolve = useCallback(
    (p: Point): XY => overrides[p.id] ?? remap(p.x, p.y),
    [overrides]
  );

  function writeOverrides(next: Record<string, XY>) {
    setOverrides(next);
    try {
      localStorage.setItem("acu-cal", JSON.stringify(next));
    } catch {}
  }

  function svgCoords(e: React.PointerEvent): XY {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const r = pt.matrixTransform(m.inverse());
    return { x: Math.round(r.x), y: Math.round(r.y) };
  }

  function onPointDown(e: React.PointerEvent, id: string) {
    if (!calibrate) return;
    e.stopPropagation();
    dragId.current = id;
    svgRef.current?.setPointerCapture(e.pointerId);
  }
  function onSvgMove(e: React.PointerEvent) {
    if (!calibrate || !dragId.current) return;
    writeOverrides({ ...overrides, [dragId.current]: svgCoords(e) });
  }
  function onSvgUp(e: React.PointerEvent) {
    if (!dragId.current) return;
    svgRef.current?.releasePointerCapture(e.pointerId);
    dragId.current = null;
  }

  function doExport() {
    const out: Record<string, XY> = {};
    for (const p of POINTS) out[p.id] = resolve(p);
    const text = JSON.stringify(out);
    setExportText(text);
    navigator.clipboard?.writeText(text).catch(() => {});
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
          </div>

          {view === "body" ? (
            <>
              <svg
                ref={svgRef}
                className={s.bodyChart}
                viewBox="0 0 400 600"
                xmlns="http://www.w3.org/2000/svg"
                onPointerMove={onSvgMove}
                onPointerUp={onSvgUp}
              >
                <BodyFigure side={side} />
                <g>
                  {POINTS.filter((p) => p.view === side).map((p) => {
                    const visible = calibrate || matchesPoint(p);
                    const c = resolve(p);
                    return (
                      <g
                        key={p.id}
                        className={`${s.point} ${
                          p.id === selectedId ? s.selected : ""
                        }`}
                        style={{
                          opacity: visible ? 1 : 0.15,
                          pointerEvents: visible ? "auto" : "none",
                          cursor: calibrate ? "grab" : "pointer",
                        }}
                        onClick={() => setSelectedId(p.id)}
                        onPointerDown={(e) => onPointDown(e, p.id)}
                      >
                        <circle className={s.halo} cx={c.x} cy={c.y} r={9} />
                        <circle className={s.core} cx={c.x} cy={c.y} r={6} />
                        <text
                          x={c.x + (c.x < 200 ? -12 : 12)}
                          y={c.y + 4}
                          textAnchor={c.x < 200 ? "end" : "start"}
                        >
                          {p.name}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
              <p className={s.stageHint}>
                點擊圖上的紅點查看穴位資料；選取後變為綠點。可切換正面／背面，或使用上方搜尋與左側經絡篩選。
              </p>
              {calibrate && (
                <div
                  style={{
                    width: "100%",
                    maxWidth: 420,
                    marginTop: 10,
                    fontSize: 12,
                    lineHeight: 1.7,
                    background: "#fff",
                    border: "1px solid #d8cbb4",
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <strong>校準模式</strong>：拖曳紅點對準穴位（目前：
                  {side === "front" ? "正面" : "背面"}）。正面、背面都校準完後按
                  「匯出座標」，把方塊內的整段文字貼回給我。
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button type="button" onClick={doExport} style={calBtn}>
                      匯出座標
                    </button>
                    <button
                      type="button"
                      onClick={() => writeOverrides({})}
                      style={calBtn}
                    >
                      全部重設
                    </button>
                  </div>
                  {exportText && (
                    <textarea
                      readOnly
                      value={exportText}
                      onFocus={(e) => e.currentTarget.select()}
                      style={{
                        width: "100%",
                        height: 90,
                        marginTop: 8,
                        fontSize: 11,
                        fontFamily: "monospace",
                      }}
                    />
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
          ) : (
            <PointDetail selectedId={selectedId} />
          )}
        </aside>
      </div>
    </div>
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
