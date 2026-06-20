"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import {
  createWellness,
  deleteWellness,
  listWellness,
  retagWellness,
  splitTags,
  updateWellness,
  uploadPdf,
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

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WellnessResource | null>(null);
  const [form, setForm] = useState<WellnessInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  const shown = useMemo(
    () =>
      activeTag
        ? items.filter((w) => splitTags(w.tags).includes(activeTag))
        : items,
    [items, activeTag]
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
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
    return <main className="p-10 text-sm text-black/60">載入中…</main>;
  }
  if (!authed) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 text-center">
        <h1 className="mb-3 text-2xl font-bold">🌿 養生知識庫</h1>
        <p className="mb-6 text-sm text-black/60">請先登入以瀏覽養生資料。</p>
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
          className="flex-1 rounded-full border px-4 py-2 text-sm outline-none focus:border-emerald-500"
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

      {activeTag && (
        <div className="mb-4 text-sm">
          篩選標籤：
          <span className="mx-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
            {activeTag}
          </span>
          <button onClick={() => setActiveTag(null)} className="text-emerald-700 underline">
            清除
          </button>
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {showForm && (
        <form
          onSubmit={submit}
          className="mb-6 grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4"
        >
          <div className="text-sm font-semibold">
            {editing ? "編輯養生資料" : "新增養生資料"}
          </div>
          <input
            required
            value={form.title ?? ""}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="標題 *（例如：「天然鈣片」的莧菜）"
            className="rounded border px-3 py-2 text-sm"
          />
          <textarea
            value={form.summary ?? ""}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            placeholder="概要"
            rows={4}
            className="rounded border px-3 py-2 text-sm"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.videoUrl ?? ""}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              placeholder="影片連結（YouTube 等）"
              className="rounded border px-3 py-2 text-sm"
            />
            <div className="flex flex-col gap-1">
              <input
                value={form.pdfUrl ?? ""}
                onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })}
                placeholder="PDF 連結（或用下方上傳）"
                className="rounded border px-3 py-2 text-sm"
              />
              <label className="text-xs text-black/60">
                {uploading ? (
                  <span className="text-emerald-700">PDF 上傳中⋯</span>
                ) : (
                  <>
                    <span className="cursor-pointer text-emerald-700 underline">
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
              value={form.category ?? ""}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="分類（例如：食療）"
              className="rounded border px-3 py-2 text-sm"
            />
            <input
              value={form.source ?? ""}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              placeholder="來源（例如：倪海廈中醫養生頻道）"
              className="rounded border px-3 py-2 text-sm"
            />
          </div>
          <input
            value={form.tags ?? ""}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="標籤（留空則由 AI 自動產生，逗號分隔）"
            className="rounded border px-3 py-2 text-sm"
          />
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
              className="rounded border px-4 py-2 text-sm"
            >
              取消
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-black/60">載入中…</p>
      ) : shown.length === 0 ? (
        <p className="text-sm text-black/60">尚無養生資料。</p>
      ) : (
        <div className="grid gap-5">
          {shown.map((w) => {
            const embed = youtubeEmbed(w.videoUrl);
            return (
              <article key={w.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-baseline gap-2">
                  {w.category && (
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                      {w.category}
                    </span>
                  )}
                  <h2 className="text-lg font-bold">{w.title}</h2>
                  {w.source && <span className="text-xs text-black/50">· {w.source}</span>}
                </div>

                <div className="mt-3 grid gap-4 md:grid-cols-[1fr_auto]">
                  <div>
                    {w.summary && (
                      <p className="text-sm leading-relaxed text-black/80">{w.summary}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {splitTags(w.tags).map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setActiveTag(tag)}
                          className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800 hover:bg-emerald-100"
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
                          className="text-emerald-700 underline"
                        >
                          📄 開啟 PDF
                        </a>
                      )}
                      {w.videoUrl && !embed && (
                        <a
                          href={w.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 underline"
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
                  <div className="mt-3 flex gap-3 border-t pt-2 text-xs text-black/50">
                    <button onClick={() => openEdit(w)} className="hover:text-emerald-700">
                      編輯
                    </button>
                    <button onClick={() => retag(w)} className="hover:text-emerald-700">
                      AI 重新標籤
                    </button>
                    <button onClick={() => remove(w)} className="hover:text-red-600">
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
