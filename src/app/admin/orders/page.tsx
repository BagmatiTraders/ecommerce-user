'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, 
  Filter, 
  RefreshCw,
  MessageCircle,
  Copy,
  Printer,
  FileText,
  ClipboardList,
  MoreHorizontal,
  ChevronDown,
  Clock,
  Package,
  ExternalLink
} from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  total_amount: number;
  status: string;
  created_at: string;
  logistic_provider?: string;
  logistic_selection?: string;
  ecommerce_order_items: any[];
}

export default function OrdersPage({ isVendor = false, vendorCategory = '' }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    let query = supabase
      .from('ecommerce_orders')
      .select('*, ecommerce_order_items(*, ecommerce_products(*))')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      let filteredOrders = data || [];
      if (isVendor && vendorCategory) {
        filteredOrders = filteredOrders.filter(order => 
          order.ecommerce_order_items.some((item: any) => 
            item.ecommerce_products?.category === vendorCategory
          )
        );
      }
      setOrders(filteredOrders);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('ecommerce_orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      alert('Error updating status: ' + error.message);
    } else {
      fetchOrders();
    }
  };

  const getStatusBadge = (status: string) => {
    const base = "px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-tight";
    switch (status.toLowerCase()) {
      case 'pending': return `${base} bg-gray-100 text-gray-700`;
      case 'processing': return `${base} bg-blue-50 text-blue-600`;
      case 'shipped': return `${base} bg-purple-50 text-purple-600`;
      case 'delivered': return `${base} bg-green-50 text-green-600`;
      case 'cancelled': return `${base} bg-red-50 text-red-600`;
      default: return `${base} bg-gray-50 text-gray-600`;
    }
  };

  return (
    <div className="p-6 bg-[#f5f5f5] min-h-screen font-sans">
      <div className="max-w-none">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#212121]">Order Management</h1>
            <p className="text-xs text-[#757575] mt-1">Manage and fulfill your store orders efficiently</p>
          </div>
          <button 
            onClick={fetchOrders}
            className="w-9 h-9 rounded bg-white border border-gray-200 flex-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all shadow-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Tabs / Filters */}
        <div className="bg-white rounded border border-gray-200 mb-4 overflow-hidden shadow-sm">
          <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide">
            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-6 py-3 text-[13px] font-medium capitalize transition-all border-b-2 whitespace-nowrap ${
                  statusFilter === tab 
                    ? 'border-orange-500 text-orange-500 bg-orange-50/20' 
                    : 'border-transparent text-[#757575] hover:text-[#212121]'
                }`}
              >
                {tab} ({orders.filter(o => tab === 'all' || o.status.toLowerCase() === tab).length})
              </button>
            ))}
          </div>
          <div className="p-3 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Order Number"
                className="w-64 pl-10 pr-3 py-1.5 bg-white border border-gray-300 rounded text-[13px] outline-none focus:border-orange-500 transition-all placeholder:text-gray-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="px-4 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-[#757575] flex items-center gap-2 hover:bg-gray-50">
              <Filter size={12} /> Filter
            </button>
          </div>
        </div>

        {/* Orders List Header */}
        <div className="bg-white grid grid-cols-12 gap-4 px-6 py-2.5 text-[12px] font-medium text-[#757575] border border-gray-200 rounded-t mb-[-1px]">
          <div className="col-span-5">Product</div>
          <div className="col-span-2 text-center">Total Amount</div>
          <div className="col-span-2 text-center">Delivery</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Orders List Body */}
        <div className="space-y-3 mt-1">
          {loading ? (
            <div className="py-20 flex-center flex-col gap-3 bg-white border border-gray-200 rounded">
              <RefreshCw className="animate-spin text-orange-500" size={24} />
              <span className="text-xs font-medium text-gray-400">Loading Orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-20 flex-center flex-col gap-3 bg-white border border-gray-200 rounded">
              <Package size={40} className="text-gray-100" />
              <span className="text-xs font-medium text-gray-400">No orders found</span>
            </div>
          ) : (
            orders
              .filter(o => o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) || o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded overflow-hidden hover:shadow-md transition-shadow">
                {/* Row Header */}
                <div className="bg-[#fafafa] px-6 py-2 border-b border-gray-100 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300" />
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex-center">
                        <MessageCircle size={10} className="text-gray-500" />
                      </div>
                      <span className="text-[12px] font-medium text-[#2563eb] hover:underline cursor-pointer">{order.customer_name}</span>
                      <div className="px-1.5 py-0.5 border border-blue-200 text-[#2563eb] text-[10px] rounded leading-none">Campaign</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-[#757575]">
                    <div className="flex items-center gap-1">
                      Order Number: <span className="text-[#2563eb] font-medium cursor-pointer">{order.order_number}</span>
                      <Copy size={10} className="cursor-pointer hover:text-black ml-1" />
                    </div>
                    <div className="flex items-center gap-1">
                      Create Time: <span className="text-[#212121]">{new Date(order.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                {/* Row Body */}
                <div className="grid grid-cols-12 gap-4 p-5 items-center">
                  {/* Product Info */}
                  <div className="col-span-5 space-y-2">
                    {order.ecommerce_order_items.map((item: any) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="w-20 h-20 rounded bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                          {item.ecommerce_products?.images?.[0] ? (
                            <img src={item.ecommerce_products.images[0]} className="w-full h-full object-cover" />
                          ) : <div className="w-full h-full flex-center bg-gray-50 text-gray-200"><Package size={20} /></div>}
                        </div>
                        <div className="min-w-0 py-0.5">
                          <h4 className="text-[13px] font-medium text-[#212121] line-clamp-2 leading-tight hover:text-[#2563eb] cursor-pointer">
                            {item.ecommerce_products?.display_name || 'Deleted Product'}
                          </h4>
                          <div className="text-[11px] text-[#757575] mt-1.5 flex flex-col gap-0.5">
                            <span>Color family: Multicolor</span>
                            <span>Seller SKU: {item.ecommerce_products?.inventory_id || 'N/A'}</span>
                          </div>
                          <button className="text-[11px] font-bold text-[#212121] mt-2 flex items-center gap-0.5 hover:underline">
                            More <ChevronDown size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Amount */}
                  <div className="col-span-2 text-center space-y-1">
                    <div className="text-[11px] text-[#757575]">Rs. {(order.total_amount / (order.ecommerce_order_items?.[0]?.quantity || 1)).toFixed(0)}</div>
                    <div className="text-[14px] font-bold text-orange-500">× {order.ecommerce_order_items?.[0]?.quantity || 1}</div>
                    <div className="mt-2 text-[13px] font-bold text-[#212121]">Rs. {order.total_amount.toLocaleString()}</div>
                    <div className="inline-block px-1.5 py-0.5 border border-blue-200 text-blue-500 text-[9px] rounded bg-white">COD</div>
                  </div>

                  {/* Delivery */}
                  <div className="col-span-2 text-center space-y-0.5">
                    <div className="text-[13px] font-bold text-[#212121]">Standard</div>
                    <div className="text-[11px] text-[#757575]">FM 3PL: {order.logistic_provider || 'NP-DEX'}</div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex flex-col items-center gap-2">
                    <div className="text-[13px] font-bold text-[#212121]">
                      {order.status}
                    </div>
                    {order.status.toLowerCase() === 'pending' && (
                      <div className="px-2 py-0.5 bg-blue-50 text-blue-500 text-[10px] rounded-full border border-blue-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        47.7 hrs left
                      </div>
                    )}
                    <div className="flex gap-2 text-gray-400 mt-1">
                      <div title="AWB" className="flex items-center gap-1 hover:text-gray-600 cursor-pointer"><Printer size={12} /> <span className="text-[10px]">AWB</span></div>
                      <div title="Invoice" className="flex items-center gap-1 hover:text-gray-600 cursor-pointer"><FileText size={12} /> <span className="text-[10px]">Invoice</span></div>
                      <div title="Pick List" className="flex items-center gap-1 hover:text-gray-600 cursor-pointer"><ClipboardList size={12} /> <span className="text-[10px]">PickList</span></div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 text-right space-y-2">
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'processing')}
                      className="w-full py-1.5 bg-orange-500 text-white text-[12px] font-bold rounded hover:bg-orange-600 transition-all"
                    >
                      Pack & Print
                    </button>
                    <button className="w-full py-1.5 bg-white border border-orange-500 text-orange-500 text-[12px] font-medium rounded hover:bg-orange-50 transition-all flex items-center justify-center gap-1">
                      More Actions <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
