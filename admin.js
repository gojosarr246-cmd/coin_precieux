import { addProduct, uploadProductImages, getAllProducts, deleteProduct, updateProduct } from './supabase.js';

// Tab management
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    btn.classList.add('active');

    if (tabName === 'manage-products') {
      loadProducts();
    }
  });
});

// Add product tab
const form = document.getElementById('productForm');
const status = document.getElementById('status');
const imageFileInput = document.getElementById('imageFile');
const previewLabel = document.getElementById('previewLabel');
const previewContainer = document.getElementById('previewContainer');

function setStatus(message, success = true) {
  status.textContent = message;
  status.style.color = success ? '#2a7f32' : '#b02a2a';
}

imageFileInput.addEventListener('change', () => {
  const files = imageFileInput.files;
  if (files.length === 0) {
    previewContainer.innerHTML = '';
    previewLabel.textContent = 'Aucune image sélectionnée.';
    return;
  }

  previewLabel.textContent = files.length + ' image(s) sélectionnée(s).';
  previewContainer.innerHTML = '';

  Array.from(files).forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const div = document.createElement('div');
      div.style.position = 'relative';
      div.style.borderRadius = '8px';
      div.style.overflow = 'hidden';
      div.innerHTML = '<img src="' + reader.result + '" alt="Apercu" style="width:100%; height:100px; object-fit:cover; display:block;">';
      previewContainer.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus('Enregistrement en cours...', true);

  const name = document.getElementById('name').value.trim();
  const category = document.getElementById('category').value;
  const price = Number(document.getElementById('price').value.trim());
  const description = document.getElementById('description').value.trim();

  if (!name || !category || !description || !imageFileInput.files.length) {
    setStatus('Merci de remplir le nom, la categorie, la description et de charger au moins une photo.', false);
    return;
  }

  try {
    const imageFiles = Array.from(imageFileInput.files);
    const imageUrls = await uploadProductImages(imageFiles);

    await addProduct({
      name,
      category,
      price: Number.isNaN(price) ? null : price,
      description,
      image_urls: imageUrls,
    });

    form.reset();
    previewContainer.innerHTML = '';
    previewLabel.textContent = 'Aucune image selectionnee.';
    setStatus('Produit ajoute avec succes !', true);
  } catch (error) {
    console.error(error);
    setStatus('Erreur lors de l\'import des photos ou de l\'enregistrement. Verifie le bucket Supabase et les regles.', false);
  }
});

// Manage products tab
const filterCategory = document.getElementById('filterCategory');
const productsList = document.getElementById('productsList');
const manageStatus = document.getElementById('manageStatus');
const editProductSection = document.getElementById('edit-product-section');
const editProductForm = document.getElementById('editProductForm');
const editProductId = document.getElementById('editProductId');
const editName = document.getElementById('editName');
const editCategory = document.getElementById('editCategory');
const editPrice = document.getElementById('editPrice');
const editDescription = document.getElementById('editDescription');
const editImageFile = document.getElementById('editImageFile');
const editPreviewLabel = document.getElementById('editPreviewLabel');
const editPreviewContainer = document.getElementById('editPreviewContainer');
const editStatus = document.getElementById('editStatus');
const cancelEditBtn = document.getElementById('cancelEditBtn');

function setManageStatus(message, success = true) {
  manageStatus.textContent = message;
  manageStatus.style.color = success ? '#2a7f32' : '#b02a2a';
}

function setEditStatus(message, success = true) {
  editStatus.textContent = message;
  editStatus.style.color = success ? '#2a7f32' : '#b02a2a';
}

function resetEditForm() {
  editProductId.value = '';
  editName.value = '';
  editCategory.value = 'habits';
  editPrice.value = '';
  editDescription.value = '';
  editImageFile.value = '';
  editPreviewContainer.innerHTML = '';
  editPreviewLabel.textContent = 'Choisir de nouvelles images uniquement si tu veux remplacer celles existantes.';
  setEditStatus('', true);
  editProductSection.style.display = 'none';
}

function openEditProduct(productData) {
  editProductSection.style.display = 'block';
  editProductId.value = productData.id;
  editName.value = productData.name;
  editCategory.value = productData.category;
  editPrice.value = productData.price;
  editDescription.value = productData.description;
  editImageFile.value = '';
  editPreviewContainer.innerHTML = '';
  editPreviewLabel.textContent = 'Choisir de nouvelles images uniquement si tu veux remplacer celles existantes.';
  setEditStatus('', true);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function loadProducts() {
  try {
    setManageStatus('Chargement...', true);
    const filter = filterCategory.value;
    const products = await getAllProducts(filter);

    if (products.length === 0) {
      productsList.innerHTML = '<p style="color: var(--texte-muted);">Aucun produit trouve.</p>';
      setManageStatus('', false);
      return;
    }

    productsList.innerHTML = products.map(product => {
      const imageUrls = Array.isArray(product.image_urls) ? product.image_urls : (product.image_urls ? JSON.parse(product.image_urls) : []);
      const firstImage = imageUrls.length > 0 ? imageUrls[0] : '';
      const price = product.price ? product.price + ' FCFA' : 'Prix sur demande';

      return '<div class="product-item" data-id="' + product.id + '" data-name="' + escapeHtml(product.name) + '" data-category="' + escapeHtml(product.category) + '" data-price="' + escapeHtml(product.price || '') + '" data-description="' + escapeHtml(product.description || '') + '" data-images="' + escapeHtml(JSON.stringify(imageUrls)) + '">' +
        '<div class="product-item-header">' +
        '<div style="flex: 1;">' +
        '<div class="product-item-title">' + escapeHtml(product.name) + '</div>' +
        '<div style="font-size: 12px; color: var(--texte-muted);">' + product.category + ' • ' + price + '</div>' +
        '<div style="font-size: 12px; color: var(--texte-muted);">' + escapeHtml(product.description) + '</div>' +
        '</div>' +
        (firstImage ? '<img src="' + escapeHtml(firstImage) + '" alt="" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; flex-shrink: 0;">' : '') +
        '</div>' +
        '<div class="product-item-actions">' +
        '<button class="secondary edit-btn" type="button">Modifier</button>' +
        '<button class="danger" onclick="window.deleteProductItem(\'' + product.id + '\')">Supprimer</button>' +
        '</div>' +
        '</div>';
    }).join('');

    setManageStatus('', false);
  } catch (error) {
    console.error(error);
    setManageStatus('Erreur lors du chargement des produits.', false);
  }
}

filterCategory.addEventListener('change', loadProducts);

productsList.addEventListener('click', (event) => {
  const editBtn = event.target.closest('.edit-btn');
  if (!editBtn) return;

  const productItem = editBtn.closest('.product-item');
  if (!productItem) return;

  openEditProduct({
    id: productItem.dataset.id,
    name: productItem.dataset.name,
    category: productItem.dataset.category,
    price: productItem.dataset.price,
    description: productItem.dataset.description,
    images: productItem.dataset.images,
  });
});

editProductForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const productId = editProductId.value;
  const name = editName.value.trim();
  const category = editCategory.value;
  const priceValue = Number(editPrice.value.trim());
  const description = editDescription.value.trim();

  if (!productId || !name || !category || !description) {
    setEditStatus('Merci de remplir le nom, la categorie et la description.', false);
    return;
  }

  try {
    setEditStatus('Mise a jour en cours...', true);
    const updates = {
      name,
      category,
      description,
      price: Number.isNaN(priceValue) ? null : priceValue,
    };

    if (editImageFile.files.length > 0) {
      const imageFiles = Array.from(editImageFile.files);
      const imageUrls = await uploadProductImages(imageFiles);
      updates.image_urls = imageUrls;
    }

    await updateProduct(productId, updates);
    setEditStatus('Produit mis a jour avec succes !', true);
    resetEditForm();
    loadProducts();
  } catch (error) {
    console.error(error);
    setEditStatus('Erreur lors de la mise a jour. Verifie la connexion Supabase.', false);
  }
});

cancelEditBtn.addEventListener('click', () => {
  resetEditForm();
});

window.deleteProductItem = async function(productId) {
  if (!confirm('Etes-vous sur de vouloir supprimer ce produit ?')) return;

  try {
    setManageStatus('Suppression en cours...', true);
    await deleteProduct(productId);
    setManageStatus('Produit supprime avec succes !', true);
    loadProducts();
  } catch (error) {
    console.error(error);
    setManageStatus('Erreur lors de la suppression du produit.', false);
  }
};
