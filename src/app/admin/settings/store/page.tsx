'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Globe, 
  Settings, 
  Save, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Coins
} from 'lucide-react';

export default function StoreSettingsPage() {
  const [storeName, setStoreName] = useState('Bagmati Traders');
  const [currency, setCurrency] = useState('Rs');
  const [contactEmail, setContactEmail] = useState('contact@bagmatitraders.com');
  const [contactPhone, setContactPhone] = useState('+977-9849080842');
  const [contactAddress, setContactAddress] = useState('Kathmandu, Balaju');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchStoreSettings();
  }, []);

  const fetchStoreSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'store_settings')
        .maybeSingle();

      if (error) throw error;
      
      if (data && data.value) {
        const val = data.value;
        if (val.store_name) setStoreName(val.store_name);
        if (val.currency) setCurrency(val.currency);
        if (val.contact_email) setContactEmail(val.contact_email);
        if (val.contact_phone) setContactPhone(val.contact_phone);
        if (val.contact_address) setContactAddress(val.contact_address);
      }
    } catch (e: any) {
      console.error('Error fetching store settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'store_settings',
          value: {
            store_name: storeName,
            currency: currency,
            contact_email: contactEmail,
            contact_phone: contactPhone,
            contact_address: contactAddress
          },
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Store settings saved successfully!' });
      
      // Dispatch storage event to notify header/footer immediately
      if (typeof window !== 'undefined') {
        localStorage.setItem('storeName', storeName);
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e: any) {
      console.error('Error saving store settings:', e);
      setMessage({ 
        type: 'error', 
        text: 'Failed to save store settings. Please ensure database permissions and tables are correct.' 
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
              <Settings size={12} />
              Admin Settings
            </div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 flex items-center gap-4">
              Store Settings
              <Globe size={32} className="text-gray-300" />
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
                <Globe size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">General Identity</h3>
                <p className="text-xs text-gray-400 font-bold">Configure how your shop brand appears to customers</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Store Name</label>
                <input 
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  placeholder="e.g. Bagmati Traders"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Store Currency</label>
                <div className="relative">
                  <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    placeholder="e.g. Rs or $"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2 border-b border-gray-50 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Phone size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Contact & Support Details</h3>
                <p className="text-xs text-gray-400 font-bold">This information is shown dynamically in the user side header and footer</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Contact Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      placeholder="support@bagmatitraders.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Contact Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      placeholder="+977-9849080842"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Contact / Office Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-5 text-gray-400" size={18} />
                  <textarea 
                    value={contactAddress}
                    onChange={(e) => setContactAddress(e.target.value)}
                    rows={3}
                    className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                    placeholder="e.g. Kathmandu, Balaju, Ward-16"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
