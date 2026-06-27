"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import RichTextEditor from "@/components/RichTextEditor";
import SafeHtml from "@/components/SafeHtml";
import {
  createWellness,
  deleteWellness,
  listWellness,
  retagWellness,
  splitTags,
  updateWellness,
  uploadPdf,
  WELLNESS_CATEGORIES,
  youtubeEmbed,
  type WellnessInput,
  type WellnessResource,
} from "@/lib/wellnessApi";

const emptyForm: WellnessInput = {
  title: "",
  summary: "",
  videoUrl: "",
  pdfUrl: "",
  category: "",
  source: "",
  tags: "",
};

export default function WellnessPage() {
  const { data: session, status } = useSession();
  const authed = status === "authenticated";

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "hychanga@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin =
    !!session?.user?.email && adminEmails.includes(session.user.email.toLowerCase());

  const [items, setItems] = useState<WellnessResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WellnessResource | null>(null);
  const [form, setForm] = useState<WellnessInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState("");

  async function onPickPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadPdf(file);
      setForm((f) => ({ ...f, pdfUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF 上傳失敗");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const load = useCallback(async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listWellness(query));
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    const t = setTimeout(() => load(search.trim() || undefined), 300);
    return () => clearTimeout(t);
  }, [search, load, authed]);

  const categories = useMemo(() => {
    const present = new Set(
      items.map((w) => w.category).filter((c): c is string => !!c)
    );
    // Show the standard taxonomy first, then any extra custom ones in the data.
    const ordered = WELLNESS_CATEGORIES.filter((c) => present.has(c));
    const extra = [...present].filter(
      (c) => !WELLNESS_CATEGORIES.includes(c as (typeof WELLNESS_CATEGORIES)[number])
    );
    return [...ordered, ...extra];
  }, [items]);

  const shown = useMemo(
    () =>
      items.filter(
        (w) =>
          (!activeTag || splitTags(w.tags).includes(activeTag)) &&
          (!activeCategory || w.category === activeCategory)
      ),
    [items, activeTag, activeCategory]
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setTagInput("");
    setShowForm(true);
  }
  function openEdit(w: WellnessResource) {
    setEditing(w);
    setForm({
      title: w.title,
      summary: w.summary ?? "",
      videoUrl: w.videoUrl ?? "",
      pdfUrl: w.pdfUrl ?? "",
      category: w.category ?? "",
      source: w.source ?? "",
      tags: w.tags ?? "",
    });
    setTagInput("");
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editing) await updateWellness(editing.id, form);
      else await createWellness(form);
      setShowForm(false);
      await load(search.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  async function remove(w: WellnessResource) {
    if (!confirm(`確定刪除「${w.title}」？`)) return;
    try {
      await deleteWellness(w.id);
      await load(search.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
    }
  }

  async function retag(w: WellnessResource) {
    try {
      await retagWellness(w.id);
      await load(search.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "重新產生標籤失敗");
    }
  }

  if (status === "loading") {
    return <main className="p-10 text-sm text-black/60 dark:text-white/60">載入中…</main>;
  }
  if (!authed) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 text-center">
        <h1 className="mb-3 text-2xl font-bold">🌿 養生知識庫</h1>
        <p className="mb-6 text-sm text-black/60 dark:text-white/60">請先登入以瀏覽養生資料。</p>
        <button
          onClick={() => signIn("google")}
          className="rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          以 Google 登入
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">🌿 養生知識庫</h1>
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋標題、概要、標籤⋯ 例如：補鈣 / 失眠"
          className="flex-1 rounded-full border px-4 py-2 text-sm outline-none focus:border-emerald-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
        />
        {isAdmin && (
          <button
            onClick={openCreate}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            ＋ 新增養生資料
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-full px-3 py-1 text-sm ${
              activeCategory === null
                ? "bg-emerald-600 text-white"
                : "border text-black/70 hover:border-emerald-500 dark:border-gray-600 dark:text-gray-300 dark:hover:border-emerald-500"
            }`}
          >
            全部
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(activeCategory === c ? null : c)}
              className={`rounded-full px-3 py-1 text-sm ${
                activeCategory === c
                  ? "bg-emerald-600 text-white"
                  : "border text-black/70 hover:border-emerald-500 dark:border-gray-600 dark:text-gray-300 dark:hover:border-emerald-500"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {activeTag && (
        <div className="mb-4 text-sm">
          篩選標籤：
          <span className="mx-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            {activeTag}
          </span>
          <button onClick={() => setActiveTag(null)} className="text-emerald-700 underline dark:text-emerald-400">
            清除
          </button>
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {showForm && (
        <form
          onSubmit={submit}
          className="mb-6 grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-800 dark:bg-emerald-950/30"
        >
          <div className="text-sm font-semibold">
            {editing ? "編輯養生資料" : "新增養生資料"}
          </div>
          <input
            required
            value={form.title ?? ""}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="標題 *（例如：「天然鈣片」的莧菜）"
            className="rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
          />
          <RichTextEditor
            key={editing?.id ?? "new"}
            value={form.summary ?? ""}
            onChange={(html) => setForm((f) => ({ ...f, summary: html }))}
            placeholder="概要（可設定字型、顏色、底色等格式）"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.videoUrl ?? ""}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              placeholder="影片連結（YouTube 等）"
              className="rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
            />
            <div className="flex flex-col gap-1">
              <input
                value={form.pdfUrl ?? ""}
                onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })}
                placeholder="PDF 連結（或用下方上傳）"
                className="rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
              />
              <label className="text-xs text-black/60 dark:text-white/50">
                {uploading ? (
                  <span className="text-emerald-700 dark:text-emerald-400">PDF 上傳中⋯</span>
                ) : (
                  <>
                    <span className="cursor-pointer text-emerald-700 underline dark:text-emerald-400">
                      上傳 PDF 檔
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={onPickPdf}
                      className="hidden"
                    />
                  </>
                )}
              </label>
            </div>
            <input
              list="wellness-categories"
              value={form.category ?? ""}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="分類（選擇或自行輸入）"
              className="rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
            />
            <datalist id="wellness-categories">
              {WELLNESS_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <input
              value={form.source ?? ""}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              placeholder="來源（例如：倪海廈中醫養生頻道）"
              className="rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
            />
          </div>
          {/* Tag chip editor */}
          {(() => {
            const tags = splitTags(form.tags ?? "");
            const removeTag = (i: number) =>
              setForm((f) => ({ ...f, tags: tags.filter((_, j) => j !== i).join(",") }));
            const commitTag = (raw: string) => {
              const t = raw.trim();
              if (!t || tags.includes(t)) return;
              setForm((f) => ({ ...f, tags: [...tags, t].join(",") }));
            };
            return (
              <div className="flex flex-wrap items-center gap-1.5 rounded border px-2 py-1.5 focus-within:border-emerald-500 dark:border-gray-600 dark:bg-gray-800">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(i)}
                      className="ml-0.5 leading-none text-emerald-600 hover:text-red-500 dark:text-emerald-400 dark:hover:text-red-400"
                      aria-label={`移除 ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      commitTag(tagInput);
                      setTagInput("");
                    } else if (e.key === "Backspace" && !tagInput && tags.length) {
                      removeTag(tags.length - 1);
                    }
                  }}
                  onBlur={() => {
                    if (tagInput.trim()) { commitTag(tagInput); setTagInput(""); }
                  }}
                  placeholder={tags.length ? "" : "輸入標籤後按 Enter 或逗號新增（留空由 AI 產生）"}
                  className="min-w-[8rem] flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
            );
          })()}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "儲存中⋯" : "儲存"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded border px-4 py-2 text-sm dark:border-gray-600 dark:text-gray-200"
            >
              取消
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-black/60 dark:text-white/60">載入中…</p>
      ) : shown.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">尚無養生資料。</p>
      ) : (
        <div className="grid gap-5">
          {shown.map((w) => {
            const embed = youtubeEmbed(w.videoUrl);
            return (
              <article key={w.id} className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex flex-wrap items-baseline gap-2">
                  {w.category && (
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {w.category}
                    </span>
                  )}
                  <h2 className="text-lg font-bold">{w.title}</h2>
                  {w.source && <span className="text-xs text-black/50 dark:text-white/40">· {w.source}</span>}
                  {isAdmin && (
                    <button
                      onClick={() => openEdit(w)}
                      className="ml-auto rounded-full border border-emerald-300 px-3 py-0.5 text-xs text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                    >
                      ✎ 編輯
                    </button>
                  )}
                </div>

                <div className="mt-3 grid gap-4 md:grid-cols-[1fr_auto]">
                  <div>
                    {w.summary && (
                      <SafeHtml
                        html={w.summary}
                        className="prose prose-sm max-w-none text-sm leading-relaxed text-black/80 dark:text-gray-200"
                      />
                    )}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {splitTags(w.tags).map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setActiveTag(tag)}
                          className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm">
                      {w.pdfUrl && (
                        <a
                          href={w.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 underline dark:text-emerald-400"
                        >
                          📄 開啟 PDF
                        </a>
                      )}
                      {w.videoUrl && !embed && (
                        <a
                          href={w.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 underline dark:text-emerald-400"
                        >
                          ▶ 觀看影片
                        </a>
                      )}
                    </div>
                  </div>
                  {embed && (
                    <iframe
                      className="aspect-video w-full rounded-lg md:w-72"
                      src={embed}
                      title={w.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>

                {isAdmin && (
                  <div className="mt-3 flex gap-3 border-t pt-2 text-xs text-black/50 dark:border-gray-700 dark:text-white/40">
                    <button onClick={() => openEdit(w)} className="hover:text-emerald-700 dark:hover:text-emerald-400">
                      編輯
                    </button>
                    <button onClick={() => retag(w)} className="hover:text-emerald-700 dark:hover:text-emerald-400">
                      AI 重新標籤
                    </button>
                    <button onClick={() => remove(w)} className="hover:text-red-600 dark:hover:text-red-400">
                      刪除
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
