async function testApi() {
  const res = await fetch('http://localhost:3000/api/products/14');
  console.log('Status for /api/products/14:', res.status);
  const data = await res.json();
  console.log('Data for 14:', data);

  const listRes = await fetch('http://localhost:3000/api/products');
  const list = await listRes.json();
  const prod14 = list.find(p => p.id == 14 || p.id == '14');
  console.log('List product 14:', prod14);
}

testApi();
