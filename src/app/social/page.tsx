"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import FindUsSection from "./FindUsSection";
import TestimonialsSection from "./TestimonialsSection";
import FooterSection from "./FooterSection";
import logoImage from "../../img/logo_b.png";
import {
  defaultLanguagePreference,
  detectLanguageCodeFromLocale,
  getLanguageOption,
  languageOptions,
  languageStorageKey,
  resolveLanguageCode,
  translations,
  type LanguagePreferenceCode,
} from "../../lib/i18n";
import {
  fetchBusinessHours,
  fetchMenuCards,
  fetchSiteSettings,
  fetchTestimonials,
  type BusinessHour,
  type SiteSettings,
  type Testimonial,
} from "../../lib/supabase-public";

type SocialPost = {
  id: string;
  image: string;
  title: string;
  routeLabel: string;
  href: string;
};

type PageContent = {
  siteSettings: SiteSettings | null;
  menuCards: SocialPost[];
  testimonials: Testimonial[];
  businessHours: BusinessHour[];
};

function subscribeToLanguageSelection(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("popstate", onStoreChange);
  window.addEventListener("language-preference-change", onStoreChange);
  return () => {
    window.removeEventListener("popstate", onStoreChange);
    window.removeEventListener("language-preference-change", onStoreChange);
  };
}

function getServerLanguageSnapshot() {
  return defaultLanguagePreference;
}

function getClientLanguageSnapshot(): LanguagePreferenceCode {
  const searchParams = new URLSearchParams(window.location.search);
  const forcedLanguage = searchParams.get("lang") as LanguagePreferenceCode | null;

  if (forcedLanguage) {
    return forcedLanguage;
  }

  const storedLanguage = window.localStorage.getItem(languageStorageKey) as LanguagePreferenceCode | null;
  if (storedLanguage) {
    return storedLanguage;
  }

  return defaultLanguagePreference;
}

function setSelectedLanguageCode(code: LanguagePreferenceCode) {
  const url = new URL(window.location.href);
  url.searchParams.set("lang", code);
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  window.localStorage.setItem(languageStorageKey, code);
  window.dispatchEvent(new Event("language-preference-change"));
}

function withLanguageInHref(href: string, languageCode: LanguagePreferenceCode) {
  if (!href.startsWith("/")) {
    return href;
  }

  const url = new URL(href, "https://local.link");
  url.searchParams.set("lang", languageCode);

  return `${url.pathname}${url.search}${url.hash}`;
}

export default function SocialPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const draggedRef = useRef(false);
  const languageMenuCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [content, setContent] = useState<PageContent>({
    siteSettings: null,
    menuCards: [],
    testimonials: [],
    businessHours: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      setIsLoading(true);
      setError(null);

      try {
        const [siteSettings, menuCards, testimonials, businessHours] = await Promise.all([
          fetchSiteSettings(),
          fetchMenuCards(),
          fetchTestimonials(),
          fetchBusinessHours(),
        ]);

        if (cancelled) {
          return;
        }

        setContent({
          siteSettings,
          menuCards: menuCards.map((card) => ({
            id: card.id,
            image: card.image_url,
            title: card.title,
            routeLabel: card.route_label,
            href: card.href,
          })),
          testimonials,
          businessHours,
        });
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el contenido");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadContent();

    return () => {
      cancelled = true;
    };
  }, []);

  const posts = content.menuCards;
  const total = posts.length;

  const goTo = (index: number) => {
    setActiveIndex((index + total) % total);
  };

  const goPrev = () => {
    goTo(activeIndex - 1);
  };

  const goNext = () => {
    goTo(activeIndex + 1);
  };

  const circularDelta = (index: number) => {
    let delta = index - activeIndex;
    const half = Math.floor(total / 2);
    if (delta > half) {
      delta -= total;
    }
    if (delta < -half) {
      delta += total;
    }
    return delta;
  };

  const getCardMotion = (delta: number) => {
    if (delta === 0) {
      return {
        x: 0,
        y: -14,
        scale: 1.03,
        rotateY: 0,
        opacity: 1,
        zIndex: 50,
        filter: "blur(0px) brightness(1)",
      };
    }

    if (delta === -1) {
      return {
        x: -240,
        y: 30,
        scale: 0.9,
        rotateY: 34,
        opacity: 0.82,
        zIndex: 20,
        filter: "blur(1.8px) brightness(0.9)",
      };
    }

    if (delta === 1) {
      return {
        x: 240,
        y: 30,
        scale: 0.9,
        rotateY: -34,
        opacity: 0.82,
        zIndex: 20,
        filter: "blur(1.8px) brightness(0.9)",
      };
    }

    return {
      x: delta < 0 ? -320 : 320,
      y: 18,
      scale: 0.82,
      rotateY: delta < 0 ? 42 : -42,
      opacity: 0,
      zIndex: 10,
      filter: "blur(2.2px) brightness(0.82)",
    };
  };

  const contactPhone = content.siteSettings?.phone ?? "+34 111 11 11 11";
  const addressLine1 = content.siteSettings?.address_line_1 ?? "C. de la alegría, 18";
  const addressLine2 = content.siteSettings?.address_line_2 ?? "Carabanchel, 28000 Madrid";
  const siteLogoImage = content.siteSettings?.logo_url || logoImage;
  const reservationHref = `tel:${contactPhone.replace(/\s+/g, "")}`;
  const selectedLanguagePreference = useSyncExternalStore(
    subscribeToLanguageSelection,
    getClientLanguageSnapshot,
    getServerLanguageSnapshot,
  );
  const browserLocale = typeof navigator !== "undefined" ? navigator.languages?.[0] ?? navigator.language ?? "es-ES" : "es-ES";
  const effectiveLanguageCode =
    selectedLanguagePreference === "auto" ? detectLanguageCodeFromLocale(browserLocale) : resolveLanguageCode(selectedLanguagePreference);
  const messages = translations[effectiveLanguageCode];
  const selectedLanguage = getLanguageOption(effectiveLanguageCode);
  const selectedFlagImageUrl = `https://flagcdn.com/w40/${selectedLanguage.countryCode}.png`;

  const openLanguageMenu = () => {
    if (languageMenuCloseTimeoutRef.current) {
      clearTimeout(languageMenuCloseTimeoutRef.current);
      languageMenuCloseTimeoutRef.current = null;
    }
    setIsLanguageMenuOpen(true);
  };

  const closeLanguageMenuWithDelay = () => {
    if (languageMenuCloseTimeoutRef.current) {
      clearTimeout(languageMenuCloseTimeoutRef.current);
    }

    languageMenuCloseTimeoutRef.current = setTimeout(() => {
      setIsLanguageMenuOpen(false);
      languageMenuCloseTimeoutRef.current = null;
    }, 140);
  };

  useEffect(() => {
    return () => {
      if (languageMenuCloseTimeoutRef.current) {
        clearTimeout(languageMenuCloseTimeoutRef.current);
      }
    };
  }, []);

  const localeBadge = (
    <aside className="fixed right-3 top-3 z-[90] sm:right-4 sm:top-4" aria-label="Selector de idioma">
      <div
        className="relative"
        onMouseEnter={openLanguageMenu}
        onMouseLeave={closeLanguageMenuWithDelay}
      >
        <button
          type="button"
          onClick={() => setIsLanguageMenuOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-100 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md"
        >
          <img
            src={selectedFlagImageUrl}
            alt={`Bandera para ${selectedLanguage.locale}`}
            className="h-4 w-6 rounded-[2px] object-cover"
            loading="eager"
          />
          <span>{selectedLanguagePreference === "auto" ? messages.languageAuto : selectedLanguage.label}</span>
        </button>

        <div
          className={`absolute right-0 top-full w-40 rounded-xl border border-white/15 bg-black/85 p-2 shadow-[0_18px_42px_rgba(0,0,0,0.45)] transition ${
            isLanguageMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
          onMouseEnter={openLanguageMenu}
          onMouseLeave={closeLanguageMenuWithDelay}
        >
          <button
            type="button"
            onClick={() => {
              setSelectedLanguageCode("auto");
              setIsLanguageMenuOpen(false);
            }}
            className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-[0.1em] transition ${
              selectedLanguagePreference === "auto" ? "bg-emerald-500/20 text-emerald-100" : "text-zinc-100 hover:bg-white/10"
            }`}
          >
            <span className="inline-flex h-4 w-6 items-center justify-center rounded-[2px] border border-white/20 text-[10px]">A</span>
            <span>{messages.languageAuto}</span>
          </button>

          {languageOptions.map((option) => {
            const optionFlagUrl = `https://flagcdn.com/w40/${option.countryCode}.png`;
            const isActive = option.code === selectedLanguagePreference;

            return (
              <button
                key={option.code}
                type="button"
                onClick={() => {
                  setSelectedLanguageCode(option.code);
                  setIsLanguageMenuOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-[0.1em] transition ${
                  isActive ? "bg-emerald-500/20 text-emerald-100" : "text-zinc-100 hover:bg-white/10"
                }`}
              >
                <img src={optionFlagUrl} alt={`Bandera ${option.label}`} className="h-4 w-6 rounded-[2px] object-cover" />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_14%_0%,#2e130f_0,transparent_28%),radial-gradient(circle_at_86%_10%,#3e1b13_0,transparent_24%),linear-gradient(180deg,#080808_0%,#141212_60%,#0c0c0c_100%)] px-4 py-10 text-center text-zinc-100">
        {localeBadge}
        <p className="text-sm uppercase tracking-[0.14em] text-zinc-300">{messages.loadingContent}</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_14%_0%,#2e130f_0,transparent_28%),radial-gradient(circle_at_86%_10%,#3e1b13_0,transparent_24%),linear-gradient(180deg,#080808_0%,#141212_60%,#0c0c0c_100%)] px-4 py-10">
        {localeBadge}
        <section className="max-w-xl rounded-2xl border border-red-400/30 bg-red-500/10 px-6 py-5 text-center text-red-50">
          <p className="text-sm uppercase tracking-[0.14em] text-red-200">{messages.loadErrorTitle}</p>
          <p className="mt-2 text-base leading-relaxed">{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden overscroll-x-none bg-[radial-gradient(circle_at_14%_0%,#2e130f_0,transparent_28%),radial-gradient(circle_at_86%_10%,#3e1b13_0,transparent_24%),linear-gradient(180deg,#080808_0%,#141212_60%,#0c0c0c_100%)] px-4 py-5 md:py-9">
      {localeBadge}
      <section className="mx-auto w-[min(1220px,96vw)]" aria-label="Social Carousel">
        <header className="mb-2 w-full md:mb-3">
          <h1 className="sr-only">{content.siteSettings?.business_name || "Carta Digital"}</h1>
          <Image
            src={siteLogoImage}
            alt={content.siteSettings?.business_name ? `Logo ${content.siteSettings.business_name}` : "Logo Carta Digital"}
            className="h-auto w-[130px] sm:w-[150px] md:w-[170px]"
            priority
            width={170}
            height={95}
          />
        </header>

        <div className="mx-auto mt-12 flex w-full max-w-[1080px] flex-col items-center gap-4 md:mt-14 md:gap-6">
          <div className="w-full max-w-[960px] px-1 md:px-8" style={{ perspective: "1500px" }}>
            <div className="relative mx-auto h-[520px] w-full max-w-[560px] md:h-[660px]" style={{ transformStyle: "preserve-3d" }}>
              {posts.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-[1.6rem] border border-white/10 bg-white/5 px-6 text-center text-zinc-200">
                  <p>{messages.noActiveCards}</p>
                </div>
              ) : (
                posts.map((post, index) => {
                  const delta = circularDelta(index);
                  const isActive = delta === 0;
                  const isVisible = Math.abs(delta) <= 1;
                  const cardContent = (
                    <>
                      <div className="aspect-[4/5] overflow-hidden">
                        <Image
                          alt={post.title}
                          className="h-full w-full object-cover"
                          src={post.image}
                          width={900}
                          height={1125}
                          sizes="(max-width: 640px) 60vw, 360px"
                          loading={isActive ? "eager" : "lazy"}
                          priority={isActive}
                        />
                      </div>

                      <div className="p-4 md:p-5">
                        <p className="text-[1.08rem] font-semibold leading-[1.25] text-[#fbfbfb] md:text-[1.15rem]">{post.title}</p>
                        <p className="mt-1 text-[0.82rem] uppercase tracking-[0.08em] text-[#c7c7c7]">{post.routeLabel}</p>
                      </div>
                    </>
                  );

                  return (
                    <motion.article
                      key={post.id}
                      animate={getCardMotion(delta)}
                      transition={{ type: "spring", stiffness: 165, damping: 26, mass: 1 }}
                      drag={isVisible ? "x" : false}
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.14}
                      onDragStart={() => {
                        draggedRef.current = false;
                      }}
                      onDragEnd={(_, info) => {
                        draggedRef.current = Math.abs(info.offset.x) > 8;
                        if (info.offset.x < -70) {
                          goNext();
                          setTimeout(() => {
                            draggedRef.current = false;
                          }, 0);
                          return;
                        }
                        if (info.offset.x > 70) {
                          goPrev();
                          setTimeout(() => {
                            draggedRef.current = false;
                          }, 0);
                        }
                      }}
                      onClick={() => {
                        if (draggedRef.current) {
                          return;
                        }
                        if (delta === -1) {
                          goPrev();
                        }
                        if (delta === 1) {
                          goNext();
                        }
                      }}
                      className={`absolute left-1/2 top-0 w-full max-w-[300px] -translate-x-1/2 overflow-hidden rounded-[1.6rem] border bg-[#1f1f1f] sm:max-w-[330px] md:max-w-[360px] ${
                        isVisible ? "cursor-grab active:cursor-grabbing " : ""
                      }${
                        isActive
                          ? "border-white/20 shadow-[0_34px_56px_rgba(0,0,0,0.55)]"
                          : "border-white/10 shadow-[0_16px_34px_rgba(0,0,0,0.35)]"
                      }`}
                      style={{
                        pointerEvents: isVisible ? "auto" : "none",
                        transformStyle: "preserve-3d",
                        touchAction: "pan-y",
                        zIndex: isActive ? 50 : Math.abs(delta) === 1 ? 20 : 10,
                      }}
                      aria-hidden={!isVisible}
                    >
                      {isActive ? (
                        <Link
                          href={withLanguageInHref(post.href, selectedLanguagePreference)}
                          onClick={(event) => {
                            if (draggedRef.current) {
                              event.preventDefault();
                            }
                          }}
                          className="block h-full w-full"
                          aria-label={`${messages.openCardAria} ${post.title}`}
                        >
                          {cardContent}
                        </Link>
                      ) : (
                        <div className="block h-full w-full" aria-label={`${post.title} (${messages.interactiveCardAria})`}>
                          {cardContent}
                        </div>
                      )}
                    </motion.article>
                  );
                })
              )}
            </div>
          </div>

          <address className="w-full max-w-[960px] text-center not-italic text-sm leading-relaxed text-zinc-200 md:text-base">
            <p>{addressLine1}</p>
            <p>{addressLine2}</p>
            <p>{contactPhone}</p>
          </address>

          <section className="w-full max-w-[960px] rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-center backdrop-blur-sm md:px-8 md:py-8">
            <p className="text-sm uppercase tracking-[0.12em] text-zinc-300">{messages.visitUs}</p>
            <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">{messages.reserveTable}</h2>
            <p className="mx-auto mt-3 max-w-[680px] text-sm leading-relaxed text-zinc-200 md:text-base">
              {messages.reservationText}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <a
                href={reservationHref}
                className="rounded-full border border-white/20 bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                {messages.callNow}
              </a>
              <a
                href={`https://wa.me/${contactPhone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-emerald-300/50 bg-emerald-500/20 px-5 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
              >
                WhatsApp
              </a>
            </div>
          </section>

          <FindUsSection
            addressLine1={addressLine1}
            addressLine2={addressLine2}
            phone={contactPhone}
            mapsLink={content.siteSettings?.maps_link ?? null}
            mapsEmbedUrl={content.siteSettings?.maps_embed_url ?? null}
            businessHours={content.businessHours}
            copy={{
              kicker: messages.findUsKicker,
              title: messages.howToGetThere,
              address: messages.address,
              phone: messages.phone,
              schedule: messages.schedule,
              scheduleNotConfigured: messages.scheduleNotConfigured,
              openNavigation: messages.openNavigation,
              mapTitle: messages.mapTitle,
            }}
          />
          <TestimonialsSection
            testimonials={content.testimonials}
            copy={{
              kicker: messages.testimonialsKicker,
              title: messages.testimonialsTitle,
              noTestimonials: messages.noTestimonials,
              ratingLabel: messages.ratingAriaLabel,
            }}
          />
          <FooterSection
            businessName={content.siteSettings?.business_name ?? "Bar Restaurante El Jardín"}
            addressLine1={addressLine1}
            addressLine2={addressLine2}
            phone={contactPhone}
            rightsText={messages.footerRights}
          />
        </div>
      </section>
    </main>
  );
}
