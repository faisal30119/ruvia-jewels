import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth-helper';
import { FALLBACK_PRODUCTS } from '@/lib/data';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // 1. Try numeric DB ID first
  const numId = Number(id);
  if (!isNaN(numId)) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', numId)
      .single();

    if (!error && data) {
      let imagesList: string[] = [];
      let mainImg = data.image || '';
      if (data.image) {
        if (data.image.startsWith('[') && data.image.endsWith(']')) {
          try {
            imagesList = JSON.parse(data.image);
            mainImg = imagesList[0] || '';
          } catch {
            imagesList = [data.image];
          }
        } else if (data.image.includes(',')) {
          imagesList = data.image.split(',').map((s: string) => s.trim()).filter(Boolean);
          mainImg = imagesList[0] || '';
        } else {
          imagesList = [data.image];
        }
      }

      // Fetch variants for this product
      const { data: variantsData } = await supabaseAdmin
        .from('product_variants')
        .select('*')
        .eq('product_id', numId);

      const variants = (variantsData || []).map((v) => {
        let label = v.label;
        let img = '';
        if (label && label.includes(':::')) {
          const parts = label.split(':::');
          label = parts[0];
          img = parts.slice(1).join(':::');
        }
        return {
          id: v.id,
          product_id: v.product_id,
          label,
          image: img,
          price: data.price + (v.price_modifier || 0),
          price_modifier: v.price_modifier ?? 0,
          stock: v.stock ?? data.stock ?? 10,
        };
      });

      return NextResponse.json({
        id: String(data.id),
        name: data.name,
        price: data.price,
        stock: data.stock,
        image: mainImg,
        images: imagesList,
        category: data.category,
        color: data.stone_color,
        stoneColor: data.stone_color,
        stone_color: data.stone_color,
        plating: data.plating,
        description: data.description,
        inclusions: data.inclusions ?? [],
        variants,
      });
    }
  }

  // 2. Check fallback products
  const fallback = FALLBACK_PRODUCTS.find((p) => p.id === id);
  if (fallback) return NextResponse.json(fallback);

  return NextResponse.json({ error: 'Product not found' }, { status: 404 });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user, error: authError } = await requireAdmin(request);
  if (authError || !user) {
    return NextResponse.json({ error: authError ?? 'Unauthorized' }, { status: 401 });
  }

  const numId = Number(params.id);
  if (isNaN(numId)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  const body = await request.json();
  const updatePayload: Record<string, unknown> = {};

  if (body.name !== undefined) updatePayload.name = body.name;
  if (body.price !== undefined) updatePayload.price = Number(body.price);
  if (body.stock !== undefined) updatePayload.stock = Number(body.stock);
  
  if (Array.isArray(body.images) && body.images.length > 0) {
    updatePayload.image = JSON.stringify(body.images);
  } else if (body.image !== undefined) {
    updatePayload.image = body.image;
  }

  if (body.category !== undefined) updatePayload.category = body.category;
  if (body.color !== undefined) updatePayload.stone_color = body.color;
  else if (body.stoneColor !== undefined) updatePayload.stone_color = body.stoneColor;
  else if (body.stone_color !== undefined) updatePayload.stone_color = body.stone_color;

  if (body.plating !== undefined) updatePayload.plating = body.plating;
  if (body.description !== undefined) updatePayload.description = body.description;
  if (body.inclusions !== undefined) updatePayload.inclusions = body.inclusions;
  if (body.is_featured !== undefined) updatePayload.is_featured = body.is_featured;
  if (body.meta_title !== undefined) updatePayload.meta_title = body.meta_title;
  if (body.meta_description !== undefined) updatePayload.meta_description = body.meta_description;
  if (body.slug !== undefined) updatePayload.slug = body.slug;
  updatePayload.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(updatePayload)
    .eq('id', numId)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Update failed' }, { status: 500 });
  }

  // Update variants if passed
  if (Array.isArray(body.variants)) {
    // Delete existing variants for this product
    await supabaseAdmin.from('product_variants').delete().eq('product_id', numId);

    // Insert updated variants
    const validVariants = body.variants.filter((v: any) => v && v.label);
    if (validVariants.length > 0) {
      const basePrice = Number(data.price);
      const rows = validVariants.map((v: any) => {
        const rawLabel = String(v.label).trim();
        const storedLabel = v.image ? `${rawLabel}:::${String(v.image).trim()}` : rawLabel;
        return {
          product_id: numId,
          label: storedLabel,
          price_modifier:
            v.price_modifier !== undefined
              ? Number(v.price_modifier)
              : v.price !== undefined
              ? Number(v.price) - basePrice
              : 0,
          stock: Number(v.stock ?? data.stock ?? 10),
        };
      });
      await supabaseAdmin.from('product_variants').insert(rows);
    }
  }

  let updatedImages: string[] = [];
  let updatedMainImg = data.image || '';
  if (data.image) {
    if (data.image.startsWith('[') && data.image.endsWith(']')) {
      try {
        updatedImages = JSON.parse(data.image);
        updatedMainImg = updatedImages[0] || '';
      } catch {
        updatedImages = [data.image];
      }
    } else if (data.image.includes(',')) {
      updatedImages = data.image.split(',').map((s: string) => s.trim()).filter(Boolean);
      updatedMainImg = updatedImages[0] || '';
    } else {
      updatedImages = [data.image];
    }
  }

  const { data: updatedVariantsData } = await supabaseAdmin
    .from('product_variants')
    .select('*')
    .eq('product_id', numId);

  const updatedVariants = (updatedVariantsData || []).map((v) => {
    let label = v.label;
    let img = '';
    if (label && label.includes(':::')) {
      const parts = label.split(':::');
      label = parts[0];
      img = parts.slice(1).join(':::');
    }
    return {
      id: v.id,
      product_id: v.product_id,
      label,
      image: img,
      price: data.price + (v.price_modifier || 0),
      price_modifier: v.price_modifier ?? 0,
      stock: v.stock ?? data.stock ?? 10,
    };
  });

  return NextResponse.json({
    id: String(data.id),
    name: data.name,
    price: data.price,
    stock: data.stock,
    image: updatedMainImg,
    images: updatedImages,
    category: data.category,
    color: data.stone_color,
    stoneColor: data.stone_color,
    stone_color: data.stone_color,
    plating: data.plating,
    description: data.description,
    inclusions: data.inclusions ?? [],
    variants: updatedVariants,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user, error: authError } = await requireAdmin(request);
  if (authError || !user) {
    return NextResponse.json({ error: authError ?? 'Unauthorized' }, { status: 401 });
  }

  const numId = Number(params.id);
  if (isNaN(numId)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('products').delete().eq('id', numId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
