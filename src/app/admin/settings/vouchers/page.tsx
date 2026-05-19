'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Ticket, 
  Plus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Calendar, 
  User, 
  Tag, 
  Clock, 
  Percent, 
  DollarSign, 
  AlertCircle, 
  X,
  Search,
  CheckCircle,
  Users,
  ShoppingBag,
  Sparkles,
  RefreshCw,
  Gift
} from 'lucide-react';
import Link from 'next/link';

interface Voucher {
  id: string;
  code: string;
  type: 'product_wise' | 'campaign' | 'secret' | 'new_user';
  discount_type: 'amount' | 'percent';
  discount_value: number;
  max_uses: number;
  used_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  specific_product_id?: string;
  specific_customer_id?: string;
  new_user_timeframe_hours?: number;
  campaign_target?: 'shipping' | 'product';
  created_at: string;
}

interface Product {
  id: string;
  name: string;
}

interface Customer {
  id: string;
  full_name: string;
  email?: string;
}

export default function VouchersAdminPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [newVoucher, setNewVoucher] = useState({
    code: '',
    type: 'product_wise',
    discount_type: 'amount',
    discount_value: '',
    max_uses: '100',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    specific_product_id: '',
    specific_customer_id: '',
    new_user_timeframe_hours: '48',
    campaign_target: 'product'
  });

  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchVouchers();
    fetchMetadata();
  }, []);

  const fetchVouchers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ecommerce_vouchers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVouchers(data || []);
    } catch (err) {
      console.error('Error fetching vouchers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      // Fetch Products
      const { data: prods } = await supabase
        .from('ecommerce_products')
        .select('id, name')
        .order('name');
      setProducts(prods || []);

      // Fetch Customers / Profiles
      const { data: custs } = await supabase
        .from('profiles')
        .select('id, full_name, email');
      setCustomers(custs || []);
    } catch (err) {
      console.error('Error fetching metadata:', err);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('ecommerce_vouchers')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setVouchers(vouchers.map(v => v.id === id ? { ...v, is_active: !currentStatus } : v));
    } catch (err) {
      console.error('Error toggling voucher status:', err);
    }
  };

  const handleDeleteVoucher = async (id: string) => {
    if (!confirm('Are you sure you want to delete this voucher permanently?')) return;
    try {
      const { error } = await supabase
        .from('ecommerce_vouchers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setVouchers(vouchers.filter(v => v.id !== id));
    } catch (err) {
      console.error('Error deleting voucher:', err);
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);

    const {
      code,
      type,
      discount_type,
      discount_value,
      max_uses,
      start_date,
      end_date,
      specific_product_id,
      specific_customer_id,
      new_user_timeframe_hours,
      campaign_target
    } = newVoucher;

    if (!code.trim()) {
      setFormError('Please enter a voucher code.');
      setIsSaving(false);
      return;
    }

    const value = parseFloat(discount_value);
    if (isNaN(value) || value <= 0) {
      setFormError('Discount value must be a positive number.');
      setIsSaving(false);
      return;
    }

    // Dynamic Validations
    if (type === 'product_wise' && !specific_product_id) {
      setFormError('Please select a target product.');
      setIsSaving(false);
      return;
    }

    if (type === 'secret' && !specific_customer_id) {
      setFormError('Please select a target customer.');
      setIsSaving(false);
      return;
    }

    try {
      const insertData: any = {
        code: code.trim().toUpperCase(),
        type,
        discount_type,
        discount_value: value,
        max_uses: parseInt(max_uses) || 100,
        start_date: new Date(start_date).toISOString(),
        end_date: new Date(end_date + 'T23:59:59').toISOString(),
        is_active: true
      };

      if (type === 'product_wise') {
        insertData.specific_product_id = specific_product_id;
      } else if (type === 'secret') {
        insertData.specific_customer_id = specific_customer_id;
      } else if (type === 'new_user') {
        insertData.new_user_timeframe_hours = parseInt(new_user_timeframe_hours) || 48;
      } else if (type === 'campaign') {
        insertData.campaign_target = campaign_target;
      }

      const { data, error } = await supabase
        .from('ecommerce_vouchers')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Voucher code already exists. Please choose a unique code.');
        }
        throw error;
      }

      setVouchers([data, ...vouchers]);
      setShowAddModal(false);
      setNewVoucher({
        code: '',
        type: 'product_wise',
        discount_type: 'amount',
        discount_value: '',
        max_uses: '100',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        specific_product_id: '',
        specific_customer_id: '',
        new_user_timeframe_hours: '48',
        campaign_target: 'product'
      });
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while creating the voucher.');
    } finally {
      setIsSaving(false);
    }
  };

  const getVoucherTypeLabel = (type: string) => {
    switch (type) {
      case 'product_wise': return 'Product Wise';
      case 'campaign': return 'Campaign / Store';
      case 'secret': return 'Secret Personal';
      case 'new_user': return 'New Signups';
      default: return type;
    }
  };

  const getCampaignTargetLabel = (target?: string) => {
    if (!target) return '';
    return target === 'shipping' ? 'Shipping Discount' : 'Storewide Product';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-6 pt-12">
        
        {/* Breadcrumb & Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest mb-2">
              <Link href="/admin/settings" className="hover:underline">Settings</Link>
              <span>/</span>
              <span className="text-gray-500">Vouchers</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 flex items-center gap-3">
              <Ticket className="text-orange-500 stroke-[2.5]" size={36} />
              Voucher Management
            </h1>
            <p className="text-gray-500 font-medium mt-1">Create codes, customize incentives, and control promotional campaigns.</p>
          </div>

          <button 
            onClick={() => setShowAddModal(true)}
            className="px-8 py-4 bg-black text-white hover:bg-gray-800 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-[0.98]"
          >
            <Plus size={16} /> Add New Voucher
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex-center">
              <Ticket size={22} />
            </div>
            <div>
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Vouchers</div>
              <div className="text-2xl font-black text-gray-900">{vouchers.length}</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex-center">
              <CheckCircle size={22} />
            </div>
            <div>
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Vouchers</div>
              <div className="text-2xl font-black text-gray-900">{vouchers.filter(v => v.is_active).length}</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex-center">
              <Users size={22} />
            </div>
            <div>
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Claims / Redemptions</div>
              <div className="text-2xl font-black text-gray-900">
                {vouchers.reduce((acc, curr) => acc + curr.used_count, 0)}
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex-center">
              <Gift size={22} />
            </div>
            <div>
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">New Signup Incentives</div>
              <div className="text-2xl font-black text-gray-900">{vouchers.filter(v => v.type === 'new_user').length}</div>
            </div>
          </div>
        </div>

        {/* Vouchers List Table */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-[2.5rem] overflow-hidden">
          {isLoading ? (
            <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
              <RefreshCw className="animate-spin text-orange-500" size={32} />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Vouchers list...</p>
            </div>
          ) : vouchers.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-[2rem] bg-orange-50 text-orange-500 flex-center mb-2">
                <Ticket size={40} className="stroke-[1.5]" />
              </div>
              <h3 className="text-xl font-black text-gray-800">No Vouchers Defined</h3>
              <p className="text-sm text-gray-400 font-bold max-w-sm">Create promo codes to trigger store discount campaigns or reward loyalty.</p>
              <button 
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-6 py-3 bg-black text-white hover:bg-gray-800 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all"
              >
                Add First Voucher
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Code & Type</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Discount Benefit</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rules / Targets</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Redemptions</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {vouchers.map((voucher) => {
                    const isExpired = new Date(voucher.end_date) < new Date();
                    
                    return (
                      <tr key={voucher.id} className="hover:bg-gray-50/30 transition-colors">
                        {/* Code & Type */}
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex-center shrink-0 ${
                              voucher.type === 'product_wise' ? 'bg-indigo-50 text-indigo-600' :
                              voucher.type === 'campaign' ? 'bg-orange-50 text-orange-600' :
                              voucher.type === 'secret' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              <Ticket size={18} />
                            </div>
                            <div>
                              <div className="font-black text-gray-900">{voucher.code}</div>
                              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                                {getVoucherTypeLabel(voucher.type)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Discount */}
                        <td className="px-8 py-6">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700">
                            {voucher.discount_type === 'percent' ? (
                              <><Percent size={12} /> {voucher.discount_value}% Off</>
                            ) : (
                              <>Rs {voucher.discount_value} Off</>
                            )}
                          </span>
                        </td>

                        {/* Targets / Rules */}
                        <td className="px-8 py-6 max-w-[200px]">
                          {voucher.type === 'product_wise' && (
                            <div className="text-xs font-bold text-gray-700 truncate">
                              Product: <span className="text-indigo-600 font-semibold">{products.find(p => p.id === voucher.specific_product_id)?.name || 'Loading...'}</span>
                            </div>
                          )}
                          {voucher.type === 'secret' && (
                            <div className="text-xs font-bold text-gray-700 truncate">
                              Recipient: <span className="text-purple-600 font-semibold">{customers.find(c => c.id === voucher.specific_customer_id)?.full_name || 'Loading...'}</span>
                            </div>
                          )}
                          {voucher.type === 'campaign' && (
                            <div className="text-xs font-bold text-gray-700">
                              Target: <span className="text-orange-600 font-black uppercase tracking-wider text-[9px]">{getCampaignTargetLabel(voucher.campaign_target)}</span>
                            </div>
                          )}
                          {voucher.type === 'new_user' && (
                            <div className="text-xs font-bold text-gray-700">
                              Timeframe: <span className="text-amber-600 font-semibold">{voucher.new_user_timeframe_hours} hrs</span> from Signup
                            </div>
                          )}
                        </td>

                        {/* Redemptions */}
                        <td className="px-8 py-6">
                          <div className="text-xs font-bold text-gray-700">
                            {voucher.used_count} <span className="text-gray-400">/ {voucher.max_uses}</span> Used
                          </div>
                          <div className="w-20 bg-gray-100 rounded-full h-1 mt-1 overflow-hidden">
                            <div 
                              className="bg-orange-500 h-1" 
                              style={{ width: `${Math.min(100, (voucher.used_count / (voucher.max_uses || 1)) * 100)}%` }}
                            />
                          </div>
                        </td>

                        {/* Duration */}
                        <td className="px-8 py-6">
                          <div className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(voucher.start_date).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] text-gray-400 font-semibold flex items-center gap-1 mt-0.5">
                            <Clock size={12} />
                            to {new Date(voucher.end_date).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Status Toggle */}
                        <td className="px-8 py-6">
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-50 text-red-600">
                              Expired
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleToggleActive(voucher.id, voucher.is_active)}
                              className="transition-transform active:scale-95"
                            >
                              {voucher.is_active ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                                  <ToggleRight size={28} className="text-emerald-500 shrink-0" /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-gray-400 font-bold text-xs">
                                  <ToggleLeft size={28} className="text-gray-300 shrink-0" /> Suspended
                                </span>
                              )}
                            </button>
                          )}
                        </td>

                        {/* Delete Action */}
                        <td className="px-8 py-6 text-right">
                          <button 
                            onClick={() => handleDeleteVoucher(voucher.id)}
                            className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors inline-flex items-center"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Create Voucher Dialog */}
        {showAddModal && (
          <div className="fixed inset-0 z-[1000] flex-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
              
              {/* Header */}
              <div className="p-8 pb-6 border-b border-gray-50 flex items-center justify-between bg-orange-50/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex-center">
                    <Plus size={20} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 leading-tight">Create Promo Voucher</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mt-1">Configure New Offer</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="w-10 h-10 rounded-xl bg-white flex-center shadow-sm hover:shadow-md border border-gray-100 transition-all active:scale-95"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCreateVoucher} className="p-8 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                
                {formError && (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-600 font-bold text-xs rounded-2xl flex items-center gap-2">
                    <AlertCircle size={16} />
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Voucher Code */}
                  <div className="space-y-2 col-span-full">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Voucher Code *</label>
                    <input 
                      type="text" required placeholder="e.g. EXTRA25OFF"
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-orange-500 font-black uppercase tracking-wide"
                      value={newVoucher.code}
                      onChange={(e) => setNewVoucher({...newVoucher, code: e.target.value})}
                    />
                  </div>

                  {/* Voucher Type */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Voucher Category *</label>
                    <select 
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                      value={newVoucher.type}
                      onChange={(e) => setNewVoucher({...newVoucher, type: e.target.value, specific_product_id: '', specific_customer_id: ''})}
                    >
                      <option value="product_wise">Product Wise Voucher</option>
                      <option value="campaign">Campaign / Storewide Voucher</option>
                      <option value="secret">Secret Personal Voucher</option>
                      <option value="new_user">New User Signups</option>
                    </select>
                  </div>

                  {/* Discount Benefit Type */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Discount Type *</label>
                    <select 
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                      value={newVoucher.discount_type}
                      onChange={(e) => setNewVoucher({...newVoucher, discount_type: e.target.value})}
                    >
                      <option value="amount">Amount based discount (Rs)</option>
                      <option value="percent">Percentage based discount (%)</option>
                    </select>
                  </div>

                  {/* Discount Value */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Discount Value *</label>
                    <input 
                      type="number" required placeholder="e.g. 50" min={1}
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                      value={newVoucher.discount_value}
                      onChange={(e) => setNewVoucher({...newVoucher, discount_value: e.target.value})}
                    />
                  </div>

                  {/* Max Vouchers Allowed */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Max Redemptions *</label>
                    <input 
                      type="number" required placeholder="e.g. 100" min={1}
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                      value={newVoucher.max_uses}
                      onChange={(e) => setNewVoucher({...newVoucher, max_uses: e.target.value})}
                    />
                  </div>

                  {/* Start Date */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Start Date *</label>
                    <input 
                      type="date" required
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                      value={newVoucher.start_date}
                      onChange={(e) => setNewVoucher({...newVoucher, start_date: e.target.value})}
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">End Date *</label>
                    <input 
                      type="date" required
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                      value={newVoucher.end_date}
                      onChange={(e) => setNewVoucher({...newVoucher, end_date: e.target.value})}
                    />
                  </div>

                  {/* Product Wise fields */}
                  {newVoucher.type === 'product_wise' && (
                    <div className="space-y-2 col-span-full">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Select Target Product *</label>
                      <select 
                        required
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                        value={newVoucher.specific_product_id}
                        onChange={(e) => setNewVoucher({...newVoucher, specific_product_id: e.target.value})}
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Secret personal fields */}
                  {newVoucher.type === 'secret' && (
                    <div className="space-y-2 col-span-full">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Select Customer Recipient *</label>
                      <select 
                        required
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                        value={newVoucher.specific_customer_id}
                        onChange={(e) => setNewVoucher({...newVoucher, specific_customer_id: e.target.value})}
                      >
                        <option value="">-- Choose Customer --</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.full_name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Campaign Target selection */}
                  {newVoucher.type === 'campaign' && (
                    <div className="space-y-2 col-span-full">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Campaign Target *</label>
                      <select 
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                        value={newVoucher.campaign_target}
                        onChange={(e) => setNewVoucher({...newVoucher, campaign_target: e.target.value})}
                      >
                        <option value="product">Storewide Product Discount</option>
                        <option value="shipping">Shipping Fee Discount</option>
                      </select>
                    </div>
                  )}

                  {/* New user timeframe in hours */}
                  {newVoucher.type === 'new_user' && (
                    <div className="space-y-2 col-span-full">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Validity Timeframe (Hours after Signup) *</label>
                      <input 
                        type="number" required min={1} placeholder="e.g. 48"
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                        value={newVoucher.new_user_timeframe_hours}
                        onChange={(e) => setNewVoucher({...newVoucher, new_user_timeframe_hours: e.target.value})}
                      />
                    </div>
                  )}

                </div>

                {/* Submit Actions */}
                <div className="pt-6 border-t border-gray-50 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-5 rounded-2xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all font-bold text-xs uppercase tracking-widest active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-5 rounded-2xl bg-black text-white hover:bg-gray-800 transition-all font-bold text-xs uppercase tracking-widest active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isSaving ? <RefreshCw className="animate-spin" size={16} /> : 'Save Voucher'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
