const API_URL = 'http://localhost:3002/api/logistics';

export async function fetchNcmBranches() {
  const res = await fetch(`${API_URL}/ncm/branches`);
  const data = await res.json();
  return data.success ? data.data : [];
}

export async function fetchNcmShippingRate(creation: string, destination: string, type: string = 'Pickup/Collect') {
  const res = await fetch(`${API_URL}/ncm/shipping-rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      creation: creation.trim().toUpperCase(), 
      destination: destination.trim().toUpperCase(), 
      type 
    })
  });
  const data = await res.json();
  // NCM API returns { charge: "220.00" } directly or inside a success wrapper
  if (data.charge) return Number(data.charge);
  if (data.success && data.data) {
    return typeof data.data === 'object' ? Number(data.data.charge || 0) : Number(data.data);
  }
  return 0;
}

export async function fetchPickDropBranches() {
  const res = await fetch(`${API_URL}/pickdrop/branches`);
  const data = await res.json();
  return data.success ? data.data : [];
}

export async function fetchPickDropDeliveryRate(destination_branch: string, city_area: string, weight: number = 1) {
  const res = await fetch(`${API_URL}/pickdrop/delivery-rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destination_branch, city_area, package_weight: weight })
  });
  const data = await res.json();
  return data.success ? data.data : { total: 0 };
}

export async function fetchPathaoCities() {
  const res = await fetch(`${API_URL}/cities`);
  return res.json();
}

export async function fetchPathaoZones(cityId: number) {
  const res = await fetch(`${API_URL}/zones/${cityId}`);
  return res.json();
}

export async function fetchPathaoAreas(zoneId: number) {
  const res = await fetch(`${API_URL}/areas/${zoneId}`);
  return res.json();
}
