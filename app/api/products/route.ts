import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth-helper';
import { FALLBACK_PRODUCTS } from '@/lib/data';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') ?? '';

  let query = supabaseAdmin
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(FALLBACK_PRODUCTS);
  }

  if (!data || data.length === 0) {
    return NextResponse.json(FALLBACK_PRODUCTS);
  }

  // Fetch variants for all returned products
  const productIds = data.map((p) => p.id);
  const { data: variantsData } = await supabaseAdmin
    .from('product_variants')
    .select('*')
    .in('product_id', productIds);

  const variantsByProdId = new Map<number, any[]>();
  (variantsData || []).forEach((v) => {
    let label = v.label;
    let img = '';
    if (label && label.includes(':::')) {
      const parts = label.split(':::');
      label = parts[0];
      img = parts.slice(1).join(':::');
    }
    const list = variantsByProdId.get(v.product_id) || [];
    list.push({
      id: v.id,
      product_id: v.product_id,
      label,
      image: img,
      price_modifier: v.price_modifier ?? 0,
      stock: v.stock ?? 10,
    });
    variantsByProdId.set(v.product_id, list);
  });

  // Return both snake_case and camelCase aliases for compatibility
  const products = data.map((p) => {
    let imagesList: string[] = [];
    let mainImg = p.image || '';
    if (p.image) {
      if (p.image.startsWith('[') && p.image.endsWith(']')) {
        try {
          imagesList = JSON.parse(p.image);
          mainImg = imagesList[0] || '';
        } catch {
          imagesList = [p.image];
        }
      } else if (p.image.includes(',')) {
        imagesList = p.image.split(',').map((s: string) => s.trim()).filter(Boolean);
        mainImg = imagesList[0] || '';
      } else {
        imagesList = [p.image];
      }
    }

    const prodVariants = (variantsByProdId.get(p.id) || []).map((v) => ({
      ...v,
      price: p.price + (v.price_modifier || 0),
    }));

    return {
      id: p.id,
      name: p.name,
      price: p.price,
      stock: p.stock,
      image: mainImg,
      images: imagesList,
      category: p.category,
      color: p.stone_color,
      stone_color: p.stone_color,
      stoneColor: p.stone_color,
      style: p.style ?? '',
      material_type: p.material_type ?? '',
      plating: p.plating,
      description: p.description,
      inclusions: p.inclusions ?? [],
      variants: prodVariants,
      is_featured: p.is_featured ?? false,
      meta_title: p.meta_title ?? '',
      meta_description: p.meta_description ?? '',
      slug: p.slug ?? '',
    };
  });

  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const { user, error: authError } = await requireAdmin(request);
  if (authError || !user) {
    return NextResponse.json({ error: authError ?? 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, price, stock, image, images, variants, category, color, stoneColor, plating, style, material_type, description, inclusions } =
    body;

  if (!name || !price) {
    return NextResponse.json({ error: 'name and price are required' }, { status: 400 });
  }

  let finalImageValue = image ?? null;
  if (Array.isArray(images) && images.length > 0) {
    finalImageValue = JSON.stringify(images);
  } else if (image) {
    finalImageValue = image;
  }

  const colorVal = color ?? stoneColor ?? body.stone_color ?? null;

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      name,
      price: Number(price),
      stock: Number(stock ?? 10),
      image: finalImageValue,
      category: category ?? null,
      stone_color: colorVal,
      style: style ?? null,
      material_type: material_type ?? null,
      plating: plating ?? null,
      description: description ?? null,
      inclusions: inclusions ?? [],
      is_featured: body.is_featured ?? false,
      meta_title: body.meta_title ?? null,
      meta_description: body.meta_description ?? null,
      slug: body.slug ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Insert variants if provided
  if (Array.isArray(variants) && variants.length > 0) {
    const variantRows = variants
      .filter((v: any) => v && v.label)
      .map((v: any) => {
        const rawLabel = String(v.label).trim();
        const storedLabel = v.image ? `${rawLabel}:::${String(v.image).trim()}` : rawLabel;
        return {
          product_id: data.id,
          label: storedLabel,
          price_modifier:
            v.price_modifier !== undefined
              ? Number(v.price_modifier)
              : v.price !== undefined
              ? Number(v.price) - Number(price)
              : 0,
          stock: Number(v.stock ?? stock ?? 10),
        };
      });

    if (variantRows.length > 0) {
      await supabaseAdmin.from('product_variants').insert(variantRows);
    }
  }

  return NextResponse.json({ id: String(data.id), ...data }, { status: 201 });
}
