"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../../../../lib/supabase-admin";
import type { MenuCard, MenuItem } from "../../../../lib/supabase-public";

type Notice = {
  type: "ok" | "error";
  text: string;
};

type MenuVideoAsset = {
  name: string;
  path: string;
  url: string;
};

const menuItemVideosBucket = process.env.NEXT_PUBLIC_SUPABASE_MENU_ITEM_VIDEOS_BUCKET || "menu-item-videos";
const videoExtensionPattern = /\.(mp4|webm|mov)$/i;

const emptyMenuCard: MenuCard = {
  id: "",
  title: "",
  route_label: "",
  href: "",
  image_url: "",
  sort_order: 0,
  is_active: true,
};

function createEmptyMenuItem(menuCardId = ""): MenuItem {
  return {
    id: "",
    menu_card_id: menuCardId,
    title: "",
    description: "",
    video_url: "",
    sort_order: 0,
    is_active: true,
  };
}

function getReadableErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      message?: unknown;
      error?: unknown;
      error_description?: unknown;
      details?: unknown;
      hint?: unknown;
    };

    const messageCandidates = [
      maybeError.message,
      maybeError.error_description,
      maybeError.error,
      maybeError.details,
      maybeError.hint,
    ];

    for (const candidate of messageCandidates) {
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate;
      }
    }
  }

  return fallback;
}

function normalizeNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export default function MenuCardDetailAdminPage() {
  const params = useParams<{ cardId?: string | string[] }>();
  const cardId = useMemo(() => {
    const raw = params?.cardId;
    return Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";
  }, [params]);

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [isBooting, setIsBooting] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [menuCard, setMenuCard] = useState<MenuCard>(emptyMenuCard);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newMenuItem, setNewMenuItem] = useState<MenuItem>(createEmptyMenuItem(cardId));
  const [menuVideoAssets, setMenuVideoAssets] = useState<MenuVideoAsset[]>([]);
  const [isLoadingMenuVideoAssets, setIsLoadingMenuVideoAssets] = useState(false);
  const [uploadingMenuItemVideoTarget, setUploadingMenuItemVideoTarget] = useState<string | null>(null);

  const getMenuVideoPublicUrl = useCallback(
    (path: string) => {
      const { data } = supabase.storage.from(menuItemVideosBucket).getPublicUrl(path);
      return data.publicUrl;
    },
    [supabase],
  );

  const loadMenuVideoAssets = useCallback(async () => {
    setIsLoadingMenuVideoAssets(true);

    try {
      const { data, error } = await supabase.storage.from(menuItemVideosBucket).list("", {
        limit: 100,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });

      if (error) {
        throw error;
      }

      const assets = (data ?? [])
        .filter((entry) => videoExtensionPattern.test(entry.name))
        .map((entry) => ({
          name: entry.name,
          path: entry.name,
          url: getMenuVideoPublicUrl(entry.name),
        }));

      setMenuVideoAssets(assets);
    } catch (error) {
      setNotice({
        type: "error",
        text: getReadableErrorMessage(error, "No se pudieron cargar los videos de Supabase Storage."),
      });
    } finally {
      setIsLoadingMenuVideoAssets(false);
    }
  }, [getMenuVideoPublicUrl, supabase]);

  const loadData = useCallback(async () => {
    if (!cardId) {
      setNotice({ type: "error", text: "No se pudo identificar la categoria." });
      return;
    }

    setIsLoadingData(true);
    setNotice(null);

    try {
      const [cardResult, itemsResult] = await Promise.all([
        supabase.from("menu_cards").select("*").eq("id", cardId).limit(1),
        supabase.from("menu_items").select("*").eq("menu_card_id", cardId).order("sort_order", { ascending: true }),
      ]);

      if (cardResult.error) {
        throw cardResult.error;
      }
      if (itemsResult.error) {
        throw itemsResult.error;
      }

      const nextCard = (cardResult.data?.[0] as MenuCard | undefined) ?? emptyMenuCard;
      setMenuCard(nextCard);
      setMenuItems((itemsResult.data as MenuItem[] | null) ?? []);
      setNewMenuItem(createEmptyMenuItem(cardId));
      await loadMenuVideoAssets();
    } catch (error) {
      setNotice({
        type: "error",
        text: getReadableErrorMessage(error, "No se pudieron cargar los platos de la categoria."),
      });
    } finally {
      setIsLoadingData(false);
    }
  }, [cardId, loadMenuVideoAssets, supabase]);

  const validateAdmin = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase.from("admin_users").select("user_id, role").eq("user_id", userId).limit(1);

      if (error) {
        throw error;
      }

      const row = ((data?.[0] as { user_id: string; role: string } | undefined) ?? null);
      const hasAdminRole = row?.role === "admin";
      setIsAdmin(hasAdminRole);

      if (!hasAdminRole) {
        await supabase.auth.signOut();
        setNotice({ type: "error", text: "Este usuario no tiene rol admin en admin_users." });
        return;
      }

      await loadData();
    },
    [loadData, supabase],
  );

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }

        if (!mounted) {
          return;
        }

        const sessionUser = data.session?.user ?? null;
        setUser(sessionUser);
        if (sessionUser) {
          await validateAdmin(sessionUser.id);
        }
      } catch (error) {
        if (mounted) {
          setNotice({
            type: "error",
            text: error instanceof Error ? error.message : "No se pudo inicializar la sesion.",
          });
        }
      } finally {
        if (mounted) {
          setIsBooting(false);
        }
      }
    }

    const subscription = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (!sessionUser) {
        setIsAdmin(false);
      }
    });

    void bootstrap();

    return () => {
      mounted = false;
      subscription.data.subscription.unsubscribe();
    };
  }, [supabase, validateAdmin]);

  async function login() {
    setIsAuthBusy(true);
    setNotice(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      const sessionUser = data.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        await validateAdmin(sessionUser.id);
      }
    } catch (error) {
      setNotice({
        type: "error",
        text: getReadableErrorMessage(error, "No se pudo iniciar sesion."),
      });
    } finally {
      setIsAuthBusy(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setNotice({ type: "ok", text: "Sesion cerrada." });
  }

  function setMenuItemVideoUrl(itemId: string, videoUrl: string) {
    setMenuItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, video_url: videoUrl } : item)));
  }

  function setNewMenuItemVideoUrl(videoUrl: string) {
    setNewMenuItem((prev) => ({ ...prev, video_url: videoUrl }));
  }

  async function uploadMenuItemVideo(file: File, itemId?: string) {
    if (!file.type.startsWith("video/")) {
      setNotice({ type: "error", text: "Solo se permiten archivos de video." });
      return;
    }

    const targetKey = itemId ?? "new";
    setUploadingMenuItemVideoTarget(targetKey);

    try {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
      const filePath = `${file.lastModified}-${safeName}`;

      const { error } = await supabase.storage.from(menuItemVideosBucket).upload(filePath, file, {
        upsert: false,
        cacheControl: "3600",
      });

      if (error) {
        throw error;
      }

      const videoUrl = getMenuVideoPublicUrl(filePath);
      if (itemId) {
        setMenuItemVideoUrl(itemId, videoUrl);
      } else {
        setNewMenuItemVideoUrl(videoUrl);
      }

      setNotice({ type: "ok", text: "Video subido a Supabase Storage y URL aplicada." });
      await loadMenuVideoAssets();
    } catch (error) {
      setNotice({
        type: "error",
        text: getReadableErrorMessage(error, "No se pudo subir el video a Supabase Storage."),
      });
    } finally {
      setUploadingMenuItemVideoTarget(null);
    }
  }

  async function handleMenuItemVideoInputChange(event: ChangeEvent<HTMLInputElement>, itemId?: string) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    await uploadMenuItemVideo(file, itemId);
    event.target.value = "";
  }

  async function saveMenuItem(item: MenuItem) {
    try {
      if (!item.menu_card_id || !item.title || !item.description || !item.video_url) {
        throw new Error("Completa titulo, descripcion y video del plato.");
      }

      const payload = {
        menu_card_id: item.menu_card_id,
        title: item.title,
        description: item.description,
        video_url: item.video_url,
        sort_order: item.sort_order,
        is_active: item.is_active,
      };

      if (item.id) {
        const { error } = await supabase.from("menu_items").update(payload as never).eq("id", item.id);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from("menu_items").insert(payload as never);
        if (error) {
          throw error;
        }
        setNewMenuItem(createEmptyMenuItem(cardId));
      }

      await loadData();
      setNotice({ type: "ok", text: "Plato guardado." });
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo guardar el plato.",
      });
    }
  }

  async function deleteMenuItem(itemId: string) {
    try {
      const { error } = await supabase.from("menu_items").delete().eq("id", itemId);
      if (error) {
        throw error;
      }

      await loadData();
      setNotice({ type: "ok", text: "Plato eliminado." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "No se pudo eliminar el plato." });
    }
  }

  if (isBooting) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
        <p className="text-sm uppercase tracking-[0.12em] text-zinc-300">Inicializando admin...</p>
      </main>
    );
  }

  if (!user || !isAdmin) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,rgba(191,78,48,0.15)_0,transparent_30%),radial-gradient(circle_at_90%_0%,rgba(242,199,170,0.2)_0,transparent_24%),linear-gradient(180deg,#1a120f_0%,#0e0908_100%)] px-4 py-10 text-zinc-50">
        <section className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-black/30 p-6 shadow-[0_28px_70px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Admin Supabase</p>
          <h1 className="mt-3 text-3xl font-semibold">Acceso privado</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            Inicia sesion con un usuario de Supabase Auth que exista tambien en la tabla admin_users con role = admin.
          </p>

          <div className="mt-6 space-y-3">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2 text-sm text-zinc-100 outline-none ring-0 placeholder:text-zinc-500 focus:border-amber-300/50"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2 text-sm text-zinc-100 outline-none ring-0 placeholder:text-zinc-500 focus:border-amber-300/50"
            />
            <button
              type="button"
              onClick={() => void login()}
              disabled={isAuthBusy}
              className="inline-flex rounded-full border border-white/20 bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAuthBusy ? "Entrando..." : "Entrar"}
            </button>
          </div>

          {notice ? (
            <p className={`mt-4 text-sm ${notice.type === "ok" ? "text-emerald-300" : "text-red-300"}`}>{notice.text}</p>
          ) : null}

          <div className="mt-6 flex gap-3">
            <Link
              href="/admin"
              className="inline-flex rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Volver al panel
            </Link>
            <Link
              href="/"
              className="inline-flex rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Volver al sitio
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100">
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-zinc-900/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Platos por categoria</p>
              <h1 className="mt-1 text-2xl font-semibold">{menuCard.title || "Categoria"}</h1>
              <p className="mt-1 text-sm text-zinc-300">{menuCard.route_label}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void loadData()}
                disabled={isLoadingData}
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-60"
              >
                {isLoadingData ? "Actualizando..." : "Recargar"}
              </button>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-full border border-red-300/40 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/30"
              >
                Cerrar sesion
              </button>
            </div>
          </div>
          {notice ? (
            <p className={`mt-3 text-sm ${notice.type === "ok" ? "text-emerald-300" : "text-red-300"}`}>{notice.text}</p>
          ) : null}
        </header>

        <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Platos de esta categoria</h2>
              <p className="mt-1 text-sm text-zinc-400">Gestion exclusiva de esta card.</p>
            </div>
            <Link
              href="/admin"
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
            >
              Volver al panel
            </Link>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {menuItems.map((item) => (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    value={item.title}
                    onChange={(event) =>
                      setMenuItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, title: event.target.value } : row)))
                    }
                    placeholder="Titulo del plato"
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={item.sort_order}
                    onChange={(event) =>
                      setMenuItems((prev) =>
                        prev.map((row) => (row.id === item.id ? { ...row, sort_order: normalizeNumber(event.target.value, 0) } : row)),
                      )
                    }
                    placeholder="Orden"
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                  />
                  <textarea
                    value={item.description}
                    onChange={(event) =>
                      setMenuItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, description: event.target.value } : row)))
                    }
                    placeholder="Descripcion"
                    className="min-h-28 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm md:col-span-2"
                  />
                  <input
                    value={item.video_url}
                    onChange={(event) =>
                      setMenuItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, video_url: event.target.value } : row)))
                    }
                    placeholder="Video URL"
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm md:col-span-2"
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="rounded-full border border-amber-300/40 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-100">
                    {uploadingMenuItemVideoTarget === item.id ? "Subiendo..." : "Subir video vertical"}
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      className="hidden"
                      disabled={uploadingMenuItemVideoTarget === item.id}
                      onChange={(event) => {
                        void handleMenuItemVideoInputChange(event, item.id);
                      }}
                    />
                  </label>
                  {menuVideoAssets.length > 0 ? (
                    <select
                      value=""
                      onChange={(event) => {
                        if (!event.target.value) {
                          return;
                        }
                        setMenuItemVideoUrl(item.id, event.target.value);
                        event.target.value = "";
                      }}
                      className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-xs text-zinc-100"
                    >
                      <option value="">Usar video existente</option>
                      {menuVideoAssets.map((asset) => (
                        <option key={`${item.id}-${asset.path}`} value={asset.url}>
                          {asset.name}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={item.is_active}
                      onChange={(event) =>
                        setMenuItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, is_active: event.target.checked } : row)))
                      }
                    />
                    Activo
                  </label>
                </div>

                {item.video_url ? (
                  <video
                    src={item.video_url}
                    className="mt-3 h-56 w-32 rounded-xl border border-white/10 bg-black object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : null}

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void saveMenuItem(item)}
                    className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-1.5 text-xs font-semibold text-emerald-100"
                  >
                    Guardar plato
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteMenuItem(item.id)}
                    className="rounded-full border border-red-300/40 bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-100"
                  >
                    Eliminar plato
                  </button>
                </div>
              </article>
            ))}
          </div>

          <article className="mt-4 rounded-2xl border border-dashed border-white/20 bg-black/20 p-4">
            <p className="text-sm font-semibold text-zinc-200">Nuevo plato</p>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <input
                value={newMenuItem.title}
                onChange={(event) => setNewMenuItem((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Titulo del plato"
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={newMenuItem.sort_order}
                onChange={(event) => setNewMenuItem((prev) => ({ ...prev, sort_order: normalizeNumber(event.target.value, 0) }))}
                placeholder="Orden"
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
              />
              <textarea
                value={newMenuItem.description}
                onChange={(event) => setNewMenuItem((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Descripcion"
                className="min-h-28 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm md:col-span-2"
              />
              <input
                value={newMenuItem.video_url}
                onChange={(event) => setNewMenuItem((prev) => ({ ...prev, video_url: event.target.value }))}
                placeholder="Video URL"
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm md:col-span-2"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="rounded-full border border-amber-300/40 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-100">
                {uploadingMenuItemVideoTarget === "new" ? "Subiendo..." : "Subir video vertical"}
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  disabled={uploadingMenuItemVideoTarget === "new"}
                  onChange={(event) => {
                    void handleMenuItemVideoInputChange(event);
                  }}
                />
              </label>
              {menuVideoAssets.length > 0 ? (
                <select
                  value=""
                  onChange={(event) => {
                    if (!event.target.value) {
                      return;
                    }
                    setNewMenuItemVideoUrl(event.target.value);
                    event.target.value = "";
                  }}
                  className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-xs text-zinc-100"
                >
                  <option value="">Usar video existente</option>
                  {menuVideoAssets.map((asset) => (
                    <option key={asset.path} value={asset.url}>
                      {asset.name}
                    </option>
                  ))}
                </select>
              ) : null}
              <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={newMenuItem.is_active}
                  onChange={(event) => setNewMenuItem((prev) => ({ ...prev, is_active: event.target.checked }))}
                />
                Activo
              </label>
            </div>
            {newMenuItem.video_url ? (
              <video
                src={newMenuItem.video_url}
                className="mt-3 h-56 w-32 rounded-xl border border-white/10 bg-black object-cover"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
              />
            ) : null}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => void saveMenuItem({ ...newMenuItem, menu_card_id: cardId })}
                className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-1.5 text-xs font-semibold text-emerald-100"
              >
                Crear plato
              </button>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
