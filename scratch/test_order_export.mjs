import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yivivoceculwwuqigbhr.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpdml2b2NlY3Vsd3d1cWlnYmhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQzOTYxMiwiZXhwIjoyMTAwMDE1NjEyfQ.rO0N7twy9XQS5Y4paGvEOFCBYbJtZA9sk9XHxh5X3nU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function escapeCsvField(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function formatItemsList(items) {
  if (!items || !Array.isArray(items) || items.length === 0) return 'N/A';
  return items
    .map((item) => {
      const varInfo = item.variant?.label || item.variant_label ? ` [Option: ${item.variant?.label || item.variant_label}]` : '';
      return `${item.name || 'Item'}${varInfo} x ${item.quantity || 1} (₹${item.price || 0})`;
    })
    .join(' | ');
}

async function testExport() {
  const { data: orderList } = await supabase.from('user_orders').select('*').limit(5);
  const headers = [
    'Order ID',
    'Order Date',
    'Order Status',
    'Customer Name',
    'Customer Phone',
    'Customer Email',
    'Shipping Address',
    'City',
    'State',
    'Pincode',
    'Full Address',
    'Total Amount (INR)',
    'Payment Method',
    'Payment Transaction ID',
    'Items Ordered (Products, Options, Qty, Price)',
    'Total Items Quantity',
    'Coupon Code',
    'Coupon Discount (INR)',
    'Courier Tracking Number',
    'Admin Notes',
  ];

  const csvRows = [
    headers.map(escapeCsvField).join(','),
    ...orderList.map((o) => {
      const s = o.shipping_details || {};
      const custName = s.name || [s.firstName, s.lastName].filter(Boolean).join(' ') || 'N/A';
      const pin = s.pincode || s.postalCode || '';
      const fullAddr = [s.address, s.city, s.state, pin].filter(Boolean).join(', ');
      const totalQty = (o.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0);
      const paymentId = s.payment_id || 'N/A';
      const dateStr = o.created_at ? new Date(o.created_at).toLocaleString('en-IN') : 'N/A';

      return [
        escapeCsvField(o.order_id),
        escapeCsvField(dateStr),
        escapeCsvField(o.status),
        escapeCsvField(custName),
        escapeCsvField(s.phone || 'N/A'),
        escapeCsvField(s.email || 'N/A'),
        escapeCsvField(s.address || 'N/A'),
        escapeCsvField(s.city || 'N/A'),
        escapeCsvField(s.state || 'N/A'),
        escapeCsvField(pin || 'N/A'),
        escapeCsvField(fullAddr || 'N/A'),
        escapeCsvField(o.amount),
        escapeCsvField(o.payment_method || 'Prepaid (Razorpay)'),
        escapeCsvField(paymentId),
        escapeCsvField(formatItemsList(o.items)),
        escapeCsvField(totalQty),
        escapeCsvField(s.coupon_code || 'None'),
        escapeCsvField(s.coupon_discount || 0),
        escapeCsvField(o.tracking_number || 'N/A'),
        escapeCsvField(o.notes || 'N/A'),
      ].join(',');
    }),
  ];

  console.log('Sample Export CSV Output:\n', csvRows.join('\n'));
}

testExport();
