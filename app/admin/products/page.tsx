'use client';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Upload, X, Star, Image as ImageIcon, Layers } from 'lucide-react';
import { adminFetch, formatPrice } from '@/lib/admin-utils';
import { useToast } from '@/components/admin/Toast';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { CATEGORIES, STYLES, type ProductVariant } from '@/lib/data';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  image: string;
  images?: string[];
  category: string;
  color?: string;
  stone_color?: string;
  style?: string;
  description: string;
  inclusions: string[];
  variants?: ProductVariant[];
  is_featured: boolean;
  meta_title: string;
  meta_description: string;
  slug: string;
}

const STANDARD_COLORS = [
  'Red',
  'Blue',
  'Green',
  'Pink',
  'Gold',
  'Silver / Clear',
  'Black',
  'White / Pearl',
  'Rose Gold',
  'Emerald Green',
  'Ruby Red',
  'Sapphire Blue',
  'Maroon',
  'Turquoise',
  'Peach',
  'Lavender',
  'Multicolor',
];

const STANDARD_STYLES = [
  'Korean Minimal',
  'Indo-Western Fusion',
  'Clean Girl',
  'Coquette / Y2K',
  'Everyday Stack',
  'Boho Ethnic',
  'Royal Heritage',
  'Contemporary Chic',
];

const DEFAULT_INCLUSIONS = [
  'Grand Neckpiece',
  'Choker Necklace',
  'Pair of Earrings',
  'Pair of Heavy Earrings',
  'Pair of Studs',
  'Jhumkas',
  'Maang Tikka',
  'Passa',
  'Haathphool',
  'Nath / Nose Ring',
  'Bangles / Pair of Kadas',
  'Statement Ring',
  'Velvet Jewelry Box',
  'Anti-Tarnish Velvet Pouch',
  'Authenticity Certificate',
];

export interface VariantFormItem {
  id?: number | string;
  label: string;
  price: number | string;
  stock: number | string;
  image?: string;
}

interface ProductFormData {
  name: string;
  price: number | string;
  stock: number | string;
  image: string;
  images: string[];
  imageUrlInput: string;
  variants: VariantFormItem[];
  category: string;
  color: string;
  isCustomColor: boolean;
  style: string;
  isCustomStyle: boolean;
  description: string;
  incStr: string;
  is_featured: boolean;
  meta_title: string;
  meta_description: string;
  slug: string;
}

const EMPTY_FORM: ProductFormData = {
  name: '',
  price: 0,
  stock: 10,
  image: '',
  images: [],
  imageUrlInput: '',
  variants: [],
  category: '',
  color: '',
  isCustomColor: false,
  style: '',
  isCustomStyle: false,
  description: '',
  incStr: '',
  is_featured: false,
  meta_title: '',
  meta_description: '',
  slug: '',
};

const INPUT = 'w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-emerald-800';
const LABEL = 'block text-xs uppercase tracking-widest text-gray-500 mb-1';

export default function ProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [variantImgPickerIdx, setVariantImgPickerIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const variantFileRef = useRef<HTMLInputElement>(null);
  const PAGE_SIZE = 20;

  async function load(p = page, q = search) {
    setLoading(true);
    const res = await adminFetch(`/api/products?page=${p}&limit=${PAGE_SIZE}&search=${q}`);
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : data.data ?? []);
    setTotal(data.count ?? (Array.isArray(data) ? data.length : 0));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    const existingColor = p.color || p.stone_color || '';
    const isCustomCol = !!existingColor && !STANDARD_COLORS.includes(existingColor);

    const existingStyle = p.style || '';
    const isCustomSty = !!existingStyle && !STANDARD_STYLES.includes(existingStyle);

    let imgArr = p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);

    const existingVariants: VariantFormItem[] = (p.variants || []).map((v) => ({
      id: v.id,
      label: v.label,
      price: v.price !== undefined ? v.price : p.price,
      stock: v.stock !== undefined ? v.stock : p.stock,
      image: v.image || '',
    }));

    setForm({
      name: p.name ?? '',
      price: p.price ?? 0,
      stock: p.stock ?? 10,
      image: p.image ?? (imgArr[0] || ''),
      images: imgArr,
      imageUrlInput: '',
      variants: existingVariants,
      category: p.category ?? '',
      color: existingColor,
      isCustomColor: isCustomCol,
      style: existingStyle,
      isCustomStyle: isCustomSty,
      description: p.description ?? '',
      incStr: (p.inclusions ?? []).join(', '),
      is_featured: p.is_featured ?? false,
      meta_title: p.meta_title ?? '',
      meta_description: p.meta_description ?? '',
      slug: p.slug ?? '',
    });
    setShowForm(true);
  }

  async function handleMultipleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newImages = [...form.images];
    let uploadCount = 0;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'niagn9pn';
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'almas_bridal';

    for (const file of Array.from(files)) {
      let uploadedUrl: string | null = null;

      // 1. Try server admin upload
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await adminFetch('/api/admin/upload', { method: 'POST', body: fd });
        if (res.ok) {
          const data = await res.json();
          if (data.url) uploadedUrl = data.url;
        }
      } catch (err) {
        console.warn('Server upload attempt failed, falling back to direct upload...', err);
      }

      // 2. Direct Cloudinary upload fallback
      if (!uploadedUrl) {
        try {
          const directForm = new FormData();
          directForm.append('file', file);
          directForm.append('upload_preset', uploadPreset);
          directForm.append('folder', 'almas_bridal/products');

          const directRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: 'POST', body: directForm }
          );

          if (directRes.ok) {
            const directData = await directRes.json();
            if (directData.secure_url) {
              uploadedUrl = directData.secure_url;
            }
          } else {
            const errText = await directRes.text();
            console.error('Direct Cloudinary upload error:', errText);
          }
        } catch (err) {
          console.error('Direct upload exception:', err);
        }
      }

      if (uploadedUrl) {
        newImages.push(uploadedUrl);
        uploadCount++;
      } else {
        toast(`Upload failed for "${file.name}". Please ensure it is a valid JPG/PNG/WebP image under 15MB.`, 'error');
      }
    }

    if (uploadCount > 0) {
      setForm((f) => ({
        ...f,
        images: newImages,
        image: f.image || newImages[0] || '',
      }));
      toast(`${uploadCount} image(s) uploaded successfully`);
    }
    setUploading(false);
  }

  function handleAddImageUrl() {
    const url = form.imageUrlInput.trim();
    if (!url) return;
    setForm((f) => {
      const updated = [...f.images, url];
      return {
        ...f,
        images: updated,
        image: f.image || url,
        imageUrlInput: '',
      };
    });
  }

  function removeImage(indexToRemove: number) {
    setForm((f) => {
      const updated = f.images.filter((_, idx) => idx !== indexToRemove);
      return {
        ...f,
        images: updated,
        image: updated[0] || '',
      };
    });
  }

  function setCoverImage(indexToSet: number) {
    setForm((f) => {
      const selected = f.images[indexToSet];
      if (!selected) return f;
      const rest = f.images.filter((_, idx) => idx !== indexToSet);
      const reordered = [selected, ...rest];
      return {
        ...f,
        images: reordered,
        image: selected,
      };
    });
    toast('Cover image updated');
  }

  // ─── Variant Helpers ───
  function addVariantRow(label = '') {
    setForm((f) => ({
      ...f,
      variants: [
        ...f.variants,
        { label, price: f.price || 0, stock: f.stock || 10, image: '' },
      ],
    }));
  }

  function removeVariantRow(index: number) {
    setForm((f) => ({
      ...f,
      variants: f.variants.filter((_, i) => i !== index),
    }));
  }

  function updateVariantRow(index: number, field: keyof VariantFormItem, val: string | number) {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === index ? { ...v, [field]: val } : v)),
    }));
  }

  async function handleVariantUpload(variantIndex: number, file: File | null) {
    if (!file) return;
    setUploading(true);
    let uploadedUrl: string | null = null;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'niagn9pn';
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'almas_bridal';

    // 1. Try server admin upload
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await adminFetch('/api/admin/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        uploadedUrl = data.url || data.secure_url;
      }
    } catch (err) {
      console.warn('Server variant upload error:', err);
    }

    // 2. Direct Cloudinary upload fallback
    if (!uploadedUrl) {
      try {
        const fdDirect = new FormData();
        fdDirect.append('file', file);
        fdDirect.append('upload_preset', uploadPreset);
        const directRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: fdDirect,
        });
        if (directRes.ok) {
          const directData = await directRes.json();
          uploadedUrl = directData.secure_url || directData.url;
        }
      } catch (err) {
        console.error('Direct variant upload failed:', err);
      }
    }

    if (uploadedUrl) {
      updateVariantRow(variantIndex, 'image', uploadedUrl);
      setForm((f) => {
        if (!f.images.includes(uploadedUrl!)) {
          return { ...f, images: [...f.images, uploadedUrl!] };
        }
        return f;
      });
      toast('Variant photo uploaded!');
      setVariantImgPickerIdx(null);
    } else {
      toast('Failed to upload image. Please try again.');
    }
    setUploading(false);
  }

  function generateVariantPreset(type: 'colors' | 'sizes' | 'sets') {
    const basePrice = form.price || 0;
    const baseStock = form.stock || 10;

    let presetLabels: string[] = [];
    if (type === 'colors') {
      presetLabels = ['Emerald Green', 'Ruby Red', 'Sapphire Blue', 'Pearl White', 'Rose Gold', 'Royal Gold'];
    } else if (type === 'sizes') {
      presetLabels = ['Size 2.4', 'Size 2.6', 'Size 2.8', 'Adjustable Free Size'];
    } else if (type === 'sets') {
      presetLabels = ['Full Bridal Set (Neckpiece + Earrings + Tikka)', 'Neckpiece & Earrings Set', 'Choker Only'];
    }

    setForm((f) => {
      const existingLabels = new Set(f.variants.map((v) => v.label.toLowerCase()));
      const newItems: VariantFormItem[] = presetLabels
        .filter((l) => !existingLabels.has(l.toLowerCase()))
        .map((label) => ({ label, price: basePrice, stock: baseStock, image: '' }));

      return {
        ...f,
        variants: [...f.variants, ...newItems],
      };
    });
    toast(`Added preset variants for ${type}`);
  }

  // Collect all unique inclusions from default list + all existing loaded products
  const allInclusionSuggestions = useMemo(() => {
    const set = new Set<string>(DEFAULT_INCLUSIONS);
    products.forEach((p) => {
      (p.inclusions || []).forEach((inc) => {
        if (inc && inc.trim()) set.add(inc.trim());
      });
    });
    return Array.from(set);
  }, [products]);

  // Compute active suggestion based on current token being typed
  const inclusionSuggestion = useMemo(() => {
    const currentText = form.incStr ?? '';
    const tokens = currentText.split(',');
    const lastToken = tokens[tokens.length - 1]?.trim() ?? '';
    if (!lastToken || lastToken.length < 1) return '';

    const match = allInclusionSuggestions.find(
      (item) =>
        item.toLowerCase().startsWith(lastToken.toLowerCase()) &&
        item.toLowerCase() !== lastToken.toLowerCase()
    );
    return (
      match ||
      allInclusionSuggestions.find(
        (item) =>
          item.toLowerCase().includes(lastToken.toLowerCase()) &&
          item.toLowerCase() !== lastToken.toLowerCase()
      ) ||
      ''
    );
  }, [form.incStr, allInclusionSuggestions]);

  function handleInclusionKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Tab' || e.key === 'Enter') && inclusionSuggestion) {
      e.preventDefault();
      const currentText = form.incStr ?? '';
      const tokens = currentText.split(',');
      tokens[tokens.length - 1] = ' ' + inclusionSuggestion;
      const updatedStr = tokens.map((t) => t.trim()).filter(Boolean).join(', ') + ', ';
      setForm((f) => ({ ...f, incStr: updatedStr }));
    }
  }

  function addInclusionChip(item: string) {
    const currentTokens = (form.incStr ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!currentTokens.some((t) => t.toLowerCase() === item.toLowerCase())) {
      currentTokens.push(item);
      setForm((f) => ({ ...f, incStr: currentTokens.join(', ') + ', ' }));
    }
  }

  async function save() {
    if (!form.name || !form.price) {
      toast('Name and price are required', 'error');
      return;
    }
    setSaving(true);
    const primaryImg = form.images[0] || form.image || '';

    const payload = {
      name: form.name,
      price: Number(form.price),
      stock: Number(form.stock ?? 10),
      category: form.category,
      color: form.color,
      stone_color: form.color,
      style: form.style,
      description: form.description,
      image: primaryImg,
      images: form.images.length > 0 ? form.images : (primaryImg ? [primaryImg] : []),
      variants: form.variants.filter((v) => v.label && v.label.trim()),
      inclusions: (form.incStr ?? '').split(',').map((s) => s.trim()).filter(Boolean),
      is_featured: form.is_featured ?? false,
      meta_title: form.meta_title,
      meta_description: form.meta_description,
      slug: form.slug,
    };

    const url = editing ? `/api/products/${editing.id}` : '/api/products';
    const method = editing ? 'PUT' : 'POST';
    const res = await adminFetch(url, { method, body: JSON.stringify(payload) });
    const data = await res.json();
    if (data.error) {
      toast(data.error, 'error');
    } else {
      toast(editing ? 'Product updated' : 'Product created');
      setShowForm(false);
      load();
    }
    setSaving(false);
  }

  async function deleteProduct() {
    if (!deleteTarget) return;
    const res = await adminFetch(`/api/products/${deleteTarget.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.error) toast(data.error, 'error');
    else {
      toast('Product deleted');
      load();
    }
    setDeleteTarget(null);
  }

  function F<K extends keyof ProductFormData>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">Products</h1>
          <p className="text-xs sm:text-sm text-gray-500">{total} total products</p>
        </div>
        <button
          onClick={openNew}
          className="self-start sm:self-auto flex items-center gap-2 bg-[#022c22] text-[#D4AF37] border border-[#D4AF37]/50 text-xs uppercase tracking-widest px-4 py-2.5 hover:bg-[#064e3b] transition-all font-semibold rounded-sm shadow-sm"
        >
          <Plus size={14} /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          placeholder="Search products…"
          onChange={(e) => {
            setSearch(e.target.value);
            load(1, e.target.value);
          }}
          className={INPUT + ' pl-9 bg-white'}
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Color</th>
              <th className="px-4 py-3">Variants</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse bg-gray-100 w-20" />
                    </td>
                  ))}
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 object-cover border border-gray-100 shrink-0 rounded-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-gray-400 rounded-sm">
                          <ImageIcon size={16} />
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-900 line-clamp-1">{p.name}</span>
                        {p.images && p.images.length > 1 && (
                          <span className="text-[10px] text-gray-400">{p.images.length} images</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{p.category || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{p.color || p.stone_color || '—'}</td>
                  <td className="px-4 py-3">
                    {p.variants && p.variants.length > 0 ? (
                      <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-medium flex items-center gap-1 w-fit">
                        <Layers size={11} /> {p.variants.length} option{p.variants.length > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 font-medium rounded-sm ${
                        p.stock < 5 ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.is_featured && (
                      <span className="text-[11px] bg-yellow-100 text-yellow-800 font-semibold px-2 py-0.5 rounded-sm">
                        Featured
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEdit(p)}
                        className="text-emerald-700 hover:text-emerald-900 p-1 hover:bg-emerald-50 rounded"
                        title="Edit product"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"
                        title="Delete product"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-500">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => {
                const p = page - 1;
                setPage(p);
                load(p);
              }}
              className="p-1.5 border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={page === pages}
              onClick={() => {
                const p = page + 1;
                setPage(p);
                load(p);
              }}
              className="p-1.5 border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Product"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={deleteProduct}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Product Form Drawer */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="bg-white w-full max-w-xl overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-serif text-xl font-bold text-[#022c22]">
                {editing ? 'Edit Product' : 'New Product'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* ─── 1. Multiple Product Images ─── */}
              <div className="bg-gray-50/70 p-4 border border-gray-200 rounded-sm">
                <div className="flex items-center justify-between mb-2">
                  <label className={LABEL}>Product Images (Gallery)</label>
                  <span className="text-[11px] text-gray-400">{form.images.length} uploaded</span>
                </div>

                {/* Thumbnail Grid */}
                {form.images.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 mb-3">
                    {form.images.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className={`group relative aspect-square rounded-sm overflow-hidden border-2 transition-all ${
                          idx === 0
                            ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Product thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Cover Badge */}
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-[#022c22] text-[#D4AF37] text-[8px] font-bold uppercase px-1 rounded-sm shadow">
                            Cover
                          </span>
                        )}

                        {/* Hover Overlay Controls */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => setCoverImage(idx)}
                              className="text-[9px] bg-white text-gray-900 font-bold px-1.5 py-0.5 rounded shadow hover:bg-[#D4AF37] hover:text-[#022c22] transition-colors"
                              title="Set as Cover Image"
                            >
                              Set Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded shadow hover:bg-red-700 transition-colors flex items-center gap-0.5"
                            title="Remove image"
                          >
                            <X size={10} /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload & URL Controls */}
                <div className="space-y-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleMultipleUpload(e.target.files)}
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold bg-[#022c22] text-[#D4AF37] border border-[#D4AF37]/50 py-2.5 px-4 rounded-sm hover:bg-[#064e3b] transition-colors disabled:opacity-50"
                    >
                      <Upload size={14} />
                      {uploading ? 'Uploading Images…' : 'Upload Image(s) from Device'}
                    </button>
                  </div>

                  {/* Add by URL */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.imageUrlInput}
                      onChange={(e) => setForm((f) => ({ ...f, imageUrlInput: e.target.value }))}
                      placeholder="Or paste external image URL here"
                      className={INPUT + ' text-xs py-1.5 bg-white'}
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      disabled={!form.imageUrlInput.trim()}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 font-medium rounded-sm disabled:opacity-40"
                    >
                      Add URL
                    </button>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div>
                <label className={LABEL}>Product Name *</label>
                <input
                  type="text"
                  value={form.name ?? ''}
                  onChange={F('name')}
                  placeholder="e.g. Hana Dainty Seed Pearl Necklace"
                  className={INPUT}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Base Price (₹) *</label>
                  <input
                    type="number"
                    value={form.price ?? ''}
                    min={0}
                    onChange={F('price')}
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Base Stock Quantity</label>
                  <input
                    type="number"
                    value={form.stock ?? ''}
                    min={0}
                    onChange={F('stock')}
                    className={INPUT}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className={LABEL}>Category</label>
                <select
                  value={form.category ?? ''}
                  onChange={F('category')}
                  className={INPUT + ' bg-white'}
                >
                  <option value="">Select Category…</option>
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* ─── 2. Color Selection (Dropdown + Add Custom Color) ─── */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={LABEL}>Color</label>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, isCustomColor: !f.isCustomColor }))}
                    className="text-[11px] text-emerald-800 hover:underline font-semibold"
                  >
                    {form.isCustomColor ? '← Select from standard colors' : '+ Add custom color'}
                  </button>
                </div>

                {form.isCustomColor ? (
                  <input
                    type="text"
                    value={form.color ?? ''}
                    onChange={F('color')}
                    placeholder="Type custom color (e.g. Lavender, Turquoise, Burgundy)..."
                    className={INPUT + ' bg-white'}
                    autoFocus
                  />
                ) : (
                  <select
                    value={STANDARD_COLORS.includes(form.color) ? form.color : form.color ? '__custom__' : ''}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setForm((f) => ({ ...f, isCustomColor: true, color: '' }));
                      } else {
                        setForm((f) => ({ ...f, color: e.target.value, isCustomColor: false }));
                      }
                    }}
                    className={INPUT + ' bg-white'}
                  >
                    <option value="">Select Color…</option>
                    {STANDARD_COLORS.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                    <option value="__custom__">+ Add new / custom color…</option>
                  </select>
                )}
              </div>

              {/* ─── 3. Aesthetic & Style (Dropdown + Custom Style) ─── */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={LABEL}>Aesthetic & Style</label>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, isCustomStyle: !f.isCustomStyle }))}
                    className="text-[11px] text-emerald-800 hover:underline font-semibold"
                  >
                    {form.isCustomStyle ? '← Select from standard styles' : '+ Add custom style'}
                  </button>
                </div>

                {form.isCustomStyle ? (
                  <input
                    type="text"
                    value={form.style ?? ''}
                    onChange={F('style')}
                    placeholder="Type aesthetic / style (e.g. Vintage Coquette, Minimalist Stack)..."
                    className={INPUT + ' bg-white'}
                    autoFocus
                  />
                ) : (
                  <select
                    value={STANDARD_STYLES.includes(form.style) ? form.style : form.style ? '__custom__' : ''}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setForm((f) => ({ ...f, isCustomStyle: true, style: '' }));
                      } else {
                        setForm((f) => ({ ...f, style: e.target.value, isCustomStyle: false }));
                      }
                    }}
                    className={INPUT + ' bg-white'}
                  >
                    <option value="">Select Aesthetic & Style…</option>
                    {STANDARD_STYLES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                    <option value="__custom__">+ Add new / custom style…</option>
                  </select>
                )}
              </div>

              {/* ─── 4. Product Variants (Color, Size, Set Options) ─── */}
              <div className="bg-gray-50/80 p-4 border border-gray-200 rounded-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className={LABEL}>Product Variants & Options</label>
                    <p className="text-[11px] text-gray-500">
                      Add size, color, or set variants with distinct prices & stock
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addVariantRow()}
                    className="text-xs flex items-center gap-1 bg-[#022c22] text-[#D4AF37] border border-[#D4AF37]/40 px-2.5 py-1 rounded font-semibold hover:bg-[#064e3b] transition-colors"
                  >
                    <Plus size={12} /> Add Variant
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3 pt-1">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                    Quick Presets:
                  </span>
                  <button
                    type="button"
                    onClick={() => generateVariantPreset('colors')}
                    className="text-[11px] bg-white border border-gray-200 hover:border-emerald-700 hover:text-emerald-900 px-2 py-0.5 rounded shadow-2xs font-medium"
                  >
                    + Color Shades
                  </button>
                  <button
                    type="button"
                    onClick={() => generateVariantPreset('sizes')}
                    className="text-[11px] bg-white border border-gray-200 hover:border-emerald-700 hover:text-emerald-900 px-2 py-0.5 rounded shadow-2xs font-medium"
                  >
                    + Bangle/Ring Sizes
                  </button>
                  <button
                    type="button"
                    onClick={() => generateVariantPreset('sets')}
                    className="text-[11px] bg-white border border-gray-200 hover:border-emerald-700 hover:text-emerald-900 px-2 py-0.5 rounded shadow-2xs font-medium"
                  >
                    + Set Options
                  </button>
                </div>

                {/* Variant Rows Table */}
                {form.variants.length > 0 ? (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
                      <span className="col-span-2">Photo</span>
                      <span className="col-span-4">Variant Option / Name</span>
                      <span className="col-span-3">Price (₹)</span>
                      <span className="col-span-2">Stock</span>
                      <span className="col-span-1 text-center">Del</span>
                    </div>
                    {form.variants.map((v, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-2.5 border border-gray-200 rounded-sm shadow-2xs space-y-2"
                      >
                        <div className="grid grid-cols-12 gap-2 items-center">
                          {/* Variant Image Thumbnail / Trigger */}
                          <div className="col-span-2 flex items-center">
                            <button
                              type="button"
                              onClick={() => setVariantImgPickerIdx(variantImgPickerIdx === idx ? null : idx)}
                              className={`relative w-10 h-10 rounded-sm border overflow-hidden flex items-center justify-center transition-all ${
                                v.image
                                  ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/50 shadow-xs'
                                  : 'border-dashed border-gray-300 hover:border-emerald-800 bg-gray-50 text-gray-400 hover:text-emerald-900'
                              }`}
                              title={v.image ? 'Change variant photo' : 'Upload photo for this variant'}
                            >
                              {v.image ? (
                                <img
                                  src={v.image}
                                  alt={v.label}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-[9px] font-semibold leading-tight">
                                  <ImageIcon size={12} />
                                  <span>+Img</span>
                                </div>
                              )}
                            </button>
                          </div>

                          {/* Variant Label */}
                          <div className="col-span-4">
                            <input
                              type="text"
                              value={v.label}
                              onChange={(e) => updateVariantRow(idx, 'label', e.target.value)}
                              placeholder="e.g. Emerald Green, Size 2.4"
                              className="w-full text-xs border border-gray-200 px-2 py-1.5 rounded-sm focus:outline-none focus:border-emerald-800"
                            />
                          </div>

                          {/* Price */}
                          <div className="col-span-3">
                            <input
                              type="number"
                              value={v.price}
                              min={0}
                              onChange={(e) => updateVariantRow(idx, 'price', e.target.value)}
                              placeholder="Price ₹"
                              className="w-full text-xs border border-gray-200 px-2 py-1.5 rounded-sm focus:outline-none focus:border-emerald-800"
                            />
                          </div>

                          {/* Stock */}
                          <div className="col-span-2">
                            <input
                              type="number"
                              value={v.stock}
                              min={0}
                              onChange={(e) => updateVariantRow(idx, 'stock', e.target.value)}
                              placeholder="Stock"
                              className="w-full text-xs border border-gray-200 px-2 py-1.5 rounded-sm focus:outline-none focus:border-emerald-800"
                            />
                          </div>

                          {/* Delete */}
                          <div className="col-span-1 flex justify-center">
                            <button
                              type="button"
                              onClick={() => removeVariantRow(idx)}
                              className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"
                              title="Remove variant"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* ─── Variant Photo Selector Panel ─── */}
                        {variantImgPickerIdx === idx && (
                          <div className="bg-[#FAF9F6] border border-[#D4AF37]/40 p-3 rounded-sm text-xs space-y-2.5 animate-fadeIn">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-950 uppercase tracking-wider text-[10px]">
                                Photo for &quot;{v.label || `Variant #${idx + 1}`}&quot;
                              </span>
                              <button
                                type="button"
                                onClick={() => setVariantImgPickerIdx(null)}
                                className="text-gray-400 hover:text-gray-600 text-xs"
                              >
                                <X size={13} />
                              </button>
                            </div>

                            {/* 1. Upload from Device */}
                            <div>
                              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                Option A: Upload from Device
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-sm file:border-0 file:text-[11px] file:font-semibold file:bg-[#022c22] file:text-[#D4AF37] hover:file:bg-[#064e3b] cursor-pointer"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleVariantUpload(idx, e.target.files[0]);
                                  }
                                }}
                              />
                            </div>

                            {/* 2. Choose from Existing Gallery */}
                            {form.images.length > 0 && (
                              <div>
                                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                  Option B: Pick from Product Gallery
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  {form.images.map((galleryImg, gIdx) => (
                                    <button
                                      key={gIdx}
                                      type="button"
                                      onClick={() => {
                                        updateVariantRow(idx, 'image', galleryImg);
                                        toast('Assigned gallery photo to variant!');
                                        setVariantImgPickerIdx(null);
                                      }}
                                      className={`w-12 h-12 rounded-sm overflow-hidden border-2 transition-all ${
                                        v.image === galleryImg
                                          ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]'
                                          : 'border-gray-200 hover:border-emerald-700 opacity-70 hover:opacity-100'
                                      }`}
                                    >
                                      <img
                                        src={galleryImg}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 3. Paste Direct URL */}
                            <div>
                              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                Option C: Paste Image URL
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="url"
                                  value={v.image || ''}
                                  onChange={(e) => updateVariantRow(idx, 'image', e.target.value)}
                                  placeholder="https://..."
                                  className="flex-1 text-xs border border-gray-200 px-2 py-1 rounded-sm bg-white"
                                />
                                {v.image && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateVariantRow(idx, 'image', '');
                                      toast('Removed variant photo');
                                    }}
                                    className="text-xs text-red-600 hover:underline font-semibold shrink-0"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-white/70 border border-dashed border-gray-200 rounded text-xs text-gray-400">
                    No variants added. Click &quot;Add Variant&quot; or select a preset above.
                  </div>
                )}
              </div>

              <div>
                <label className={LABEL}>Description</label>
                <textarea
                  value={form.description ?? ''}
                  rows={3}
                  onChange={F('description')}
                  placeholder="Craftsmanship details, materials, anti-tarnish warranty, etc."
                  className={INPUT + ' resize-none'}
                />
              </div>

              {/* Inclusions with Tab Completion & Quick Chips */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={LABEL}>Inclusions (comma-separated)</label>
                  {inclusionSuggestion && (
                    <span className="text-[11px] text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
                      Press <kbd className="font-mono bg-white px-1 py-0.2 border border-emerald-300 rounded text-[10px]">Tab</kbd> to complete: <strong className="font-bold">{inclusionSuggestion}</strong>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={form.incStr ?? ''}
                    onChange={F('incStr')}
                    onKeyDown={handleInclusionKeyDown}
                    placeholder="e.g. Grand Neckpiece, Pair of Heavy Earrings, Maang Tikka"
                    className={INPUT + ' bg-white'}
                  />
                </div>

                {/* Quick Add Inclusions Chips */}
                <div className="mt-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                      Quick Add Suggestions (Click to insert):
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {allInclusionSuggestions.map((item) => {
                      const isAlreadyAdded = (form.incStr ?? '')
                        .split(',')
                        .map((s) => s.trim().toLowerCase())
                        .includes(item.toLowerCase());
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => addInclusionChip(item)}
                          disabled={isAlreadyAdded}
                          className={`text-[11px] px-2 py-1 rounded-sm border transition-all flex items-center gap-1 ${
                            isAlreadyAdded
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 shadow-2xs'
                          }`}
                        >
                          <span className={isAlreadyAdded ? 'text-gray-400' : 'text-emerald-700 font-bold'}>
                            {isAlreadyAdded ? '✓' : '+'}
                          </span>
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SEO */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-3 font-semibold">
                  SEO & Search Optimization
                </p>
                <div className="space-y-3">
                  <div>
                    <label className={LABEL}>Slug</label>
                    <input
                      type="text"
                      value={form.slug ?? ''}
                      onChange={F('slug')}
                      placeholder="e.g. hana-seed-pearl-necklace"
                      className={INPUT}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Meta Title</label>
                    <input
                      type="text"
                      value={form.meta_title ?? ''}
                      onChange={F('meta_title')}
                      placeholder="Title for Google search results"
                      className={INPUT}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Meta Description</label>
                    <textarea
                      value={form.meta_description ?? ''}
                      rows={2}
                      onChange={F('meta_description')}
                      placeholder="Summary snippet for search results"
                      className={INPUT + ' resize-none'}
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={form.is_featured ?? false}
                  onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
                  className="w-4 h-4 accent-emerald-700"
                />
                <span className="text-sm text-gray-700 font-medium">Featured in Spotlight / Homepage</span>
              </label>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 py-2.5 text-sm hover:bg-gray-50 rounded-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 bg-[#022c22] text-[#D4AF37] border border-[#D4AF37]/40 py-2.5 text-sm hover:bg-[#064e3b] font-bold rounded-sm disabled:opacity-60 transition-colors shadow-sm"
              >
                {saving ? 'Saving…' : editing ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
