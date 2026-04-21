export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      comments: {
        Row: {
          created_at: string | null
          gif_id: string | null
          gif_preview_url: string | null
          gif_title: string | null
          gif_url: string | null
          guest_id: string | null
          id: string
          message: string | null
          wedding_id: string
        }
        Insert: {
          created_at?: string | null
          gif_id?: string | null
          gif_preview_url?: string | null
          gif_title?: string | null
          gif_url?: string | null
          guest_id?: string | null
          id?: string
          message?: string | null
          wedding_id: string
        }
        Update: {
          created_at?: string | null
          gif_id?: string | null
          gif_preview_url?: string | null
          gif_title?: string | null
          gif_url?: string | null
          guest_id?: string | null
          id?: string
          message?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      concierge_broadcast_recipients: {
        Row: {
          broadcast_id: string
          collected_data: Json | null
          created_at: string
          delivered_at: string | null
          delivery_status: string
          error_message: string | null
          guest_id: string
          id: string
          read_at: string | null
          replied_at: string | null
          reply_text: string | null
          wedding_id: string
          whatsapp_message_id: string | null
        }
        Insert: {
          broadcast_id: string
          collected_data?: Json | null
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string
          error_message?: string | null
          guest_id: string
          id?: string
          read_at?: string | null
          replied_at?: string | null
          reply_text?: string | null
          wedding_id: string
          whatsapp_message_id?: string | null
        }
        Update: {
          broadcast_id?: string
          collected_data?: Json | null
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string
          error_message?: string | null
          guest_id?: string
          id?: string
          read_at?: string | null
          replied_at?: string | null
          reply_text?: string | null
          wedding_id?: string
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "concierge_broadcast_recipients_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "concierge_broadcasts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concierge_broadcast_recipients_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      concierge_broadcasts: {
        Row: {
          collects_data: boolean
          created_at: string
          created_by: string | null
          data_schema: Json
          failed_count: number
          id: string
          message: string
          sent_at: string | null
          sent_count: number
          status: string
          target_guest_ids: string[] | null
          target_tags: string[] | null
          target_type: string
          wedding_id: string
        }
        Insert: {
          collects_data?: boolean
          created_at?: string
          created_by?: string | null
          data_schema?: Json
          failed_count?: number
          id?: string
          message: string
          sent_at?: string | null
          sent_count?: number
          status?: string
          target_guest_ids?: string[] | null
          target_tags?: string[] | null
          target_type: string
          wedding_id: string
        }
        Update: {
          collects_data?: boolean
          created_at?: string
          created_by?: string | null
          data_schema?: Json
          failed_count?: number
          id?: string
          message?: string
          sent_at?: string | null
          sent_count?: number
          status?: string
          target_guest_ids?: string[] | null
          target_tags?: string[] | null
          target_type?: string
          wedding_id?: string
        }
        Relationships: []
      }
      concierge_knowledge_base: {
        Row: {
          category: string
          content: string
          created_at: string | null
          generated_at: string | null
          id: string
          is_active: boolean
          order_index: number
          source: string
          title: string
          updated_at: string | null
          wedding_id: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string | null
          generated_at?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          source?: string
          title: string
          updated_at?: string | null
          wedding_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          generated_at?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          source?: string
          title?: string
          updated_at?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concierge_knowledge_base_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      conversation_members: {
        Row: {
          avatar_url: string | null
          conversation_id: string
          created_at: string | null
          id: string
          is_whatsapp_admin: boolean
          name: string | null
          phone: string
          role: string
          role_source: string | null
          updated_at: string | null
          wedding_id: string
        }
        Insert: {
          avatar_url?: string | null
          conversation_id: string
          created_at?: string | null
          id?: string
          is_whatsapp_admin?: boolean
          name?: string | null
          phone: string
          role?: string
          role_source?: string | null
          updated_at?: string | null
          wedding_id: string
        }
        Update: {
          avatar_url?: string | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_whatsapp_admin?: boolean
          name?: string | null
          phone?: string
          role?: string
          role_source?: string | null
          updated_at?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "vendor_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      coordination_issues: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string | null
          description: string | null
          due_date: string | null
          guest_id: string | null
          id: string
          metadata: Json | null
          priority: string | null
          resolution_notes: string | null
          resolved_at: string | null
          source: string | null
          status: string | null
          title: string
          wedding_id: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          guest_id?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          source?: string | null
          status?: string | null
          title: string
          wedding_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          guest_id?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          source?: string | null
          status?: string | null
          title?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coordination_issues_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_requests: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string
          wedding_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id: string
          wedding_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_id?: string
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_requests_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_checklist_items: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          guest_id: string | null
          id: string
          item_key: string
          wedding_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          guest_id?: string | null
          id?: string
          item_key: string
          wedding_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          guest_id?: string | null
          id?: string
          item_key?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_checklist_items_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_flights: {
        Row: {
          airline: string | null
          arrival_airport: string | null
          arrival_datetime: string | null
          created_at: string | null
          departure_airport: string | null
          departure_datetime: string | null
          flight_number: string | null
          guest_id: string | null
          id: string
          shuttle_preference_note: string | null
          shuttle_preference_time: string | null
          updated_at: string | null
          wedding_id: string
        }
        Insert: {
          airline?: string | null
          arrival_airport?: string | null
          arrival_datetime?: string | null
          created_at?: string | null
          departure_airport?: string | null
          departure_datetime?: string | null
          flight_number?: string | null
          guest_id?: string | null
          id?: string
          shuttle_preference_note?: string | null
          shuttle_preference_time?: string | null
          updated_at?: string | null
          wedding_id: string
        }
        Update: {
          airline?: string | null
          arrival_airport?: string | null
          arrival_datetime?: string | null
          created_at?: string | null
          departure_airport?: string | null
          departure_datetime?: string | null
          flight_number?: string | null
          guest_id?: string | null
          id?: string
          shuttle_preference_note?: string | null
          shuttle_preference_time?: string | null
          updated_at?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_flights_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_hotels: {
        Row: {
          check_in: string | null
          check_out: string | null
          confirmation_number: string | null
          created_at: string | null
          guest_id: string | null
          hotel_name: string | null
          id: string
          notes: string | null
          room_type: string | null
          status: string | null
          updated_at: string | null
          wedding_id: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          confirmation_number?: string | null
          created_at?: string | null
          guest_id?: string | null
          hotel_name?: string | null
          id?: string
          notes?: string | null
          room_type?: string | null
          status?: string | null
          updated_at?: string | null
          wedding_id: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          confirmation_number?: string | null
          created_at?: string | null
          guest_id?: string | null
          hotel_name?: string | null
          id?: string
          notes?: string | null
          room_type?: string | null
          status?: string | null
          updated_at?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_hotels_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_visas: {
        Row: {
          applied_at: string | null
          approved_at: string | null
          created_at: string | null
          document_url: string | null
          expiry_date: string | null
          guest_id: string | null
          id: string
          notes: string | null
          status: string | null
          updated_at: string | null
          visa_type: string | null
          wedding_id: string
        }
        Insert: {
          applied_at?: string | null
          approved_at?: string | null
          created_at?: string | null
          document_url?: string | null
          expiry_date?: string | null
          guest_id?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          visa_type?: string | null
          wedding_id: string
        }
        Update: {
          applied_at?: string | null
          approved_at?: string | null
          created_at?: string | null
          document_url?: string | null
          expiry_date?: string | null
          guest_id?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          visa_type?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_visas_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          ai_notes: string | null
          auth_method: string | null
          avatar_color: string
          avatar_seed: string | null
          avatar_style: string | null
          avatar_svg: string | null
          consent_given_at: string | null
          consent_language: string | null
          consent_withdrawn_at: string | null
          contact_type: string | null
          conversation_state: string | null
          conversation_topic: string | null
          created_at: string | null
          data_retention_until: string | null
          email: string
          id: string
          initials: string | null
          is_family_liaison: boolean | null
          last_inbound_at: string | null
          last_outbound_at: string | null
          liaison_for: string[] | null
          logistics_data: Json | null
          name: string
          outreach_attempt_count: number | null
          outreach_last_contacted_at: string | null
          outreach_next_action: string | null
          outreach_next_action_at: string | null
          outreach_status: string | null
          phone: string | null
          unread_count: number | null
          wedding_id: string
          wedding_side: string | null
          whatsapp_opted_out: boolean | null
        }
        Insert: {
          ai_notes?: string | null
          auth_method?: string | null
          avatar_color: string
          avatar_seed?: string | null
          avatar_style?: string | null
          avatar_svg?: string | null
          consent_given_at?: string | null
          consent_language?: string | null
          consent_withdrawn_at?: string | null
          contact_type?: string | null
          conversation_state?: string | null
          conversation_topic?: string | null
          created_at?: string | null
          data_retention_until?: string | null
          email: string
          id?: string
          initials?: string | null
          is_family_liaison?: boolean | null
          last_inbound_at?: string | null
          last_outbound_at?: string | null
          liaison_for?: string[] | null
          logistics_data?: Json | null
          name: string
          outreach_attempt_count?: number | null
          outreach_last_contacted_at?: string | null
          outreach_next_action?: string | null
          outreach_next_action_at?: string | null
          outreach_status?: string | null
          phone?: string | null
          unread_count?: number | null
          wedding_id: string
          wedding_side?: string | null
          whatsapp_opted_out?: boolean | null
        }
        Update: {
          ai_notes?: string | null
          auth_method?: string | null
          avatar_color?: string
          avatar_seed?: string | null
          avatar_style?: string | null
          avatar_svg?: string | null
          consent_given_at?: string | null
          consent_language?: string | null
          consent_withdrawn_at?: string | null
          contact_type?: string | null
          conversation_state?: string | null
          conversation_topic?: string | null
          created_at?: string | null
          data_retention_until?: string | null
          email?: string
          id?: string
          initials?: string | null
          is_family_liaison?: boolean | null
          last_inbound_at?: string | null
          last_outbound_at?: string | null
          liaison_for?: string[] | null
          logistics_data?: Json | null
          name?: string
          outreach_attempt_count?: number | null
          outreach_last_contacted_at?: string | null
          outreach_next_action?: string | null
          outreach_next_action_at?: string | null
          outreach_status?: string | null
          phone?: string | null
          unread_count?: number | null
          wedding_id?: string
          wedding_side?: string | null
          whatsapp_opted_out?: boolean | null
        }
        Relationships: []
      }
      milestones: {
        Row: {
          auto_escalate: boolean | null
          category: string
          completed_at: string | null
          created_at: string | null
          depends_on: string | null
          due_date: string
          escalation_days_before: number | null
          id: string
          metadata: Json | null
          status: string | null
          title: string
          wedding_id: string
        }
        Insert: {
          auto_escalate?: boolean | null
          category: string
          completed_at?: string | null
          created_at?: string | null
          depends_on?: string | null
          due_date: string
          escalation_days_before?: number | null
          id?: string
          metadata?: Json | null
          status?: string | null
          title: string
          wedding_id: string
        }
        Update: {
          auto_escalate?: boolean | null
          category?: string
          completed_at?: string | null
          created_at?: string | null
          depends_on?: string | null
          due_date?: string
          escalation_days_before?: number | null
          id?: string
          metadata?: Json | null
          status?: string | null
          title?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_depends_on_fkey"
            columns: ["depends_on"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_escalations: {
        Row: {
          context: Json | null
          created_at: string | null
          guest_id: string
          id: string
          reason: string
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          wedding_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          guest_id: string
          id?: string
          reason: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          wedding_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          guest_id?: string
          id?: string
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_escalations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_events: {
        Row: {
          channel: string | null
          created_at: string | null
          details: Json | null
          event_type: string
          guest_id: string
          id: string
          template_name: string | null
          wedding_id: string
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          details?: Json | null
          event_type: string
          guest_id: string
          id?: string
          template_name?: string | null
          wedding_id: string
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          details?: Json | null
          event_type?: string
          guest_id?: string
          id?: string
          template_name?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_events_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_sequences: {
        Row: {
          created_at: string | null
          days_before_wedding: number
          id: string
          scheduled_at: string | null
          sent_at: string | null
          sequence_type: string
          status: string | null
          target_statuses: string[] | null
          template_name: string
          wedding_id: string
        }
        Insert: {
          created_at?: string | null
          days_before_wedding: number
          id?: string
          scheduled_at?: string | null
          sent_at?: string | null
          sequence_type: string
          status?: string | null
          target_statuses?: string[] | null
          template_name: string
          wedding_id: string
        }
        Update: {
          created_at?: string | null
          days_before_wedding?: number
          id?: string
          scheduled_at?: string | null
          sent_at?: string | null
          sequence_type?: string
          status?: string | null
          target_statuses?: string[] | null
          template_name?: string
          wedding_id?: string
        }
        Relationships: []
      }
      pin_access: {
        Row: {
          allows_plus_one: boolean | null
          id: string
          pin_type: string | null
          user_id: string
          verified_at: string | null
          wedding_id: string
        }
        Insert: {
          allows_plus_one?: boolean | null
          id?: string
          pin_type?: string | null
          user_id: string
          verified_at?: string | null
          wedding_id: string
        }
        Update: {
          allows_plus_one?: boolean | null
          id?: string
          pin_type?: string | null
          user_id?: string
          verified_at?: string | null
          wedding_id?: string
        }
        Relationships: []
      }
      planner_profiles: {
        Row: {
          company_name: string
          created_at: string | null
          id: string
          location: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string | null
          id?: string
          location: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string | null
          id?: string
          location?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rsvp_custom_questions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          insert_after: string
          order_index: number
          questions: Json
          step_title: string
          updated_at: string | null
          wedding_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          insert_after?: string
          order_index?: number
          questions?: Json
          step_title: string
          updated_at?: string | null
          wedding_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          insert_after?: string
          order_index?: number
          questions?: Json
          step_title?: string
          updated_at?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_custom_questions_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["slug"]
          },
        ]
      }
      rsvps: {
        Row: {
          attending: string
          country_code: string | null
          created_at: string | null
          custom_answers: Json | null
          dietary_restrictions: string | null
          event_id: string
          food_preference: string[] | null
          guest_count: number | null
          guest_id: string | null
          id: string
          maybe_comment: string | null
          plus_one: boolean | null
          plus_one_country_code: string | null
          plus_one_email: string | null
          plus_one_name: string | null
          plus_one_phone: string | null
          song_request: string | null
          special_message: string | null
          wedding_id: string
        }
        Insert: {
          attending: string
          country_code?: string | null
          created_at?: string | null
          custom_answers?: Json | null
          dietary_restrictions?: string | null
          event_id: string
          food_preference?: string[] | null
          guest_count?: number | null
          guest_id?: string | null
          id?: string
          maybe_comment?: string | null
          plus_one?: boolean | null
          plus_one_country_code?: string | null
          plus_one_email?: string | null
          plus_one_name?: string | null
          plus_one_phone?: string | null
          song_request?: string | null
          special_message?: string | null
          wedding_id: string
        }
        Update: {
          attending?: string
          country_code?: string | null
          created_at?: string | null
          custom_answers?: Json | null
          dietary_restrictions?: string | null
          event_id?: string
          food_preference?: string[] | null
          guest_count?: number | null
          guest_id?: string | null
          id?: string
          maybe_comment?: string | null
          plus_one?: boolean | null
          plus_one_country_code?: string | null
          plus_one_email?: string | null
          plus_one_name?: string | null
          plus_one_phone?: string | null
          song_request?: string | null
          special_message?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_items: {
        Row: {
          created_at: string | null
          description: string | null
          dress_code: string | null
          gradient_background: string | null
          icon: string | null
          id: string
          is_major_event: boolean | null
          linked_event_id: string | null
          location: string | null
          name: string
          order_index: number
          schedule_id: string | null
          time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          dress_code?: string | null
          gradient_background?: string | null
          icon?: string | null
          id?: string
          is_major_event?: boolean | null
          linked_event_id?: string | null
          location?: string | null
          name: string
          order_index?: number
          schedule_id?: string | null
          time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          dress_code?: string | null
          gradient_background?: string | null
          icon?: string | null
          id?: string
          is_major_event?: boolean | null
          linked_event_id?: string | null
          location?: string | null
          name?: string
          order_index?: number
          schedule_id?: string | null
          time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_items_linked_event_id_fkey"
            columns: ["linked_event_id"]
            isOneToOne: false
            referencedRelation: "wedding_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_items_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "wedding_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      transportation_groups: {
        Row: {
          created_at: string | null
          departure_datetime: string | null
          direction: string
          id: string
          is_finalized: boolean | null
          pickup_location_id: string | null
          total_passengers: number | null
          updated_at: string | null
          vehicle_type_id: string | null
          wedding_id: string | null
        }
        Insert: {
          created_at?: string | null
          departure_datetime?: string | null
          direction: string
          id?: string
          is_finalized?: boolean | null
          pickup_location_id?: string | null
          total_passengers?: number | null
          updated_at?: string | null
          vehicle_type_id?: string | null
          wedding_id?: string | null
        }
        Update: {
          created_at?: string | null
          departure_datetime?: string | null
          direction?: string
          id?: string
          is_finalized?: boolean | null
          pickup_location_id?: string | null
          total_passengers?: number | null
          updated_at?: string | null
          vehicle_type_id?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transportation_groups_pickup_location_id_fkey"
            columns: ["pickup_location_id"]
            isOneToOne: false
            referencedRelation: "transportation_pickup_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transportation_groups_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "transportation_vehicle_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transportation_groups_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      transportation_pickup_locations: {
        Row: {
          address: string | null
          coordinates: Json | null
          created_at: string | null
          direction: string
          id: string
          name: string
          order_index: number | null
          updated_at: string | null
          wedding_id: string | null
        }
        Insert: {
          address?: string | null
          coordinates?: Json | null
          created_at?: string | null
          direction: string
          id?: string
          name: string
          order_index?: number | null
          updated_at?: string | null
          wedding_id?: string | null
        }
        Update: {
          address?: string | null
          coordinates?: Json | null
          created_at?: string | null
          direction?: string
          id?: string
          name?: string
          order_index?: number | null
          updated_at?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transportation_pickup_locations_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      transportation_reservations: {
        Row: {
          assigned_group_id: string | null
          created_at: string | null
          direction: string
          guest_id: string | null
          id: string
          notes: string | null
          party_size: number | null
          pickup_location_id: string | null
          preferred_datetime: string | null
          status: string | null
          updated_at: string | null
          vehicle_id: string | null
          wedding_id: string | null
        }
        Insert: {
          assigned_group_id?: string | null
          created_at?: string | null
          direction: string
          guest_id?: string | null
          id?: string
          notes?: string | null
          party_size?: number | null
          pickup_location_id?: string | null
          preferred_datetime?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          wedding_id?: string | null
        }
        Update: {
          assigned_group_id?: string | null
          created_at?: string | null
          direction?: string
          guest_id?: string | null
          id?: string
          notes?: string | null
          party_size?: number | null
          pickup_location_id?: string | null
          preferred_datetime?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transportation_reservations_assigned_group_id_fkey"
            columns: ["assigned_group_id"]
            isOneToOne: false
            referencedRelation: "transportation_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transportation_reservations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transportation_reservations_pickup_location_id_fkey"
            columns: ["pickup_location_id"]
            isOneToOne: false
            referencedRelation: "transportation_pickup_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transportation_reservations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "transportation_vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transportation_reservations_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      transportation_settings: {
        Row: {
          arrival_configured: boolean | null
          created_at: string | null
          departure_configured: boolean | null
          id: string
          mode: string | null
          setup_complete: boolean | null
          updated_at: string | null
          wedding_id: string | null
        }
        Insert: {
          arrival_configured?: boolean | null
          created_at?: string | null
          departure_configured?: boolean | null
          id?: string
          mode?: string | null
          setup_complete?: boolean | null
          updated_at?: string | null
          wedding_id?: string | null
        }
        Update: {
          arrival_configured?: boolean | null
          created_at?: string | null
          departure_configured?: boolean | null
          id?: string
          mode?: string | null
          setup_complete?: boolean | null
          updated_at?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transportation_settings_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: true
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      transportation_time_ranges: {
        Row: {
          created_at: string | null
          direction: string
          end_datetime: string
          id: string
          interval_minutes: number | null
          start_datetime: string
          updated_at: string | null
          wedding_id: string | null
        }
        Insert: {
          created_at?: string | null
          direction: string
          end_datetime: string
          id?: string
          interval_minutes?: number | null
          start_datetime: string
          updated_at?: string | null
          wedding_id?: string | null
        }
        Update: {
          created_at?: string | null
          direction?: string
          end_datetime?: string
          id?: string
          interval_minutes?: number | null
          start_datetime?: string
          updated_at?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transportation_time_ranges_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      transportation_vehicle_types: {
        Row: {
          capacity: number
          created_at: string | null
          id: string
          name: string
          quantity: number | null
          updated_at: string | null
          wedding_id: string | null
        }
        Insert: {
          capacity: number
          created_at?: string | null
          id?: string
          name: string
          quantity?: number | null
          updated_at?: string | null
          wedding_id?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string | null
          id?: string
          name?: string
          quantity?: number | null
          updated_at?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transportation_vehicle_types_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      transportation_vehicles: {
        Row: {
          capacity: number
          created_at: string | null
          departure_datetime: string
          direction: string
          dropoff_location: string | null
          dropoff_location_coordinates: Json | null
          id: string
          is_full: boolean | null
          order_index: number | null
          pickup_location: string | null
          pickup_location_coordinates: Json | null
          updated_at: string | null
          vehicle_name: string | null
          wedding_id: string | null
        }
        Insert: {
          capacity: number
          created_at?: string | null
          departure_datetime: string
          direction: string
          dropoff_location?: string | null
          dropoff_location_coordinates?: Json | null
          id?: string
          is_full?: boolean | null
          order_index?: number | null
          pickup_location?: string | null
          pickup_location_coordinates?: Json | null
          updated_at?: string | null
          vehicle_name?: string | null
          wedding_id?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string | null
          departure_datetime?: string
          direction?: string
          dropoff_location?: string | null
          dropoff_location_coordinates?: Json | null
          id?: string
          is_full?: boolean | null
          order_index?: number | null
          pickup_location?: string | null
          pickup_location_coordinates?: Json | null
          updated_at?: string | null
          vehicle_name?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transportation_vehicles_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_bus_signups: {
        Row: {
          bangkok_to_huahin: boolean | null
          created_at: string | null
          email: string
          huahin_to_airport: boolean | null
          huahin_to_sukhumvit: boolean | null
          id: string
          name: string
          party_size: number
          passport_image_path: string | null
          updated_at: string | null
          wedding_id: string
        }
        Insert: {
          bangkok_to_huahin?: boolean | null
          created_at?: string | null
          email: string
          huahin_to_airport?: boolean | null
          huahin_to_sukhumvit?: boolean | null
          id?: string
          name: string
          party_size?: number
          passport_image_path?: string | null
          updated_at?: string | null
          wedding_id: string
        }
        Update: {
          bangkok_to_huahin?: boolean | null
          created_at?: string | null
          email?: string
          huahin_to_airport?: boolean | null
          huahin_to_sukhumvit?: boolean | null
          id?: string
          name?: string
          party_size?: number
          passport_image_path?: string | null
          updated_at?: string | null
          wedding_id?: string
        }
        Relationships: []
      }
      travel_sections: {
        Row: {
          address: string | null
          content: string | null
          created_at: string | null
          icon: string | null
          id: string
          image_url: string | null
          more_details: string | null
          order_index: number
          phone: string | null
          price_level: number | null
          source: string | null
          subtitle: string | null
          title: string | null
          type: string
          updated_at: string | null
          visible: boolean
          wedding_id: string
        }
        Insert: {
          address?: string | null
          content?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          more_details?: string | null
          order_index?: number
          phone?: string | null
          price_level?: number | null
          source?: string | null
          subtitle?: string | null
          title?: string | null
          type: string
          updated_at?: string | null
          visible?: boolean
          wedding_id: string
        }
        Update: {
          address?: string | null
          content?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          more_details?: string | null
          order_index?: number
          phone?: string | null
          price_level?: number | null
          source?: string | null
          subtitle?: string | null
          title?: string | null
          type?: string
          updated_at?: string | null
          visible?: boolean
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_sections_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          account_type: string | null
          avatar_color: string | null
          avatar_seed: string | null
          avatar_style: string | null
          avatar_svg: string | null
          created_at: string | null
          enabled_features: string[] | null
          id: string
          onboarding_completed: boolean | null
          onboarding_goals: string[] | null
          subscription_tier: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_type?: string | null
          avatar_color?: string | null
          avatar_seed?: string | null
          avatar_style?: string | null
          avatar_svg?: string | null
          created_at?: string | null
          enabled_features?: string[] | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_goals?: string[] | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_type?: string | null
          avatar_color?: string | null
          avatar_seed?: string | null
          avatar_style?: string | null
          avatar_svg?: string | null
          created_at?: string | null
          enabled_features?: string[] | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_goals?: string[] | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      vendor_conversations: {
        Row: {
          chat_type: string
          created_at: string
          first_message_at: string | null
          id: string
          last_message_at: string | null
          message_count: number
          raw_file_url: string | null
          source: string
          status: string
          title: string | null
          updated_at: string
          vendor_id: string | null
          wedding_id: string
          whatsapp_chat_id: string | null
          whatsapp_group_id: string | null
        }
        Insert: {
          chat_type?: string
          created_at?: string
          first_message_at?: string | null
          id?: string
          last_message_at?: string | null
          message_count?: number
          raw_file_url?: string | null
          source?: string
          status?: string
          title?: string | null
          updated_at?: string
          vendor_id?: string | null
          wedding_id: string
          whatsapp_chat_id?: string | null
          whatsapp_group_id?: string | null
        }
        Update: {
          chat_type?: string
          created_at?: string
          first_message_at?: string | null
          id?: string
          last_message_at?: string | null
          message_count?: number
          raw_file_url?: string | null
          source?: string
          status?: string
          title?: string | null
          updated_at?: string
          vendor_id?: string | null
          wedding_id?: string
          whatsapp_chat_id?: string | null
          whatsapp_group_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_conversations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_insights: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          due_date: string | null
          id: string
          insight_type: string
          is_completed: boolean
          metadata: Json
          priority: string
          updated_at: string
          vendor_id: string | null
          wedding_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          insight_type: string
          is_completed?: boolean
          metadata?: Json
          priority?: string
          updated_at?: string
          vendor_id?: string | null
          wedding_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          insight_type?: string
          is_completed?: boolean
          metadata?: Json
          priority?: string
          updated_at?: string
          vendor_id?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_insights_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "vendor_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_insights_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          has_media: boolean
          id: string
          media_type: string | null
          media_url: string | null
          message_timestamp: string | null
          sender_name: string | null
          sender_phone: string | null
          sender_type: string
          wedding_id: string
          whapi_message_id: string | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          has_media?: boolean
          id?: string
          media_type?: string | null
          media_url?: string | null
          message_timestamp?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          sender_type?: string
          wedding_id: string
          whapi_message_id?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          has_media?: boolean
          id?: string
          media_type?: string | null
          media_url?: string | null
          message_timestamp?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          sender_type?: string
          wedding_id?: string
          whapi_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "vendor_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          category: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
          wedding_id: string
          whatsapp_group_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          wedding_id: string
          whatsapp_group_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          wedding_id?: string
          whatsapp_group_id?: string | null
        }
        Relationships: []
      }
      wedding_admins: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string | null
          wedding_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string | null
          wedding_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_admins_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_events: {
        Row: {
          carousel_images: Json | null
          carousel_slides: Json | null
          created_at: string | null
          date: string
          dress_code: string
          dress_code_description: string | null
          dress_code_icon: string | null
          gradient_background: string | null
          id: string
          is_template: boolean | null
          name: string
          order_index: number
          outfit_example_url: string | null
          outfit_ideas_men: Json | null
          outfit_ideas_women: Json | null
          ritual_description: string | null
          ritual_name: string | null
          slug: string
          text_color: string | null
          time: string
          updated_at: string | null
          wedding_id: string | null
        }
        Insert: {
          carousel_images?: Json | null
          carousel_slides?: Json | null
          created_at?: string | null
          date: string
          dress_code: string
          dress_code_description?: string | null
          dress_code_icon?: string | null
          gradient_background?: string | null
          id?: string
          is_template?: boolean | null
          name: string
          order_index?: number
          outfit_example_url?: string | null
          outfit_ideas_men?: Json | null
          outfit_ideas_women?: Json | null
          ritual_description?: string | null
          ritual_name?: string | null
          slug: string
          text_color?: string | null
          time: string
          updated_at?: string | null
          wedding_id?: string | null
        }
        Update: {
          carousel_images?: Json | null
          carousel_slides?: Json | null
          created_at?: string | null
          date?: string
          dress_code?: string
          dress_code_description?: string | null
          dress_code_icon?: string | null
          gradient_background?: string | null
          id?: string
          is_template?: boolean | null
          name?: string
          order_index?: number
          outfit_example_url?: string | null
          outfit_ideas_men?: Json | null
          outfit_ideas_women?: Json | null
          ritual_description?: string | null
          ritual_name?: string | null
          slug?: string
          text_color?: string | null
          time?: string
          updated_at?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_events_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_faqs: {
        Row: {
          answer: string
          button_link: string | null
          button_text: string | null
          created_at: string | null
          id: string
          order_index: number
          question: string
          updated_at: string | null
          wedding_id: string | null
        }
        Insert: {
          answer: string
          button_link?: string | null
          button_text?: string | null
          created_at?: string | null
          id?: string
          order_index?: number
          question: string
          updated_at?: string | null
          wedding_id?: string | null
        }
        Update: {
          answer?: string
          button_link?: string | null
          button_text?: string | null
          created_at?: string | null
          id?: string
          order_index?: number
          question?: string
          updated_at?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_faqs_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_invites: {
        Row: {
          created_at: string | null
          email: string
          id: string
          invited_by: string | null
          role: string
          wedding_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          invited_by?: string | null
          role?: string
          wedding_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          invited_by?: string | null
          role?: string
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_invites_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_registry: {
        Row: {
          created_at: string | null
          description: string | null
          emoji: string
          external_url: string | null
          fund_name: string
          id: string
          order_index: number
          stripe_product_id: string | null
          updated_at: string | null
          wedding_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          emoji: string
          external_url?: string | null
          fund_name: string
          id?: string
          order_index?: number
          stripe_product_id?: string | null
          updated_at?: string | null
          wedding_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          emoji?: string
          external_url?: string | null
          fund_name?: string
          id?: string
          order_index?: number
          stripe_product_id?: string | null
          updated_at?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_registry_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_rooms: {
        Row: {
          assigned_guest_ids: string[]
          bed_type: string | null
          capacity: number | null
          created_at: string
          floor: string | null
          hotel_name: string | null
          id: string
          notes: string | null
          room_number: string
          source: string
          updated_at: string
          wedding_id: string
        }
        Insert: {
          assigned_guest_ids?: string[]
          bed_type?: string | null
          capacity?: number | null
          created_at?: string
          floor?: string | null
          hotel_name?: string | null
          id?: string
          notes?: string | null
          room_number: string
          source?: string
          updated_at?: string
          wedding_id: string
        }
        Update: {
          assigned_guest_ids?: string[]
          bed_type?: string | null
          capacity?: number | null
          created_at?: string
          floor?: string | null
          hotel_name?: string | null
          id?: string
          notes?: string | null
          room_number?: string
          source?: string
          updated_at?: string
          wedding_id?: string
        }
        Relationships: []
      }
      wedding_schedule: {
        Row: {
          created_at: string | null
          date: string
          day_name: string
          id: string
          order_index: number
          updated_at: string | null
          wedding_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          day_name: string
          id?: string
          order_index?: number
          updated_at?: string | null
          wedding_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          day_name?: string
          id?: string
          order_index?: number
          updated_at?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_schedule_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_settings: {
        Row: {
          concierge_enabled: boolean
          concierge_enabled_at: string | null
          created_at: string | null
          custom_domain: string | null
          google_sheets_id: string | null
          id: string
          lapse_event_codes: Json | null
          pin_codes: Json | null
          updated_at: string | null
          wedding_id: string | null
          whatsapp_group_link: string | null
        }
        Insert: {
          concierge_enabled?: boolean
          concierge_enabled_at?: string | null
          created_at?: string | null
          custom_domain?: string | null
          google_sheets_id?: string | null
          id?: string
          lapse_event_codes?: Json | null
          pin_codes?: Json | null
          updated_at?: string | null
          wedding_id?: string | null
          whatsapp_group_link?: string | null
        }
        Update: {
          concierge_enabled?: boolean
          concierge_enabled_at?: string | null
          created_at?: string | null
          custom_domain?: string | null
          google_sheets_id?: string | null
          id?: string
          lapse_event_codes?: Json | null
          pin_codes?: Json | null
          updated_at?: string | null
          wedding_id?: string | null
          whatsapp_group_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_settings_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: true
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_shops: {
        Row: {
          created_at: string | null
          details: string
          id: string
          name: string
          order_index: number
          updated_at: string | null
          url: string
          wedding_id: string | null
        }
        Insert: {
          created_at?: string | null
          details: string
          id?: string
          name: string
          order_index?: number
          updated_at?: string | null
          url: string
          wedding_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string
          id?: string
          name?: string
          order_index?: number
          updated_at?: string | null
          url?: string
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_shops_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_tasks: {
        Row: {
          column: string
          created_at: string | null
          description: string | null
          id: string
          order_index: number | null
          tags: string[] | null
          title: string
          wedding_id: string
        }
        Insert: {
          column?: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number | null
          tags?: string[] | null
          title: string
          wedding_id: string
        }
        Update: {
          column?: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number | null
          tags?: string[] | null
          title?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_tasks_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_travel_cards: {
        Row: {
          button_action: string | null
          button_text: string | null
          content: Json
          created_at: string | null
          id: string
          image_url: string
          is_disabled: boolean | null
          is_whatsapp_button: boolean | null
          order_index: number
          title: string
          updated_at: string | null
          wedding_id: string | null
        }
        Insert: {
          button_action?: string | null
          button_text?: string | null
          content?: Json
          created_at?: string | null
          id?: string
          image_url: string
          is_disabled?: boolean | null
          is_whatsapp_button?: boolean | null
          order_index?: number
          title: string
          updated_at?: string | null
          wedding_id?: string | null
        }
        Update: {
          button_action?: string | null
          button_text?: string | null
          content?: Json
          created_at?: string | null
          id?: string
          image_url?: string
          is_disabled?: boolean | null
          is_whatsapp_button?: boolean | null
          order_index?: number
          title?: string
          updated_at?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_travel_cards_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      weddings: {
        Row: {
          background_image: string | null
          button_font_color: string | null
          couple_image_url: string | null
          couple_images: Json | null
          couple_name: string
          couple_name_font: string | null
          created_at: string | null
          created_by: string | null
          font_color: string | null
          frame_image_url: string | null
          has_unpublished_changes: boolean | null
          hidden_rsvp_steps: string[] | null
          id: string
          last_published_at: string | null
          partner1_name: string | null
          partner2_name: string | null
          pin_entry_background: string | null
          pin_entry_button_font_color: string | null
          pin_entry_font_color: string | null
          pin_entry_primary_color: string | null
          pin_entry_subtitle_text: string | null
          pin_entry_text: string | null
          primary_color: string | null
          published_snapshot: Json | null
          rsvp_confirmation_messages: Json | null
          rsvp_deadline: string
          show_venue_location: boolean | null
          slug: string
          status: string
          updated_at: string | null
          venue_flag: string | null
          venue_location: string
          venue_name: string
          website_layout: string | null
          wedding_date: string
          wedding_date_display: string
          wedding_date_end: string | null
          welcome_text: string | null
        }
        Insert: {
          background_image?: string | null
          button_font_color?: string | null
          couple_image_url?: string | null
          couple_images?: Json | null
          couple_name: string
          couple_name_font?: string | null
          created_at?: string | null
          created_by?: string | null
          font_color?: string | null
          frame_image_url?: string | null
          has_unpublished_changes?: boolean | null
          hidden_rsvp_steps?: string[] | null
          id?: string
          last_published_at?: string | null
          partner1_name?: string | null
          partner2_name?: string | null
          pin_entry_background?: string | null
          pin_entry_button_font_color?: string | null
          pin_entry_font_color?: string | null
          pin_entry_primary_color?: string | null
          pin_entry_subtitle_text?: string | null
          pin_entry_text?: string | null
          primary_color?: string | null
          published_snapshot?: Json | null
          rsvp_confirmation_messages?: Json | null
          rsvp_deadline: string
          show_venue_location?: boolean | null
          slug: string
          status?: string
          updated_at?: string | null
          venue_flag?: string | null
          venue_location: string
          venue_name: string
          website_layout?: string | null
          wedding_date: string
          wedding_date_display: string
          wedding_date_end?: string | null
          welcome_text?: string | null
        }
        Update: {
          background_image?: string | null
          button_font_color?: string | null
          couple_image_url?: string | null
          couple_images?: Json | null
          couple_name?: string
          couple_name_font?: string | null
          created_at?: string | null
          created_by?: string | null
          font_color?: string | null
          frame_image_url?: string | null
          has_unpublished_changes?: boolean | null
          hidden_rsvp_steps?: string[] | null
          id?: string
          last_published_at?: string | null
          partner1_name?: string | null
          partner2_name?: string | null
          pin_entry_background?: string | null
          pin_entry_button_font_color?: string | null
          pin_entry_font_color?: string | null
          pin_entry_primary_color?: string | null
          pin_entry_subtitle_text?: string | null
          pin_entry_text?: string | null
          primary_color?: string | null
          published_snapshot?: Json | null
          rsvp_confirmation_messages?: Json | null
          rsvp_deadline?: string
          show_venue_location?: boolean | null
          slug?: string
          status?: string
          updated_at?: string | null
          venue_flag?: string | null
          venue_location?: string
          venue_name?: string
          website_layout?: string | null
          wedding_date?: string
          wedding_date_display?: string
          wedding_date_end?: string | null
          welcome_text?: string | null
        }
        Relationships: []
      }
      whatsapp_broadcasts: {
        Row: {
          created_at: string | null
          created_by: string | null
          failed_sends: number | null
          filters: Json | null
          id: string
          name: string
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          successful_sends: number | null
          template_name: string
          total_recipients: number | null
          wedding_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          failed_sends?: number | null
          filters?: Json | null
          id?: string
          name: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          successful_sends?: number | null
          template_name: string
          total_recipients?: number | null
          wedding_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          failed_sends?: number | null
          filters?: Json | null
          id?: string
          name?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          successful_sends?: number | null
          template_name?: string
          total_recipients?: number | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_broadcasts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_channel_clicks: {
        Row: {
          clicked_at: string | null
          created_at: string | null
          guest_id: string | null
          id: string
          source: string | null
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string | null
          guest_id?: string | null
          id?: string
          source?: string | null
        }
        Update: {
          clicked_at?: string | null
          created_at?: string | null
          guest_id?: string | null
          id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_channel_clicks_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_chat_history: {
        Row: {
          content: string
          created_at: string
          guest_id: string | null
          id: string
          metadata: Json | null
          role: string
          wa_message_id: string | null
          wedding_id: string
        }
        Insert: {
          content: string
          created_at?: string
          guest_id?: string | null
          id?: string
          metadata?: Json | null
          role: string
          wa_message_id?: string | null
          wedding_id: string
        }
        Update: {
          content?: string
          created_at?: string
          guest_id?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          wa_message_id?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_chat_history_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_chat_history_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          content: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          guest_id: string | null
          id: string
          message_type: string | null
          parameters: Json | null
          phone_number: string
          read_at: string | null
          sent_at: string | null
          status: string | null
          template_name: string | null
          wa_message_id: string | null
          wedding_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          guest_id?: string | null
          id?: string
          message_type?: string | null
          parameters?: Json | null
          phone_number: string
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          template_name?: string | null
          wa_message_id?: string | null
          wedding_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          guest_id?: string | null
          id?: string
          message_type?: string | null
          parameters?: Json | null
          phone_number?: string
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          template_name?: string | null
          wa_message_id?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_opt_ins: {
        Row: {
          guest_id: string | null
          id: string
          opt_in_method: string | null
          opted_in: boolean | null
          opted_in_at: string | null
          opted_out_at: string | null
          phone_number: string
          wedding_id: string
        }
        Insert: {
          guest_id?: string | null
          id?: string
          opt_in_method?: string | null
          opted_in?: boolean | null
          opted_in_at?: string | null
          opted_out_at?: string | null
          phone_number: string
          wedding_id: string
        }
        Update: {
          guest_id?: string | null
          id?: string
          opt_in_method?: string | null
          opted_in?: boolean | null
          opted_in_at?: string | null
          opted_out_at?: string | null
          phone_number?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_opt_ins_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          approved_at: string | null
          category: string
          content: string
          created_at: string | null
          id: string
          language: string | null
          meta_template_id: string | null
          name: string
          parameters: Json | null
          status: string | null
        }
        Insert: {
          approved_at?: string | null
          category: string
          content: string
          created_at?: string | null
          id?: string
          language?: string | null
          meta_template_id?: string | null
          name: string
          parameters?: Json | null
          status?: string | null
        }
        Update: {
          approved_at?: string | null
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          language?: string | null
          meta_template_id?: string | null
          name?: string
          parameters?: Json | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      rsvps_with_names: {
        Row: {
          guest_id: string | null
          guest_name: string | null
          id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_slug_availability: {
        Args: { slug_to_check: string }
        Returns: boolean
      }
      is_wedding_owner_or_admin_by_id: {
        Args: { w_id: string }
        Returns: boolean
      }
      is_wedding_owner_or_admin_by_slug: {
        Args: { w_slug: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
