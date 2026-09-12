'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, X, Pencil, Copy, CheckCircle, XCircle, Tag, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { adminFetch, formatPrice, formatDate } from '@/lib/admin-utils';
import { useToast } from '@/components/admin/Toast';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
type CouponType = 'flat' | 'percent' | 'free_shipping' | 'bogo';

interface Coupon {
  id: number;
  code: string;
  coupon_type: CouponType;
  discount_type: string;
  discount_amount: number;
  description: string | null;
  is_active: boolean;
  usage_count: number;
  usage_limit: number | null;
  min_order_amount: number;
  max_discount_amount: number | null;
  expires_at: string | null;
  created_at: string;
  stackable: boolean;
  stack_group: string | null;
  allowed_product_ids: number[] | null;
  allowed_category_slugs: string[] | null;
  bogo_buy_product_id: number | null;
  bogo_get_product_id: number | null;
}

interface StackingRule {
  id: number;
  coupon_code_a: string;
  coupon_code_b: string;
  rule_type: string;
}

const COUPON_TYPE_LABELS: Record<CouponType, string> = {
  flat: 'Fixed Amount (₹)',
  percent: 'Percentage (%)',
  free_shipping: 'Free Shipping',
  bogo: 'Buy One Get One',
};

const COUPON_TYPE_COLORS: Record<CouponType, string> = {
  flat: 'bg-blue-50 text-blue-700',
  percent: 'bg-purple-50 text-purple-700',
  free_shipping: 'bg-emerald-50 text-emerald-700',
  bogo: 'bg-amber-50 text-amber-700',
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const INPUT = 'w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-emerald-800 bg-white';
const LABEL = 'block text-xs uppercase tracking-widest text-gray-500 mb-1';

type FormData = {
  code: string;
  coupon_type: CouponType;
  discount_amount: string;
  description: string;
  min_order_amount: string;
  max_discount_amount: string;
  usage_limit: string;
  expires_at: string;
  stackable: boolean;
  stack_group: string;
  allowed_category_slugs: string;
  allowed_product_ids: string;
  stacking_rules: Array<{ coupon_code_b: string; rule_type: string }>;
};

const EMPTY_FORM: FormData = {
  code: '',
  coupon_type: 'flat',
  discount_amount: '',
  description: '',
  min_order_amount: '0',
  max_discount_amount: '',
  usage_limit: '',
  expires_at: '',
  stackable: true,
  stack_group: '',
  allowed_category_slugs: '',
  allowed_product_ids: '',
  stacking_rules: [],
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CouponsPage() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stackingRules, setStackingRules] = useState<StackingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Coupon | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [newRuleCode, setNewRuleCode] = useState('');
  const [showStackingInfo, setShowStackingInfo] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch('/api/admin/coupons');
    const data = await res.json();
    setCoupons(data.coupons ?? []);
    setStackingRules(data.stackingRules ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Form helpers ─────────────────────────────────────────────────────────────
  function F<K extends keyof FormData>(k: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(c: Coupon) {
    setEditTarget(c);
    // Gather existing stacking rules for this coupon
    const existingRules = stackingRules
      .filter((r) => r.coupon_code_a === c.code || r.coupon_code_b === c.code)
      .map((r) => ({
        coupon_code_b: r.coupon_code_a === c.code ? r.coupon_code_b : r.coupon_code_a,
        rule_type: r.rule_type,
      }));

    setForm({
      code: c.code,
      coupon_type: c.coupon_type ?? (c.discount_type as CouponType) ?? 'flat',
      discount_amount: c.discount_amount > 0 ? String(c.discount_amount) : '',
      description: c.description ?? '',
      min_order_amount: String(c.min_order_amount ?? 0),
      max_discount_amount: c.max_discount_amount ? String(c.max_discount_amount) : '',
      usage_limit: c.usage_limit ? String(c.usage_limit) : '',
      expires_at: c.expires_at ? c.expires_at.split('T')[0] : '',
      stackable: c.stackable ?? true,
      stack_group: c.stack_group ?? '',
      allowed_category_slugs: c.allowed_category_slugs?.join(', ') ?? '',
      allowed_product_ids: c.allowed_product_ids?.join(', ') ?? '',
      stacking_rules: existingRules,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setNewRuleCode('');
  }

  function addRule() {
    const code = newRuleCode.toUpperCase().trim();
    if (!code) return;
    if (form.stacking_rules.some((r) => r.coupon_code_b === code)) {
      toast('Rule already added', 'error'); return;
    }
    setForm((f) => ({ ...f, stacking_rules: [...f.stacking_rules, { coupon_code_b: code, rule_type: 'exclusive' }] }));
    setNewRuleCode('');
  }

  function removeRule(code: string) {
    setForm((f) => ({ ...f, stacking_rules: f.stacking_rules.filter((r) => r.coupon_code_b !== code) }));
  }

  // ── Save ──────────────────────────────────────────────────────────────────────
  async function save() {
    if (!form.code.trim()) { toast('Coupon code is required', 'error'); return; }
    if (['flat', 'percent'].includes(form.coupon_type) && !form.discount_amount) {
      toast('Discount amount is required for this coupon type', 'error'); return;
    }

    setSaving(true);
    const payload = {
      code: form.code.toUpperCase().trim(),
      coupon_type: form.coupon_type,
      discount_amount: form.discount_amount ? Number(form.discount_amount) : 0,
      description: form.description || null,
      min_order_amount: Number(form.min_order_amount || 0),
      max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      expires_at: form.expires_at || null,
      stackable: form.stackable,
      stack_group: form.stack_group || null,
      allowed_category_slugs: form.allowed_category_slugs
        ? form.allowed_category_slugs.split(',').map((s) => s.trim()).filter(Boolean)
        : null,
      allowed_product_ids: form.allowed_product_ids
        ? form.allowed_product_ids.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n) && n > 0)
        : null,
      stacking_rules: form.stacking_rules,
    };

    const method = editTarget ? 'PUT' : 'POST';
    const body = editTarget ? { ...payload, id: editTarget.id } : payload;

    const res = await adminFetch('/api/admin/coupons', { method, body: JSON.stringify(body) });
    const data = await res.json();

    if (data.error) {
      toast(data.error, 'error');
    } else {
      toast(editTarget ? 'Coupon updated' : 'Coupon created');
      closeForm();
      load();
    }
    setSaving(false);
  }

  // ── Toggle active ─────────────────────────────────────────────────────────────
  async function toggleActive(c: Coupon) {
    const res = await adminFetch('/api/admin/coupons', {
      method: 'PUT',
      body: JSON.stringify({ id: c.id, is_active: !c.is_active }),
    });
    const data = await res.json();
    if (data.error) toast(data.error, 'error');
    else { toast(c.is_active ? 'Coupon deactivated' : 'Coupon activated'); load(); }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function deleteCoupon() {
    if (!deleteTarget) return;
    const res = await adminFetch(`/api/admin/coupons?id=${deleteTarget.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.error) toast(data.error, 'error');
    else { toast('Coupon deleted'); load(); }
    setDeleteTarget(null);
  }

  // ── Copy code ──────────────────────────────────────────────────────────────
  function copyCode(code: string) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  }

  // ── Coupon discount display ───────────────────────────────────────────────
  function discountLabel(c: Coupon): string {
    const type = c.coupon_type ?? c.discount_type;
    if (type === 'percent') return `${c.discount_amount}% OFF`;
    if (type === 'free_shipping') return 'Free Shipping';
    if (type === 'bogo') return 'BOGO';
    return formatPrice(c.discount_amount) + ' OFF';
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  const activeCoupons = coupons.filter((c) => c.is_active);
  const couponType = form.coupon_type;
  const needsAmount = ['flat', 'percent'].includes(couponType);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-playfair font-bold text-gray-900">Coupon Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {activeCoupons.length} active · {coupons.length} total
          </p>
        </div>
        <button
          onClick={openCreate}
          className="self-start sm:self-auto flex items-center gap-2 bg-emerald-900 text-white text-xs uppercase tracking-widest px-4 py-2.5 hover:bg-emerald-800 transition-colors"
        >
          <Plus size={14} /> New Coupon
        </button>
      </div>

      {/* Stacking info banner */}
      <div className="mb-4 border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-800">
        <button
          onClick={() => setShowStackingInfo((v) => !v)}
          className="flex items-center gap-1.5 font-semibold w-full text-left"
        >
          <Info size={13} /> Coupon Stacking Rules
          {showStackingInfo ? <ChevronUp size={13} className="ml-auto" /> : <ChevronDown size={13} className="ml-auto" />}
        </button>
        {showStackingInfo && (
          <div className="mt-2 space-y-1 text-emerald-700">
            <p>• Set a coupon as <strong>non-stackable</strong> to prevent it combining with any other coupon.</p>
            <p>• Assign the same <strong>stack group</strong> to coupons that are mutually exclusive within a category (e.g. two percentage discounts).</p>
            <p>• Use <strong>explicit rules</strong> (on each coupon's edit form) to define pairwise exclusions between specific codes.</p>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Code', 'Type', 'Discount', 'Min Order', 'Usage', 'Expires', 'Stack', 'Status', ''].map((h, i) => (
                <th key={i} className="text-left text-[11px] uppercase tracking-widest text-gray-400 px-3 py-3 font-medium whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td colSpan={9} className="px-3 py-3">
                    <div className="h-4 animate-pulse bg-gray-100 w-full" />
                  </td>
                </tr>
              ))
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400 text-sm">
                  No coupons yet — create your first one
                </td>
              </tr>
            ) : (
              coupons.map((c) => {
                const type: CouponType = (c.coupon_type ?? c.discount_type) as CouponType;
                const rulesForCoupon = stackingRules.filter(
                  (r) => r.coupon_code_a === c.code || r.coupon_code_b === c.code
                );
                const isExpanded = expandedId === c.id;

                return (
                  <>
                    <tr
                      key={c.id}
                      className={cn(
                        'border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer',
                        !c.is_active && 'opacity-50'
                      )}
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    >
                      {/* Code */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-gray-900 text-xs">{c.code}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); copyCode(c.code); }}
                            className="text-gray-300 hover:text-gray-500 transition-colors"
                            title="Copy code"
                          >
                            {copiedCode === c.code ? <CheckCircle size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                        {c.description && (
                          <p className="text-[10px] text-gray-400 mt-0.5 max-w-[120px] truncate">{c.description}</p>
                        )}
                      </td>
                      {/* Type */}
                      <td className="px-3 py-3">
                        <span className={cn('text-[10px] px-1.5 py-0.5 font-medium rounded', COUPON_TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-600')}>
                          {COUPON_TYPE_LABELS[type] ?? type}
                        </span>
                      </td>
                      {/* Discount */}
                      <td className="px-3 py-3 font-semibold text-xs text-gray-800">{discountLabel(c)}</td>
                      {/* Min Order */}
                      <td className="px-3 py-3 text-xs text-gray-500">
                        {c.min_order_amount > 0 ? formatPrice(c.min_order_amount) : '—'}
                      </td>
                      {/* Usage */}
                      <td className="px-3 py-3 text-xs text-gray-500">
                        {c.usage_count}{c.usage_limit ? ` / ${c.usage_limit}` : ''}
                      </td>
                      {/* Expires */}
                      <td className="px-3 py-3 text-[11px] text-gray-400 whitespace-nowrap">
                        {c.expires_at ? formatDate(c.expires_at) : '—'}
                      </td>
                      {/* Stack */}
                      <td className="px-3 py-3">
                        <span className={cn(
                          'text-[10px] px-1.5 py-0.5 font-medium',
                          c.stackable ? 'bg-sky-50 text-sky-700' : 'bg-orange-50 text-orange-700'
                        )}>
                          {c.stackable ? (c.stack_group ? `Group: ${c.stack_group}` : 'Stackable') : 'Solo only'}
                        </span>
                      </td>
                      {/* Status toggle */}
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleActive(c)}
                          title={c.is_active ? 'Deactivate' : 'Activate'}
                          className="flex items-center gap-1"
                        >
                          {c.is_active
                            ? <CheckCircle size={16} className="text-emerald-500" />
                            : <XCircle size={16} className="text-gray-300" />
                          }
                          <span className={cn('text-[10px] font-medium', c.is_active ? 'text-emerald-600' : 'text-gray-400')}>
                            {c.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </button>
                      </td>
                      {/* Actions */}
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(c)}
                            className="text-gray-400 hover:text-emerald-700 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded details row */}
                    {isExpanded && (
                      <tr key={`${c.id}-expanded`} className="bg-gray-50 border-b border-gray-100">
                        <td colSpan={9} className="px-4 py-3">
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs text-gray-600">
                            {c.max_discount_amount && (
                              <div>
                                <span className="uppercase tracking-wider text-gray-400 text-[10px]">Max Discount</span>
                                <p className="font-semibold">{formatPrice(c.max_discount_amount)}</p>
                              </div>
                            )}
                            {c.allowed_category_slugs?.length ? (
                              <div>
                                <span className="uppercase tracking-wider text-gray-400 text-[10px]">Categories</span>
                                <p className="font-medium">{c.allowed_category_slugs.join(', ')}</p>
                              </div>
                            ) : null}
                            {c.allowed_product_ids?.length ? (
                              <div>
                                <span className="uppercase tracking-wider text-gray-400 text-[10px]">Product IDs</span>
                                <p className="font-medium">{c.allowed_product_ids.join(', ')}</p>
                              </div>
                            ) : null}
                            {(type === 'bogo') && (
                              <div>
                                <span className="uppercase tracking-wider text-gray-400 text-[10px]">BOGO Get Product ID</span>
                                <p className="font-medium">{c.bogo_get_product_id ?? '—'}</p>
                              </div>
                            )}
                            {rulesForCoupon.length > 0 && (
                              <div className="col-span-2">
                                <span className="uppercase tracking-wider text-gray-400 text-[10px]">Exclusive with</span>
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {rulesForCoupon.map((r) => (
                                    <span key={r.id} className="bg-red-50 text-red-600 px-1.5 py-0.5 text-[10px] font-mono rounded">
                                      {r.coupon_code_a === c.code ? r.coupon_code_b : r.coupon_code_a}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div>
                              <span className="uppercase tracking-wider text-gray-400 text-[10px]">Created</span>
                              <p className="font-medium">{formatDate(c.created_at)}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm delete modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Coupon"
        message={`Permanently delete coupon "${deleteTarget?.code}"? All associated stacking rules will also be removed.`}
        onConfirm={deleteCoupon}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ─── Create / Edit Form Modal ───────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 overflow-y-auto">
          <div className="bg-white w-full max-w-xl shadow-2xl my-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-emerald-700" />
                <h2 className="font-playfair text-xl font-bold">
                  {editTarget ? `Edit ${editTarget.code}` : 'New Coupon'}
                </h2>
              </div>
              <button onClick={closeForm}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Code + Description */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Code *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={F('code')}
                    className={INPUT}
                    style={{ textTransform: 'uppercase' }}
                    placeholder="SUMMER20"
                    disabled={!!editTarget}
                  />
                  {editTarget && <p className="text-[10px] text-gray-400 mt-0.5">Code cannot be changed after creation</p>}
                </div>
                <div>
                  <label className={LABEL}>Coupon Type *</label>
                  <select value={form.coupon_type} onChange={F('coupon_type')} className={INPUT}>
                    <option value="flat">Fixed Amount (₹)</option>
                    <option value="percent">Percentage (%)</option>
                    <option value="free_shipping">Free Shipping</option>
                    <option value="bogo">Buy One Get One (BOGO)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={LABEL}>Description (admin note)</label>
                <input type="text" value={form.description} onChange={F('description')} className={INPUT} placeholder="e.g. Summer sale — 20% off all orders" />
              </div>

              {/* Discount amount (conditional) */}
              {needsAmount && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>
                      {couponType === 'percent' ? 'Percentage *' : 'Flat Amount (₹) *'}
                    </label>
                    <input
                      type="number"
                      value={form.discount_amount}
                      min={1}
                      max={couponType === 'percent' ? 100 : undefined}
                      onChange={F('discount_amount')}
                      className={INPUT}
                      placeholder={couponType === 'percent' ? '10' : '500'}
                    />
                  </div>
                  {couponType === 'percent' && (
                    <div>
                      <label className={LABEL}>Max Discount Cap (₹)</label>
                      <input
                        type="number"
                        value={form.max_discount_amount}
                        min={0}
                        onChange={F('max_discount_amount')}
                        className={INPUT}
                        placeholder="e.g. 1000"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* BOGO info */}
              {couponType === 'bogo' && (
                <div className="bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                  <strong>BOGO:</strong> When applied, the lowest-priced item in the cart matching the get-product criteria will be discounted 100%.
                  You can optionally restrict which products trigger the offer using the product IDs field below.
                </div>
              )}

              {/* Limits */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Min Order Amount (₹)</label>
                  <input type="number" value={form.min_order_amount} min={0} onChange={F('min_order_amount')} className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Usage Limit (blank = unlimited)</label>
                  <input type="number" value={form.usage_limit} min={1} onChange={F('usage_limit')} className={INPUT} placeholder="e.g. 100" />
                </div>
              </div>

              <div>
                <label className={LABEL}>Expires At</label>
                <input type="date" value={form.expires_at} onChange={F('expires_at')} className={INPUT} />
              </div>

              {/* Product / Category Restrictions */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Restrictions (optional)</p>
                <div className="space-y-3">
                  <div>
                    <label className={LABEL}>Allowed Category Slugs (comma-separated)</label>
                    <input
                      type="text"
                      value={form.allowed_category_slugs}
                      onChange={F('allowed_category_slugs')}
                      className={INPUT}
                      placeholder="earrings, necklaces"
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Allowed Product IDs (comma-separated)</label>
                    <input
                      type="text"
                      value={form.allowed_product_ids}
                      onChange={F('allowed_product_ids')}
                      className={INPUT}
                      placeholder="12, 45, 78"
                    />
                  </div>
                </div>
              </div>

              {/* Stacking rules */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Stacking Configuration</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={LABEL}>Stackable</label>
                    <select
                      value={form.stackable ? 'yes' : 'no'}
                      onChange={(e) => setForm((f) => ({ ...f, stackable: e.target.value === 'yes' }))}
                      className={INPUT}
                    >
                      <option value="yes">Yes — can combine with others</option>
                      <option value="no">No — solo use only</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Stack Group (optional)</label>
                    <input
                      type="text"
                      value={form.stack_group}
                      onChange={F('stack_group')}
                      className={INPUT}
                      placeholder="e.g. percentage_deals"
                    />
                  </div>
                </div>

                {/* Explicit exclusion rules */}
                <div>
                  <label className={LABEL}>Mutually Exclusive With (specific codes)</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newRuleCode}
                      onChange={(e) => setNewRuleCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
                      className={INPUT + ' flex-1'}
                      placeholder="Enter coupon code & press Enter"
                    />
                    <button
                      type="button"
                      onClick={addRule}
                      className="px-3 py-2 bg-emerald-900 text-white text-xs hover:bg-emerald-800"
                    >
                      Add
                    </button>
                  </div>
                  {form.stacking_rules.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {form.stacking_rules.map((r) => (
                        <span key={r.coupon_code_b} className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 text-xs px-2 py-0.5 font-mono">
                          {r.coupon_code_b}
                          <button onClick={() => removeRule(r.coupon_code_b)} className="hover:text-red-900">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={closeForm} className="flex-1 border border-gray-200 py-2.5 text-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 bg-emerald-900 text-white py-2.5 text-sm hover:bg-emerald-800 disabled:opacity-60 transition-colors"
              >
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
