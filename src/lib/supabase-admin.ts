import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BusinessHour, MenuCard, MenuItem, SiteSettings, Testimonial } from "./supabase-public";

type SiteSettingsInsert = Omit<SiteSettings, "id" | "updated_at"> & {
  id?: string;
  updated_at?: string;
};

type SiteSettingsUpdate = Partial<Omit<SiteSettings, "id" | "updated_at">> & {
  updated_at?: string;
};

type MenuCardInsert = Omit<MenuCard, "id" | "updated_at"> & {
  id?: string;
  updated_at?: string;
};

type MenuCardUpdate = Partial<Omit<MenuCard, "id" | "updated_at">> & {
  updated_at?: string;
};

type MenuItemInsert = Omit<MenuItem, "id" | "updated_at"> & {
  id?: string;
  updated_at?: string;
};

type MenuItemUpdate = Partial<Omit<MenuItem, "id" | "updated_at">> & {
  updated_at?: string;
};

type TestimonialInsert = Omit<Testimonial, "id" | "updated_at"> & {
  id?: string;
  updated_at?: string;
};

type TestimonialUpdate = Partial<Omit<Testimonial, "id" | "updated_at">> & {
  updated_at?: string;
};

type BusinessHourInsert = Omit<BusinessHour, "id" | "updated_at"> & {
  id?: string;
  updated_at?: string;
};

type BusinessHourUpdate = Partial<Omit<BusinessHour, "id" | "updated_at">> & {
  updated_at?: string;
};

type AdminUserRow = {
  user_id: string;
  role: string;
  created_at?: string;
  updated_at?: string;
};

type AdminUserInsert = {
  user_id: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
};

type AdminUserUpdate = {
  role?: string;
  updated_at?: string;
};

type SupportedI18nLang = "es" | "us" | "gb" | "fr" | "it";

type SiteSettingsI18nRow = {
  id: string;
  site_settings_id: string;
  lang_code: SupportedI18nLang;
  business_name: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  updated_at?: string;
};

type SiteSettingsI18nInsert = {
  id?: string;
  site_settings_id: string;
  lang_code: SupportedI18nLang;
  business_name?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  updated_at?: string;
};

type SiteSettingsI18nUpdate = Partial<Omit<SiteSettingsI18nInsert, "site_settings_id" | "lang_code">>;

type MenuCardI18nRow = {
  id: string;
  menu_card_id: string;
  lang_code: SupportedI18nLang;
  title: string | null;
  route_label: string | null;
  updated_at?: string;
};

type MenuCardI18nInsert = {
  id?: string;
  menu_card_id: string;
  lang_code: SupportedI18nLang;
  title?: string | null;
  route_label?: string | null;
  updated_at?: string;
};

type MenuCardI18nUpdate = Partial<Omit<MenuCardI18nInsert, "menu_card_id" | "lang_code">>;

type TestimonialI18nRow = {
  id: string;
  testimonial_id: string;
  lang_code: SupportedI18nLang;
  quote: string | null;
  author: string | null;
  updated_at?: string;
};

type TestimonialI18nInsert = {
  id?: string;
  testimonial_id: string;
  lang_code: SupportedI18nLang;
  quote?: string | null;
  author?: string | null;
  updated_at?: string;
};

type TestimonialI18nUpdate = Partial<Omit<TestimonialI18nInsert, "testimonial_id" | "lang_code">>;

type BusinessHourI18nRow = {
  id: string;
  business_hour_id: string;
  lang_code: SupportedI18nLang;
  day_label: string | null;
  hours_text: string | null;
  updated_at?: string;
};

type BusinessHourI18nInsert = {
  id?: string;
  business_hour_id: string;
  lang_code: SupportedI18nLang;
  day_label?: string | null;
  hours_text?: string | null;
  updated_at?: string;
};

type BusinessHourI18nUpdate = Partial<Omit<BusinessHourI18nInsert, "business_hour_id" | "lang_code">>;

export type SupabaseDatabase = {
  public: {
    Tables: {
      site_settings: {
        Row: SiteSettings;
        Insert: SiteSettingsInsert;
        Update: SiteSettingsUpdate;
      };
      menu_cards: {
        Row: MenuCard;
        Insert: MenuCardInsert;
        Update: MenuCardUpdate;
      };
      menu_items: {
        Row: MenuItem;
        Insert: MenuItemInsert;
        Update: MenuItemUpdate;
      };
      testimonials: {
        Row: Testimonial;
        Insert: TestimonialInsert;
        Update: TestimonialUpdate;
      };
      business_hours: {
        Row: BusinessHour;
        Insert: BusinessHourInsert;
        Update: BusinessHourUpdate;
      };
      admin_users: {
        Row: AdminUserRow;
        Insert: AdminUserInsert;
        Update: AdminUserUpdate;
      };
      site_settings_i18n: {
        Row: SiteSettingsI18nRow;
        Insert: SiteSettingsI18nInsert;
        Update: SiteSettingsI18nUpdate;
      };
      menu_cards_i18n: {
        Row: MenuCardI18nRow;
        Insert: MenuCardI18nInsert;
        Update: MenuCardI18nUpdate;
      };
      testimonials_i18n: {
        Row: TestimonialI18nRow;
        Insert: TestimonialI18nInsert;
        Update: TestimonialI18nUpdate;
      };
      business_hours_i18n: {
        Row: BusinessHourI18nRow;
        Insert: BusinessHourI18nInsert;
        Update: BusinessHourI18nUpdate;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

let browserClient: SupabaseClient<SupabaseDatabase> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Faltan SUPABASE_URL (o NEXT_PUBLIC_SUPABASE_URL) o NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  browserClient = createClient<SupabaseDatabase>(url, anonKey);
  return browserClient;
}
