export type LanguagePreferenceCode = "auto" | "es" | "us" | "gb" | "fr" | "it";
export type LanguageCode = Exclude<LanguagePreferenceCode, "auto">;

export type TranslationMessages = {
  loadingContent: string;
  loadErrorTitle: string;
  noActiveCards: string;
  openCardAria: string;
  interactiveCardAria: string;
  backToHome: string;
  menuItemsTitle: string;
  categoryEmpty: string;
  visitUs: string;
  reserveTable: string;
  reservationText: string;
  callNow: string;
  findUsKicker: string;
  howToGetThere: string;
  address: string;
  phone: string;
  schedule: string;
  scheduleNotConfigured: string;
  openNavigation: string;
  mapTitle: string;
  testimonialsKicker: string;
  testimonialsTitle: string;
  noTestimonials: string;
  ratingAriaLabel: string;
  footerRights: string;
  languageAuto: string;
};

export const languageOptions: Array<{
  code: LanguageCode;
  locale: string;
  label: string;
  countryCode: string;
}> = [
  { code: "es", locale: "es-ES", label: "ES", countryCode: "es" },
  { code: "us", locale: "en-US", label: "US", countryCode: "us" },
  { code: "gb", locale: "en-GB", label: "GB", countryCode: "gb" },
  { code: "fr", locale: "fr-FR", label: "FR", countryCode: "fr" },
  { code: "it", locale: "it-IT", label: "IT", countryCode: "it" },
];

export const defaultLanguagePreference: LanguagePreferenceCode = "es";
export const languageStorageKey = "preferred-language-code";

export const translations: Record<LanguageCode, TranslationMessages> = {
  es: {
    loadingContent: "Cargando contenido...",
    loadErrorTitle: "Error de carga",
    noActiveCards: "No hay tarjetas activas configuradas.",
    openCardAria: "Abrir",
    interactiveCardAria: "interactiva",
    backToHome: "Menú principal",
    menuItemsTitle: "Platos de esta categoría",
    categoryEmpty: "Todavía no hay platos activos en esta categoría.",
    visitUs: "Ven a visitarnos",
    reserveTable: "Reservar Mesa",
    reservationText: "Reserva tu mesa por teléfono o WhatsApp y disfruta de la mejor cocina tradicional.",
    callNow: "Llamar ahora",
    findUsKicker: "Encuéntranos",
    howToGetThere: "Cómo Llegar",
    address: "Dirección",
    phone: "Teléfono",
    schedule: "Horario",
    scheduleNotConfigured: "Horario no configurado",
    openNavigation: "Abrir navegación",
    mapTitle: "Ubicación en Google Maps",
    testimonialsKicker: "Lo que dicen",
    testimonialsTitle: "Nuestros Clientes",
    noTestimonials: "No hay testimonios activos configurados.",
    ratingAriaLabel: "Valoración",
    footerRights: "Todos los derechos reservados.",
    languageAuto: "AUTO",
  },
  us: {
    loadingContent: "Loading content...",
    loadErrorTitle: "Loading error",
    noActiveCards: "There are no active cards configured.",
    openCardAria: "Open",
    interactiveCardAria: "interactive",
    backToHome: "Back to menu",
    menuItemsTitle: "Dishes in this category",
    categoryEmpty: "There are no active dishes in this category yet.",
    visitUs: "Visit us",
    reserveTable: "Book a table",
    reservationText: "Book your table by phone or WhatsApp and enjoy the best traditional cuisine.",
    callNow: "Call now",
    findUsKicker: "Find us",
    howToGetThere: "How to get here",
    address: "Address",
    phone: "Phone",
    schedule: "Opening hours",
    scheduleNotConfigured: "Schedule not configured",
    openNavigation: "Open navigation",
    mapTitle: "Location on Google Maps",
    testimonialsKicker: "What they say",
    testimonialsTitle: "Our customers",
    noTestimonials: "There are no active testimonials configured.",
    ratingAriaLabel: "Rating",
    footerRights: "All rights reserved.",
    languageAuto: "AUTO",
  },
  gb: {
    loadingContent: "Loading content...",
    loadErrorTitle: "Loading error",
    noActiveCards: "There are no active cards configured.",
    openCardAria: "Open",
    interactiveCardAria: "interactive",
    backToHome: "Back to menu",
    menuItemsTitle: "Dishes in this category",
    categoryEmpty: "There are no active dishes in this category yet.",
    visitUs: "Visit us",
    reserveTable: "Book a table",
    reservationText: "Book your table by phone or WhatsApp and enjoy the best traditional cuisine.",
    callNow: "Call now",
    findUsKicker: "Find us",
    howToGetThere: "How to get here",
    address: "Address",
    phone: "Phone",
    schedule: "Opening hours",
    scheduleNotConfigured: "Schedule not configured",
    openNavigation: "Open navigation",
    mapTitle: "Location on Google Maps",
    testimonialsKicker: "What they say",
    testimonialsTitle: "Our customers",
    noTestimonials: "There are no active testimonials configured.",
    ratingAriaLabel: "Rating",
    footerRights: "All rights reserved.",
    languageAuto: "AUTO",
  },
  fr: {
    loadingContent: "Chargement du contenu...",
    loadErrorTitle: "Erreur de chargement",
    noActiveCards: "Aucune carte active configuree.",
    openCardAria: "Ouvrir",
    interactiveCardAria: "interactive",
    backToHome: "Retour a la carte",
    menuItemsTitle: "Plats de cette categorie",
    categoryEmpty: "Il n'y a pas encore de plats actifs dans cette categorie.",
    visitUs: "Venez nous voir",
    reserveTable: "Reserver une table",
    reservationText: "Reservez votre table par telephone ou WhatsApp et profitez de la meilleure cuisine traditionnelle.",
    callNow: "Appeler",
    findUsKicker: "Nous trouver",
    howToGetThere: "Comment venir",
    address: "Adresse",
    phone: "Telephone",
    schedule: "Horaires",
    scheduleNotConfigured: "Horaires non configures",
    openNavigation: "Ouvrir la navigation",
    mapTitle: "Emplacement sur Google Maps",
    testimonialsKicker: "Ce qu'ils disent",
    testimonialsTitle: "Nos clients",
    noTestimonials: "Aucun temoignage actif configure.",
    ratingAriaLabel: "Note",
    footerRights: "Tous droits reserves.",
    languageAuto: "AUTO",
  },
  it: {
    loadingContent: "Caricamento contenuti...",
    loadErrorTitle: "Errore di caricamento",
    noActiveCards: "Nessuna card attiva configurata.",
    openCardAria: "Apri",
    interactiveCardAria: "interattiva",
    backToHome: "Torna al menu",
    menuItemsTitle: "Piatti di questa categoria",
    categoryEmpty: "Non ci sono ancora piatti attivi in questa categoria.",
    visitUs: "Vieni a trovarci",
    reserveTable: "Prenota un tavolo",
    reservationText: "Prenota il tuo tavolo per telefono o WhatsApp e goditi la migliore cucina tradizionale.",
    callNow: "Chiama ora",
    findUsKicker: "Dove siamo",
    howToGetThere: "Come arrivare",
    address: "Indirizzo",
    phone: "Telefono",
    schedule: "Orari",
    scheduleNotConfigured: "Orari non configurati",
    openNavigation: "Apri navigazione",
    mapTitle: "Posizione su Google Maps",
    testimonialsKicker: "Cosa dicono",
    testimonialsTitle: "I nostri clienti",
    noTestimonials: "Nessuna recensione attiva configurata.",
    ratingAriaLabel: "Valutazione",
    footerRights: "Tutti i diritti riservati.",
    languageAuto: "AUTO",
  },
};

export function resolveLanguageCode(rawCode: string | null | undefined): LanguageCode {
  const normalizedCode = (rawCode ?? "").trim().toLowerCase();
  if (!normalizedCode || normalizedCode === "auto") {
    return "es";
  }

  const hasOption = languageOptions.some((option) => option.code === normalizedCode);
  return hasOption ? (normalizedCode as LanguageCode) : "es";
}

export function getLanguageOption(code: LanguageCode) {
  return languageOptions.find((option) => option.code === code) ?? languageOptions[0];
}

export function detectLanguageCodeFromLocale(locale: string): LanguageCode {
  const normalized = locale.toLowerCase();

  if (normalized.startsWith("en-gb")) {
    return "gb";
  }

  if (normalized.startsWith("en")) {
    return "us";
  }

  if (normalized.startsWith("fr")) {
    return "fr";
  }

  if (normalized.startsWith("it")) {
    return "it";
  }

  if (normalized.startsWith("es")) {
    return "es";
  }

  return "es";
}
