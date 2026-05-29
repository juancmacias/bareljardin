export type SiteSettings = {
  id: string;
  business_name: string;
  address_line_1: string;
  address_line_2: string | null;
  phone: string;
  maps_link: string | null;
  maps_embed_url: string | null;
  updated_at?: string;
};

export type MenuCard = {
  id: string;
  title: string;
  route_label: string;
  href: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
  updated_at?: string;
};

export type MenuItem = {
  id: string;
  menu_card_id: string;
  title: string;
  description: string;
  video_url: string;
  sort_order: number;
  is_active: boolean;
  updated_at?: string;
};

export type Testimonial = {
  id: string;
  quote: string;
  author: string;
  rating: number;
  sort_order: number;
  is_active: boolean;
  updated_at?: string;
};

export type BusinessHour = {
  id: string;
  day_label: string;
  hours_text: string;
  sort_order: number;
  is_active: boolean;
  updated_at?: string;
};

type SupabaseConfig = {
  url: string;
  anonKey: string;
};

function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Faltan SUPABASE_URL (o NEXT_PUBLIC_SUPABASE_URL) o NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return { url, anonKey };
}

async function supabaseSelect<T>(path: string): Promise<T> {
  const { url, anonKey } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function fetchSiteSettings(): Promise<SiteSettings | null> {
  const rows = await supabaseSelect<SiteSettings[]>("site_settings?select=*&limit=1");
  return rows[0] ?? null;
}

export async function fetchMenuCards(): Promise<MenuCard[]> {
  return supabaseSelect<MenuCard[]>("menu_cards?select=*&is_active=eq.true&order=sort_order.asc");
}

export async function fetchMenuCardByHref(href: string): Promise<MenuCard | null> {
  const rows = await supabaseSelect<MenuCard[]>(
    `menu_cards?select=*&is_active=eq.true&href=eq.${encodeURIComponent(href)}&limit=1`,
  );
  return rows[0] ?? null;
}

export async function fetchMenuItemsByCardId(menuCardId: string): Promise<MenuItem[]> {
  return supabaseSelect<MenuItem[]>(
    `menu_items?select=*&menu_card_id=eq.${encodeURIComponent(menuCardId)}&is_active=eq.true&order=sort_order.asc`,
  );
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  return supabaseSelect<Testimonial[]>("testimonials?select=*&is_active=eq.true&order=sort_order.asc");
}

export async function fetchBusinessHours(): Promise<BusinessHour[]> {
  return supabaseSelect<BusinessHour[]>("business_hours?select=*&is_active=eq.true&order=sort_order.asc");
}