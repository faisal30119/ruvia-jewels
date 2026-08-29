import crypto from 'crypto';

const cloudName = 'niagn9pn';
const uploadPreset = 'almas_bridal';
const apiKey = '738543779546239';
const apiSecret = 'wVRhdaov4Fg4urDDuN6LnaX7P4A';

// Valid 1x1 PNG
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const pngBuffer = Buffer.from(pngBase64, 'base64');

async function testUnsigned() {
  console.log('Testing Unsigned Cloudinary upload with valid PNG...');
  const formData = new FormData();
  const blob = new Blob([pngBuffer], { type: 'image/png' });
  formData.append('file', blob, 'test.png');
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'almas_bridal/products');

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    console.log('Unsigned status:', res.status);
    const text = await res.text();
    console.log('Unsigned response:', text);
  } catch (err) {
    console.error('Unsigned fetch error:', err);
  }
}

async function testSigned() {
  console.log('\nTesting Signed Cloudinary upload with valid PNG...');
  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'almas_bridal/products';
  const strToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

  const formData = new FormData();
  const blob = new Blob([pngBuffer], { type: 'image/png' });
  formData.append('file', blob, 'test.png');
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', folder);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    console.log('Signed status:', res.status);
    const text = await res.text();
    console.log('Signed response:', text);
  } catch (err) {
    console.error('Signed fetch error:', err);
  }
}

async function run() {
  await testUnsigned();
  await testSigned();
}

run();
