'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, User, Menu, X, Package, LogIn, Clock, ChevronRight, Truck, Star, Ticket, LogOut } from 'lucide-react';
import { useCart } from '@/lib/store/useCart';
import { supabase } from '@/lib/supabase';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState<string>('User');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [storeName, setStoreName] = useState('Ecommerce');

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches] = useState(['Smart Watch', 'Summer Collection', 'Wireless Earbuds', 'Premium Gadgets']);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const router = useRouter();
  const { items } = useCart();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleScroll();
    handleResize();
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    // Load storeName from localStorage on mount
    const savedStoreName = localStorage.getItem('storeName');
    if (savedStoreName) {
      setStoreName(savedStoreName);
    }

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .maybeSingle();
          if (data && data.full_name) {
            setProfileName(data.full_name);
          } else {
            const nameFromEmail = user.email ? user.email.split('@')[0] : 'User';
            setProfileName(nameFromEmail);
          }
        } catch (err) {
          const nameFromEmail = user.email ? user.email.split('@')[0] : 'User';
          setProfileName(nameFromEmail);
        }
      }
    };

    const fetchStoreName = async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('*')
          .eq('key', 'store_settings')
          .maybeSingle();
        if (data && data.value && data.value.store_name) {
          setStoreName(data.value.store_name);
          localStorage.setItem('storeName', data.value.store_name);
        }
      } catch (err) {
        console.error('Error fetching store settings:', err);
      }
    };

    const fetchCategories = async () => {
      try {
        const { data } = await supabase
          .from('ecommerce_categories')
          .select('id, name')
          .order('name');
        if (data) setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    checkUser();
    fetchStoreName();
    fetchCategories();

    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    } else {
      setRecentSearches(['Smart Watch', 'Earbuds', 'T-Shirt']);
    }
  }, []);

  // Fetch suggestions as searchQuery changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }
      try {
        const { data } = await supabase
          .from('ecommerce_products')
          .select('display_name')
          .ilike('display_name', `%${searchQuery}%`)
          .limit(5);
        if (data) {
          setSuggestions(data.map(p => p.display_name));
        }
      } catch (err) {
        console.error('Error fetching search suggestions:', err);
      }
    };

    const timer = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setIsSearchFocused(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfileName('User');
    router.push('/');
    router.refresh();
  };

  const firstLetter = storeName ? storeName.charAt(0).toUpperCase() : 'E';

  return (
    <header 
      className="sticky top-0 z-[999] w-full bg-white border-b border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-300"
      style={{ height: isMobile ? (isScrolled ? '48px' : '56px') : '72px' }}
    >
      {/* Desktop Header Layout */}
      <div className="hidden md:flex max-w-[1440px] mx-auto h-full items-center justify-between px-6 gap-5">
        {/* Left Side: Brand Logo and Category Menu */}
        <div className="flex items-center gap-5 shrink-0">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 animate-in zoom-in duration-300" style={{ background: 'var(--primary-gradient)' }}>
              <span className="text-white font-bold text-xl">{firstLetter}</span>
            </div>
            <span className="text-[24px] font-[700] tracking-tight text-[#111827]">
              {storeName.split(' ')[0]}<span className="text-[#FF6A00]">{storeName.split(' ').slice(1).join(' ')}</span>
            </span>
          </Link>

          {/* Category Hover Menu */}
          <div className="relative group/cat">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[#111827] hover:text-[#FF6A00] font-semibold text-[13px] hover:bg-[#F9FAFB] transition-all duration-300 cursor-pointer bg-transparent border-none">
              <Menu size={16} />
              <span>Categories</span>
            </button>
            
            {/* Hover Dropdown */}
            <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_rgba(0,0,0,0.08)] opacity-0 invisible group-hover/cat:opacity-100 group-hover/cat:visible transition-all duration-300 z-[1000] p-2">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <Link 
                    key={cat.id} 
                    href={`/products?category=${encodeURIComponent(cat.name)}`}
                    className="flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:text-[#FF6A00] hover:bg-[#F9FAFB] transition-colors duration-200"
                  >
                    <span>{cat.name}</span>
                    <ChevronRight size={14} className="text-gray-400" />
                  </Link>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-gray-400">No categories found</div>
              )}
            </div>
          </div>
        </div>

        {/* Center: Sleek Search Bar */}
        <div className="relative flex-grow max-w-[50%] lg:max-w-[60%] transition-all duration-300">
          <form 
            onSubmit={handleSearch} 
            className="w-full h-[46px] bg-white rounded-full border-2 border-[#E5E7EB] focus-within:border-[#FF6A00] focus-within:shadow-[0_0_0_4px_rgba(255,106,0,0.12)] transition-all duration-300 overflow-hidden flex items-center"
          >
            <input 
              type="text" 
              placeholder="Search for products, brands and more"
              className="flex-grow h-full pl-6 pr-4 outline-none font-[500] text-[15px] text-[#111827] placeholder:text-[#9CA3AF] placeholder:font-[400] placeholder:text-[15px] bg-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            />
            <button 
              type="submit" 
              className="w-[58px] h-[46px] shrink-0 bg-[#FFA41C] hover:bg-[#FA8900] text-[#111111] flex items-center justify-center transition-colors duration-300 cursor-pointer border-none"
            >
              <Search size={20} className="text-[#111111]" />
            </button>
          </form>

          {/* SUGGESTION DROPDOWN */}
          {isSearchFocused && (
            <div className="absolute top-[52px] left-0 right-0 bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_rgba(0,0,0,0.08)] z-[1000] overflow-hidden p-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {!searchQuery.trim() ? (
                <div className="p-3">
                  {recentSearches.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2 flex items-center justify-between">
                        <span>Recent Searches</span>
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setRecentSearches([]); localStorage.removeItem('recentSearches'); }}
                          className="text-[10px] text-gray-400 hover:text-[#FF6A00] font-semibold lowercase bg-transparent border-none cursor-pointer"
                        >
                          clear
                        </button>
                      </h4>
                      <div className="flex flex-col">
                        {recentSearches.map((term, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => { setSearchQuery(term); router.push(`/search?q=${encodeURIComponent(term)}`); addRecentSearch(term); setIsSearchFocused(false); }}
                            className="h-12 w-full flex items-center px-4 rounded-xl text-sm text-[#111827] font-medium hover:bg-[#F9FAFB] text-left transition-colors border-none bg-transparent cursor-pointer"
                          >
                            <Clock size={16} className="text-gray-400 mr-3" />
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Trending Searches</h4>
                    <div className="flex flex-wrap gap-2 px-3">
                      {trendingSearches.map((term, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { setSearchQuery(term); router.push(`/search?q=${encodeURIComponent(term)}`); addRecentSearch(term); setIsSearchFocused(false); }}
                          className="px-3 py-1.5 bg-[#F9FAFB] hover:bg-[#FFF3E6] hover:text-[#FF6A00] rounded-full text-xs text-gray-600 font-semibold border border-gray-100 transition-all cursor-pointer"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  {suggestions.length > 0 ? (
                    suggestions.map((name, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setSearchQuery(name); router.push(`/search?q=${encodeURIComponent(name)}`); addRecentSearch(name); setIsSearchFocused(false); }}
                        className="h-12 w-full flex items-center px-4 rounded-xl text-sm text-[#111827] font-medium hover:bg-[#F9FAFB] text-left transition-colors truncate border-none bg-transparent cursor-pointer"
                      >
                        <Search size={16} className="text-gray-400 mr-3 shrink-0" />
                        <span className="truncate">{name}</span>
                      </button>
                    ))
                  ) : (
                    <button
                      type="submit"
                      className="h-12 w-full flex items-center px-4 rounded-xl text-sm text-[#FF6A00] font-bold hover:bg-[#F9FAFB] text-left transition-colors border-none bg-transparent cursor-pointer"
                    >
                      <Search size={16} className="text-[#FF6A00] mr-3" />
                      Search for "{searchQuery}"
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Cart, Profile Actions */}
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/cart" className="p-2 rounded-full hover:bg-[var(--surface-1)] transition-all relative flex items-center justify-center">
            <ShoppingCart size={24} className="text-[#111827]" />
            {cartCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 bg-[#FF6A00] text-white flex items-center justify-center font-[500] text-[11px] rounded-full shadow-[0_2px_5px_rgba(255,106,0,0.4)]"
                style={{ width: '18px', height: '18px' }}
              >
                {cartCount}
              </span>
            )}
          </Link>

          <div className="relative" ref={dropdownRef} onMouseEnter={() => setIsDropdownOpen(true)} onMouseLeave={() => setIsDropdownOpen(false)}>
            <div 
              onClick={(e) => {
                if (user) {
                  router.push('/account/profile');
                } else {
                  router.push('/login');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '14px',
                transition: 'all 0.25s ease',
                cursor: 'pointer',
                background: isDropdownOpen ? '#F9FAFB' : 'transparent',
              }}
              className="hover:bg-[#F9FAFB] select-none"
            >
              <div 
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '999px',
                  background: '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#374151'
                }}
              >
                <User size={18} />
              </div>

              <div className="flex flex-col text-left shrink-0">
                <span 
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#6B7280',
                    lineHeight: '1.2'
                  }}
                  className="max-w-[100px] truncate block"
                >
                  Hello, {user ? (profileName || 'Customer') : 'Sign In'}
                </span>
                <span 
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#111827',
                    lineHeight: '1.3'
                  }}
                >
                  {user ? 'Account & Lists' : 'My Account'}
                </span>
              </div>
            </div>

            {isDropdownOpen && (
              <div 
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  width: '260px',
                  background: 'white',
                  borderRadius: '20px',
                  border: '1px solid #EEF2F7',
                  padding: '10px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                  zIndex: 1000
                }}
                className="animate-in fade-in slide-in-from-top-2 duration-150"
              >
                {!user ? (
                  <div className="p-2 border-b border-gray-100/80 pb-3 mb-2">
                    <Link 
                      href="/login"
                      onClick={() => setIsDropdownOpen(false)}
                      style={{
                        height: '40px',
                        background: '#FF6A00',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none'
                      }}
                      className="hover:bg-[#E85D00] transition-colors w-full shadow-sm"
                    >
                      Sign In
                    </Link>
                    <div className="text-center mt-2" style={{ fontSize: '11px', color: '#9CA3AF' }}>
                      New customer? <Link href="/signup" onClick={() => setIsDropdownOpen(false)} className="text-[#FF6A00] font-bold hover:underline">Start here.</Link>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-2 border-b border-gray-100/80 pb-2.5 mb-2">
                    <div style={{ fontSize: '11px', fontWeight: 500, color: '#9CA3AF' }}>Logged in as</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }} className="truncate">
                      {user.email}
                    </div>
                  </div>
                )}

                <div className="space-y-0.5">
                  <Link 
                    href="/account/profile?tab=profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="h-11 rounded-xl px-3.5 flex items-center gap-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#FF6A00] transition-colors cursor-pointer w-full text-left"
                  >
                    <User size={16} />
                    <span>My Profile</span>
                  </Link>

                  <Link 
                    href="/account/profile?tab=orders"
                    onClick={() => setIsDropdownOpen(false)}
                    className="h-11 rounded-xl px-3.5 flex items-center gap-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#FF6A00] transition-colors cursor-pointer w-full text-left"
                  >
                    <Package size={16} />
                    <span>Orders</span>
                  </Link>

                  <button 
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleLogout();
                    }}
                    className="h-11 rounded-xl px-3.5 flex items-center gap-3 text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer w-full text-left border-none bg-transparent"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Top Bar (Main Header) */}
      <div className="flex md:hidden items-center justify-between w-full h-full relative px-4">
        
        {/* Left Side: ☰ Hamburger Button */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-800 transition-colors cursor-pointer border-none bg-transparent"
        >
          <Menu size={22} />
        </button>

        {/* Center: Small Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group absolute left-1/2 -translate-x-1/2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-gradient)' }}>
            <span className="text-white font-bold text-sm">{firstLetter}</span>
          </div>
          <span className="text-sm font-bold text-gray-900 tracking-tight">
            {storeName.split(' ')[0]}
          </span>
        </Link>

        {/* Right Side: [🔍] [🛒(badge)] */}
        <div className="flex items-center gap-1">
          
          {/* Search Button (Hidden when scrolled) */}
          {!isScrolled && (
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-800 transition-all duration-300 cursor-pointer animate-in fade-in duration-200 border-none bg-transparent"
            >
              <Search size={22} />
            </button>
          )}

          {/* Cart Icon & Badge */}
          <Link href="/cart" className="p-2 rounded-full hover:bg-gray-100 transition-all relative flex items-center justify-center">
            <ShoppingCart size={22} className="text-gray-800" />
            {cartCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 bg-[#FF6A00] text-white flex items-center justify-center font-[500] text-[10px] rounded-full shadow-[0_2px_5px_rgba(255,106,0,0.4)]"
                style={{ width: '16px', height: '16px' }}
              >
                {cartCount}
              </span>
            )}
          </Link>

        </div>
      </div>

      {/* Category Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[1000] md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Category Drawer Content */}
      <div 
        className={`fixed top-0 left-0 h-full w-[280px] bg-white z-[1001] md:hidden shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-gradient)' }}>
              <span className="text-white font-bold text-sm">{firstLetter}</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{storeName}</span>
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer border-none bg-transparent"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Account Info */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">My Profile</div>
            {user ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-800 truncate">Hello, {profileName}</p>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <Link 
                    href="/account/profile?tab=profile" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-[11px] font-semibold text-[#FF6A00] bg-white hover:bg-orange-50/20 border border-orange-100 px-2 py-1.5 rounded-lg text-center"
                  >
                    Profile
                  </Link>
                  <Link 
                    href="/account/profile?tab=orders" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-[11px] font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 px-2 py-1.5 rounded-lg text-center"
                  >
                    Orders
                  </Link>
                </div>
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                  className="w-full text-[11px] font-semibold text-red-500 bg-red-50 hover:bg-red-100/50 py-1.5 rounded-lg text-center cursor-pointer mt-1 border-none"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Sign in to manage orders, tracks, and vouchers.</p>
                <Link 
                  href="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-xs font-bold text-white bg-[#FF6A00] py-2 rounded-lg text-center hover:bg-[#E85D00]"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Categories list */}
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Shop Categories</div>
            <div className="space-y-0.5">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${encodeURIComponent(cat.name)}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-gray-700 hover:text-[#FF6A00] hover:bg-[#F9FAFB] transition-colors"
                >
                  <span>{cat.name}</span>
                  <ChevronRight size={14} className="text-gray-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Search Page/Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-white z-[1002] flex flex-col p-5 md:hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Top Search Bar */}
          <div className="flex items-center gap-3 mb-6">
            <button 
              onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-700 cursor-pointer border-none bg-transparent"
            >
              <ChevronRight className="rotate-180" size={24} />
            </button>
            
            <form onSubmit={handleSearch} className="flex-1 relative flex items-center">
              <input 
                autoFocus
                type="text" 
                placeholder="Search products, brands..."
                className="w-full h-11 pl-4 pr-10 rounded-xl bg-gray-50 border border-[#E5E7EB] focus:border-[#FF6A00] outline-none focus:ring-4 focus:ring-[#FF6A00]/8 transition-all font-[600] text-sm text-gray-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1 rounded-full hover:bg-gray-200 text-gray-400 cursor-pointer border-none bg-transparent"
                >
                  <X size={14} />
                </button>
              )}
            </form>
          </div>

          {/* Suggestion list, Recent searches or Trending */}
          <div className="flex-1 overflow-y-auto space-y-6">
            {searchQuery.trim() ? (
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Suggestions</h4>
                <div className="flex flex-col">
                  {suggestions.length > 0 ? (
                    suggestions.map((name, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setSearchQuery(name); router.push(`/search?q=${encodeURIComponent(name)}`); addRecentSearch(name); setIsSearchOpen(false); }}
                        className="h-12 w-full flex items-center border-b border-gray-50 text-xs font-semibold text-gray-700 text-left hover:bg-gray-50/50 border-none bg-transparent cursor-pointer"
                      >
                        <Search size={14} className="text-gray-400 mr-3" />
                        <span className="truncate">{name}</span>
                      </button>
                    ))
                  ) : (
                    <button
                      type="submit"
                      onClick={handleSearch}
                      className="h-12 w-full flex items-center border-b border-gray-50 text-xs font-bold text-[#FF6A00] text-left hover:bg-gray-50/50 border-none bg-transparent cursor-pointer"
                    >
                      <Search size={14} className="text-[#FF6A00] mr-3" />
                      Search for "{searchQuery}"
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recent Searches</h4>
                      <button 
                        type="button"
                        onClick={() => { setRecentSearches([]); localStorage.removeItem('recentSearches'); }}
                        className="text-[10px] font-bold text-[#FF6A00] hover:underline border-none bg-transparent cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-col">
                      {recentSearches.map((term, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { setSearchQuery(term); router.push(`/search?q=${encodeURIComponent(term)}`); addRecentSearch(term); setIsSearchOpen(false); }}
                          className="h-12 w-full flex items-center border-b border-gray-50 text-xs font-semibold text-gray-700 text-left hover:bg-gray-50/50 border-none bg-transparent cursor-pointer"
                        >
                          <Clock size={14} className="text-gray-400 mr-3" />
                          <span>{term}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending searches */}
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Trending Searches</h4>
                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.map((term, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setSearchQuery(term); router.push(`/search?q=${encodeURIComponent(term)}`); addRecentSearch(term); setIsSearchOpen(false); }}
                        className="px-3 py-1.5 bg-gray-50 hover:bg-[#FFF3E6] hover:text-[#FF6A00] rounded-full text-xs text-gray-600 font-semibold border border-gray-100 transition-all cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
