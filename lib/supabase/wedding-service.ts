import { supabase, TypedSupabaseClient } from './client';
import { Tables, TablesInsert, TablesUpdate, Json } from './types';

// Types for wedding data
export type Wedding = Tables<'weddings'>;

export type CarouselSlide = {
  type: 'dress_code' | 'image' | 'outfit_ideas' | 'ritual' | 'two_sections' | 'three_lines';
  title?: string;
  subtitle?: string;
  heading?: string;
  description?: string;
  src?: string; // For image slides
  women?: string[]; // For outfit_ideas slides
  men?: string[]; // For outfit_ideas slides
  // For two_sections type (outfit ideas style with two gender sections)
  section1_header?: string;
  section1_items?: string[];
  section2_header?: string;
  section2_items?: string[];
  // For three_lines type (celebration header style)
  top_label?: string;  // Small header like "THE CELEBRATION"
  main_heading?: string; // Large italic heading like "Sangeet & Reception"
  body_text?: string; // Description text
};

export type WeddingEvent = Omit<Tables<'wedding_events'>, 'carousel_slides'> & {
  carousel_slides: CarouselSlide[];
};

export type WeddingSchedule = Tables<'wedding_schedule'>;

export type ScheduleItem = Tables<'schedule_items'>;

export type WeddingTravelCard = Tables<'wedding_travel_cards'>;

export interface TravelSection {
  id: string;
  wedding_id: string;
  type: 'travel' | 'flight' | 'travel_note' | 'accommodation' | 'hotel';
  title: string | null;
  subtitle: string | null;
  content: string | null;
  image_url: string | null;
  icon: string | null;
  order_index: number;
  more_details: string | null;
  address: string | null;
  phone: string | null;
  price_level: number | null;
  visible: boolean;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export type TravelSectionInsert = Omit<TravelSection, 'id' | 'created_at' | 'updated_at'>;
export type TravelSectionUpdate = Partial<Omit<TravelSection, 'id' | 'created_at' | 'updated_at'>>;

export type WeddingFAQ = Tables<'wedding_faqs'>;

export type WeddingRegistry = Tables<'wedding_registry'>;

export type WeddingShop = Tables<'wedding_shops'>;

export type WeddingSettings = Tables<'wedding_settings'>;

export type WeddingAdmin = Tables<'wedding_admins'>;

export type WeddingInvite = Tables<'wedding_invites'>;

export interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  role: 'owner' | 'admin' | 'viewer';
  created_at: string;
  is_owner: boolean;
}

export type Column = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  wedding_id: string;
  title: string;
  description?: string;
  column: Column;
  tags?: string[];
  order_index: number;
  created_at: string;
}

// Wedding CRUD operations
export class WeddingService {
  private supabase: TypedSupabaseClient;

  constructor(client?: TypedSupabaseClient) {
    this.supabase = client || supabase;
  }

  // Weddings
  async getWeddingBySlug(slug: string): Promise<Wedding | null> {
    try {
      console.log('🔍 WeddingService: Fetching wedding by slug:', slug);

      const { data, error } = await this.supabase
        .from('weddings')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('❌ WeddingService: Error fetching wedding:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return null;
      }

      console.log('✅ WeddingService: Wedding fetched successfully:', data);
      return data as Wedding;
    } catch (err) {
      console.error('❌ WeddingService: Unexpected error:', err);
      return null;
    }
  }

  async getWeddingById(id: string): Promise<Wedding | null> {
    const { data, error } = await this.supabase
      .from('weddings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching wedding:', error);
      return null;
    }

    return data as Wedding;
  }

  async getUserWeddings(userId: string): Promise<Wedding[]> {
    // First get wedding IDs from wedding_admins
    const { data: adminEntries } = await this.supabase
      .from('wedding_admins')
      .select('wedding_id')
      .eq('user_id', userId);

    const adminWeddingIds = (adminEntries || []).map((e: { wedding_id: string }) => e.wedding_id);

    // Fetch weddings created by user OR where they are an admin
    const { data, error } = await this.supabase
      .from('weddings')
      .select('*')
      .or(
        adminWeddingIds.length > 0
          ? `created_by.eq.${userId},id.in.(${adminWeddingIds.join(',')})`
          : `created_by.eq.${userId}`
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user weddings:', error);
      return [];
    }

    // Filter out demo clones (demo- prefixed slugs) so they don't pollute the user's dashboard
    return ((data || []) as Wedding[]).filter(w => !w.slug.startsWith('demo-'));
  }

  async createWedding(wedding: TablesInsert<'weddings'>): Promise<Wedding | null> {
    const { data, error } = await this.supabase
      .from('weddings')
      .insert([wedding])
      .select()
      .single();

    if (error) {
      console.error('Error creating wedding:', error);
      return null;
    }

    // Automatically create wedding_admins entry for the creator
    if (data && wedding.created_by) {
      const adminEntry: TablesInsert<'wedding_admins'> = {
        wedding_id: data.id,
        user_id: wedding.created_by,
        role: 'owner',
      };

      const { error: adminError } = await this.supabase
        .from('wedding_admins')
        .insert([adminEntry]);

      if (adminError) {
        console.error('Error creating wedding_admins entry:', adminError);
        // Don't fail the wedding creation if admin entry fails
        // The wedding is still created, just log the error
      } else {
        console.log('✅ Created wedding_admins entry for user:', wedding.created_by);
      }
    }

    return data;
  }

  async updateWedding(id: string, updates: TablesUpdate<'weddings'>): Promise<Wedding | null> {
    const { data, error } = await this.supabase
      .from('weddings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating wedding:', error);
      return null;
    }

    return data;
  }

  async deleteWedding(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('weddings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting wedding:', error);
      return false;
    }

    return true;
  }

  async checkSlugAvailability(slug: string, excludeWeddingId?: string): Promise<boolean> {
    // We must use an RPC function to check availability because RLS prevents 
    // users from seeing 'draft' weddings of other users, which would lead 
    // to false positives in availability checks.
    const { data, error } = await this.supabase
      .rpc('check_slug_availability', { slug_to_check: slug });

    if (error) {
      console.error('Error checking slug availability via RPC:', error);

      // Fallback to client-side check if RPC fails for some reason
      let query = this.supabase
        .from('weddings')
        .select('id')
        .eq('slug', slug);

      if (excludeWeddingId) {
        query = query.neq('id', excludeWeddingId);
      }

      const { data: fallbackData, error: fallbackError } = await query;
      if (fallbackError) return false;
      return !fallbackData || fallbackData.length === 0;
    }

    // Since RPC checks the whole table, if we have an excludeWeddingId, 
    // we need to make sure we aren't blocking ourselves.
    // However, for onboarding, excludeWeddingId is usually not used.
    if (excludeWeddingId && data === false) {
      const { data: ownWedding } = await this.supabase
        .from('weddings')
        .select('id')
        .eq('slug', slug)
        .eq('id', excludeWeddingId)
        .single();

      if (ownWedding) return true;
    }

    return data === true;
  }

  // Events
  async getWeddingEvents(weddingId: string): Promise<WeddingEvent[]> {
    const { data, error } = await this.supabase
      .from('wedding_events')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching wedding events:', error);
      return [];
    }

    return (data || []) as unknown as WeddingEvent[];
  }

  async getEventBySlug(weddingId: string, slug: string): Promise<WeddingEvent | null> {
    const { data, error } = await this.supabase
      .from('wedding_events')
      .select('*')
      .eq('wedding_id', weddingId)
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      return null;
    }

    return data as unknown as WeddingEvent;
  }

  async createEvent(event: TablesInsert<'wedding_events'>): Promise<WeddingEvent | null> {
    const invalid = validateEventPayload(event);
    if (invalid) {
      console.error('Error creating event:', invalid);
      return null;
    }

    const { data, error } = await this.supabase
      .from('wedding_events')
      .insert([event])
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return null;
    }

    return data as unknown as WeddingEvent;
  }

  async updateEvent(id: string, updates: TablesUpdate<'wedding_events'>): Promise<WeddingEvent | null> {
    const invalid = validateEventPayload(updates, { partial: true });
    if (invalid) {
      console.error('Error updating event:', invalid);
      return null;
    }

    const { data, error } = await this.supabase
      .from('wedding_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      return null;
    }

    return data as unknown as WeddingEvent;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('wedding_events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      return false;
    }

    return true;
  }

  // Schedule
  async getWeddingSchedule(weddingId: string): Promise<Array<WeddingSchedule & { events: ScheduleItem[] }>> {
    const { data: schedules, error: scheduleError } = await this.supabase
      .from('wedding_schedule')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('order_index', { ascending: true });

    if (scheduleError) {
      console.error('Error fetching wedding schedule:', scheduleError);
      return [];
    }

    if (!schedules || schedules.length === 0) {
      return [];
    }

    // Sort days chronologically by date (handles both ISO and legacy "Day - Month D, YYYY" formats)
    schedules.sort((a, b) => {
      const parse = (d: string) => { try { const p = new Date(d.replace(/\s*-\s*/, ', ')); return isNaN(p.getTime()) ? 0 : p.getTime(); } catch { return 0; } };
      return parse(a.date) - parse(b.date);
    });

    const scheduleIds = schedules.map(s => s.id);
    const { data: items, error: itemsError } = await this.supabase
      .from('schedule_items')
      .select('*')
      .in('schedule_id', scheduleIds)
      .order('order_index', { ascending: true });

    if (itemsError) {
      console.error('Error fetching schedule items:', itemsError);
      return schedules.map(s => ({ ...s, events: [] }));
    }

    return schedules.map(schedule => ({
      ...schedule,
      events: items?.filter(item => item.schedule_id === schedule.id) || []
    }));
  }

  async createSchedule(schedule: TablesInsert<'wedding_schedule'>): Promise<WeddingSchedule | null> {
    const { data, error } = await this.supabase
      .from('wedding_schedule')
      .insert([schedule])
      .select()
      .single();

    if (error) {
      console.error('Error creating schedule:', error);
      return null;
    }

    return data as WeddingSchedule;
  }

  async updateSchedule(id: string, updates: TablesUpdate<'wedding_schedule'>): Promise<WeddingSchedule | null> {
    const { data, error } = await this.supabase
      .from('wedding_schedule')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating schedule:', error);
      return null;
    }

    return data as WeddingSchedule;
  }

  async deleteSchedule(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('wedding_schedule')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting schedule:', error);
      return false;
    }

    return true;
  }

  async createScheduleItem(item: TablesInsert<'schedule_items'>): Promise<ScheduleItem | null> {
    const { data, error } = await this.supabase
      .from('schedule_items')
      .insert([item])
      .select()
      .single();

    if (error) {
      console.error('Error creating schedule item:', error);
      return null;
    }

    return data as ScheduleItem;
  }

  async updateScheduleItem(id: string, updates: TablesUpdate<'schedule_items'>): Promise<ScheduleItem | null> {
    const { data, error } = await this.supabase
      .from('schedule_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating schedule item:', error);
      return null;
    }

    return data as ScheduleItem;
  }

  async deleteScheduleItem(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('schedule_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting schedule item:', error);
      return false;
    }

    return true;
  }

  async reorderScheduleItems(
    items: { id: string; order_index: number; schedule_id?: string }[]
  ): Promise<boolean> {
    try {
      const updates = items.map(item => {
        const patch: { order_index: number; schedule_id?: string } = { order_index: item.order_index };
        if (item.schedule_id !== undefined) patch.schedule_id = item.schedule_id;
        return this.supabase
          .from('schedule_items')
          .update(patch)
          .eq('id', item.id);
      });

      const results = await Promise.all(updates);
      const hasError = results.some(r => r.error);

      if (hasError) {
        console.error('Error reordering schedule items');
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in reorderScheduleItems:', err);
      return false;
    }
  }

  // Travel Cards (legacy — use TravelSections instead)
  /** @deprecated Use getTravelSections instead */
  async getTravelCards(weddingId: string): Promise<WeddingTravelCard[]> {
    const { data, error } = await this.supabase
      .from('wedding_travel_cards')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching travel cards:', error);
      return [];
    }

    return data || [];
  }

  async createTravelCard(card: TablesInsert<'wedding_travel_cards'>): Promise<WeddingTravelCard | null> {
    const { data, error } = await this.supabase
      .from('wedding_travel_cards')
      .insert([card])
      .select()
      .single();

    if (error) {
      console.error('Error creating travel card:', error);
      return null;
    }

    return data as WeddingTravelCard;
  }

  async updateTravelCard(id: string, updates: TablesUpdate<'wedding_travel_cards'>): Promise<WeddingTravelCard | null> {
    const { data, error } = await this.supabase
      .from('wedding_travel_cards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating travel card:', error);
      return null;
    }

    return data as WeddingTravelCard;
  }

  async deleteTravelCard(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('wedding_travel_cards')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting travel card:', error);
      return false;
    }

    return true;
  }

  // Travel Sections (new structured travel system)
  async getTravelSections(weddingId: string): Promise<TravelSection[]> {
    const { data, error } = await this.supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- travel_sections not yet in generated supabase types
      .from('travel_sections' as any)
      .select('*')
      .eq('wedding_id', weddingId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching travel sections:', error);
      return [];
    }

    return (data || []) as unknown as TravelSection[];
  }

  async createTravelSection(section: TravelSectionInsert): Promise<TravelSection | null> {
    const { data, error } = await this.supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- travel_sections not yet in generated supabase types
      .from('travel_sections' as any)
      .insert([section])
      .select()
      .single();

    if (error) {
      console.error('Error creating travel section:', error);
      return null;
    }

    return data as unknown as TravelSection;
  }

  async updateTravelSection(id: string, updates: TravelSectionUpdate): Promise<TravelSection | null> {
    const { data, error } = await this.supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- travel_sections not yet in generated supabase types
      .from('travel_sections' as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating travel section:', error);
      return null;
    }

    return data as unknown as TravelSection;
  }

  async deleteTravelSection(id: string): Promise<boolean> {
    const { error } = await this.supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- travel_sections not yet in generated supabase types
      .from('travel_sections' as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting travel section:', error);
      return false;
    }

    return true;
  }

  async reorderTravelSections(items: { id: string; order_index: number }[]): Promise<boolean> {
    try {
      await Promise.all(
        items.map(item =>
          this.supabase
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- travel_sections not yet in generated supabase types
      .from('travel_sections' as any)
            .update({ order_index: item.order_index })
            .eq('id', item.id)
        )
      );
      return true;
    } catch (error) {
      console.error('Error reordering travel sections:', error);
      return false;
    }
  }

  // FAQs
  async getFAQs(weddingId: string): Promise<WeddingFAQ[]> {
    const { data, error } = await this.supabase
      .from('wedding_faqs')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching FAQs:', error);
      return [];
    }

    return data || [];
  }

  async createFAQ(faq: TablesInsert<'wedding_faqs'>): Promise<WeddingFAQ | null> {
    const { data, error } = await this.supabase
      .from('wedding_faqs')
      .insert([faq])
      .select()
      .single();

    if (error) {
      console.error('Error creating FAQ:', error);
      return null;
    }

    return data as WeddingFAQ;
  }

  async updateFAQ(id: string, updates: TablesUpdate<'wedding_faqs'>): Promise<WeddingFAQ | null> {
    const { data, error } = await this.supabase
      .from('wedding_faqs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating FAQ:', error);
      return null;
    }

    return data as WeddingFAQ;
  }

  async deleteFAQ(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('wedding_faqs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting FAQ:', error);
      return false;
    }

    return true;
  }

  // Registry
  async getRegistry(weddingId: string): Promise<WeddingRegistry[]> {
    const { data, error } = await this.supabase
      .from('wedding_registry')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching registry:', error);
      return [];
    }

    return data || [];
  }

  async createRegistryItem(item: TablesInsert<'wedding_registry'>): Promise<WeddingRegistry | null> {
    const { data, error } = await this.supabase
      .from('wedding_registry')
      .insert([item])
      .select()
      .single();

    if (error) {
      console.error('Error creating registry item:', error);
      return null;
    }

    return data as WeddingRegistry;
  }

  async updateRegistryItem(id: string, updates: TablesUpdate<'wedding_registry'>): Promise<WeddingRegistry | null> {
    const { data, error } = await this.supabase
      .from('wedding_registry')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating registry item:', error);
      return null;
    }

    return data as WeddingRegistry;
  }

  async deleteRegistryItem(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('wedding_registry')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting registry item:', error);
      return false;
    }

    return true;
  }

  // Shops
  async getShops(weddingId: string): Promise<WeddingShop[]> {
    const { data, error } = await this.supabase
      .from('wedding_shops')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching shops:', error);
      return [];
    }

    return data || [];
  }

  async createShop(shop: TablesInsert<'wedding_shops'>): Promise<WeddingShop | null> {
    const { data, error } = await this.supabase
      .from('wedding_shops')
      .insert([shop])
      .select()
      .single();

    if (error) {
      console.error('Error creating shop:', error);
      return null;
    }

    return data as WeddingShop;
  }

  async updateShop(id: string, updates: TablesUpdate<'wedding_shops'>): Promise<WeddingShop | null> {
    const { data, error } = await this.supabase
      .from('wedding_shops')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating shop:', error);
      return null;
    }

    return data as WeddingShop;
  }

  async deleteShop(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('wedding_shops')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting shop:', error);
      return false;
    }

    return true;
  }

  // Settings
  async getSettings(weddingId: string): Promise<WeddingSettings | null> {
    const { data, error } = await this.supabase
      .from('wedding_settings')
      .select('*')
      .eq('wedding_id', weddingId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      return null;
    }

    return data;
  }

  async createSettings(settings: TablesInsert<'wedding_settings'>): Promise<WeddingSettings | null> {
    const { data, error } = await this.supabase
      .from('wedding_settings')
      .insert([settings])
      .select()
      .single();

    if (error) {
      console.error('Error creating settings:', error);
      return null;
    }

    return data as WeddingSettings;
  }

  async updateSettings(weddingId: string, updates: TablesUpdate<'wedding_settings'>): Promise<WeddingSettings | null> {
    const { data, error } = await this.supabase
      .from('wedding_settings')
      .update(updates)
      .eq('wedding_id', weddingId)
      .select()
      .single();

    if (error) {
      console.error('Error updating settings:', error);
      return null;
    }

    return data as WeddingSettings;
  }

  // Admins
  async getWeddingAdmins(weddingId: string): Promise<WeddingAdmin[]> {
    const { data, error } = await this.supabase
      .from('wedding_admins')
      .select('*')
      .eq('wedding_id', weddingId);

    if (error) {
      console.error('Error fetching wedding admins:', error);
      return [];
    }

    return (data || []) as WeddingAdmin[];
  }

  async addWeddingAdmin(admin: TablesInsert<'wedding_admins'>): Promise<WeddingAdmin | null> {
    const { data, error } = await this.supabase
      .from('wedding_admins')
      .insert([admin])
      .select()
      .single();

    if (error) {
      console.error('Error adding wedding admin:', error);
      return null;
    }

    return data as WeddingAdmin;
  }

  async removeWeddingAdmin(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('wedding_admins')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error removing wedding admin:', error);
      return false;
    }

    return true;
  }

  async isUserWeddingAdmin(weddingId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('weddings')
      .select('id, created_by')
      .eq('id', weddingId)
      .single();

    if (error || !data) {
      return false;
    }

    if (data.created_by === userId) {
      return true;
    }

    const { data: adminData, error: adminError } = await this.supabase
      .from('wedding_admins')
      .select('id')
      .eq('wedding_id', weddingId)
      .eq('user_id', userId)
      .single();

    return !adminError && !!adminData;
  }

  // Team Members - Get all team members with their details
  async getTeamMembers(weddingId: string): Promise<TeamMember[]> {
    // First get the wedding to find the owner
    const { data: wedding, error: weddingError } = await this.supabase
      .from('weddings')
      .select('created_by')
      .eq('id', weddingId)
      .single();

    if (weddingError || !wedding) {
      console.error('Error fetching wedding for team members:', weddingError);
      return [];
    }

    // Get the owner's email from auth.users using a separate query
    const { data: { user: currentUser } } = await this.supabase.auth.getUser();

    const teamMembers: TeamMember[] = [];

    // Add the owner as the first team member
    // We'll get the owner's email from the current user if they're the owner,
    // otherwise we just show "Owner" as they can see it in the admin list
    if (currentUser && currentUser.id === wedding.created_by) {
      teamMembers.push({
        id: 'owner',
        user_id: wedding.created_by || '',
        email: currentUser.email || 'Owner',
        role: 'owner',
        created_at: '',
        is_owner: true,
      });
    } else {
      // For non-owners viewing the team, show the owner without email
      teamMembers.push({
        id: 'owner',
        user_id: wedding.created_by || '',
        email: 'Wedding Owner',
        role: 'owner',
        created_at: '',
        is_owner: true,
      });
    }

    // Get all admins from wedding_admins table
    const { data: admins, error: adminsError } = await this.supabase
      .from('wedding_admins')
      .select('*')
      .eq('wedding_id', weddingId);

    if (adminsError) {
      console.error('Error fetching wedding admins:', adminsError);
      return teamMembers;
    }

    // Add admins to the team members list
    // Note: We can't directly get emails from auth.users, so admins will need to be matched via user_id
    if (admins) {
      for (const admin of admins) {
        // Skip any admin row that points to the wedding owner — they're already
        // rendered as the "Owner" entry at the top. Happens when the owner
        // accepts their own invite or legacy data double-counts them.
        if (admin.user_id && admin.user_id === wedding.created_by) continue;

        // If the current user is one of the admins, we can show their email
        if (currentUser && admin.user_id === currentUser.id) {
          teamMembers.push({
            id: admin.id,
            user_id: admin.user_id || '',
            email: currentUser.email || 'Unknown',
            role: admin.role as 'owner' | 'admin' | 'viewer',
            created_at: admin.created_at || '',
            is_owner: false,
          });
        } else {
          teamMembers.push({
            id: admin.id,
            user_id: admin.user_id || '',
            email: 'Team Member',
            role: admin.role as 'owner' | 'admin' | 'viewer',
            created_at: admin.created_at || '',
            is_owner: false,
          });
        }
      }
    }

    return teamMembers;
  }

  // Wedding Invites
  async getWeddingInvites(weddingId: string): Promise<WeddingInvite[]> {
    const { data, error } = await this.supabase
      .from('wedding_invites')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wedding invites:', error);
      return [];
    }

    return data || [];
  }

  async createWeddingInvite(invite: TablesInsert<'wedding_invites'>): Promise<WeddingInvite | null> {
    try {
      const { data, error } = await this.supabase
        .from('wedding_invites')
        .insert([invite])
        .select()
        .single();

      if (error) {
        // Log the full error object structure
        console.error('Error creating wedding invite:', error);
        console.error('Error type:', typeof error);
        console.error('Error keys:', Object.keys(error));
        console.error('Error stringified:', JSON.stringify(error, null, 2));
        console.error('Error details:', {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          inviteData: invite,
        });

        // Check if it's a table not found error
        if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
          const enhancedError = new Error('The wedding_invites table does not exist. Please run the migration first.');
          (enhancedError as Error & { originalError?: unknown }).originalError = error;
          throw enhancedError;
        }

        // Check if it's an RLS policy error
        if (error?.code === '42501' || error?.message?.includes('permission denied') || error?.message?.includes('policy')) {
          const enhancedError = new Error('Permission denied. You may not have permission to invite team members for this wedding.');
          (enhancedError as Error & { originalError?: unknown }).originalError = error;
          throw enhancedError;
        }

        // Create a more descriptive error
        const errorMessage = error?.message || error?.code || 'Unknown database error';
        const enhancedError = new Error(`Failed to create invite: ${errorMessage}`);
        (enhancedError as Error & { originalError?: unknown }).originalError = error;
        throw enhancedError;
      }

      return data as WeddingInvite;
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      // If it's already our enhanced error, re-throw it
      if (errObj.message && errObj.message !== 'Unknown database error') {
        throw err;
      }

      // Otherwise, wrap it
      console.error('Unexpected error in createWeddingInvite:', err);
      throw new Error(`Failed to create invite: ${errObj.message || 'Unknown error'}`);
    }
  }

  async deleteWeddingInvite(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('wedding_invites')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting wedding invite:', error);
      return false;
    }

    return true;
  }

  // Process pending invites for a user (called after login/signup)
  async processInvitesForUser(userEmail: string, userId: string): Promise<number> {
    // Find all pending invites for this email
    const { data: invites, error: fetchError } = await this.supabase
      .from('wedding_invites')
      .select('*')
      .eq('email', userEmail.toLowerCase());

    if (fetchError || !invites || invites.length === 0) {
      return 0;
    }

    let processedCount = 0;

    for (const invite of invites) {
      // Check if user is already an admin for this wedding
      const { data: existingAdmin } = await this.supabase
        .from('wedding_admins')
        .select('id')
        .eq('wedding_id', invite.wedding_id as string)
        .eq('user_id', userId)
        .single();

      if (!existingAdmin) {
        // Add user as admin
        const { error: insertError } = await this.supabase
          .from('wedding_admins')
          .insert([{
            wedding_id: invite.wedding_id as string,
            user_id: userId,
            role: invite.role,
          }]);

        if (!insertError) {
          // Delete the processed invite
          await this.supabase
            .from('wedding_invites')
            .delete()
            .eq('id', invite.id);

          processedCount++;
        }
      } else {
        // User already has access, just delete the invite
        await this.supabase
          .from('wedding_invites')
          .delete()
          .eq('id', invite.id);
      }
    }

    return processedCount;
  }

  // Check if an invite already exists for this email and wedding
  async checkInviteExists(weddingId: string, email: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('wedding_invites')
      .select('id')
      .eq('wedding_id', weddingId)
      .eq('email', email.toLowerCase())
      .single();

    return !error && !!data;
  }

  // Update order of schedule items (for drag and drop reordering)
  async updateScheduleItemsOrder(items: { id: string; order_index: number }[]): Promise<boolean> {
    try {
      const results = await Promise.all(
        items.map(item =>
          this.supabase
            .from('schedule_items')
            .update({ order_index: item.order_index })
            .eq('id', item.id)
        )
      );

      const hasError = results.some(r => r.error);
      if (hasError) {
        console.error('Error updating item order');
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error in updateScheduleItemsOrder:', err);
      return false;
    }
  }

  // Prepopulate schedule from simran-karanvir wedding template

  async prepopulateScheduleFromTemplate(weddingId: string, weddingDateStart: Date, weddingDateEnd: Date | null): Promise<boolean> {
    try {
      const templateSlug = process.env.TEMPLATE_WEDDING_SLUG || 'simran-karanvir';
      console.log(`Prepopulating schedule from ${templateSlug} template...`);

      const { data: templateWedding, error: weddingError } = await this.supabase
        .from('weddings')
        .select('id')
        .eq('slug', templateSlug)
        .single();

      if (weddingError || !templateWedding) {
        console.error(`Template wedding ${templateSlug} not found`);

        return false;
      }

      // Get template events
      const { data: templateEventsRaw, error: eventsError } = await this.supabase
        .from('wedding_events')
        .select('*')
        .eq('wedding_id', templateWedding.id)
        .order('order_index', { ascending: true });
      const templateEvents = templateEventsRaw as WeddingEvent[] | null;

      if (eventsError) {
        console.error('Error fetching template events:', eventsError);
        return false;
      }

      // Get template schedule
      const { data: templateScheduleRaw, error: scheduleError } = await this.supabase
        .from('wedding_schedule')
        .select('*')
        .eq('wedding_id', templateWedding.id)
        .order('order_index', { ascending: true });
      const templateSchedule = templateScheduleRaw as WeddingSchedule[] | null;

      if (scheduleError) {
        console.error('Error fetching template schedule:', scheduleError);
        return false;
      }

      // Get template items for all schedule days
      const scheduleIds = templateSchedule?.map(s => s.id) || [];
      const { data: templateItemsRaw, error: itemsError } = await this.supabase
        .from('schedule_items')
        .select('*')
        .in('schedule_id', scheduleIds)
        .order('order_index', { ascending: true });
      const templateItems = templateItemsRaw as ScheduleItem[] | null;

      if (itemsError) {
        console.error('Error fetching template items:', itemsError);
        return false;
      }

      // Calculate actual duration in days
      const durationInDays = weddingDateEnd
        ? Math.max(1, Math.ceil((weddingDateEnd.getTime() - weddingDateStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
        : 1;

      console.log(`📊 Wedding duration: ${durationInDays} days`);

      // Create events for the new wedding (cloning from template)
      const eventIdMapping: Record<string, string> = {};

      for (const event of (templateEvents || [])) {
        // If 1-day wedding, only include the most critical events (Anand Karaj/Wedding, Reception)
        if (durationInDays === 1) {
          const lowerName = event.name.toLowerCase();
          if (!lowerName.includes('wedding') && !lowerName.includes('anand karaj') && !lowerName.includes('reception')) {
            continue;
          }
        }

        // If 2-day wedding, maybe skip the earliest pre-wedding day (Day 1 of 3)
        // For simplicity and since we don't know exactly which events are on which days in the template,
        // we'll filter schedule days first and then only link events that have matching items.
        // But we'll clone all events for now to ensure they are available to be linked.

        const newEvent: TablesInsert<'wedding_events'> = {
          wedding_id: weddingId,
          name: event.name,
          slug: event.slug,
          date: event.date ?? '',
          time: event.time,
          dress_code: event.dress_code ?? '',
          dress_code_icon: event.dress_code_icon,
          dress_code_description: event.dress_code_description,
          outfit_ideas_women: event.outfit_ideas_women,
          outfit_ideas_men: event.outfit_ideas_men,
          ritual_name: event.ritual_name,
          ritual_description: event.ritual_description,
          carousel_slides: event.carousel_slides as unknown as Json,
          gradient_background: event.gradient_background,
          text_color: event.text_color,
          order_index: event.order_index,
          is_template: false,
        };

        const createdEvent = await this.createEvent(newEvent);
        if (createdEvent) {
          eventIdMapping[event.id] = createdEvent.id;
        }
      }

      // Create schedule days for the new wedding
      const scheduleIdMapping: Record<string, string> = {};

      // Filter template schedule based on user's duration
      const filteredTemplateSchedule = (templateSchedule || []).slice(0, durationInDays);

      for (const day of filteredTemplateSchedule) {
        // Adjust date relative to new wedding date
        const adjustedDate = new Date(weddingDateStart);
        adjustedDate.setDate(adjustedDate.getDate() + day.order_index);

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[adjustedDate.getDay()];
        // Store as ISO date string (yyyy-MM-dd) for consistent formatting
        const yyyy = adjustedDate.getFullYear();
        const mm = String(adjustedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(adjustedDate.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        const newDay: TablesInsert<'wedding_schedule'> = {
          wedding_id: weddingId,
          day_name: dayName,
          date: dateStr,
          order_index: day.order_index,
        };

        const createdDay = await this.createSchedule(newDay);
        if (createdDay) {
          scheduleIdMapping[day.id as string] = createdDay.id;
        }
      }

      // Create schedule items for the new wedding
      for (const item of (templateItems || [])) {
        const newScheduleId = scheduleIdMapping[item.schedule_id as string];
        if (!newScheduleId) continue;

        // Check if this item corresponds to a major event by matching names
        let linkedEventId = null;
        let isMajorEvent = false;
        let gradientBackground = null;

        // Match item to event by checking if item name contains event keywords
        for (const event of (templateEvents || [])) {
          if (item.name.toLowerCase().includes('haldi') && event.name.toLowerCase().includes('haldi')) {
            linkedEventId = eventIdMapping[event.id];
            isMajorEvent = true;
            gradientBackground = event.gradient_background;
            break;
          }
          if ((item.name.toLowerCase().includes('baraat') || item.name.toLowerCase().includes('jaggo') || item.name.toLowerCase().includes('varmala'))
            && event.name.toLowerCase().includes('baraat')) {
            linkedEventId = eventIdMapping[event.id];
            isMajorEvent = true;
            gradientBackground = event.gradient_background;
            break;
          }
          if (item.name.toLowerCase().includes('anand karaj') && event.name.toLowerCase().includes('anand karaj')) {
            linkedEventId = eventIdMapping[event.id];
            isMajorEvent = true;
            gradientBackground = event.gradient_background;
            break;
          }
          if (item.name.toLowerCase().includes('pool party') && event.name.toLowerCase().includes('pool party')) {
            linkedEventId = eventIdMapping[event.id];
            isMajorEvent = true;
            gradientBackground = event.gradient_background;
            break;
          }
          if ((item.name.toLowerCase().includes('sangeet') || item.name.toLowerCase().includes('reception'))
            && event.name.toLowerCase().includes('reception')) {
            linkedEventId = eventIdMapping[event.id];
            isMajorEvent = true;
            gradientBackground = event.gradient_background;
            break;
          }
        }

        const newItem: TablesInsert<'schedule_items'> = {
          schedule_id: newScheduleId,
          time: item.time,
          name: item.name,
          description: item.description,
          location: item.location,
          order_index: item.order_index,
          is_major_event: isMajorEvent,
          gradient_background: gradientBackground,
          linked_event_id: linkedEventId,
        };

        await this.createScheduleItem(newItem);
      }

      console.log('✅ Schedule prepopulated successfully');
      return true;
    } catch (err) {
      console.error('Error prepopulating schedule:', err);
      return false;
    }
  }

  // Task management
  async getTasks(weddingId: string): Promise<Task[]> {
    const { data, error } = await this.supabase
      .from('wedding_tasks')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
    return data as Task[];
  }

  async createTask(task: Partial<Task>): Promise<Task | null> {
    const { data, error } = await this.supabase
      .from('wedding_tasks')
      .insert([task])
      .select()
      .single();
    if (error) {
      console.error('Error creating task:', error);
      return null;
    }
    return data as Task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const { data, error } = await this.supabase
      .from('wedding_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Error updating task:', error);
      return null;
    }
    return data as Task;
  }

  async deleteTask(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('wedding_tasks')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting task:', error);
      return false;
    }
    return true;
  }

  async submitFeatureRequest(userId: string, weddingId: string | undefined, content: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('feature_requests')
      .insert([{ user_id: userId, wedding_id: weddingId || null, content }]);
    if (error) {
      console.error('Error submitting feature request:', error);
      return false;
    }
    return true;
  }

  // Clear all content for a wedding (for testing)
  async clearWeddingContent(weddingId: string): Promise<boolean> {
    try {
      console.log('🗑️ WeddingService: Clearing content for wedding:', weddingId);

      // Delete in correct order to respect dependencies if any
      await this.supabase.from('wedding_faqs').delete().eq('wedding_id', weddingId);
      await this.supabase.from('wedding_registry').delete().eq('wedding_id', weddingId);
      await this.supabase.from('wedding_travel_cards').delete().eq('wedding_id', weddingId);
      await this.supabase.from('wedding_events').delete().eq('wedding_id', weddingId);

      // Schedule items usually cascade from schedule, but let's be safe
      const { data: schedules } = await this.supabase.from('wedding_schedule').select('id').eq('wedding_id', weddingId);
      if (schedules && schedules.length > 0) {
        const scheduleIds = schedules.map(s => s.id);
        await this.supabase.from('schedule_items').delete().in('schedule_id', scheduleIds);
      }
      await this.supabase.from('wedding_schedule').delete().eq('wedding_id', weddingId);

      // Reset wedding-specific fields if needed (optional, user didn't ask for this specifically but it's good practice)
      // await this.supabase.from('weddings').update({ 
      //   welcome_text: null, 
      //   primary_color: '#DE3F5E',
      //   rsvp_deadline: null 
      // }).eq('id', weddingId);

      console.log('✅ WeddingService: Content cleared successfully');
      return true;
    } catch (err) {
      console.error('❌ WeddingService: Error clearing content:', err);
      return false;
    }
  }

  // Planner Profiles
  async createPlannerProfile({ userId, companyName, location }: { userId: string; companyName: string; location: string }): Promise<boolean> {
    const { error } = await this.supabase
      .from('planner_profiles')
      .upsert([{
        user_id: userId,
        company_name: companyName,
        location,
      }], { onConflict: 'user_id' });

    if (error) {
      console.error('Error creating planner profile:', error);
      return false;
    }
    return true;
  }

  async getPlannerProfile(userId: string): Promise<{ company_name: string; location: string } | null> {
    const { data, error } = await this.supabase
      .from('planner_profiles')
      .select('company_name, location')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching planner profile:', error);
      return null;
    }
    return data;
  }

  // Publish Snapshot
  async publishWedding(weddingId: string): Promise<boolean> {
    try {
      // Fetch all wedding data in parallel
      const [wedding, events, schedule, faqs, travelCards, registry, shops, settings] = await Promise.all([
        this.getWeddingById(weddingId),
        this.getWeddingEvents(weddingId),
        this.getWeddingSchedule(weddingId),
        this.getFAQs(weddingId),
        this.getTravelCards(weddingId),
        this.getRegistry(weddingId),
        this.getShops(weddingId),
        this.getSettings(weddingId),
      ]);

      if (!wedding) {
        console.error('Wedding not found for publishing:', weddingId);
        return false;
      }

      const snapshot = {
        wedding,
        events,
        schedule,
        faqs,
        travelCards,
        registry,
        shops,
        settings,
        publishedAt: new Date().toISOString(),
      };

      const { error } = await this.supabase
        .from('weddings')
        .update({
          published_snapshot: snapshot as unknown as Json,
          has_unpublished_changes: false,
          last_published_at: new Date().toISOString(),
          status: 'live',
        })
        .eq('id', weddingId);

      if (error) {
        console.error('Error publishing wedding:', error);
        return false;
      }

      console.log('✅ Wedding published successfully');
      return true;
    } catch (err) {
      console.error('Error in publishWedding:', err);
      return false;
    }
  }

  async markUnpublishedChanges(weddingId: string): Promise<void> {
    const { error } = await this.supabase
      .from('weddings')
      .update({ has_unpublished_changes: true })
      .eq('id', weddingId);

    if (error) {
      console.error('Error marking unpublished changes:', error);
    }
  }

  // RSVP Stats
  async getRSVPStats(weddingId: string): Promise<{ total: number; yes: number; no: number; maybe: number; plusOnes: number }> {
    try {
      const { data, error } = await this.supabase
        .from('rsvps')
        .select('attending, plus_one')
        .eq('wedding_id', weddingId);

      if (error || !data) {
        return { total: 0, yes: 0, no: 0, maybe: 0, plusOnes: 0 };
      }

      return {
        total: data.length,
        yes: data.filter(r => r.attending === 'yes').length,
        no: data.filter(r => r.attending === 'no').length,
        maybe: data.filter(r => r.attending === 'maybe').length,
        plusOnes: data.filter(r => r.plus_one).length,
      };
    } catch (err) {
      console.error('Error fetching RSVP stats:', err);
      return { total: 0, yes: 0, no: 0, maybe: 0, plusOnes: 0 };
    }
  }
  async updateRsvpConfirmationMessages(weddingSlug: string, messages: Record<string, { heading: string; body: string }>) {
    const { error } = await supabase
      .from('weddings')
      .update({ rsvp_confirmation_messages: messages as unknown as Json })
      .eq('slug', weddingSlug);

    if (error) throw error;
  }

  async updateHiddenRsvpSteps(weddingSlug: string, hiddenSteps: string[]) {
    const { error } = await supabase
      .from('weddings')
      .update({ hidden_rsvp_steps: hiddenSteps })
      .eq('slug', weddingSlug);

    if (error) throw error;
  }

  // ── Wedding password + per-guest event access ────────────────────────────
  // The `guest_event_access` table uses the default-true contract: a missing
  // (guest_id, event_id) row means the guest IS invited. We only write rows
  // when un-checking; we delete them when re-checking.

  // Password lives in `wedding_secrets` (admin-only RLS — no anon read;
  // migrations/20260705_wedding_secrets.sql). The legacy-column fallback
  // read covers passwords set before that migration deployed; it goes away
  // with 20260705b, which drops wedding_settings.wedding_password.
  async getWeddingPassword(weddingId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('wedding_secrets')
      .select('wedding_password')
      .eq('wedding_id', weddingId)
      .maybeSingle();
    if (error) {
      console.error('Error fetching wedding password:', error);
      return null;
    }
    if (data?.wedding_password) return data.wedding_password;

    const { data: legacy } = await this.supabase
      .from('wedding_settings')
      .select('wedding_password')
      .eq('wedding_id', weddingId)
      .maybeSingle();
    return (legacy as { wedding_password?: string | null } | null)?.wedding_password ?? null;
  }

  async setWeddingPassword(weddingId: string, password: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('wedding_secrets')
      .upsert(
        { wedding_id: weddingId, wedding_password: password, updated_at: new Date().toISOString() },
        { onConflict: 'wedding_id' },
      );
    if (error) { console.error('Error saving wedding password:', error); return false; }
    return true;
  }

  // `weddingSlug` is the TEXT slug (e.g. "priya-rahul-2026"), NOT the wedding
  // UUID. The `wedding_id` column on guest_event_access is TEXT and the RLS
  // policy resolves admin access via `is_wedding_owner_or_admin_by_slug`, so
  // storing UUID here would silently break both reads and writes.

  async listGuestEventAccess(weddingSlug: string): Promise<Array<{ guest_id: string; event_id: string; invited: boolean }>> {
    const { data, error } = await this.supabase
      .from('guest_event_access')
      .select('guest_id, event_id, invited')
      .eq('wedding_id', weddingSlug);
    if (error) {
      console.error('Error fetching guest_event_access:', error);
      return [];
    }
    return (data || []) as Array<{ guest_id: string; event_id: string; invited: boolean }>;
  }

  async setGuestEventInvited(
    weddingSlug: string,
    guestId: string,
    eventId: string,
    invited: boolean,
  ): Promise<boolean> {
    // Default-true contract: if invited === true, delete any existing row.
    if (invited) {
      const { error } = await this.supabase
        .from('guest_event_access')
        .delete()
        .eq('guest_id', guestId)
        .eq('event_id', eventId);
      if (error) { console.error('Error deleting guest_event_access row:', error); return false; }
      return true;
    }
    const { error } = await this.supabase
      .from('guest_event_access')
      .upsert([{ guest_id: guestId, event_id: eventId, wedding_id: weddingSlug, invited: false }], {
        onConflict: 'guest_id,event_id',
      });
    if (error) { console.error('Error upserting guest_event_access row:', error); return false; }
    return true;
  }
}

/**
 * Validates a wedding_events payload before write. Blocks empty / whitespace
 * name and date so downstream features (AI concierge weekday inference,
 * guest-facing schedule rendering) never have to cope with orphan rows. On
 * `partial: true` we only check fields that were actually provided, so
 * partial updates of unrelated fields aren't blocked.
 */
function validateEventPayload(
  payload: Record<string, unknown>,
  opts: { partial?: boolean } = {},
): string | null {
  const partial = !!opts.partial;
  const nameProvided = 'name' in payload;
  const dateProvided = 'date' in payload;

  const nameEmpty = typeof payload.name === 'string' && payload.name.trim() === '';
  const dateEmpty = typeof payload.date === 'string' && payload.date.trim() === '';

  if ((!partial || nameProvided) && (nameEmpty || (!partial && !payload.name))) {
    return 'Event name is required.';
  }
  if ((!partial || dateProvided) && (dateEmpty || (!partial && !payload.date))) {
    return 'Event date is required.';
  }
  return null;
}

// Export a singleton instance
export const weddingService = new WeddingService();

