'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { supabaseInventory } from '@/lib/supabaseInventory';
import { getWarehouseInventory, updateWarehouseCategory } from '@/app/actions/inventory';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  ShoppingBag, 
  Upload, 
  Image as ImageIcon, 
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Layers,
  Zap,
  Save,
  Globe,
  Package
} from 'lucide-react';
import { uploadToCloudinary } from '@/app/actions/cloudinary';

interface InventoryProduct {
  id: string;
  product_id: string;
  product_name: string;
  est_price: number;
  image_url?: string;
  website_category?: string;
}

interface Variation {
  id: string;
  name: string; // e.g., "Size" or "Color"
  value: string; // e.g., "XL" or "Red"
  price: number;
  stock: number;
  special_price?: number;
}

const CATEGORIES = [
  'Select Category',
  'Electronics',
  'Home & Kitchen',
  'Fashion',
  'Beauty & Care',
  'Toys & Games',
  'Sports'
];

export default function AdminInventory() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [localCategories, setLocalCategories] = useState<Record<string, string>>({});
  const [message, setMessage] = useState({ text: '', type: '' });
  const [productsInStore, setProductsInStore] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [syncFilter, setSyncFilter] = useState('all'); // 'all', 'synced', 'unsynced'
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Bulk Upload State
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkResults, setBulkResults] = useState<{
    total: number;
    success: number;
    skippedDouble: number;
    skippedInvalidId: number;
    skippedInvalidCategory: number;
    skippedOther: number;
    errors: string[];
  } | null>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  // Full Page Editor State
  const [storefrontData, setStorefrontData] = useState({
    displayName: '',
    description: '',
    regularPrice: 0,
    specialPrice: 0,
    stockQty: 0,
    category: CATEGORIES[0],
    images: [] as string[],
    highlights: [] as string[],
    variations: [] as Variation[]
  });
  
  const [newHighlight, setNewHighlight] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchInventory();
    fetchStoreStatus();
  }, []);

  const fetchStoreStatus = async () => {
    const { data } = await supabase
      .from('ecommerce_products')
      .select('inventory_id');
    
    if (data) {
      setProductsInStore(new Set(data.map(p => p.inventory_id)));
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    const result = await getWarehouseInventory();

    if (!result.success) {
      console.error('Inventory Fetch Error:', result.error);
      setMessage({ text: `Sync Error: ${result.error}`, type: 'error' });
    } else {
      const activeProducts = result.data?.filter((p: any) => p.is_deleted !== true) || [];
      setProducts(activeProducts);
      
      // Process and save categories into state
      const savedCats: Record<string, string> = {};
      result.data?.forEach((p: any) => {
        if (p.website_category) savedCats[p.id] = p.website_category;
      });
      setLocalCategories(savedCats);
      
      if (!result.data || result.data.length === 0) {
        setMessage({ text: `Connection OK, but server returned 0 rows. Check Warehouse DB!`, type: 'error' });
      } else {
        setMessage({ text: `Successfully synced ${result.data.length} products!`, type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      }
    }
    setLoading(false);
  };

  const processProducts = (data: any[]) => {
    // Handled in fetchInventory
    setProducts(data);
    const savedCats: Record<string, string> = {};
    data.forEach(p => {
      if (p.website_category) savedCats[p.id] = p.website_category;
    });
    setLocalCategories(savedCats);
  };

  const handleBulkCSVProcess = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkProcessing(true);
    setBulkResults(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          alert("Empty CSV file!");
          setBulkProcessing(false);
          return;
        }

        const lines = parseCSV(text);
        if (lines.length < 2) {
          alert("CSV must contain headers and at least one product row!");
          setBulkProcessing(false);
          return;
        }

        const headers = lines[0];
        const dataRows = lines.slice(1);

        // Highly flexible column lookups supporting typo tolerances and abbreviations
        const getFlexibleIdx = (keywords: string[], exacts: string[] = []): number => {
          return headers.findIndex(h => {
            const norm = h.trim().toLowerCase().replace(/[\s_]+/g, '');
            if (exacts.some(ex => norm === ex.toLowerCase().replace(/[\s_]+/g, ''))) return true;
            return keywords.some(kw => norm.includes(kw.toLowerCase().replace(/[\s_]+/g, '')));
          });
        };

        const idxInventoryId = getFlexibleIdx(['inventoryid', 'id'], ['inventoryid', 'id']);
        const idxWarehouseId = getFlexibleIdx(['warehouseproductid', 'warehouseid', 'warehouseproduct']);
        const idxProductName = getFlexibleIdx(['productname', 'name', 'title']);
        const idxCategory = getFlexibleIdx(['category', 'categories']);
        const idxSubCategory = getFlexibleIdx(['subcategory', 'subcategories']);
        const idxBrand = getFlexibleIdx(['brand', 'brands']);
        const idxImg1 = getFlexibleIdx(['image1', 'images1', 'img1']);
        const idxImg2 = getFlexibleIdx(['image2', 'images2', 'img2']);
        const idxImg3 = getFlexibleIdx(['image3', 'images3', 'img3']);
        const idxImg4 = getFlexibleIdx(['image4', 'images4', 'img4']);
        const idxRegPrice = getFlexibleIdx(['regularprice', 'price', 'mrp']);
        const idxSpecPrice = getFlexibleIdx(['specialprice', 'saleprice', 'discountprice']);
        const idxStock = getFlexibleIdx(['stock', 'qty', 'quantity']);
        const idxDesc = getFlexibleIdx(['description', 'desc', 'details']);
        const idxHighlights = getFlexibleIdx(['highlight', 'hightlight', 'features']);

        // Check if mandatory fields indexes are present
        if (idxInventoryId === -1 || idxWarehouseId === -1) {
          alert("CSV is missing mandatory columns! Ensure columns 'Inventory ID' and 'Warehouse Product Id' exist.");
          setBulkProcessing(false);
          return;
        }

        let successCount = 0;
        let skippedDouble = 0;
        let skippedInvalidId = 0;
        let skippedInvalidCategory = 0;
        let skippedOther = 0;
        const errorsList: string[] = [];

        // Pre-filter valid categories list
        const validCategoriesList = CATEGORIES.filter(c => c !== 'Select Category');

        for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
          const row = dataRows[rowIndex];
          if (row.length === 0 || row.every(cell => cell.trim() === '')) {
            continue; // Skip empty rows
          }

          const csvInventoryId = row[idxInventoryId]?.trim();
          const csvWarehouseProductId = row[idxWarehouseId]?.trim();
          const rowNum = rowIndex + 2; // Row number (1-indexed header is row 1)

          if (!csvWarehouseProductId) {
            skippedOther++;
            errorsList.push(`Row ${rowNum}: Missing Warehouse Product Id`);
            continue;
          }

          if (!csvInventoryId) {
            skippedOther++;
            errorsList.push(`Row ${rowNum}: Missing Inventory ID`);
            continue;
          }

          // 1. Find product in loaded warehouse inventory
          const matchedProduct = products.find(p => {
            const pIdStr = p.id ? String(p.id).trim().toLowerCase() : '';
            const pProductIdStr = p.product_id ? String(p.product_id).trim().toLowerCase() : '';
            const csvIdStr = csvInventoryId.trim().toLowerCase();
            return pIdStr === csvIdStr || pProductIdStr === csvIdStr;
          });
          if (!matchedProduct) {
            skippedInvalidId++;
            errorsList.push(`Row ${rowNum}: Inventory ID '${csvInventoryId}' not found in warehouse`);
            continue;
          }

          // 2. Check if already uploaded (no double upload)
          if (productsInStore.has(matchedProduct.id)) {
            skippedDouble++;
            errorsList.push(`Row ${rowNum}: Product '${matchedProduct.product_name}' already uploaded`);
            continue;
          }

          // 3. Product Name logic
          const rawProductName = idxProductName !== -1 ? row[idxProductName]?.trim() : '';
          const displayName = rawProductName || matchedProduct.product_name;

          // 4. Category logic
          const rawCategory = idxCategory !== -1 ? row[idxCategory]?.trim() : '';
          let finalCategory = '';
          if (!rawCategory) {
            finalCategory = 'Home & Kitchen';
          } else {
            const matchedCat = validCategoriesList.find(c => c.toLowerCase() === rawCategory.toLowerCase());
            if (matchedCat) {
              finalCategory = matchedCat;
            } else {
              skippedInvalidCategory++;
              errorsList.push(`Row ${rowNum}: Category '${rawCategory}' does not match any valid category`);
              continue;
            }
          }

          // 5. Brand logic
          const rawBrand = idxBrand !== -1 ? row[idxBrand]?.trim() : '';
          const finalBrand = rawBrand || 'No Brand';

          // 6. Collect images
          const images: string[] = [];
          if (idxImg1 !== -1 && row[idxImg1]?.trim()) images.push(row[idxImg1].trim());
          if (idxImg2 !== -1 && row[idxImg2]?.trim()) images.push(row[idxImg2].trim());
          if (idxImg3 !== -1 && row[idxImg3]?.trim()) images.push(row[idxImg3].trim());
          if (idxImg4 !== -1 && row[idxImg4]?.trim()) images.push(row[idxImg4].trim());

          // If no images specified in CSV, fallback to warehouse product image
          if (images.length === 0 && matchedProduct.image_url) {
            images.push(matchedProduct.image_url);
          }

          if (images.length === 0) {
            skippedOther++;
            errorsList.push(`Row ${rowNum}: At least one product image is required`);
            continue;
          }

          // 7. Pricing
          const rawRegPrice = idxRegPrice !== -1 ? Number(row[idxRegPrice]) : 0;
          const regularPrice = rawRegPrice || matchedProduct.est_price || 0;
          if (regularPrice <= 0) {
            skippedOther++;
            errorsList.push(`Row ${rowNum}: Regular Price must be greater than 0`);
            continue;
          }

          const specialPrice = idxSpecPrice !== -1 ? Number(row[idxSpecPrice]) : 0;
          if (specialPrice > 0) {
            if (specialPrice >= regularPrice) {
              skippedOther++;
              errorsList.push(`Row ${rowNum}: Special Price must be lower than Regular Price`);
              continue;
            }
          }

          // 8. Stock
          const stockQty = idxStock !== -1 ? Number(row[idxStock]) : 0;

          // 9. Description (HTML cleaned to plain text)
          const rawDesc = idxDesc !== -1 ? row[idxDesc] : '';
          const cleanedDescription = cleanDescriptionHtml(rawDesc);
          if (!cleanedDescription) {
            skippedOther++;
            errorsList.push(`Row ${rowNum}: Product Description/Details are necessary`);
            continue;
          }

          // 10. Highlights (HTML parsed to array of strings)
          const rawHighlights = idxHighlights !== -1 ? row[idxHighlights] : '';
          const parsedHighlights = parseHighlights(rawHighlights);
          if (parsedHighlights.length === 0) {
            skippedOther++;
            errorsList.push(`Row ${rowNum}: At least one Product Highlight is necessary`);
            continue;
          }

          // 11. Generate slug
          const slug = displayName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Math.random().toString(36).substring(2, 5);

          // 12. Upload to database
          try {
            const payload = {
              inventory_id: matchedProduct.id,
              display_name: displayName,
              description: cleanedDescription,
              regular_price: regularPrice,
              special_price: specialPrice,
              stock_quantity: stockQty,
              category: finalCategory,
              brand: finalBrand,
              images: images,
              status: 'active',
              variations: [],
              highlights: parsedHighlights,
              slug: slug
            };

            const { error: insertError } = await supabase
              .from('ecommerce_products')
              .insert(payload);

            if (insertError) throw insertError;

            // Sync category back to warehouse
            await updateWarehouseCategory(matchedProduct.id, finalCategory);
            
            // Add to in-store set
            productsInStore.add(matchedProduct.id);
            successCount++;
          } catch (err: any) {
            skippedOther++;
            errorsList.push(`Row ${rowNum}: Database insert failed - ${err.message}`);
          }
        }

        setBulkResults({
          total: dataRows.length,
          success: successCount,
          skippedDouble,
          skippedInvalidId,
          skippedInvalidCategory,
          skippedOther,
          errors: errorsList
        });

        // Trigger store status and list refresh
        fetchStoreStatus();
        fetchInventory();

      } catch (error: any) {
        alert("Failed to read/process CSV: " + error.message);
      } finally {
        setBulkProcessing(false);
        if (bulkFileInputRef.current) {
          bulkFileInputRef.current.value = ''; // clear file input
        }
      }
    };

    reader.readAsText(file);
  };

  const handleOpenEditor = async (product: InventoryProduct, editMode = false) => {
    setLoading(true);
    setIsCreatingNew(false);
    setIsEditing(editMode);
    setSelectedProduct(product);
    
    // Fetch existing storefront data if editing
    let existingData = null;
    if (editMode) {
      const { data } = await supabase
        .from('ecommerce_products')
        .select('*')
        .eq('inventory_id', product.id)
        .single();
      existingData = data;
    }

    setStorefrontData({
      displayName: existingData?.display_name || product.product_name,
      description: existingData?.description || '',
      regularPrice: existingData?.regular_price || product.est_price || 0,
      specialPrice: existingData?.special_price || 0,
      stockQty: existingData?.stock_quantity || 0,
      category: existingData?.category || localCategories[product.id] || CATEGORIES[0],
      images: existingData?.images || (product.image_url ? [product.image_url] : []),
      highlights: existingData?.highlights || [],
      variations: existingData?.variations || []
    });
    
    setIsEditorOpen(true);
    setLoading(false);
  };

  const handleCreateInInventory = async () => {
    if (!selectedProduct?.product_name) {
      alert('Inventory Product Name is required!');
      return;
    }
    
    setIsRegistering(true);
    try {
      const { data, error } = await supabaseInventory
        .from('products')
        .insert({
          product_name: selectedProduct.product_name,
          image_url: selectedProduct.image_url || null,
          product_type: 'single',
          status: 'Active'
        })
        .select()
        .single();

      if (error) throw error;
      
      setSelectedProduct(data);
      setIsCreatingNew(false); // Now it's a registered product
      setMessage({ text: 'Product Registered in Warehouse!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err: any) {
      alert('Registration Failed: ' + err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUpdateInventory = async () => {
    if (!selectedProduct) return;
    setIsRegistering(true);
    try {
      const { error } = await supabaseInventory
        .from('products')
        .update({
          product_name: selectedProduct.product_name,
          image_url: selectedProduct.image_url
        })
        .eq('id', selectedProduct.id);

      if (error) throw error;
      setMessage({ text: 'Warehouse Data Updated!', type: 'success' });
      fetchInventory();
    } catch (err: any) {
      alert('Update Failed: ' + err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    setUploading(true);
    const newImages = [...storefrontData.images];
    
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      const file = files[i];
      const uploadPromise = new Promise<string>((resolve, reject) => {
        reader.onload = async () => {
          const result = await uploadToCloudinary(reader.result as string);
          if (result.success) resolve(result.url!);
          else reject(result.error);
        };
        reader.readAsDataURL(file);
      });

      try {
        const url = await uploadPromise;
        newImages.push(url);
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
    
    setStorefrontData({ ...storefrontData, images: newImages });
    setUploading(false);
  };

  const addVariation = () => {
    const newVar: Variation = {
      id: Math.random().toString(36).substring(7),
      name: '',
      value: '',
      price: storefrontData.regularPrice,
      stock: 0
    };
    setStorefrontData({ ...storefrontData, variations: [...storefrontData.variations, newVar] });
  };

  const addHighlight = () => {
    if (!newHighlight.trim()) return;
    setStorefrontData({ ...storefrontData, highlights: [...storefrontData.highlights, newHighlight.trim()] });
    setNewHighlight('');
  };

  const handlePublish = async (status: 'active' | 'inactive') => {
    if (!selectedProduct) return;

    // VALIDATION LOGIC
    if (!storefrontData.category || storefrontData.category === 'Select Category') {
      alert('⚠️ Category is required!');
      return;
    }

    if (storefrontData.images.length === 0) {
      alert('⚠️ At least one product image is required!');
      return;
    }

    if (storefrontData.regularPrice <= 0) {
      alert('⚠️ Regular Price is necessary and must be greater than 0!');
      return;
    }

    if (storefrontData.specialPrice > 0) {
      if (storefrontData.specialPrice >= storefrontData.regularPrice) {
        alert('⚠️ Special Price must be lower than Regular Price!');
        return;
      }
    }

    if (!storefrontData.description.trim()) {
      alert('⚠️ Product Description/Details are necessary!');
      return;
    }

    if (storefrontData.highlights.length === 0) {
      alert('⚠️ At least one Product Highlight is necessary!');
      return;
    }

    setLoading(true);
    
    try {
      const slug = storefrontData.displayName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Math.random().toString(36).substring(2, 5);
      
      const payload = {
        inventory_id: selectedProduct.id,
        display_name: storefrontData.displayName,
        description: storefrontData.description,
        regular_price: storefrontData.regularPrice,
        special_price: storefrontData.specialPrice,
        stock_quantity: storefrontData.stockQty,
        category: storefrontData.category,
        images: storefrontData.images,
        status: status,
        variations: storefrontData.variations,
        highlights: storefrontData.highlights
      };

      let error;
      if (isEditing) {
        // Update existing ecommerce record
        const { error: err } = await supabase
          .from('ecommerce_products')
          .update(payload)
          .eq('inventory_id', selectedProduct.id);
        error = err;
      } else {
        // Create new
        const { error: err } = await supabase
          .from('ecommerce_products')
          .insert({ ...payload, slug });
        error = err;
      }

      if (error) throw error;

      // Sync category back to products table
      if (storefrontData.category && storefrontData.category !== 'Select Category') {
        await updatePersistentCategory(selectedProduct.id, storefrontData.category);
      }

      setMessage({ text: status === 'active' ? 'Product Published!' : 'Saved as Draft', type: 'success' });
      setTimeout(() => {
        setIsEditorOpen(false);
        fetchInventory();
        fetchStoreStatus();
      }, 1500);

    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePersistentCategory = async (productId: string, newCategory: string) => {
    setLocalCategories(prev => ({ ...prev, [productId]: newCategory }));
    const result = await updateWarehouseCategory(productId, newCategory);
    if (!result.success) {
      console.error('Failed to save category:', result.error);
      setMessage({ text: 'Failed to save category to Warehouse', type: 'error' });
    }
  };

  if (isEditorOpen && selectedProduct) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <header className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsEditorOpen(false)} className="p-3 rounded-2xl hover:bg-gray-100 transition-all">
              <ChevronLeft />
            </button>
            <div>
              <h1 className="text-xl font-black">
                {isCreatingNew ? 'Registering New Product' : isEditing ? `Editing: ${selectedProduct.product_name}` : `Importing: ${selectedProduct.product_name}`}
              </h1>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
                {isCreatingNew ? 'Create Warehouse Entry First' : isEditing ? 'Storefront & Warehouse Editor' : 'Storefront Configuration'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              disabled={loading}
              onClick={() => handlePublish('inactive')}
              className="px-6 py-3 rounded-xl border-2 border-gray-100 font-bold hover:bg-gray-50 transition-all"
            >
              Save as Draft
            </button>
            <button 
              disabled={loading}
              onClick={() => handlePublish('active')}
              className="px-8 py-3 rounded-xl bg-black text-white font-bold hover:bg-gray-800 transition-all shadow-xl shadow-black/10 flex items-center gap-2"
            >
              <Globe size={18} />
              Publish to Store
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-gray-50/50">
          <div className="max-w-[1200px] mx-auto p-8 space-y-8">
            
            {/* Top: Warehouse Source Reference (Single Row) */}
            <div className="premium-card p-6 border-blue-100 bg-blue-50/30">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest shrink-0">
                  <RefreshCw size={14} />
                  Warehouse Source
                </div>
                
                <div className="h-16 w-16 rounded-xl bg-white border border-blue-100 overflow-hidden flex-center shrink-0">
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={24} className="text-blue-200" />
                  )}
                </div>

                <div className="flex-1 grid grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Inventory Product Name</label>
                    {isCreatingNew ? (
                      <input 
                        type="text" 
                        value={selectedProduct.product_name}
                        onChange={(e) => setSelectedProduct({...selectedProduct, product_name: e.target.value})}
                        className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="Enter inventory name..."
                      />
                    ) : (
                      <div className="font-bold text-blue-900 text-sm">{selectedProduct.product_name}</div>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Product Image URL / Warehouse ID</label>
                    {isCreatingNew ? (
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={selectedProduct.image_url || ''}
                          onChange={(e) => setSelectedProduct({...selectedProduct, image_url: e.target.value})}
                          className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                          placeholder="Paste Image URL..."
                        />
                        <button 
                          onClick={handleCreateInInventory}
                          disabled={isRegistering}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                          {isRegistering ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
                          Added to Inventory
                        </button>
                      </div>
                    ) : (
                      <div className="font-mono text-xs text-blue-700 bg-blue-100/50 px-2 py-1 rounded w-fit mt-1">{selectedProduct.product_id}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Rest of the Editor Sections */}
            <div className="space-y-8">
              {/* General Info */}
              <div className="premium-card p-8">
                <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                  <Zap className="text-amber-500" size={20} />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">
                      Product Name (for website) <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={storefrontData.displayName}
                      onChange={(e) => setStorefrontData({...storefrontData, displayName: e.target.value})}
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-black font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select 
                      value={storefrontData.category}
                      onChange={(e) => setStorefrontData({...storefrontData, category: e.target.value})}
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-black font-bold"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Media */}
              <div className="premium-card p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black flex items-center gap-2">
                    <ImageIcon className="text-blue-500" size={20} />
                    Product Images <span className="text-red-500 text-sm">*</span>
                  </h3>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-black text-[var(--primary)] uppercase tracking-widest hover:underline"
                  >
                    Add Images
                  </button>
                  <input type="file" multiple ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {storefrontData.images.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden relative group">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setStorefrontData({...storefrontData, images: storefrontData.images.filter((_, i) => i !== idx)})}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex-center flex-col gap-2 hover:border-black hover:bg-gray-50 transition-all"
                  >
                    {uploading ? <RefreshCw className="animate-spin text-gray-400" /> : <Upload className="text-gray-400" />}
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Upload</span>
                  </button>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="premium-card p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black flex items-center gap-2">
                    <Package className="text-green-500" size={20} />
                    Pricing & Inventory
                  </h3>
                  <button 
                    onClick={addVariation}
                    className="text-xs font-black text-purple-600 uppercase tracking-widest flex items-center gap-1 hover:underline"
                  >
                    <Plus size={14} /> Add Variation
                  </button>
                </div>

                {/* Variations Section - Now at the Top */}
                <div className="mb-8 space-y-3">
                  {storefrontData.variations.length > 0 && (
                    <div className="grid grid-cols-6 gap-3 px-4 mb-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                      <div>Name</div>
                      <div>Value</div>
                      <div>Reg. Price</div>
                      <div>Spec. Price</div>
                      <div>Stock</div>
                      <div className="text-right">Action</div>
                    </div>
                  )}
                  {storefrontData.variations.map((v, idx) => (
                    <div key={v.id} className="grid grid-cols-6 gap-3 bg-gray-50 p-4 rounded-2xl items-center border border-gray-100 group animate-in slide-in-from-left-4 duration-300">
                      <input 
                        placeholder="e.g. Size" 
                        className="bg-transparent border-none font-bold text-xs outline-none focus:text-black"
                        value={v.name}
                        onChange={(e) => {
                          const next = [...storefrontData.variations];
                          next[idx].name = e.target.value;
                          setStorefrontData({...storefrontData, variations: next});
                        }}
                      />
                      <input 
                        placeholder="e.g. XL" 
                        className="bg-transparent border-none font-bold text-xs outline-none focus:text-black"
                        value={v.value}
                        onChange={(e) => {
                          const next = [...storefrontData.variations];
                          next[idx].value = e.target.value;
                          setStorefrontData({...storefrontData, variations: next});
                        }}
                      />
                      <input 
                        type="number" 
                        placeholder="Reg. Price" 
                        className="bg-transparent border-none font-bold text-xs outline-none focus:text-black"
                        value={v.price}
                        onChange={(e) => {
                          const next = [...storefrontData.variations];
                          next[idx].price = Number(e.target.value);
                          setStorefrontData({...storefrontData, variations: next});
                        }}
                      />
                      <input 
                        type="number" 
                        placeholder="Spec. Price" 
                        className="bg-transparent border-none font-bold text-xs outline-none focus:text-red-600"
                        value={v.special_price || 0}
                        onChange={(e) => {
                          const next = [...storefrontData.variations];
                          next[idx].special_price = Number(e.target.value);
                          setStorefrontData({...storefrontData, variations: next});
                        }}
                      />
                      <input 
                        type="number" 
                        placeholder="Stock" 
                        className="bg-transparent border-none font-bold text-xs outline-none focus:text-green-600 font-black"
                        value={v.stock}
                        onChange={(e) => {
                          const next = [...storefrontData.variations];
                          next[idx].stock = Number(e.target.value);
                          setStorefrontData({...storefrontData, variations: next});
                        }}
                      />
                      <button 
                        onClick={() => setStorefrontData({...storefrontData, variations: storefrontData.variations.filter(x => x.id !== v.id)})}
                        className="justify-self-end p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Global Pricing - Disabled if variations exist */}
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-gray-100 transition-all ${storefrontData.variations.length > 0 ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center justify-between">
                      Regular Price <span className="text-red-500">*</span>
                      {storefrontData.variations.length > 0 && <span className="text-[8px] text-amber-600">Locked by Variations</span>}
                    </label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rs</span>
                      <input 
                        type="number" 
                        disabled={storefrontData.variations.length > 0}
                        value={storefrontData.regularPrice}
                        onChange={(e) => setStorefrontData({...storefrontData, regularPrice: Number(e.target.value)})}
                        className="w-full pl-12 pr-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-black font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">Special Price</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rs</span>
                      <input 
                        type="number" 
                        disabled={storefrontData.variations.length > 0}
                        value={storefrontData.specialPrice}
                        onChange={(e) => setStorefrontData({...storefrontData, specialPrice: Number(e.target.value)})}
                        className="w-full pl-12 pr-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-red-500 font-bold text-red-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">Total Stock Qty</label>
                    <input 
                      type="number" 
                      disabled={storefrontData.variations.length > 0}
                      value={storefrontData.stockQty}
                      onChange={(e) => setStorefrontData({...storefrontData, stockQty: Number(e.target.value)})}
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-black font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Details & Highlights */}
              <div className="premium-card p-8">
                <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                  <Layers className="text-indigo-500" size={20} />
                  Details & Highlights <span className="text-red-500 text-sm">*</span>
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">Product Description</label>
                    <textarea 
                      value={storefrontData.description}
                      onChange={(e) => setStorefrontData({...storefrontData, description: e.target.value})}
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-black h-48 resize-none font-medium text-sm leading-relaxed"
                      placeholder="Write a compelling story for your product..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">
                      Highlights (One per line) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2 mb-4">
                      <input 
                        type="text" 
                        value={newHighlight}
                        onChange={(e) => setNewHighlight(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addHighlight()}
                        className="flex-1 px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-black font-medium text-sm"
                        placeholder="Add a key feature..."
                      />
                      <button onClick={addHighlight} className="p-4 rounded-2xl bg-black text-white hover:bg-gray-800 transition-all">
                        <Plus />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {storefrontData.highlights.map((h, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white border border-gray-100 px-4 py-2 rounded-xl text-xs font-bold shadow-sm group">
                          {h}
                          <button 
                            onClick={() => setStorefrontData({...storefrontData, highlights: storefrontData.highlights.filter((_, idx) => idx !== i)})}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Toast */}
        {message.text && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-8 duration-500">
            <div className={`px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3 ${
              message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}>
              <CheckCircle />
              <span className="font-bold">{message.text}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Inventory Integration</h1>
            <p className="text-[var(--text-secondary)]">Import products from your inventory to the ecommerce store.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => {
                setIsCreatingNew(true);
                setSelectedProduct({
                  id: '',
                  product_id: 'Auto-ID',
                  product_name: '',
                  est_price: 0
                });
                setStorefrontData({
                  displayName: '',
                  description: '',
                  regularPrice: 0,
                  specialPrice: 0,
                  stockQty: 0,
                  category: CATEGORIES[0],
                  images: [],
                  highlights: [],
                  variations: []
                });
                setIsEditorOpen(true);
              }}
              className="px-6 py-3 rounded-xl bg-black text-white font-bold flex items-center gap-2 hover:bg-gray-800 transition-all shadow-xl shadow-black/10"
            >
              <Plus size={20} />
              Add New Product
            </button>
            <button 
              onClick={fetchInventory}
              className="px-6 py-3 rounded-xl glass hover:bg-[var(--surface-1)] transition-all flex items-center gap-2"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Sync List
            </button>
            <button 
              onClick={() => {
                setBulkResults(null);
                setIsBulkUploadOpen(true);
              }}
              className="px-6 py-3 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2 hover:bg-green-700 transition-all shadow-xl shadow-green-600/10"
            >
              <Upload size={20} />
              Bulk Product Upload
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={20} />
            <input 
              type="text" 
              placeholder="Search by name or ID..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border-none shadow-sm focus:ring-2 focus:ring-[var(--primary)] outline-none font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-6 py-3 rounded-2xl bg-white border-none shadow-sm focus:ring-2 focus:ring-[var(--primary)] outline-none font-bold text-sm cursor-pointer"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.filter(c => c !== 'Select Category').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select 
              value={syncFilter}
              onChange={(e) => setSyncFilter(e.target.value)}
              className="px-6 py-3 rounded-2xl bg-white border-none shadow-sm focus:ring-2 focus:ring-[var(--primary)] outline-none font-bold text-sm cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="synced">Synced Only</option>
              <option value="unsynced">Unsynced Only</option>
            </select>

            {(searchTerm || categoryFilter !== 'All' || syncFilter !== 'all') && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('All');
                  setSyncFilter('all');
                }}
                className="px-6 py-3 rounded-2xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-all flex items-center gap-2"
              >
                <X size={16} />
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="glass rounded-[2rem] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--surface-1)]">
                <th className="p-6 font-bold text-sm text-[var(--text-muted)] uppercase">Inventory Product</th>
                <th className="p-6 font-bold text-sm text-[var(--text-muted)] uppercase">Category</th>
                <th className="p-6 font-bold text-sm text-[var(--text-muted)] uppercase text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-[var(--text-muted)]">Loading products...</td>
                </tr>
              ) : (() => {
                const filtered = products.filter(p => {
                  const matchesSearch = p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                      p.product_id.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesCategory = categoryFilter === 'All' || localCategories[p.id] === categoryFilter;
                  const isSynced = productsInStore.has(p.id);
                  const matchesSync = syncFilter === 'all' || 
                                    (syncFilter === 'synced' && isSynced) || 
                                    (syncFilter === 'unsynced' && !isSynced);
                  
                  return matchesSearch && matchesCategory && matchesSync;
                });

                if (filtered.length === 0) {
                  return (
                    <tr>
                      <td colSpan={3} className="p-12 text-center text-[var(--text-muted)]">No products found matching your filters.</td>
                    </tr>
                  );
                }

                return filtered.map((product) => {
                  const isSynced = productsInStore.has(product.id);
                  return (
                    <tr key={product.id} className="border-t border-[var(--surface-2)] hover:bg-[var(--surface-1)] transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div 
                            onClick={() => product.image_url && setZoomImage(product.image_url)}
                            className="w-12 h-12 rounded-xl bg-[var(--surface-1)] overflow-hidden border border-[var(--surface-2)] shrink-0 flex-center cursor-zoom-in hover:scale-110 transition-transform"
                          >
                            {product.image_url ? (
                              <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={20} className="text-[var(--text-muted)]" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold">{product.product_name}</span>
                            <span className="text-xs font-mono text-[var(--text-muted)]">{product.product_id}</span>
                            {isSynced && (
                              <span className="w-fit mt-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-widest border border-green-100">
                                Synced
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <select 
                          value={localCategories[product.id] || 'Select Category'}
                          onChange={(e) => updatePersistentCategory(product.id, e.target.value)}
                          className={`px-4 py-2 rounded-xl bg-white border text-sm font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none cursor-pointer transition-all ${
                            !localCategories[product.id] || localCategories[product.id] === 'Select Category'
                              ? 'border-amber-200 text-amber-600 bg-amber-50/30'
                              : 'border-[var(--surface-2)] text-black'
                          }`}
                        >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="p-6">
                        <div className="flex justify-center gap-2">
                          {isSynced ? (
                            <>
                              <button 
                                onClick={() => handleOpenEditor(product, true)}
                                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all shadow-sm"
                                title="Edit Product"
                              >
                                <Save size={16} />
                              </button>
                              <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm font-bold bg-green-50 px-3 py-1 rounded-xl">
                                <CheckCircle size={16} className="text-green-500" />
                                Synced
                              </div>
                            </>
                          ) : (
                            <button 
                              onClick={() => handleOpenEditor(product)}
                              className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-bold flex items-center gap-2 hover:bg-[var(--primary-hover)] transition-all shadow-sm"
                            >
                              <Plus size={16} />
                              Add to Store
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Zoom Lightbox */}
      {zoomImage && (
        <div className="fixed inset-0 z-[110] flex-center bg-black/90 backdrop-blur-md p-8" onClick={() => setZoomImage(null)}>
          <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
            <X size={40} />
          </button>
          <img 
            src={zoomImage} 
            alt="Enlarged product" 
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-zoom-in"
          />
        </div>
      )}

      {/* Bulk Product Upload Modal */}
      {isBulkUploadOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[85vh] overflow-y-auto p-8 shadow-2xl relative flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            <button 
              onClick={() => {
                if (!bulkProcessing) {
                  setIsBulkUploadOpen(false);
                  setBulkResults(null);
                }
              }} 
              disabled={bulkProcessing}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-all disabled:opacity-50"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
              <Upload className="text-green-600" />
              Bulk Product Upload
            </h2>
            <p className="text-xs text-[var(--text-muted)] mb-6 font-bold uppercase tracking-wider">
              Upload storefront products from a CSV file
            </p>

            <div className="flex-1 space-y-6">
              {/* Instructions / File Column Layout */}
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-600 space-y-3">
                <div className="font-bold text-gray-800 uppercase tracking-widest text-[10px]">Expected CSV Columns:</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 font-mono text-[11px]">
                  <div>• Inventory ID <span className="text-red-500 font-bold">*</span></div>
                  <div>• Warehouse Product Id <span className="text-red-500 font-bold">*</span></div>
                  <div>• Product Name</div>
                  <div>• Category</div>
                  <div>• Sub Category</div>
                  <div>• Brand</div>
                  <div>• Product Images1, 2, 3, 4</div>
                  <div>• Regular Price</div>
                  <div>• Special Price</div>
                  <div>• Total Stock Qty</div>
                  <div>• Product Description</div>
                  <div>• Product Highlights</div>
                </div>
                <div className="text-[10px] text-amber-600 font-medium pt-2 border-t border-gray-200">
                  * HTML content in Description and Highlights will be automatically cleaned and parsed.
                </div>
              </div>

              {/* Upload Input Area */}
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center hover:bg-gray-50/50 hover:border-[var(--primary)] transition-all cursor-pointer relative"
                   onClick={() => !bulkProcessing && bulkFileInputRef.current?.click()}>
                <input 
                  type="file" 
                  ref={bulkFileInputRef} 
                  onChange={handleBulkCSVProcess} 
                  className="hidden" 
                  accept=".csv"
                  disabled={bulkProcessing}
                />
                
                {bulkProcessing ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <RefreshCw className="animate-spin text-[var(--primary)]" size={32} />
                    <span className="font-bold text-sm text-gray-700 animate-pulse">Processing CSV data & uploading products...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-2">
                      <Upload size={24} />
                    </div>
                    <span className="font-bold text-sm text-gray-900">Click to upload CSV File</span>
                    <span className="text-xs text-gray-400">or drag and drop your sheet file here</span>
                  </div>
                )}
              </div>

              {/* Bulk Results Summary */}
              {bulkResults && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-center">
                      <div className="text-xs font-bold text-gray-400 uppercase">Total Rows</div>
                      <div className="text-xl font-black text-gray-800">{bulkResults.total}</div>
                    </div>
                    <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-center">
                      <div className="text-xs font-bold text-green-500 uppercase">Uploaded</div>
                      <div className="text-xl font-black text-green-600">{bulkResults.success}</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-center">
                      <div className="text-xs font-bold text-amber-500 uppercase">Double Skip</div>
                      <div className="text-xl font-black text-amber-600">{bulkResults.skippedDouble}</div>
                    </div>
                    <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-center">
                      <div className="text-xs font-bold text-red-500 uppercase">Errors</div>
                      <div className="text-xl font-black text-red-600">
                        {bulkResults.skippedInvalidId + bulkResults.skippedInvalidCategory + bulkResults.skippedOther}
                      </div>
                    </div>
                  </div>

                  {/* Errors / Warnings List Log */}
                  {bulkResults.errors.length > 0 && (
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-100">
                        Process Log ({bulkResults.errors.length} items)
                      </div>
                      <div className="max-h-48 overflow-y-auto p-4 space-y-1.5 font-mono text-[11px] text-gray-600 bg-gray-50/30">
                        {bulkResults.errors.map((err, i) => (
                          <div key={i} className={`flex gap-2 items-start ${err.includes('already uploaded') || err.includes('double') ? 'text-amber-600' : 'text-red-500'}`}>
                            <span className="font-bold shrink-0">•</span>
                            <span>{err}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-6 border-t border-gray-100 pt-6">
              <button
                onClick={() => {
                  setIsBulkUploadOpen(false);
                  setBulkResults(null);
                }}
                disabled={bulkProcessing}
                className="flex-1 py-3.5 rounded-xl border border-gray-200 font-bold hover:bg-gray-50 transition-all text-center text-sm disabled:opacity-50"
              >
                Close Dialog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// HELPER FUNCTIONS FOR CSV PARSING AND HTML CLEANING
// ----------------------------------------------------------------------

function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote inside double quotes
          currentVal += '"';
          i++; // Skip the next quote
        } else {
          // Closing quote
          inQuotes = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(currentVal.trim());
        currentVal = '';
      } else if (char === '\n' || char === '\r') {
        row.push(currentVal.trim());
        currentVal = '';
        if (row.some(val => val !== '') || char === '\n') {
          lines.push(row);
        }
        row = [];
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip newline after carriage return
        }
      } else {
        currentVal += char;
      }
    }
  }
  if (row.length > 0 || currentVal !== '') {
    row.push(currentVal.trim());
    lines.push(row);
  }
  return lines;
}

function stripHtml(html: string): string {
  if (!html) return '';
  // 1. Remove all HTML tags
  let text = html.replace(/<[^>]*>/g, '');
  // 2. Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  return text;
}

function parseHighlights(html: string): string[] {
  if (!html) return [];
  // Restore escaped double double-quotes
  let cleaned = html.replace(/""/g, '"');
  
  // Try to match <li>...</li> tags first
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  const items: string[] = [];
  let match;
  
  while ((match = liRegex.exec(cleaned)) !== null) {
    let content = match[1];
    content = stripHtml(content);
    if (content.trim()) {
      items.push(content.trim());
    }
  }
  
  if (items.length > 0) {
    return items;
  }
  
  // If no <li> tags, replace closing block tags and breaks with newlines
  let text = cleaned
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|pre|ol|ul|li)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n');
    
  // Strip all other HTML tags
  text = stripHtml(text);
  
  // Split by newlines
  const lines = text.split('\n');
  return lines
    .map(line => line.trim().replace(/^[•\-\*\s]+/, '').trim())
    .filter(line => line.length > 0);
}

function cleanDescriptionHtml(html: string): string {
  if (!html) return '';
  // Restore escaped double double-quotes
  let text = html.replace(/""/g, '"');

  // Replace block elements closing tags with newline to preserve structure
  text = text.replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|pre|ol|ul)>/gi, '\n');
  
  // Replace list item tags with a bullet point and space
  text = text.replace(/<li[^>]*>/gi, '\n• ');
  
  // Replace break tags with newline
  text = text.replace(/<br\s*\/?>/gi, '\n');
  
  // Strip all remaining HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
    
  // Normalize consecutive newlines and spaces
  const lines = text.split('\n');
  const cleanedLines = lines
    .map(line => line.trim())
    .filter((line, index, arr) => {
      // Allow only one empty line spacing between paragraph blocks
      if (line === '' && arr[index - 1] === '') return false;
      return true;
    });
    
  return cleanedLines.join('\n').trim();
}
