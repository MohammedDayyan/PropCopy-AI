import { supabase } from "./supabaseClient";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// ── Auth Helper ──────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}
export async function signupUser(payload: {
  email: string;
  password: string;
}) {
  const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create account");
  }

  return res.json();
}
// ── API Calls ────────────────────────────────────────────────────────────────

export async function initUser() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/user/init`, {
    method: "POST",
    headers,
  });
  return res.json();
}

export async function fetchCredits() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/user/credits`, { headers });
  if (!res.ok) {
  let errorMessage = "Failed to fetch credits";
  
  try {
    // Read as text first to handle empty error responses safely
    const text = await res.text(); 
    const err = text ? JSON.parse(text) : {};
    errorMessage = err.detail || errorMessage;
  } catch (e) {
    // If parsing fails, fall back to default message
  }

  throw new Error(errorMessage);
}

// If it is successful, read it safely here
  return res.json();
}

export async function processProperty(payload: {
  image_paths: string[];
  raw_bullet_points: string;
  creative_type: "instagram" | "banner" | "email";
  company_name?: string;
  logo_path?: string;
}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/process-property`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
  let errorMessage = "Processing Failed.";
  
  try {
    // Read as text first to handle empty error responses safely
    const text = await res.text(); 
    const err = text ? JSON.parse(text) : {};
    errorMessage = err.detail || errorMessage;
  } catch (e) {
    // If parsing fails, fall back to default message
  }

  throw new Error(errorMessage);
}

// If it is successful, read it safely here
return res.json();
}

export async function fetchProperties() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/properties`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch properties");
  }
  return res.json();
}

export async function fetchProperty(id: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/properties/${id}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Property not found");
  }
  return res.json();
}

export async function updateProperty(
  id: string,
  payload: {
    raw_bullet_points?: string;
    mls_description?: string;
    instagram_script?: string;
    email_blast?: string;
    facebook_ad?: string;
  }
) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/properties/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update property");
  }
  return res.json();
}

export async function createRazorpayOrder() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/create-order`, {
    method: "POST",
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create order");
  }
  return res.json();
}

export async function verifyPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/verify-payment`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Payment verification failed");
  }
  return res.json();
}

// ── Supabase Storage Upload ──────────────────────────────────────────────────

export async function uploadImageToSupabase(
  file: File,
  userId: string
): Promise<string> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${timestamp}_${safeName}`;

  const { error } = await supabase.storage
    .from("property-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);
  return path;
}

export async function uploadBrandAssetToSupabase(
  file: File,
  userId: string
): Promise<string> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${timestamp}_${safeName}`;

  const { error } = await supabase.storage
    .from("brand-assets")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw new Error(`Logo upload failed: ${error.message}`);
  return path;
}