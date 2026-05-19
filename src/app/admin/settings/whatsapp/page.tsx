'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  MessageCircle, 
  Settings, 
  Save, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Phone,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function WhatsappSettingsPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'whatsapp_settings')
        .maybeSingle();

      if (error) throw error;

      if (data && data.value) {
        setPhoneNumber(data.value.phone_number || '');
      }
    } catch (e: any) {
      console.error('Error fetching WhatsApp settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate and clean phone number format
    const cleaned = phoneNumber.replace(/[^0-9+]/g, '');
    if (!cleaned) {
      setMessage({ type: 'error', text: 'WhatsApp Phone Number is required!' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'whatsapp_settings',
          value: {
            phone_number: cleaned
          },
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error) throw error;
      setMessage({ type: 'success', text: 'WhatsApp settings saved successfully!' });
    } catch (e: any) {
      console.error('Error saving WhatsApp settings:', e);
      setMessage({ 
        type: 'error', 
        text: 'Failed to save WhatsApp settings. Please ensure database permissions and tables are correct.' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <RefreshCw className="animate-spin text-gray-400" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-6 pt-12">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest mb-2">
              <Link href="/admin/settings" className="flex items-center gap-1 hover:underline">
                <ArrowLeft size={10} /> Back to Settings
              </Link>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 flex items-center gap-4">
              WhatsApp Settings
              <MessageCircle size={32} className="text-gray-300" />
            </h1>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/10 cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            Save Settings
          </button>
        </div>

        {message && (
          <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm border-2 animate-fade-in ${
            message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        {/* Form Sections */}
        <div className="grid gap-8">
          
          {/* General Information Card */}
          <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2 border-b border-gray-50 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Phone size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">WhatsApp Integration Settings</h3>
                <p className="text-xs text-gray-400 font-bold">Configure the WhatsApp phone number used for customer order redirects.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">WhatsApp Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    placeholder="e.g. +9779800000000 or 9779812345678"
                  />
                </div>
                <p className="text-xs text-gray-400 font-bold leading-relaxed mt-2 ml-1">
                  Include the country code (e.g., 977 for Nepal, 91 for India) without leading zeros, spaces, or plus symbols if possible. For example, <strong>9779812345678</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Button Preview Card */}
          <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-gray-900">Button Live Preview</h3>
            
            <div className="p-6 bg-gray-50 rounded-2xl flex flex-col items-center justify-center">
              <div className="w-full max-w-sm">
                <div className="flex gap-3 mb-4 w-full">
                  <div className="flex-1 h-12 rounded-xl border border-orange-200 text-orange-600 flex items-center justify-center text-xs font-semibold bg-white">Add to Cart</div>
                  <div className="flex-1 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">Buy Now</div>
                </div>
                
                <div className="border-t border-gray-200 my-4" />
                
                {/* WhatsApp Button Preview */}
                <div 
                  className="w-full h-[52px] rounded-[14px] bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-[15px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer hover:bg-[#DCFCE7] active:translate-y-0.5"
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.1px' }}
                >
                  {/* Official WhatsApp Icon SVG */}
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.118-2.905-6.993-1.876-1.875-4.37-2.907-7.01-2.907-5.439 0-9.868 4.429-9.872 9.875-.001 1.73.453 3.422 1.32 4.924l-.995 3.635 3.737-.98zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.174.2-.298.3-.496.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.011c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  Order on WhatsApp
                </div>
                
                <p className="text-[13px] text-[#6B7280] text-center mt-2.5">
                  Need help? Chat directly with our team.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
