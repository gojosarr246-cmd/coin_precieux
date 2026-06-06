import { fetchProducts } from './supabase.js';

const category = document.body.dataset.supabaseCategory || '';
const productGrid = document.getElementById('productGrid');
const modal = document.getElementById('productModal');
const modalImage = document.getElementById('modalImage');
const modalText = document.getElementById('modalText');
const whatsappBtn = document.getElementById('whatsappBtn');
let currentProduct = '';
let currentImageIndex = 0;
let currentImages = [];

const injectedStyle = document.createElement('style');
injectedStyle.textContent = `
  #productGrid {
    display: grid;
    gap: 24px;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    padding: 0;
  }
  .product-card {
    background: #fff;
    border: 1px solid rgba(232,160,176,0.24);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 16px 36px rgba(184,80,112,0.08);
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    display: flex;
    flex-direction: column;
  }
  .product-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 24px 48px rgba(184,80,112,0.12);
  }
  .product-card .product-image {
    position: relative;
    width: 100%;
    min-height: 240px;
    background: var(--rose-pale, #FDF0F3);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .product-card .product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.35s ease;
    display: block;
  }
  .product-card:hover .product-image img {
    transform: scale(1.05);
  }
  .product-card .prod-wish {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: rgba(255,255,255,0.95);
    color: #d62f5e;
    font-size: 18px;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(0,0,0,0.08);
    transition: transform 0.2s ease;
  }
  .product-card .prod-wish:hover {
    transform: scale(1.05);
  }
  .product-card .image-count {
    position: absolute;
    bottom: 12px;
    right: 12px;
    background: rgba(0,0,0,0.6);
    color: #fff;
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
  }
  .product-card .placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 54px;
    color: rgba(184,80,112,0.4);
  }
  .product-card .product-content {
    padding: 18px 20px 22px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 220px;
  }
  .product-card h3 {
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    color: var(--rose-fonce, #B85070);
    line-height: 1.2;
    margin: 0;
  }
  .product-card p {
    color: var(--texte-muted, #8A6070);
    font-size: 13px;
    line-height: 1.65;
    margin: 0;
    min-height: 56px;
  }
  .product-card .product-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    font-size: 12px;
    color: var(--texte-muted, #8A6070);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .product-card .product-badge {
    background: var(--rose-pale, #FDF0F3);
    color: var(--rose-fonce, #B85070);
    padding: 5px 10px;
    border-radius: 999px;
    border: 1px solid rgba(184,80,112,0.1);
    font-weight: 700;
  }
  .product-card .product-gallery {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-top: 8px;
  }
  .product-card .product-thumb {
    flex: 0 0 auto;
    width: 52px;
    height: 52px;
    object-fit: cover;
    border-radius: 12px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: border-color 0.2s ease;
  }
  .product-card .product-thumb:hover {
    border-color: var(--rose-fonce, #B85070);
  }
  .product-card .product-action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
  }
  .product-card .price {
    font-size: 18px;
    font-weight: 700;
    color: var(--rose-fonce, #B85070);
  }
  .product-card .order-btn {
    width: 100%;
    max-width: 180px;
    border: none;
    border-radius: 999px;
    background: var(--rose-fonce, #B85070);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    padding: 12px 16px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .product-card .order-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(184,80,112,0.2);
  }
  .product-card .stars {
    color: var(--or, #C9A96E);
    font-size: 12px;
    letter-spacing: 0.08em;
  }
  .empty {
    text-align: center;
    color: var(--texte-muted, #8A6070);
  }
  @media (max-width: 720px) {
    #productGrid {
      grid-template-columns: 1fr;
    }
  }
`;
document.head.appendChild(injectedStyle);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getCategoryEmoji(categoryName) {
  switch (categoryName) {
    case 'habits':
      return '👗';
    case 'sacs':
      return '👜';
    case 'chaussures':
      return '👠';
    default:
      return '🛍️';
  }
}

function renderProducts(products) {
  if (!products.length) {
    productGrid.innerHTML = `<p class="empty">Aucun produit trouvé pour cette collection.</p>`;
    return;
  }

  productGrid.innerHTML = products
    .map((product) => {
      const imageUrls = Array.isArray(product.image_urls) ? product.image_urls : (product.image_urls ? JSON.parse(product.image_urls) : []);
      const safeName = escapeHtml(product.name);
      const safeDescription = escapeHtml(product.description || '');
      const price = product.price ? `${product.price} FCFA` : 'Prix sur demande';
      const categoryLabel = category ? `${category.charAt(0).toUpperCase() + category.slice(1)}` : 'Produit';

      const thumbnails = imageUrls.length > 0
        ? imageUrls.map((url, idx) => `<img src="${escapeHtml(url)}" alt="${safeName} ${idx + 1}" class="product-thumb" data-idx="${idx}">`).join('')
        : `<div class="placeholder">${getCategoryEmoji(category)}</div>`;

      return `
        <article class="product product-card" data-images="${escapeHtml(JSON.stringify(imageUrls))}">
          <div class="product-image">
            <button type="button" class="prod-wish" aria-label="Ajouter aux favoris">♥</button>
            ${imageUrls.length > 0
              ? `<img src="${escapeHtml(imageUrls[0])}" alt="${safeName}" class="product-main-img">`
              : `<div class="placeholder">${getCategoryEmoji(category)}</div>`}
            ${imageUrls.length > 1 ? `<span class="image-count">${imageUrls.length} vues</span>` : ''}
          </div>
          <div class="product-content">
            <div class="product-meta">
              <span>${getCategoryEmoji(category)} ${categoryLabel}</span>
              <span class="product-badge">En stock</span>
            </div>
            <h3>${safeName}</h3>
            <p>${safeDescription}</p>
            <div class="product-action">
              <div>
                <div class="price">${price}</div>
                <div class="stars">★★★★★</div>
              </div>
              <button class="order-btn" type="button" data-name="${safeName}">Commander</button>
            </div>
            <div class="product-gallery">
              ${thumbnails}
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

function ouvrirModal(name, images) {
  currentProduct = name;
  currentImageIndex = 0;
  
  let imageUrls = [];
  try {
    imageUrls = images ? JSON.parse(images) : [];
  } catch (e) {
    imageUrls = [];
  }
  
  currentImages = imageUrls;

  if (imageUrls.length === 0) {
    modalImage.style.display = 'none';
    modalText.innerHTML = `<div style="text-align:center;"><h3>${name}</h3><p>Images du produit disponibles sur demande.</p></div>`;
  } else {
    displayModalImage();
  }

  modal.style.display = 'block';
}

function displayModalImage() {
  if (currentImages.length === 0) return;
  
  const url = currentImages[currentImageIndex];
  modalImage.src = escapeHtml(url);
  modalImage.style.display = 'block';
  modalImage.style.maxWidth = '100%';
  modalImage.style.maxHeight = '350px';
  modalImage.style.objectFit = 'cover';
  modalImage.style.borderRadius = '12px';
  
  // Navigation et miniatures
  const navHTML = currentImages.length > 1 ? `
    <div style="margin-top:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <button id="prevBtn" style="background:#B85070; color:#fff; border:none; padding:8px 16px; border-radius:999px; cursor:pointer; font-weight:600;">◀ Précédent</button>
        <span style="font-weight:600; font-size:14px;">${currentImageIndex + 1} / ${currentImages.length}</span>
        <button id="nextBtn" style="background:#B85070; color:#fff; border:none; padding:8px 16px; border-radius:999px; cursor:pointer; font-weight:600;">Suivant ▶</button>
      </div>
      <div style="display:flex; gap:4px; overflow-x:auto; padding:4px 0; justify-content:center;">
        ${currentImages.map((url, idx) => `<img src="${escapeHtml(url)}" alt="" style="width:50px; height:50px; object-fit:cover; border-radius:6px; cursor:pointer; border:3px solid ${idx === currentImageIndex ? '#B85070' : 'transparent'};\" class="modal-thumb" data-idx="${idx}">`)
          .join('')}
      </div>
    </div>
  ` : '';
  
  modalText.innerHTML = `<div style="text-align:center;"><h3>${currentProduct}</h3>${navHTML}</div>`;
  
  // Gestionnaires pour navigation
  if (currentImages.length > 1) {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const thumbs = document.querySelectorAll('.modal-thumb');
    
    prevBtn.onclick = () => {
      currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
      displayModalImage();
    };
    
    nextBtn.onclick = () => {
      currentImageIndex = (currentImageIndex + 1) % currentImages.length;
      displayModalImage();
    };
    
    thumbs.forEach((thumb, idx) => {
      thumb.onclick = () => {
        currentImageIndex = idx;
        displayModalImage();
      };
    });
  }
}

function envoyerWhatsApp() {
  const message = encodeURIComponent(
    `Bonjour Aminah, je suis intéressé(e) par ${currentProduct} sur Coin Précieux.`
  );
  window.open(`https://wa.me/774810937?text=${message}`, '_blank');
  modal.style.display = 'none';
}

productGrid.addEventListener('click', (event) => {
  // Clic sur l'image principale
  const mainImg = event.target.closest('.product-main-img');
  if (mainImg) {
    const product = mainImg.closest('.product');
    const images = product.dataset.images;
    const productName = product.querySelector('h3').textContent;
    ouvrirModal(productName, images);
    return;
  }

  // Clic sur le bouton "Commander"
  const btn = event.target.closest('.order-btn');
  if (btn) {
    const product = btn.closest('.product');
    const images = product.dataset.images;
    ouvrirModal(btn.dataset.name, images);
    return;
  }
  
  // Clic sur une miniature produit
  const thumb = event.target.closest('.product-thumb');
  if (thumb) {
    const product = thumb.closest('.product');
    const images = product.dataset.images;
    ouvrirModal(product.querySelector('h3').textContent, images);
    return;
  }
});

whatsappBtn.addEventListener('click', envoyerWhatsApp);

document.querySelector('.close').addEventListener('click', () => {
  modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});

async function loadProducts() {
  try {
    const products = await fetchProducts(category);
    renderProducts(products);
  } catch (error) {
    productGrid.innerHTML = `<p class="empty">Impossible de charger les produits. Vérifiez votre configuration Supabase.</p>`;
    console.error(error);
  }
}

loadProducts();
