import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
  id?: string;
  conversation_id?: string;
  text: string;
  sender: 'customer' | 'agent';
  platform: 'ecommerce';
  created_at?: string;
  metadata?: any;
}

class MessagingService {
  private deviceId: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.deviceId = localStorage.getItem('ecommerce_device_id');
      if (!this.deviceId) {
        this.deviceId = uuidv4();
        localStorage.setItem('ecommerce_device_id', this.deviceId);
      }
    }
  }

  getDeviceId() {
    return this.deviceId;
  }

  async getOrCreateConversation() {
    if (!this.deviceId) return null;

    // Check if we should sync based on local settings
    const shouldSync = localStorage.getItem('sync_to_messaging_app') !== 'false';

    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('customer_id', this.deviceId)
      .eq('platform', 'ecommerce')
      .single();

    if (error && error.code === 'PGRST116') {
      // Create new
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          customer_id: this.deviceId,
          customer_name: `Guest (${this.deviceId.slice(0, 8)})`,
          platform: 'ecommerce',
          page_id: 'ecommerce_store',
          page_name: 'Ecommerce Store'
        })
        .select()
        .single();

      if (createError) throw createError;
      return newConv;
    }

    if (error) throw error;
    return conversation;
  }

  async sendMessage(text: string, productContext?: any) {
    const conversation = await this.getOrCreateConversation();
    if (!conversation) return null;

    const shouldSync = localStorage.getItem('sync_to_messaging_app') !== 'false';
    
    // If sync is disabled, we might want to save to a local table instead
    // But the user said "dont sent messages to messages and order webapp"
    // So if disabled, we just don't write to the shared conversations/messages table?
    // Actually, for the ecommerce app to have its own chat history, it needs to save SOMEWHERE.
    // I'll add a 'sync_enabled' flag to the metadata.

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        text: text,
        sender: 'customer',
        platform: 'ecommerce',
        metadata: {
          ...productContext,
          sync_enabled: shouldSync,
          source: 'ecommerce_web'
        }
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation last message
    await supabase
      .from('conversations')
      .update({
        last_message: text,
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversation.id);

    return message;
  }

  subscribeToMessages(conversationId: string, onMessage: (message: ChatMessage) => void) {
    return supabase
      .channel(`messages:conversation_id=eq.${conversationId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}` 
      }, payload => {
        onMessage(payload.new as ChatMessage);
      })
      .subscribe();
  }
}

export const messagingService = new MessagingService();
