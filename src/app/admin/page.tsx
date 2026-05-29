"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../../lib/supabase-admin";
import type { BusinessHour, MenuCard, SiteSettings, Testimonial } from "../../lib/supabase-public";

type AdminRow = {
  user_id: string;
  role: string;
};

type Notice = {
  type: "ok" | "error";
  text: string;
};

type MenuImageAsset = {
  name: string;
  path: string;
  url: string;
};

type I18nLangCode = "es" | "us" | "gb" | "fr" | "it";

type MenuCardI18nForm = {
  title: string;
  route_label: string;
};

type TestimonialI18nForm = {
  quote: string;
  author: string;
};

type MenuCardTranslationsModalState = {
  cardId: string;
  cardTitle: string;
};

type TestimonialTranslationsModalState = {
  testimonialId: string;
  testimonialAuthor: string;
};

type MenuCardI18nByLang = Record<I18nLangCode, MenuCardI18nForm>;
type TestimonialI18nByLang = Record<I18nLangCode, TestimonialI18nForm>;

type ImagePickerTarget =
  | {
      kind: "existing-card";
      cardId: string;
    }
  | {
      kind: "new-card";
    }
  | {
      kind: "site-logo";
    };

const menuImagesBucket = process.env.NEXT_PUBLIC_SUPABASE_MENU_IMAGES_BUCKET || "menu-images";
const imageExtensionPattern = /\.(avif|webp|png|jpe?g|gif|svg)$/i;
const i18nLanguageOptions: Array<{ code: I18nLangCode; label: string }> = [
  { code: "es", label: "ES" },
  { code: "us", label: "US" },
  { code: "gb", label: "GB" },
  { code: "fr", label: "FR" },
  { code: "it", label: "IT" },
];

function createEmptyMenuCardI18nByLang(): MenuCardI18nByLang {
  return {
    es: { title: "", route_label: "" },
    us: { title: "", route_label: "" },
    gb: { title: "", route_label: "" },
    fr: { title: "", route_label: "" },
    it: { title: "", route_label: "" },
  };
}

function createEmptyTestimonialI18nByLang(): TestimonialI18nByLang {
  return {
    es: { quote: "", author: "" },
    us: { quote: "", author: "" },
    gb: { quote: "", author: "" },
    fr: { quote: "", author: "" },
    it: { quote: "", author: "" },
  };
}

const emptySiteSettings: SiteSettings = {
  id: "",
  business_name: "",
  logo_url: "",
  address_line_1: "",
  address_line_2: "",
  phone: "",
  maps_link: "",
  maps_embed_url: "",
};

const emptyMenuCard: MenuCard = {
  id: "",
  title: "",
  route_label: "",
  href: "",
  image_url: "",
  sort_order: 0,
  is_active: true,
};

const emptyTestimonial: Testimonial = {
  id: "",
  quote: "",
  author: "",
  rating: 5,
  sort_order: 0,
  is_active: true,
};

const emptyBusinessHour: BusinessHour = {
  id: "",
  day_label: "",
  hours_text: "",
  sort_order: 0,
  is_active: true,
};

function normalizeNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
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

export default function AdminPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [isBooting, setIsBooting] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthBusy, setIsAuthBusy] = useState(false);

  const [siteSettings, setSiteSettings] = useState<SiteSettings>(emptySiteSettings);
  const [menuCards, setMenuCards] = useState<MenuCard[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);

  const [newMenuCard, setNewMenuCard] = useState<MenuCard>(emptyMenuCard);
  const [newTestimonial, setNewTestimonial] = useState<Testimonial>(emptyTestimonial);
  const [newBusinessHour, setNewBusinessHour] = useState<BusinessHour>(emptyBusinessHour);

  const [menuImageAssets, setMenuImageAssets] = useState<MenuImageAsset[]>([]);
  const [imagePickerTarget, setImagePickerTarget] = useState<ImagePickerTarget | null>(null);
  const [imagePickerSelection, setImagePickerSelection] = useState("");
  const [isLoadingMenuImageAssets, setIsLoadingMenuImageAssets] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  const [menuCardTranslationsModal, setMenuCardTranslationsModal] = useState<MenuCardTranslationsModalState | null>(null);
  const [menuCardTranslationsDraft, setMenuCardTranslationsDraft] = useState<MenuCardI18nByLang>(createEmptyMenuCardI18nByLang());
  const [isLoadingMenuCardTranslations, setIsLoadingMenuCardTranslations] = useState(false);
  const [isSavingMenuCardTranslations, setIsSavingMenuCardTranslations] = useState(false);
  const [testimonialTranslationsModal, setTestimonialTranslationsModal] = useState<TestimonialTranslationsModalState | null>(null);
  const [testimonialTranslationsDraft, setTestimonialTranslationsDraft] = useState<TestimonialI18nByLang>(
    createEmptyTestimonialI18nByLang(),
  );
  const [isLoadingTestimonialTranslations, setIsLoadingTestimonialTranslations] = useState(false);
  const [isSavingTestimonialTranslations, setIsSavingTestimonialTranslations] = useState(false);

  const getMenuImagePublicUrl = useCallback(
    (path: string) => {
      const { data } = supabase.storage.from(menuImagesBucket).getPublicUrl(path);
      return data.publicUrl;
    },
    [supabase],
  );

  const loadMenuImageAssets = useCallback(async () => {
    setIsLoadingMenuImageAssets(true);

    try {
      const { data, error } = await supabase.storage.from(menuImagesBucket).list("", {
        limit: 100,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });

      if (error) {
        throw error;
      }

      const assets = (data ?? [])
        .filter((entry) => imageExtensionPattern.test(entry.name))
        .map((entry) => ({
          name: entry.name,
          path: entry.name,
          url: getMenuImagePublicUrl(entry.name),
        }));

      setMenuImageAssets(assets);
    } catch (error) {
      setNotice({
        type: "error",
        text: getReadableErrorMessage(
          error,
          "No se pudieron cargar las imagenes de Supabase Storage. Revisa bucket y policies.",
        ),
      });
    } finally {
      setIsLoadingMenuImageAssets(false);
    }
  }, [getMenuImagePublicUrl, supabase]);

  function setCardImageUrl(cardId: string, imageUrl: string) {
    setMenuCards((prev) => prev.map((item) => (item.id === cardId ? { ...item, image_url: imageUrl } : item)));
  }

  function setNewCardImageUrl(imageUrl: string) {
    setNewMenuCard((prev) => ({ ...prev, image_url: imageUrl }));
  }

  function getTargetKey(target: ImagePickerTarget) {
    return target.kind === "existing-card" ? target.cardId : "new-card";
  }

  function getTargetCurrentImageUrl(target: ImagePickerTarget) {
    if (target.kind === "existing-card") {
      const card = menuCards.find((item) => item.id === target.cardId);
      return card?.image_url ?? "";
    }

    if (target.kind === "site-logo") {
      return siteSettings.logo_url ?? "";
    }

    return newMenuCard.image_url;
  }

  function applyImageUrlToTarget(target: ImagePickerTarget, imageUrl: string) {
    if (target.kind === "existing-card") {
      setCardImageUrl(target.cardId, imageUrl);
      return;
    }

    if (target.kind === "site-logo") {
      setSiteSettings((prev) => ({ ...prev, logo_url: imageUrl }));
      return;
    }

    setNewCardImageUrl(imageUrl);
  }

  async function openImagePicker(target: ImagePickerTarget) {
    setImagePickerTarget(target);
    setImagePickerSelection(getTargetCurrentImageUrl(target));

    if (menuImageAssets.length === 0) {
      await loadMenuImageAssets();
    }
  }

  function closeImagePicker() {
    setImagePickerTarget(null);
    setImagePickerSelection("");
  }

  function applySelectedImageFromPicker() {
    if (!imagePickerTarget || !imagePickerSelection) {
      return;
    }

    applyImageUrlToTarget(imagePickerTarget, imagePickerSelection);
    closeImagePicker();
  }

  async function uploadMenuImage(file: File, target: ImagePickerTarget) {
    if (!file.type.startsWith("image/")) {
      setNotice({ type: "error", text: "Solo se permiten archivos de imagen." });
      return;
    }

    setUploadingTarget(getTargetKey(target));

    try {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
      const filePath = `${Date.now()}-${safeName}`;

      const { error } = await supabase.storage.from(menuImagesBucket).upload(filePath, file, {
        upsert: false,
        cacheControl: "3600",
      });

      if (error) {
        throw error;
      }

      const imageUrl = getMenuImagePublicUrl(filePath);
      applyImageUrlToTarget(target, imageUrl);
      setImagePickerSelection(imageUrl);

      setNotice({ type: "ok", text: "Imagen subida a Supabase Storage y URL aplicada." });
      await loadMenuImageAssets();
    } catch (error) {
      setNotice({
        type: "error",
        text: getReadableErrorMessage(error, "No se pudo subir la imagen a Supabase Storage."),
      });
    } finally {
      setUploadingTarget(null);
    }
  }

  async function handleMenuImageInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (!imagePickerTarget) {
      return;
    }

    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    await uploadMenuImage(file, imagePickerTarget);
    event.target.value = "";
  }

  async function openMenuCardTranslationsModal(card: MenuCard) {
    setMenuCardTranslationsModal({ cardId: card.id, cardTitle: card.title });
    setMenuCardTranslationsDraft(createEmptyMenuCardI18nByLang());
    setIsLoadingMenuCardTranslations(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const menuCardsI18nTable = supabase.from("menu_cards_i18n") as any;
      const { data, error } = await menuCardsI18nTable.select("*").eq("menu_card_id", card.id);

      if (error) {
        throw error;
      }

      const nextDraft = createEmptyMenuCardI18nByLang();

      ((data as Array<{ lang_code: I18nLangCode; title: string | null; route_label: string | null }> | null) ?? []).forEach((row) => {
        if (!nextDraft[row.lang_code]) {
          return;
        }

        nextDraft[row.lang_code] = {
          title: row.title ?? "",
          route_label: row.route_label ?? "",
        };
      });

      setMenuCardTranslationsDraft(nextDraft);
    } catch (error) {
      setNotice({
        type: "error",
        text: getReadableErrorMessage(error, "No se pudieron cargar las traducciones de la tarjeta."),
      });
    } finally {
      setIsLoadingMenuCardTranslations(false);
    }
  }

  function closeMenuCardTranslationsModal() {
    setMenuCardTranslationsModal(null);
    setMenuCardTranslationsDraft(createEmptyMenuCardI18nByLang());
  }

  async function saveMenuCardTranslationsModal() {
    if (!menuCardTranslationsModal) {
      return;
    }

    setIsSavingMenuCardTranslations(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const menuCardsI18nTable = supabase.from("menu_cards_i18n") as any;

      const payload = i18nLanguageOptions.map((option) => ({
        menu_card_id: menuCardTranslationsModal.cardId,
        lang_code: option.code,
        title: menuCardTranslationsDraft[option.code].title || null,
        route_label: menuCardTranslationsDraft[option.code].route_label || null,
      }));

      const { error } = await menuCardsI18nTable.upsert(payload, {
        onConflict: "menu_card_id,lang_code",
      });

      if (error) {
        throw error;
      }

      setNotice({ type: "ok", text: "Traducciones de la tarjeta guardadas para todos los idiomas." });
      closeMenuCardTranslationsModal();
    } catch (error) {
      setNotice({
        type: "error",
        text: getReadableErrorMessage(error, "No se pudieron guardar las traducciones de la tarjeta."),
      });
    } finally {
      setIsSavingMenuCardTranslations(false);
    }
  }

  async function openTestimonialTranslationsModal(item: Testimonial) {
    setTestimonialTranslationsModal({ testimonialId: item.id, testimonialAuthor: item.author });
    setTestimonialTranslationsDraft(createEmptyTestimonialI18nByLang());
    setIsLoadingTestimonialTranslations(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testimonialsI18nTable = supabase.from("testimonials_i18n") as any;
      const { data, error } = await testimonialsI18nTable.select("*").eq("testimonial_id", item.id);

      if (error) {
        throw error;
      }

      const nextDraft = createEmptyTestimonialI18nByLang();

      ((data as Array<{ lang_code: I18nLangCode; quote: string | null; author: string | null }> | null) ?? []).forEach((row) => {
        if (!nextDraft[row.lang_code]) {
          return;
        }

        nextDraft[row.lang_code] = {
          quote: row.quote ?? "",
          author: row.author ?? "",
        };
      });

      setTestimonialTranslationsDraft(nextDraft);
    } catch (error) {
      setNotice({
        type: "error",
        text: getReadableErrorMessage(error, "No se pudieron cargar las traducciones del testimonio."),
      });
    } finally {
      setIsLoadingTestimonialTranslations(false);
    }
  }

  function closeTestimonialTranslationsModal() {
    setTestimonialTranslationsModal(null);
    setTestimonialTranslationsDraft(createEmptyTestimonialI18nByLang());
  }

  async function saveTestimonialTranslationsModal() {
    if (!testimonialTranslationsModal) {
      return;
    }

    setIsSavingTestimonialTranslations(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testimonialsI18nTable = supabase.from("testimonials_i18n") as any;

      const payload = i18nLanguageOptions.map((option) => ({
        testimonial_id: testimonialTranslationsModal.testimonialId,
        lang_code: option.code,
        quote: testimonialTranslationsDraft[option.code].quote || null,
        author: testimonialTranslationsDraft[option.code].author || null,
      }));

      const { error } = await testimonialsI18nTable.upsert(payload, {
        onConflict: "testimonial_id,lang_code",
      });

      if (error) {
        throw error;
      }

      setNotice({ type: "ok", text: "Traducciones del testimonio guardadas para todos los idiomas." });
      closeTestimonialTranslationsModal();
    } catch (error) {
      setNotice({
        type: "error",
        text: getReadableErrorMessage(error, "No se pudieron guardar las traducciones del testimonio."),
      });
    } finally {
      setIsSavingTestimonialTranslations(false);
    }
  }

  const refreshAll = useCallback(async () => {
    setIsLoadingData(true);
    setNotice(null);

    try {
      const [settingsResult, menuResult, testimonialsResult, hoursResult] = await Promise.all([
        supabase.from("site_settings").select("*").limit(1),
        supabase.from("menu_cards").select("*").order("sort_order", { ascending: true }),
        supabase.from("testimonials").select("*").order("sort_order", { ascending: true }),
        supabase.from("business_hours").select("*").order("sort_order", { ascending: true }),
      ]);

      if (settingsResult.error) {
        throw settingsResult.error;
      }
      if (menuResult.error) {
        throw menuResult.error;
      }
      if (testimonialsResult.error) {
        throw testimonialsResult.error;
      }
      if (hoursResult.error) {
        throw hoursResult.error;
      }

      setSiteSettings((settingsResult.data?.[0] as SiteSettings | undefined) ?? emptySiteSettings);
      setMenuCards((menuResult.data as MenuCard[] | null) ?? []);
      setTestimonials((testimonialsResult.data as Testimonial[] | null) ?? []);
      setBusinessHours((hoursResult.data as BusinessHour[] | null) ?? []);
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudieron cargar los datos de admin.",
      });
    } finally {
      setIsLoadingData(false);
    }
  }, [supabase]);

  const validateAdmin = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase.from("admin_users").select("user_id, role").eq("user_id", userId).limit(1);

      if (error) {
        throw error;
      }

      const row = (data?.[0] as AdminRow | undefined) ?? null;
      const hasAdminRole = row?.role === "admin";
      setIsAdmin(hasAdminRole);

      if (!hasAdminRole) {
        await supabase.auth.signOut();
        setNotice({
          type: "error",
          text: "Este usuario no tiene rol admin en admin_users.",
        });
        return;
      }

      await refreshAll();
      await loadMenuImageAssets();
    },
    [loadMenuImageAssets, refreshAll, supabase],
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

  useEffect(() => {
    if (!imagePickerTarget) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeImagePicker();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [imagePickerTarget]);

  async function login() {
    setIsAuthBusy(true);
    setNotice(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      const sessionUser = data.user;
      if (!sessionUser) {
        throw new Error("No se pudo obtener la sesion de usuario.");
      }

      setUser(sessionUser);
      await validateAdmin(sessionUser.id);
      setNotice({ type: "ok", text: "Sesion iniciada." });
      setPassword("");
    } catch (error) {
      const message = getReadableErrorMessage(error, "No se pudo iniciar sesion.");
      const normalizedMessage = message.toLowerCase();

      const friendlyMessage =
        normalizedMessage.includes("invalid login credentials") || normalizedMessage.includes("invalid credentials")
          ? "Credenciales invalidas. Usa el email y password de un usuario de Supabase Auth (no ADMIN_USERNAME)."
          : normalizedMessage.includes("infinite recursion") ||
              normalizedMessage.includes("stack depth") ||
              normalizedMessage.includes("admin_users")
            ? "El login de Supabase funciona, pero hay un error de politicas RLS en admin_users. Ejecuta sql/004_fix_admin_users_rls_recursion.sql en Supabase SQL Editor y vuelve a intentar."
          : message;

      setNotice({
        type: "error",
        text: friendlyMessage,
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

  async function saveSiteSettings() {
    setNotice(null);

    try {
      if (!siteSettings.business_name || !siteSettings.address_line_1 || !siteSettings.phone) {
        throw new Error("Completa negocio, direccion y telefono.");
      }

      const payload = {
        business_name: siteSettings.business_name,
        logo_url: siteSettings.logo_url || null,
        address_line_1: siteSettings.address_line_1,
        address_line_2: siteSettings.address_line_2 || null,
        phone: siteSettings.phone,
        maps_link: siteSettings.maps_link || null,
        maps_embed_url: siteSettings.maps_embed_url || null,
      };

      if (siteSettings.id) {
        const { error } = await supabase.from("site_settings").update(payload as never).eq("id", siteSettings.id);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from("site_settings").insert(payload as never);
        if (error) {
          throw error;
        }
      }

      await refreshAll();
      setNotice({ type: "ok", text: "Site settings guardado." });
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo guardar site settings.",
      });
    }
  }

  async function saveMenuCard(card: MenuCard) {
    try {
      if (!card.title || !card.route_label || !card.href || !card.image_url) {
        throw new Error("Completa todos los campos requeridos en la tarjeta.");
      }

      const payload = {
        title: card.title,
        route_label: card.route_label,
        href: card.href,
        image_url: card.image_url,
        sort_order: card.sort_order,
        is_active: card.is_active,
      };

      if (card.id) {
        const { error } = await supabase.from("menu_cards").update(payload as never).eq("id", card.id);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from("menu_cards").insert(payload as never);
        if (error) {
          throw error;
        }
        setNewMenuCard(emptyMenuCard);
      }

      await refreshAll();
      setNotice({ type: "ok", text: "Tarjeta guardada." });
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo guardar la tarjeta.",
      });
    }
  }

  async function deleteMenuCard(id: string) {
    try {
      const { error } = await supabase.from("menu_cards").delete().eq("id", id);
      if (error) {
        throw error;
      }
      await refreshAll();
      setNotice({ type: "ok", text: "Tarjeta eliminada." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "No se pudo eliminar la tarjeta." });
    }
  }

  async function saveTestimonial(item: Testimonial) {
    try {
      if (!item.quote || !item.author) {
        throw new Error("Completa texto y autor del testimonio.");
      }

      const payload = {
        quote: item.quote,
        author: item.author,
        rating: item.rating,
        sort_order: item.sort_order,
        is_active: item.is_active,
      };

      if (item.id) {
        const { error } = await supabase.from("testimonials").update(payload as never).eq("id", item.id);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from("testimonials").insert(payload as never);
        if (error) {
          throw error;
        }
        setNewTestimonial(emptyTestimonial);
      }

      await refreshAll();
      setNotice({ type: "ok", text: "Testimonio guardado." });
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo guardar el testimonio.",
      });
    }
  }

  async function deleteTestimonial(id: string) {
    try {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) {
        throw error;
      }
      await refreshAll();
      setNotice({ type: "ok", text: "Testimonio eliminado." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "No se pudo eliminar el testimonio." });
    }
  }

  async function saveBusinessHour(item: BusinessHour) {
    try {
      if (!item.day_label || !item.hours_text) {
        throw new Error("Completa dia y horario.");
      }

      const payload = {
        day_label: item.day_label,
        hours_text: item.hours_text,
        sort_order: item.sort_order,
        is_active: item.is_active,
      };

      if (item.id) {
        const { error } = await supabase.from("business_hours").update(payload as never).eq("id", item.id);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from("business_hours").insert(payload as never);
        if (error) {
          throw error;
        }
        setNewBusinessHour(emptyBusinessHour);
      }

      await refreshAll();
      setNotice({ type: "ok", text: "Horario guardado." });
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo guardar el horario.",
      });
    }
  }

  async function deleteBusinessHour(id: string) {
    try {
      const { error } = await supabase.from("business_hours").delete().eq("id", id);
      if (error) {
        throw error;
      }
      await refreshAll();
      setNotice({ type: "ok", text: "Horario eliminado." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "No se pudo eliminar el horario." });
    }
  }

  const pickerTargetLabel =
    imagePickerTarget?.kind === "existing-card"
      ? "tarjeta"
      : imagePickerTarget?.kind === "site-logo"
        ? "logo del sitio"
        : "nueva tarjeta";
  const isUploadingForPicker = imagePickerTarget ? uploadingTarget === getTargetKey(imagePickerTarget) : false;

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

          <div className="mt-6">
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
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Panel Admin</p>
              <h1 className="mt-1 text-2xl font-semibold">Gestion de contenido</h1>
              <p className="mt-1 text-sm text-zinc-300">{user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void refreshAll()}
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
          <h2 className="text-lg font-semibold">Site Settings</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              value={siteSettings.business_name}
              onChange={(event) => setSiteSettings((prev) => ({ ...prev, business_name: event.target.value }))}
              placeholder="Nombre negocio"
              className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm"
            />
            <input
              value={siteSettings.logo_url ?? ""}
              onChange={(event) => setSiteSettings((prev) => ({ ...prev, logo_url: event.target.value }))}
              placeholder="Logo URL"
              className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm"
            />
            <input
              value={siteSettings.phone}
              onChange={(event) => setSiteSettings((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="Telefono"
              className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm"
            />
            <input
              value={siteSettings.address_line_1}
              onChange={(event) => setSiteSettings((prev) => ({ ...prev, address_line_1: event.target.value }))}
              placeholder="Direccion linea 1"
              className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm"
            />
            <input
              value={siteSettings.address_line_2 ?? ""}
              onChange={(event) => setSiteSettings((prev) => ({ ...prev, address_line_2: event.target.value }))}
              placeholder="Direccion linea 2"
              className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm"
            />
            <input
              value={siteSettings.maps_link ?? ""}
              onChange={(event) => setSiteSettings((prev) => ({ ...prev, maps_link: event.target.value }))}
              placeholder="Enlace Google Maps"
              className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm"
            />
            <input
              value={siteSettings.maps_embed_url ?? ""}
              onChange={(event) => setSiteSettings((prev) => ({ ...prev, maps_embed_url: event.target.value }))}
              placeholder="URL embed Google Maps"
              className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs text-zinc-400">Logo desde Supabase Storage</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  void openImagePicker({ kind: "site-logo" });
                }}
                className="rounded-full border border-amber-300/40 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-100"
              >
                Seleccionar/subir logo
              </button>
            </div>
            {siteSettings.logo_url ? (
              <img
                src={siteSettings.logo_url}
                alt="Logo del sitio"
                className="mt-3 h-16 w-auto rounded-lg object-contain"
                loading="lazy"
              />
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => void saveSiteSettings()}
            className="mt-4 rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
          >
            Guardar Site Settings
          </button>
        </section>

        <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Menu Cards</h2>
            <button
              type="button"
              onClick={() => void loadMenuImageAssets()}
              disabled={isLoadingMenuImageAssets}
              className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-zinc-100 transition hover:bg-white/10 disabled:opacity-60"
            >
              {isLoadingMenuImageAssets ? "Cargando imagenes..." : "Recargar imagenes Storage"}
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {menuCards.map((card) => (
              <article key={card.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="grid gap-2 md:grid-cols-3">
                  <input
                    value={card.title}
                    onChange={(event) =>
                      setMenuCards((prev) => prev.map((item) => (item.id === card.id ? { ...item, title: event.target.value } : item)))
                    }
                    placeholder="Titulo"
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                  />
                  <input
                    value={card.route_label}
                    onChange={(event) =>
                      setMenuCards((prev) => prev.map((item) => (item.id === card.id ? { ...item, route_label: event.target.value } : item)))
                    }
                    placeholder="Route label"
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                  />
                  <input
                    value={card.href}
                    onChange={(event) =>
                      setMenuCards((prev) => prev.map((item) => (item.id === card.id ? { ...item, href: event.target.value } : item)))
                    }
                    placeholder="Href"
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                  />
                  <input
                    value={card.image_url}
                    onChange={(event) =>
                      setMenuCards((prev) => prev.map((item) => (item.id === card.id ? { ...item, image_url: event.target.value } : item)))
                    }
                    placeholder="Image URL"
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm md:col-span-2"
                  />
                  <input
                    type="number"
                    value={card.sort_order}
                    onChange={(event) =>
                      setMenuCards((prev) =>
                        prev.map((item) =>
                          item.id === card.id ? { ...item, sort_order: normalizeNumber(event.target.value, 0) } : item,
                        ),
                      )
                    }
                    placeholder="Orden"
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                  />

                  <div className="rounded-lg border border-white/10 bg-black/20 p-2 md:col-span-3">
                    <p className="text-xs text-zinc-400">Supabase Storage</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          void openImagePicker({ kind: "existing-card", cardId: card.id });
                        }}
                        className="rounded-full border border-amber-300/40 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-100"
                      >
                        Seleccionar imagen
                      </button>
                    </div>
                  </div>
                </div>
                {card.image_url ? (
                  <img src={card.image_url} alt={card.title} className="mt-2 h-24 w-40 rounded-lg object-cover" loading="lazy" />
                ) : null}
                <label className="mt-2 inline-flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={card.is_active}
                    onChange={(event) =>
                      setMenuCards((prev) => prev.map((item) => (item.id === card.id ? { ...item, is_active: event.target.checked } : item)))
                    }
                  />
                  Activa
                </label>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void saveMenuCard(card)}
                    className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-1.5 text-xs font-semibold text-emerald-100"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => void openMenuCardTranslationsModal(card)}
                    className="rounded-full border border-cyan-300/40 bg-cyan-500/20 px-4 py-1.5 text-xs font-semibold text-cyan-100"
                  >
                    Traducciones
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteMenuCard(card.id)}
                    className="rounded-full border border-red-300/40 bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-100"
                  >
                    Eliminar
                  </button>
                  <Link
                    href={`/admin/menu-cards/${card.id}`}
                    className="rounded-full border border-cyan-300/40 bg-cyan-500/20 px-4 py-1.5 text-xs font-semibold text-cyan-100"
                  >
                    Gestionar platos
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <article className="mt-4 rounded-2xl border border-dashed border-white/20 bg-black/20 p-3">
            <p className="text-sm font-semibold text-zinc-200">Nueva tarjeta</p>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              <input
                value={newMenuCard.title}
                onChange={(event) => setNewMenuCard((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Titulo"
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
              />
              <input
                value={newMenuCard.route_label}
                onChange={(event) => setNewMenuCard((prev) => ({ ...prev, route_label: event.target.value }))}
                placeholder="Route label"
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
              />
              <input
                value={newMenuCard.href}
                onChange={(event) => setNewMenuCard((prev) => ({ ...prev, href: event.target.value }))}
                placeholder="Href"
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
              />
              <input
                value={newMenuCard.image_url}
                onChange={(event) => setNewMenuCard((prev) => ({ ...prev, image_url: event.target.value }))}
                placeholder="Image URL"
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm md:col-span-2"
              />
              <input
                type="number"
                value={newMenuCard.sort_order}
                onChange={(event) => setNewMenuCard((prev) => ({ ...prev, sort_order: normalizeNumber(event.target.value, 0) }))}
                placeholder="Orden"
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
              />

              <div className="rounded-lg border border-white/10 bg-black/20 p-2 md:col-span-3">
                <p className="text-xs text-zinc-400">Supabase Storage</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void openImagePicker({ kind: "new-card" });
                    }}
                    className="rounded-full border border-amber-300/40 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-100"
                  >
                    Seleccionar imagen
                  </button>
                </div>
              </div>
            </div>
            {newMenuCard.image_url ? (
              <img
                src={newMenuCard.image_url}
                alt={newMenuCard.title || "Nueva tarjeta"}
                className="mt-2 h-24 w-40 rounded-lg object-cover"
                loading="lazy"
              />
            ) : null}
            <label className="mt-2 inline-flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={newMenuCard.is_active}
                onChange={(event) => setNewMenuCard((prev) => ({ ...prev, is_active: event.target.checked }))}
              />
              Activa
            </label>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => void saveMenuCard(newMenuCard)}
                className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-1.5 text-xs font-semibold text-emerald-100"
              >
                Crear tarjeta
              </button>
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5">
          <h2 className="text-lg font-semibold">Testimonials</h2>
          <div className="mt-4 space-y-3">
            {testimonials.map((item) => (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="grid gap-2 md:grid-cols-3">
                  <input
                    value={item.author}
                    onChange={(event) =>
                      setTestimonials((prev) => prev.map((row) => (row.id === item.id ? { ...row, author: event.target.value } : row)))
                    }
                    placeholder="Autor"
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={item.rating}
                    onChange={(event) =>
                      setTestimonials((prev) =>
                        prev.map((row) =>
                          row.id === item.id ? { ...row, rating: Math.max(1, Math.min(5, normalizeNumber(event.target.value, 5))) } : row,
                        ),
                      )
                    }
                    placeholder="Rating"
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={item.sort_order}
                    onChange={(event) =>
                      setTestimonials((prev) =>
                        prev.map((row) =>
                          row.id === item.id ? { ...row, sort_order: normalizeNumber(event.target.value, 0) } : row,
                        ),
                      )
                    }
                    placeholder="Orden"
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                  />
                  <textarea
                    value={item.quote}
                    onChange={(event) =>
                      setTestimonials((prev) => prev.map((row) => (row.id === item.id ? { ...row, quote: event.target.value } : row)))
                    }
                    placeholder="Testimonio"
                    className="min-h-24 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm md:col-span-3"
                  />
                </div>
                <label className="mt-2 inline-flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={item.is_active}
                    onChange={(event) =>
                      setTestimonials((prev) =>
                        prev.map((row) => (row.id === item.id ? { ...row, is_active: event.target.checked } : row)),
                      )
                    }
                  />
                  Activo
                </label>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void saveTestimonial(item)}
                    className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-1.5 text-xs font-semibold text-emerald-100"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => void openTestimonialTranslationsModal(item)}
                    className="rounded-full border border-cyan-300/40 bg-cyan-500/20 px-4 py-1.5 text-xs font-semibold text-cyan-100"
                  >
                    Traducciones
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteTestimonial(item.id)}
                    className="rounded-full border border-red-300/40 bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-100"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>

          <article className="mt-4 rounded-2xl border border-dashed border-white/20 bg-black/20 p-3">
            <p className="text-sm font-semibold text-zinc-200">Nuevo testimonio</p>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              <input
                value={newTestimonial.author}
                onChange={(event) => setNewTestimonial((prev) => ({ ...prev, author: event.target.value }))}
                placeholder="Autor"
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={1}
                max={5}
                value={newTestimonial.rating}
                onChange={(event) =>
                  setNewTestimonial((prev) => ({
                    ...prev,
                    rating: Math.max(1, Math.min(5, normalizeNumber(event.target.value, 5))),
                  }))
                }
                placeholder="Rating"
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={newTestimonial.sort_order}
                onChange={(event) => setNewTestimonial((prev) => ({ ...prev, sort_order: normalizeNumber(event.target.value, 0) }))}
                placeholder="Orden"
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
              />
              <textarea
                value={newTestimonial.quote}
                onChange={(event) => setNewTestimonial((prev) => ({ ...prev, quote: event.target.value }))}
                placeholder="Testimonio"
                className="min-h-24 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm md:col-span-3"
              />
            </div>
            <label className="mt-2 inline-flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={newTestimonial.is_active}
                onChange={(event) => setNewTestimonial((prev) => ({ ...prev, is_active: event.target.checked }))}
              />
              Activo
            </label>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => void saveTestimonial(newTestimonial)}
                className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-1.5 text-xs font-semibold text-emerald-100"
              >
                Crear testimonio
              </button>
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5">
          <h2 className="text-lg font-semibold">Business Hours</h2>
          <div className="mt-4 space-y-3">
            {businessHours.map((item) => (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="grid gap-2 md:grid-cols-3">
                  <input
                    value={item.day_label}
                    onChange={(event) =>
                      setBusinessHours((prev) =>
                        prev.map((row) => (row.id === item.id ? { ...row, day_label: event.target.value } : row)),
                      )
                    }
                    placeholder="Dia"
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                  />
                  <input
                    value={item.hours_text}
                    onChange={(event) =>
                      setBusinessHours((prev) =>
                        prev.map((row) => (row.id === item.id ? { ...row, hours_text: event.target.value } : row)),
                      )
                    }
                    placeholder="Horario"
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={item.sort_order}
                    onChange={(event) =>
                      setBusinessHours((prev) =>
                        prev.map((row) =>
                          row.id === item.id ? { ...row, sort_order: normalizeNumber(event.target.value, 0) } : row,
                        ),
                      )
                    }
                    placeholder="Orden"
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                  />
                </div>
                <label className="mt-2 inline-flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={item.is_active}
                    onChange={(event) =>
                      setBusinessHours((prev) =>
                        prev.map((row) => (row.id === item.id ? { ...row, is_active: event.target.checked } : row)),
                      )
                    }
                  />
                  Activo
                </label>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void saveBusinessHour(item)}
                    className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-1.5 text-xs font-semibold text-emerald-100"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteBusinessHour(item.id)}
                    className="rounded-full border border-red-300/40 bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-100"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>

          <article className="mt-4 rounded-2xl border border-dashed border-white/20 bg-black/20 p-3">
            <p className="text-sm font-semibold text-zinc-200">Nuevo horario</p>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              <input
                value={newBusinessHour.day_label}
                onChange={(event) => setNewBusinessHour((prev) => ({ ...prev, day_label: event.target.value }))}
                placeholder="Dia"
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
              />
              <input
                value={newBusinessHour.hours_text}
                onChange={(event) => setNewBusinessHour((prev) => ({ ...prev, hours_text: event.target.value }))}
                placeholder="Horario"
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={newBusinessHour.sort_order}
                onChange={(event) =>
                  setNewBusinessHour((prev) => ({ ...prev, sort_order: normalizeNumber(event.target.value, 0) }))
                }
                placeholder="Orden"
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
              />
            </div>
            <label className="mt-2 inline-flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={newBusinessHour.is_active}
                onChange={(event) => setNewBusinessHour((prev) => ({ ...prev, is_active: event.target.checked }))}
              />
              Activo
            </label>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => void saveBusinessHour(newBusinessHour)}
                className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-1.5 text-xs font-semibold text-emerald-100"
              >
                Crear horario
              </button>
            </div>
          </article>
        </section>

        {imagePickerTarget ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
            onClick={() => closeImagePicker()}
          >
            <section
              className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-white/15 bg-zinc-900 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
              onClick={(event) => event.stopPropagation()}
            >
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100">Seleccionar imagen</h3>
                  <p className="text-xs text-zinc-400">Destino actual: {pickerTargetLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => closeImagePicker()}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
                >
                  Cerrar
                </button>
              </header>

              <div className="space-y-4 overflow-y-auto px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void loadMenuImageAssets()}
                    disabled={isLoadingMenuImageAssets}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-zinc-100 transition hover:bg-white/10 disabled:opacity-60"
                  >
                    {isLoadingMenuImageAssets ? "Cargando..." : "Recargar galeria"}
                  </button>

                  <label className="rounded-full border border-amber-300/40 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-100">
                    {isUploadingForPicker ? "Subiendo..." : "Subir imagen"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingForPicker}
                      onChange={(event) => {
                        void handleMenuImageInputChange(event);
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => applySelectedImageFromPicker()}
                    disabled={!imagePickerSelection}
                    className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100 disabled:opacity-50"
                  >
                    Usar imagen seleccionada
                  </button>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-2">
                  <p className="text-xs text-zinc-400">URL seleccionada</p>
                  <input
                    value={imagePickerSelection}
                    onChange={(event) => setImagePickerSelection(event.target.value)}
                    placeholder="Selecciona desde galeria o pega URL manual"
                    className="mt-2 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-xs text-zinc-200"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {menuImageAssets.map((asset) => {
                    const isSelected = imagePickerSelection === asset.url;

                    return (
                      <article
                        key={asset.path}
                        className={`rounded-xl border p-2 ${isSelected ? "border-emerald-300/50 bg-emerald-500/10" : "border-white/10 bg-black/20"}`}
                      >
                        <img src={asset.url} alt={asset.name} className="h-32 w-full rounded-lg object-cover" loading="lazy" />
                        <p className="mt-2 truncate text-xs text-zinc-300" title={asset.name}>
                          {asset.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => setImagePickerSelection(asset.url)}
                          className="mt-2 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-zinc-100 transition hover:bg-white/10"
                        >
                          Seleccionar
                        </button>
                      </article>
                    );
                  })}
                </div>

                {menuImageAssets.length === 0 ? (
                  <p className="text-sm text-zinc-400">No hay imagenes en el bucket todavia.</p>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}

        {menuCardTranslationsModal ? (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
            onClick={() => closeMenuCardTranslationsModal()}
          >
            <section
              className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-white/15 bg-zinc-900 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
              onClick={(event) => event.stopPropagation()}
            >
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100">Traducciones de Menu Card</h3>
                  <p className="text-xs text-zinc-400">{menuCardTranslationsModal.cardTitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void saveMenuCardTranslationsModal()}
                    disabled={isSavingMenuCardTranslations}
                    className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100 disabled:opacity-60"
                  >
                    {isSavingMenuCardTranslations ? "Guardando..." : "Guardar todos"}
                  </button>
                  <button
                    type="button"
                    onClick={() => closeMenuCardTranslationsModal()}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
                  >
                    Cerrar
                  </button>
                </div>
              </header>

              <div className="space-y-4 overflow-y-auto px-5 py-4">
                {isLoadingMenuCardTranslations ? (
                  <p className="text-sm text-zinc-400">Cargando traducciones...</p>
                ) : (
                  i18nLanguageOptions.map((langOption) => (
                    <article key={`menu-card-i18n-${langOption.code}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-300">{langOption.label}</p>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        <input
                          value={menuCardTranslationsDraft[langOption.code].title}
                          onChange={(event) =>
                            setMenuCardTranslationsDraft((prev) => ({
                              ...prev,
                              [langOption.code]: {
                                ...prev[langOption.code],
                                title: event.target.value,
                              },
                            }))
                          }
                          placeholder="Titulo traducido"
                          className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                        />
                        <input
                          value={menuCardTranslationsDraft[langOption.code].route_label}
                          onChange={(event) =>
                            setMenuCardTranslationsDraft((prev) => ({
                              ...prev,
                              [langOption.code]: {
                                ...prev[langOption.code],
                                route_label: event.target.value,
                              },
                            }))
                          }
                          placeholder="Route label traducido"
                          className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                        />
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        ) : null}

        {testimonialTranslationsModal ? (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
            onClick={() => closeTestimonialTranslationsModal()}
          >
            <section
              className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-white/15 bg-zinc-900 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
              onClick={(event) => event.stopPropagation()}
            >
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100">Traducciones de Testimonial</h3>
                  <p className="text-xs text-zinc-400">{testimonialTranslationsModal.testimonialAuthor}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void saveTestimonialTranslationsModal()}
                    disabled={isSavingTestimonialTranslations}
                    className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100 disabled:opacity-60"
                  >
                    {isSavingTestimonialTranslations ? "Guardando..." : "Guardar todos"}
                  </button>
                  <button
                    type="button"
                    onClick={() => closeTestimonialTranslationsModal()}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
                  >
                    Cerrar
                  </button>
                </div>
              </header>

              <div className="space-y-4 overflow-y-auto px-5 py-4">
                {isLoadingTestimonialTranslations ? (
                  <p className="text-sm text-zinc-400">Cargando traducciones...</p>
                ) : (
                  i18nLanguageOptions.map((langOption) => (
                    <article key={`testimonial-i18n-${langOption.code}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-300">{langOption.label}</p>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        <input
                          value={testimonialTranslationsDraft[langOption.code].author}
                          onChange={(event) =>
                            setTestimonialTranslationsDraft((prev) => ({
                              ...prev,
                              [langOption.code]: {
                                ...prev[langOption.code],
                                author: event.target.value,
                              },
                            }))
                          }
                          placeholder="Autor traducido"
                          className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                        />
                        <input
                          value={testimonialTranslationsDraft[langOption.code].quote}
                          onChange={(event) =>
                            setTestimonialTranslationsDraft((prev) => ({
                              ...prev,
                              [langOption.code]: {
                                ...prev[langOption.code],
                                quote: event.target.value,
                              },
                            }))
                          }
                          placeholder="Texto traducido"
                          className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                        />
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        ) : null}

        <footer className="pb-2 text-center text-xs text-zinc-400">
          Si no puedes entrar, revisa que el usuario exista en auth.users y en admin_users con role = admin.
        </footer>
      </section>
    </main>
  );
}
