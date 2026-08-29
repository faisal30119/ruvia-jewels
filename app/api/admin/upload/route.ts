import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helper';

export async function POST(request: Request) {
  const { user, error: authError } = await requireAdmin(request);
  if (authError || !user) {
    return NextResponse.json({ error: authError ?? 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Only JPEG, PNG, WebP, GIF, and SVG images are allowed' },
      { status: 400 }
    );
  }

  const MAX_SIZE = 15 * 1024 * 1024; // 15 MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File size must be under 15 MB' }, { status: 400 });
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName) {
    return NextResponse.json(
      { error: 'Cloudinary is not configured (missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)' },
      { status: 500 }
    );
  }

  // 1. Try unsigned upload if preset is provided
  if (uploadPreset) {
    try {
      const cloudinaryForm = new FormData();
      cloudinaryForm.append('file', file);
      cloudinaryForm.append('upload_preset', uploadPreset);
      cloudinaryForm.append('folder', 'almas_bridal/products');

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: cloudinaryForm }
      );

      if (cloudRes.ok) {
        const cloudData = (await cloudRes.json()) as {
          secure_url: string;
          public_id: string;
        };
        return NextResponse.json({
          url: cloudData.secure_url,
          public_id: cloudData.public_id,
        });
      }
      const errText = await cloudRes.text();
      console.warn('Unsigned upload response was not ok:', errText);
    } catch (err) {
      console.warn('Unsigned Cloudinary upload failed, attempting signed upload...', err);
    }
  }

  // 2. Try signed upload if API Key and Secret are configured
  if (apiKey && apiSecret) {
    try {
      const timestamp = Math.round(Date.now() / 1000);
      const folder = 'almas_bridal/products';
      const strToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

      const signedForm = new FormData();
      signedForm.append('file', file);
      signedForm.append('api_key', apiKey);
      signedForm.append('timestamp', String(timestamp));
      signedForm.append('signature', signature);
      signedForm.append('folder', folder);

      const signedRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: signedForm }
      );

      if (signedRes.ok) {
        const signedData = (await signedRes.json()) as {
          secure_url: string;
          public_id: string;
        };
        return NextResponse.json({
          url: signedData.secure_url,
          public_id: signedData.public_id,
        });
      }
      const errText = await signedRes.text();
      console.error('Signed Cloudinary upload error:', errText);
    } catch (err) {
      console.error('Signed Cloudinary upload error:', err);
    }
  }

  return NextResponse.json({ error: 'Cloudinary image upload failed. Please verify credentials.' }, { status: 500 });
}
