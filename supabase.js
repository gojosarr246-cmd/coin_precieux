import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://qgeeklkbsycvssvwrkbg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZWVrbGtic3ljdnNzdndya2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3Mzk1OTMsImV4cCI6MjA5NjMxNTU5M30.pDfGsmZvi1HROgwmr4KiZ_5OCVgDcCRz9yNUda177Y0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function fetchProducts(category) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, category, price, description, image_urls')
    .eq('category', category)
    .eq('available', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function uploadProductImages(files) {
  const uploadedUrls = [];

  for (const file of files) {
    // Nettoie le nom de fichier : retire espaces et caractères spéciaux
    const sanitizedName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${sanitizedName}`;
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) {
      throw error;
    }

    uploadedUrls.push(`${SUPABASE_URL}/storage/v1/object/public/product-images/${data.path}`);
  }

  return uploadedUrls;
}

export async function uploadProductImage(file) {
  // Nettoie le nom de fichier : retire espaces et caractères spéciaux
  const sanitizedName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  const fileName = `${Date.now()}-${sanitizedName}`;
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) {
    throw error;
  }

  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${data.path}`;
}

export async function addProduct(product) {
  const { data, error } = await supabase
    .from('products')
    .insert([{ ...product, available: true }]);

  if (error) {
    throw error;
  }

  return data;
}

export async function getAllProducts(category = '') {
  let query = supabase
    .from('products')
    .select('id, name, category, price, description, image_urls');

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function deleteProduct(productId) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) {
    throw error;
  }
}

export async function updateProduct(productId, updates) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId);

  if (error) {
    throw error;
  }

  return data;
}
