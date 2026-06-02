'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, User, Menu, X, Package, LogIn, Clock, ChevronRight, Truck, Star, Ticket, LogOut } from 'lucide-react';
import { useCart } from '@/lib/store/useCart';
import { supabase } from '@/lib/supabase';

const HighlightText = ({ text, search }: { text: string; search: string }) => {
  if (!search.trim()) return <span>{text}</span>;
  try {
    const regex = new RegExp(`(${search.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) 
            ? <strong key={i} className="text-[#FF6A00] font-extrabold">{part}</strong> 
            : <span key={i} className="text-gray-700 font-medium">{part}</span>
        )}
      </span>
    );
  } catch (_) {
    return <span>{text}</span>;
  }
};

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
  const [trendingSearches, setTrendingSearches] = useState<string[]>(['Smart Watch', 'Summer Collection', 'Wireless Earbuds', 'Premium Gadgets']);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchData, setSearchData] = useState<{
    suggestedSearches: string[];
    products: any[];
    categories: string[];
    brands: string[];
  }>({
    suggestedSearches: [],
    products: [],
    categories: [],
    brands: []
  });
  
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

    const fetchTrending = async () => {
      try {
        const { data } = await supabase
          .from('search_logs')
          .select('query')
          .not('query', 'is', null)
          .limit(100);
        
        if (data && data.length > 0) {
          const counts: Record<string, number> = {};
          data.forEach(row => {
            const q = row.query.trim();
            if (q.length > 1) {
              counts[q] = (counts[q] || 0) + 1;
            }
          });
          const sorted = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0])
            .slice(0, 5);
          if (sorted.length > 0) {
            setTrendingSearches(sorted);
          }
        }
      } catch (err) {
        console.error('Error fetching trending searches:', err);
      }
    };

    checkUser();
    fetchStoreName();
    fetchCategories();
    fetchTrending();

    // Prefetch search route in background to compile/load it instantly on user submit
    router.prefetch('/search');

    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    } else {
      setRecentSearches(['Smart Watch', 'Earbuds', 'T-Shirt']);
    }
  }, []);

  // Rank products according to active Weights & Boosts
  const rankProducts = (productsList: any[]) => {
    let weights = { popularity: 40, recency: 20, stock: 20, rating: 20 };
    let boosts = { inStock: true, highRated: true, onSale: false, featured: false };
    try {
      const saved = localStorage.getItem('search_ranking_rules');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.weights) weights = parsed.weights;
        if (parsed.boosts) boosts = parsed.boosts;
      }
    } catch (_) {}

    return productsList.map(p => {
      // 1. Stock availability (20%)
      const stockQty = p.stock_quantity || 0;
      const stockScore = stockQty > 0 ? 100 : 0;

      // 2. Customer rating (20%)
      const ratingVal = p.rating || 5.0;
      const ratingScore = (ratingVal / 5.0) * 100;

      // 3. Product recency (20%)
      const createdDate = new Date(p.created_at || Date.now());
      const diffDays = Math.ceil(Math.abs(Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      const recencyScore = Math.max(0, 100 - (diffDays * 3));

      // 4. Popularity (40%)
      const popularityScore = Math.min(100, ((p.soldCount || 0) * 5) + ((p.reviews_count || 0) * 10));

      let score = (stockScore * (weights.stock / 100)) +
                  (ratingScore * (weights.rating / 100)) +
                  (recencyScore * (weights.recency / 100)) +
                  (popularityScore * (weights.popularity / 100));

      // Apply Boost rules
      if (boosts.inStock && stockQty > 0) score += 20;
      if (boosts.highRated && ratingVal >= 4.0) score += 15;
      if (boosts.onSale && p.special_price && p.special_price < p.regular_price) score += 15;

      return { ...p, score };
    }).sort((a, b) => b.score - a.score);
  };

  // Fetch suggestions as searchQuery changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      const query = searchQuery.trim();
      if (!query) {
        setSearchData({
          suggestedSearches: [],
          products: [],
          categories: [],
          brands: []
        });
        setSuggestions([]);
        return;
      }

      try {
        // Step 1: Parallel fetch for synonyms, suggestions, and categories
        const searchTerms = [query];
        let suggestedSearches: string[] = [];
        let categoriesData: any[] = [];

        const [synonymsRes, sugRes, catsRes] = await Promise.all([
          supabase
            .from('search_synonyms')
            .select('keyword, synonyms')
            .ilike('keyword', `%${query}%`),
          supabase
            .from('search_suggestions')
            .select('suggestion')
            .or(`keyword.ilike.%${query}%,suggestion.ilike.%${query}%`)
            .eq('is_hidden', false)
            .order('priority', { ascending: false })
            .limit(4),
          supabase
            .from('ecommerce_categories')
            .select('name')
            .ilike('name', `%${query}%`)
            .limit(3)
        ]);

        if (synonymsRes.data) {
          synonymsRes.data.forEach(row => {
            if (row.synonyms && Array.isArray(row.synonyms)) {
              searchTerms.push(...row.synonyms);
            }
          });
        }

        if (sugRes.data && sugRes.data.length > 0) {
          suggestedSearches = sugRes.data.map(s => s.suggestion);
        }

        if (catsRes.data) {
          categoriesData = catsRes.data;
        }

        // Step 2: Parallel fetch for matched products and fallback suggestions (if needed)
        let orFilters = searchTerms.map(term => 
          `display_name.ilike.%${term}%,category.ilike.%${term}%,brand.ilike.%${term}%`
        ).join(',');

        const productsPromise = supabase
          .from('ecommerce_products')
          .select('id, display_name, slug, regular_price, special_price, images, category, brand, rating, stock_quantity, created_at')
          .or(orFilters)
          .eq('status', 'active')
          .limit(8);

        const fallbackPromise = suggestedSearches.length === 0
          ? supabase
              .from('ecommerce_products')
              .select('display_name')
              .ilike('display_name', `%${query}%`)
              .limit(4)
          : Promise.resolve({ data: null });

        const [productsRes, fallbackRes] = await Promise.all([
          productsPromise,
          fallbackPromise
        ]);

        if (suggestedSearches.length === 0 && fallbackRes.data) {
          suggestedSearches = fallbackRes.data.map(p => p.display_name);
        }

        const productsData = productsRes.data || [];
        const rankedProducts = rankProducts(productsData).slice(0, 4);

        // Extract Brands from matched products
        const distinctBrands = Array.from(new Set(
          productsData
            .map(p => p.brand)
            .filter(b => b && b !== 'No Brand' && b.toLowerCase().includes(query.toLowerCase()))
        )).slice(0, 3);

        setSearchData({
          suggestedSearches,
          products: rankedProducts,
          categories: categoriesData.map(c => c.name),
          brands: distinctBrands
        });

        // Backward compatibility
        setSuggestions(suggestedSearches);

      } catch (err) {
        console.error('Error fetching search autocomplete:', err);
      }
    };

    const timer = setTimeout(fetchSuggestions, 250); // 250ms debounce
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
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden transition-transform group-hover:rotate-12 animate-in zoom-in duration-300" style={{ background: 'var(--primary-gradient)' }}>
              <img src="/logo.png" alt="EcoMmerce Logo" className="w-full h-full object-cover" />
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
            <div className="absolute top-[52px] left-0 right-0 bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_rgba(0,0,0,0.08)] z-[1000] overflow-hidden p-3 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[500px] overflow-y-auto">
              {!searchQuery.trim() ? (
                <div className="p-2 space-y-4">
                  {recentSearches.length > 0 && (
                    <div>
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
                      <div className="flex flex-col gap-0.5">
                        {recentSearches.map((term, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => { setSearchQuery(term); router.push(`/search?q=${encodeURIComponent(term)}`); addRecentSearch(term); setIsSearchFocused(false); }}
                            className="h-10 w-full flex items-center px-3 rounded-xl text-xs font-semibold text-gray-700 hover:bg-[#F9FAFB] text-left transition-colors border-none bg-transparent cursor-pointer"
                          >
                            <Clock size={14} className="text-gray-400 mr-2.5 shrink-0" />
                            <span className="truncate">{term}</span>
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
                <div className="flex flex-col gap-4">
                  
                  {/* 1. Suggested Searches */}
                  {searchData.suggestedSearches.length > 0 && (
                    <div className="border-b border-gray-50 pb-2">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-1.5">
                        🔍 Suggested Searches
                      </h4>
                      <div className="flex flex-col gap-0.5">
                        {searchData.suggestedSearches.map((name, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => { setSearchQuery(name); router.push(`/search?q=${encodeURIComponent(name)}`); addRecentSearch(name); setIsSearchFocused(false); }}
                            className="h-9 w-full flex items-center px-2 rounded-lg text-xs font-semibold text-gray-700 hover:bg-[#F9FAFB] text-left transition-colors truncate border-none bg-transparent cursor-pointer"
                          >
                            <Search size={12} className="text-gray-400 mr-2 shrink-0" />
                            <span className="truncate">
                              <HighlightText text={name} search={searchQuery} />
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Products */}
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">
                      🛍 Products
                    </h4>
                    {searchData.products.length > 0 ? (
                      <div className="flex flex-col gap-1.5 border-b border-gray-50 pb-2">
                        {searchData.products.map((product) => {
                          const price = product.special_price || product.regular_price;
                          return (
                            <Link
                              key={product.id}
                              href={`/products/${product.slug}`}
                              onClick={() => setIsSearchFocused(false)}
                              className="flex items-center gap-3 p-1.5 hover:bg-[#F9FAFB] rounded-xl transition-all border border-transparent hover:border-gray-100 text-decoration-none text-left"
                            >
                              {/* Product Thumbnail */}
                              <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-lg p-1 flex items-center justify-center shrink-0">
                                {product.images?.[0] ? (
                                  <img 
                                    src={product.images[0]} 
                                    alt={product.display_name} 
                                    className="max-w-full max-h-full object-contain"
                                  />
                                ) : (
                                  <span className="text-[8px] text-gray-300 uppercase">IMG</span>
                                )}
                              </div>

                              {/* Product Info */}
                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <span className="text-[12px] font-bold text-gray-900 line-clamp-1">
                                  <HighlightText text={product.display_name} search={searchQuery} />
                                </span>
                                
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] font-extrabold text-[#FF6A00]">
                                    Rs. {price}
                                  </span>
                                  {product.rating && (
                                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500 bg-amber-50 px-1 py-0.2 rounded">
                                      ★ {product.rating.toFixed(1)}
                                    </span>
                                  )}
                                  <span className={`text-[9px] font-bold px-1 py-0.2 rounded ${product.stock_quantity > 0 ? 'text-green-700 bg-green-50' : 'text-gray-500 bg-gray-50'}`}>
                                    {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-gray-100 rounded-2xl mb-2">
                        <span className="text-gray-300 font-semibold text-xs">No matching products</span>
                        <button
                          type="submit"
                          onClick={handleSearch}
                          className="mt-2 text-xs font-bold text-[#FF6A00] hover:underline bg-transparent border-none cursor-pointer"
                        >
                          Submit global search for "{searchQuery}"
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 3. Categories & Brands */}
                  {(searchData.categories.length > 0 || searchData.brands.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Categories */}
                      {searchData.categories.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-1.5">
                            📂 Categories
                          </h4>
                          <div className="flex flex-col gap-0.5">
                            {searchData.categories.map((cat, i) => (
                              <Link
                                key={i}
                                href={`/products?category=${encodeURIComponent(cat)}`}
                                onClick={() => setIsSearchFocused(false)}
                                className="h-9 w-full flex items-center px-2 rounded-lg text-xs font-semibold text-gray-700 hover:bg-[#F9FAFB] text-left transition-colors truncate text-decoration-none"
                              >
                                <ChevronRight size={12} className="text-gray-400 mr-2 shrink-0" />
                                <span className="truncate">
                                  <HighlightText text={cat} search={searchQuery} />
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Brands */}
                      {searchData.brands.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-1.5">
                            🏷 Brands
                          </h4>
                          <div className="flex flex-col gap-0.5">
                            {searchData.brands.map((brand, i) => (
                              <Link
                                key={i}
                                href={`/products?brand=${encodeURIComponent(brand)}`}
                                onClick={() => setIsSearchFocused(false)}
                                className="h-9 w-full flex items-center px-2 rounded-lg text-xs font-semibold text-gray-700 hover:bg-[#F9FAFB] text-left transition-colors truncate text-decoration-none"
                              >
                                <Ticket size={12} className="text-gray-400 mr-2 shrink-0" />
                                <span className="truncate">
                                  <HighlightText text={brand} search={searchQuery} />
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
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
          <div className="w-7 h-7 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: 'var(--primary-gradient)' }}>
            <img src="/logo.png" alt="EcoMmerce Logo" className="w-full h-full object-cover" />
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
            <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: 'var(--primary-gradient)' }}>
              <img src="/logo.png" alt="EcoMmerce Logo" className="w-full h-full object-cover" />
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
              <div className="space-y-6">
                
                {/* Suggested Searches */}
                {searchData.suggestedSearches.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      🔍 Suggested Searches
                    </h4>
                    <div className="flex flex-col gap-1">
                      {searchData.suggestedSearches.map((name, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { setSearchQuery(name); router.push(`/search?q=${encodeURIComponent(name)}`); addRecentSearch(name); setIsSearchOpen(false); }}
                          className="h-10 w-full flex items-center px-2 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 text-left transition-colors truncate border-none bg-transparent cursor-pointer"
                        >
                          <Search size={14} className="text-gray-400 mr-2.5 shrink-0" />
                          <span className="truncate">
                            <HighlightText text={name} search={searchQuery} />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories & Brands */}
                {(searchData.categories.length > 0 || searchData.brands.length > 0) && (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Categories */}
                    {searchData.categories.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                          📂 Categories
                        </h4>
                        <div className="flex flex-col gap-1">
                          {searchData.categories.map((cat, i) => (
                            <Link
                              key={i}
                              href={`/products?category=${encodeURIComponent(cat)}`}
                              onClick={() => setIsSearchOpen(false)}
                              className="h-10 w-full flex items-center px-2 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 text-left transition-colors truncate text-decoration-none"
                            >
                              <ChevronRight size={12} className="text-gray-400 mr-2 shrink-0" />
                              <span className="truncate">{cat}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Brands */}
                    {searchData.brands.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                          🏷 Brands
                        </h4>
                        <div className="flex flex-col gap-1">
                          {searchData.brands.map((brand, i) => (
                            <Link
                              key={i}
                              href={`/products?brand=${encodeURIComponent(brand)}`}
                              onClick={() => setIsSearchOpen(false)}
                              className="h-10 w-full flex items-center px-2 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 text-left transition-colors truncate text-decoration-none"
                            >
                              <Ticket size={12} className="text-gray-400 mr-2 shrink-0" />
                              <span className="truncate">{brand}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Products */}
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    🛍 Products
                  </h4>
                  {searchData.products.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {searchData.products.map((product) => {
                        const price = product.special_price || product.regular_price;
                        return (
                          <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-all border border-gray-100/50 text-decoration-none text-left"
                          >
                            <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-lg p-1 flex items-center justify-center shrink-0">
                              {product.images?.[0] ? (
                                <img 
                                  src={product.images[0]} 
                                  alt={product.display_name} 
                                  className="max-w-full max-h-full object-contain"
                                />
                              ) : (
                                <span className="text-[8px] text-gray-300">IMG</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-gray-900 line-clamp-1">
                                <HighlightText text={product.display_name} search={searchQuery} />
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-extrabold text-[#FF6A00]">
                                  Rs. {price}
                                </span>
                                <span className={`text-[8px] font-bold px-1 rounded ${product.stock_quantity > 0 ? 'text-green-700 bg-green-50' : 'text-gray-500 bg-gray-50'}`}>
                                  {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                                </span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-gray-100 rounded-xl">
                      <span className="text-gray-400 text-xs">No matching products found</span>
                    </div>
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
