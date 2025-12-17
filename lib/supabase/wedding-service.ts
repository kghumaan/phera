import { supabase } from './client';

// Types for wedding data
export interface Wedding {
  id: string;
  slug: string;
  couple_name: string;
  bride_name: string | null;
  groom_name: string | null;
  wedding_date: string;
  wedding_date_end: string | null;
  wedding_date_display: string;
  venue_name: string;
  venue_location: string;
  venue_flag: string | null;
  rsvp_deadline: string;
  status: 'draft' | 'live';
  couple_image_url: string | null;
  couple_images: string[] | null;
  frame_image_url: string | null;
  background_image: string;
  primary_color: string;
  font_color?: string | null;
  button_font_color?: string | null;
  pin_entry_text?: string | null;
  pin_entry_background?: string | null;
  pin_entry_primary_color?: string | null;
  pin_entry_font_color?: string | null;
  pin_entry_button_font_color?: string | null;
  pin_entry_subtitle_text?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WeddingEvent {
  id: string;
  wedding_id: string;
  name: string;
  slug: string;
  date: string;
  time: string;
  dress_code: string;
  dress_code_emoji: string | null;
  dress_code_description: string | null;
  outfit_ideas_women: string[];
  outfit_ideas_men: string[];
  ritual_name: string | null;
  ritual_description: string | null;
  carousel_images: string[];
  gradient_background: string | null;
  order_index: number;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeddingSchedule {
  id: string;
  wedding_id: string;
  day_name: string;
  date: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface ScheduleItem {
  id: string;
  schedule_id: string;
  time: string;
  name: string;
  description: string | null;
  location: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface WeddingTravelCard {
  id: string;
  wedding_id: string;
  title: string;
  content: string[];
  image_url: string;
  button_text: string | null;
  button_action: string | null;
  is_whatsapp_button: boolean;
  is_disabled: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface WeddingFAQ {
  id: string;
  wedding_id: string;
  question: string;
  answer: string;
  button_text: string | null;
  button_link: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface WeddingRegistry {
  id: string;
  wedding_id: string;
  fund_name: string;
  emoji: string;
  description: string | null;
  stripe_product_id: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface WeddingShop {
  id: string;
  wedding_id: string;
  name: string;
  details: string;
  url: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface WeddingSettings {
  id: string;
  wedding_id: string;
  pin_codes: Array<{
    pin: string;
    type: string;
    allows_plus_one: boolean;
    skip_rsvp?: boolean;
  }>;
  whatsapp_group_link: string | null;
  lapse_event_codes: Record<string, string>;
  google_sheets_id: string | null;
  custom_domain: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeddingAdmin {
  id: string;
  wedding_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'viewer';
  created_at: string;
}

export interface WeddingInvite {
  id: string;
  wedding_id: string;
  email: string;
  role: 'admin' | 'viewer';
  invited_by: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  role: 'owner' | 'admin' | 'viewer';
  created_at: string;
  is_owner: boolean;
}

// Wedding CRUD operations
export class WeddingService {
  private supabase = supabase;

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
      return data;
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

    return data;
  }

  async getUserWeddings(userId: string): Promise<Wedding[]> {
    const { data, error } = await this.supabase
      .from('weddings')
      .select('*')
      .or(`created_by.eq.${userId},id.in.(SELECT wedding_id FROM wedding_admins WHERE user_id = '${userId}')`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user weddings:', error);
      return [];
    }

    return data || [];
  }

  async createWedding(wedding: Partial<Wedding>): Promise<Wedding | null> {
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
      const adminEntry = {
        wedding_id: data.id,
        user_id: wedding.created_by,
        role: 'owner' as const,
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

  async updateWedding(id: string, updates: Partial<Wedding>): Promise<Wedding | null> {
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
    let query = this.supabase
      .from('weddings')
      .select('id')
      .eq('slug', slug);

    if (excludeWeddingId) {
      query = query.neq('id', excludeWeddingId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error checking slug availability:', error);
      return false;
    }

    return !data || data.length === 0;
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

    return data || [];
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

    return data;
  }

  async createEvent(event: Partial<WeddingEvent>): Promise<WeddingEvent | null> {
    const { data, error } = await this.supabase
      .from('wedding_events')
      .insert([event])
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return null;
    }

    return data;
  }

  async updateEvent(id: string, updates: Partial<WeddingEvent>): Promise<WeddingEvent | null> {
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

    return data;
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

  async createSchedule(schedule: Partial<WeddingSchedule>): Promise<WeddingSchedule | null> {
    const { data, error } = await this.supabase
      .from('wedding_schedule')
      .insert([schedule])
      .select()
      .single();

    if (error) {
      console.error('Error creating schedule:', error);
      return null;
    }

    return data;
  }

  async updateSchedule(id: string, updates: Partial<WeddingSchedule>): Promise<WeddingSchedule | null> {
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

    return data;
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

  async createScheduleItem(item: Partial<ScheduleItem>): Promise<ScheduleItem | null> {
    const { data, error } = await this.supabase
      .from('schedule_items')
      .insert([item])
      .select()
      .single();

    if (error) {
      console.error('Error creating schedule item:', error);
      return null;
    }

    return data;
  }

  async updateScheduleItem(id: string, updates: Partial<ScheduleItem>): Promise<ScheduleItem | null> {
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

    return data;
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

  // Travel Cards
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

  async createTravelCard(card: Partial<WeddingTravelCard>): Promise<WeddingTravelCard | null> {
    const { data, error } = await this.supabase
      .from('wedding_travel_cards')
      .insert([card])
      .select()
      .single();

    if (error) {
      console.error('Error creating travel card:', error);
      return null;
    }

    return data;
  }

  async updateTravelCard(id: string, updates: Partial<WeddingTravelCard>): Promise<WeddingTravelCard | null> {
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

    return data;
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

  async createFAQ(faq: Partial<WeddingFAQ>): Promise<WeddingFAQ | null> {
    const { data, error } = await this.supabase
      .from('wedding_faqs')
      .insert([faq])
      .select()
      .single();

    if (error) {
      console.error('Error creating FAQ:', error);
      return null;
    }

    return data;
  }

  async updateFAQ(id: string, updates: Partial<WeddingFAQ>): Promise<WeddingFAQ | null> {
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

    return data;
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

  async createRegistryItem(item: Partial<WeddingRegistry>): Promise<WeddingRegistry | null> {
    const { data, error } = await this.supabase
      .from('wedding_registry')
      .insert([item])
      .select()
      .single();

    if (error) {
      console.error('Error creating registry item:', error);
      return null;
    }

    return data;
  }

  async updateRegistryItem(id: string, updates: Partial<WeddingRegistry>): Promise<WeddingRegistry | null> {
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

    return data;
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

  async createShop(shop: Partial<WeddingShop>): Promise<WeddingShop | null> {
    const { data, error } = await this.supabase
      .from('wedding_shops')
      .insert([shop])
      .select()
      .single();

    if (error) {
      console.error('Error creating shop:', error);
      return null;
    }

    return data;
  }

  async updateShop(id: string, updates: Partial<WeddingShop>): Promise<WeddingShop | null> {
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

    return data;
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
      .single();

    if (error) {
      console.error('Error fetching settings:', error);
      return null;
    }

    return data;
  }

  async createSettings(settings: Partial<WeddingSettings>): Promise<WeddingSettings | null> {
    const { data, error } = await this.supabase
      .from('wedding_settings')
      .insert([settings])
      .select()
      .single();

    if (error) {
      console.error('Error creating settings:', error);
      return null;
    }

    return data;
  }

  async updateSettings(weddingId: string, updates: Partial<WeddingSettings>): Promise<WeddingSettings | null> {
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

    return data;
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

    return data || [];
  }

  async addWeddingAdmin(admin: Partial<WeddingAdmin>): Promise<WeddingAdmin | null> {
    const { data, error } = await this.supabase
      .from('wedding_admins')
      .insert([admin])
      .select()
      .single();

    if (error) {
      console.error('Error adding wedding admin:', error);
      return null;
    }

    return data;
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
        user_id: wedding.created_by,
        email: currentUser.email || 'Owner',
        role: 'owner',
        created_at: '',
        is_owner: true,
      });
    } else {
      // For non-owners viewing the team, show the owner without email
      teamMembers.push({
        id: 'owner',
        user_id: wedding.created_by,
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
        // If the current user is one of the admins, we can show their email
        if (currentUser && admin.user_id === currentUser.id) {
          teamMembers.push({
            id: admin.id,
            user_id: admin.user_id,
            email: currentUser.email || 'Unknown',
            role: admin.role,
            created_at: admin.created_at,
            is_owner: false,
          });
        } else {
          teamMembers.push({
            id: admin.id,
            user_id: admin.user_id,
            email: 'Team Member',
            role: admin.role,
            created_at: admin.created_at,
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

  async createWeddingInvite(invite: Partial<WeddingInvite>): Promise<WeddingInvite | null> {
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
          (enhancedError as any).originalError = error;
          throw enhancedError;
        }
        
        // Check if it's an RLS policy error
        if (error?.code === '42501' || error?.message?.includes('permission denied') || error?.message?.includes('policy')) {
          const enhancedError = new Error('Permission denied. You may not have permission to invite team members for this wedding.');
          (enhancedError as any).originalError = error;
          throw enhancedError;
        }
        
        // Create a more descriptive error
        const errorMessage = error?.message || error?.code || 'Unknown database error';
        const enhancedError = new Error(`Failed to create invite: ${errorMessage}`);
        (enhancedError as any).originalError = error;
        throw enhancedError;
      }

      return data;
    } catch (err: any) {
      // If it's already our enhanced error, re-throw it
      if (err.message && err.message !== 'Unknown database error') {
        throw err;
      }
      
      // Otherwise, wrap it
      console.error('Unexpected error in createWeddingInvite:', err);
      throw new Error(`Failed to create invite: ${err?.message || 'Unknown error'}`);
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
        .eq('wedding_id', invite.wedding_id)
        .eq('user_id', userId)
        .single();

      if (!existingAdmin) {
        // Add user as admin
        const { error: insertError } = await this.supabase
          .from('wedding_admins')
          .insert([{
            wedding_id: invite.wedding_id,
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

  async updateWedding(weddingId: string, updates: Partial<Wedding>): Promise<Wedding | null> {
    const { data, error } = await this.supabase
      .from('weddings')
      .update(updates)
      .eq('id', weddingId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating wedding:', error);
      return null;
    }
    
    return data;
  }
}

// Export a singleton instance
export const weddingService = new WeddingService();

