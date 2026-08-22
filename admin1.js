(function(){
  'use strict';

  /* ============================================================
     SUPABASE
     Get these two values from Supabase → Project Settings → API.
     The anon key is safe to expose here — it only grants what the
     Row Level Security policies in supabase_schema.sql allow.
     Never put the service_role key in this file.
     ============================================================ */
  var SUPABASE_URL = 'https://dwtlsztnklxhgaghxfzc.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3dGxzenRua2x4aGdhZ2h4ZnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4ODQ0NzIsImV4cCI6MjEwMjQ2MDQ3Mn0.wd7jiE84t3hwdOeIiieG3QzOfzTTuruqc-rwKYaBbDI';
  if(SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY'){
    document.body.innerHTML =
      '<div style="max-width:420px;margin:80px auto;padding:32px;text-align:center;font-family:inherit;color:#3a2a1e">' +
      '<div style="font-size:40px;margin-bottom:12px">🔌</div>' +
      '<h2 style="margin:0 0 12px">Supabase isn\'t connected yet</h2>' +
      '<p style="margin:0;line-height:1.6">Open this file and replace <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> near the top of the script with your real project values — see README.md for exactly where to find them.</p>' +
      '</div>';
    throw new Error('Supabase is not configured yet — replace SUPABASE_URL / SUPABASE_ANON_KEY near the top of the script.');
  }
  var supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  /* ============================================================
     DATA LAYER — Supabase
     map*() helpers translate the database's snake_case columns
     into the exact shape the rendering code below already expects.
     ============================================================ */
  var CATEGORIES = [];
  var PRODUCTS = [];
  function findProduct(id){ for(var i=0;i<PRODUCTS.length;i++){ if(PRODUCTS[i].id===id) return PRODUCTS[i]; } return null; }
  function findCategory(id){ for(var i=0;i<CATEGORIES.length;i++){ if(CATEGORIES[i].id===id) return CATEGORIES[i]; } return null; }

  function mapProduct(row){
    return {
      id: row.id, name: row.name, category: row.category_id, desc: row.description,
      price: row.price, priceLabel: row.price_label, image: row.image_url,
      emoji: row.emoji, badge: row.badge, badgeStyle: row.badge_style,
      type: row.item_type, isFeatured: row.is_featured
    };
  }
  function mapPost(row){
    return {
      id: row.id, title: row.title, message: row.message, badge: row.badge,
      emoji: row.emoji, ctaText: row.cta_text, ctaTarget: row.cta_target,
      active: row.is_active, createdAt: row.created_at
    };
  }
  function mapOrder(row){
    return {
      id: row.id, status: row.status, createdAt: row.created_at,
      subtotalLabel: formatPrice(row.subtotal),
      items: (row.order_items || []).map(function(it){ return {name: it.product_name, qty: it.quantity, lineLabel: it.line_label}; })
    };
  }
  function mapBooking(row){
    return {
      id: row.id, name: row.name, phone: row.phone, orderType: row.order_type,
      date: row.needed_on, status: row.status, createdAt: row.created_at
    };
  }
  function mapTrainee(row){
    return { id: row.id, name: row.name, phone: row.phone, reason: row.reason, status: row.status, createdAt: row.created_at };
  }

  async function loadCategories(){
    var res = await supabaseClient.from('categories').select('*').order('sort_order');
    if(res.error){ showToast(res.error.message); CATEGORIES = []; return; }
    CATEGORIES = res.data.map(function(row){ return {id: row.id, name: row.name, emoji: row.emoji}; });
  }
  async function loadProducts(){
    var res = await supabaseClient.from('products').select('*').order('created_at', {ascending:false});
    if(res.error){ showToast(res.error.message); PRODUCTS = []; return; }
    PRODUCTS = res.data.map(mapProduct);
  }

  var posts = [];
  var orders = [];
  var bookings = [];
  var trainees = [];
  async function loadPosts(){
    var res = await supabaseClient.from('posts').select('*').order('created_at', {ascending:false});
    if(res.error){ showToast(res.error.message); posts = []; return; }
    posts = res.data.map(mapPost);
  }
  async function loadOrders(){
    var res = await supabaseClient.from('orders').select('*, order_items(*)').order('created_at', {ascending:false});
    if(res.error){ showToast(res.error.message); orders = []; return; }
    orders = res.data.map(mapOrder);
  }
  async function loadBookings(){
    var res = await supabaseClient.from('bookings').select('*').order('created_at', {ascending:false});
    if(res.error){ showToast(res.error.message); bookings = []; return; }
    bookings = res.data.map(mapBooking);
  }
  async function loadTrainees(){
    var res = await supabaseClient.from('trainees').select('*').order('created_at', {ascending:false});
    if(res.error){ showToast(res.error.message); trainees = []; return; }
    trainees = res.data.map(mapTrainee);
  }

  var faqs = [];
  var services = [];
  var siteSettings = {};
  function mapFaq(row){ return {id: row.id, question: row.question, answer: row.answer}; }
  function mapService(row){ return {id: row.id, icon: row.icon, title: row.title, description: row.description}; }
  async function loadFaqs(){
    var res = await supabaseClient.from('faqs').select('*').order('sort_order');
    if(res.error){ showToast(res.error.message); faqs = []; return; }
    faqs = res.data.map(mapFaq);
  }
  async function loadServices(){
    var res = await supabaseClient.from('services').select('*').order('sort_order');
    if(res.error){ showToast(res.error.message); services = []; return; }
    services = res.data.map(mapService);
  }
  async function loadSiteSettings(){
    var res = await supabaseClient.from('site_settings').select('*');
    if(res.error){ showToast(res.error.message); return; }
    siteSettings = {};
    res.data.forEach(function(row){ siteSettings[row.key] = row.value; });
  }

  function formatPrice(n){ return n.toLocaleString('en-US') + ' FCFA'; }
  function icon(name, extraClass){ return '<svg class="icon' + (extraClass ? ' ' + extraClass : '') + '"><use href="#icon-' + name + '"/></svg>'; }
  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function relativeTime(ts){
    var mins = Math.floor((Date.now() - ts) / 60000);
    if(mins < 1) return 'Just now';
    if(mins < 60) return mins + 'm ago';
    var hrs = Math.floor(mins / 60);
    if(hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  }
  var toastTimer = null;
  function showToast(msg){
    var toast = document.getElementById('toast');
    var text = document.getElementById('toast-text');
    if(!toast || !text) return;
    text.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toast.classList.remove('is-visible'); }, 2600);
  }

  /* ============================================================
     AUTH
     ============================================================ */
  var currentSession = null; // kept in sync by supabaseClient.auth.onAuthStateChange, set up in init()
  function isAdminLoggedIn(){ return !!currentSession; }
  function setupAdminAuth(){
    var form = document.getElementById('admin-login-form');
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      var emailInput = document.getElementById('admin-email');
      var passwordInput = document.getElementById('admin-password');
      var email = emailInput.value.trim();
      var password = passwordInput.value;
      var errorEl = document.getElementById('admin-login-error');
      var submitBtn = form.querySelector('button[type="submit"]');

      function fail(){
        errorEl.classList.add('is-visible');
        emailInput.classList.add('has-error');
        passwordInput.classList.add('has-error');
      }
      function succeed(){
        errorEl.classList.remove('is-visible');
        emailInput.classList.remove('has-error');
        passwordInput.classList.remove('has-error');
        showToast('Welcome back!');
        // onAuthStateChange (set up in init) fires renderApp() automatically
      }
      submitBtn.disabled = true;
      var res = await supabaseClient.auth.signInWithPassword({email: email, password: password});
      submitBtn.disabled = false;
      if(res.error){ fail(); return; }
      succeed();
    });
    document.getElementById('admin-logout-btn').addEventListener('click', function(){
      supabaseClient.auth.signOut();
      // onAuthStateChange fires renderApp() automatically
    });
  }
  async function renderApp(){
    var loginView = document.getElementById('admin-login-view');
    var dashView = document.getElementById('admin-dashboard-view');
    var logoutBtn = document.getElementById('admin-logout-btn');
    if(isAdminLoggedIn()){
      loginView.hidden = true;
      dashView.hidden = false;
      logoutBtn.hidden = false;
      await Promise.all([loadCategories(), loadProducts(), loadOrders(), loadBookings(), loadTrainees(), loadPosts(), loadFaqs(), loadServices(), loadSiteSettings()]);
      renderAllPanels();
    } else {
      loginView.hidden = false;
      dashView.hidden = true;
      logoutBtn.hidden = true;
    }
  }

  /* ============================================================
     RENDER: PANELS
     ============================================================ */
  function renderOverview(){
    var el = document.getElementById('admin-stat-grid');
    var stats = [
      {label:'Pending Orders', value:orders.filter(function(o){ return o.status==='pending'; }).length, ic:'cart', tab:'orders'},
      {label:'Pending Bookings', value:bookings.filter(function(b){ return b.status==='pending'; }).length, ic:'calendar', tab:'bookings'},
      {label:'Trainee Applications', value:trainees.filter(function(t){ return t.status==='pending'; }).length, ic:'graduation', tab:'trainees'},
      {label:'Products Listed', value:PRODUCTS.length, ic:'grid', tab:'products'},
      {label:'Active Posts', value:posts.filter(function(p){ return p.active !== false; }).length, ic:'bell', tab:'posts'},
      {label:'FAQs', value:faqs.length, ic:'check', tab:'faqs'},
      {label:'Services', value:services.length, ic:'truck', tab:'services'}
    ];
    el.innerHTML = stats.map(function(s){
      return '<button type="button" class="admin-stat-card js-admin-stat-link" data-tab="' + s.tab + '"><div class="admin-stat-icon">' + icon(s.ic) + '</div><div><span class="admin-stat-value">' + s.value + '</span><span class="admin-stat-label">' + s.label + '</span></div></button>';
    }).join('');
  }
  function renderProducts(){
    var el = document.getElementById('admin-product-list');
    if(PRODUCTS.length === 0){ el.innerHTML = '<p class="admin-empty">No products yet.</p>'; return; }
    el.innerHTML = PRODUCTS.map(function(p){
      var cat = findCategory(p.category);
      var visual = p.image ? '<img src="' + p.image.replace(/"/g,'&quot;') + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">' : p.emoji;
      return (
        '<div class="admin-row">' +
          '<div class="admin-row-emoji">' + visual + '</div>' +
          '<div class="admin-row-body"><h4>' + escapeHtml(p.name) + '</h4><p>' + escapeHtml(p.priceLabel) + ' · ' + escapeHtml(cat ? cat.name : p.category) + '</p></div>' +
          '<div class="admin-row-actions">' +
            '<button type="button" class="admin-icon-action js-admin-edit-product" data-id="' + p.id + '" aria-label="Edit ' + escapeHtml(p.name) + '">' + icon('edit','icon--sm') + '</button>' +
            '<button type="button" class="admin-icon-action admin-icon-action--danger js-admin-delete-product" data-id="' + p.id + '" aria-label="Delete ' + escapeHtml(p.name) + '">' + icon('trash','icon--sm') + '</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }
  function renderOrders(){
    var el = document.getElementById('admin-order-list');
    if(orders.length === 0){ el.innerHTML = '<p class="admin-empty">No orders yet.</p>'; return; }
    el.innerHTML = orders.map(function(o){
      var itemsText = o.items.map(function(i){ return i.name + ' x' + i.qty; }).join(', ');
      return (
        '<div class="admin-row admin-row--stack">' +
          '<div class="admin-row-body"><h4>' + escapeHtml(o.subtotalLabel) + '<span class="admin-status admin-status--' + o.status + '">' + o.status + '</span></h4>' +
          '<p>' + escapeHtml(itemsText) + '</p><span class="admin-row-time">' + relativeTime(o.createdAt) + '</span></div>' +
          (o.status === 'pending' ? '<button type="button" class="btn btn--folere btn--sm js-admin-confirm-order" data-id="' + o.id + '">Confirm</button>' : '') +
        '</div>'
      );
    }).join('');
  }
  function renderBookings(){
    var el = document.getElementById('admin-booking-list');
    if(bookings.length === 0){ el.innerHTML = '<p class="admin-empty">No bookings yet.</p>'; return; }
    el.innerHTML = bookings.map(function(b){
      return (
        '<div class="admin-row admin-row--stack">' +
          '<div class="admin-row-body"><h4>' + escapeHtml(b.name) + '<span class="admin-status admin-status--' + b.status + '">' + b.status + '</span></h4>' +
          '<p>' + escapeHtml(b.orderType) + (b.date ? ' · ' + escapeHtml(b.date) : '') + ' · ' + escapeHtml(b.phone) + '</p>' +
          '<span class="admin-row-time">' + relativeTime(b.createdAt) + '</span></div>' +
          (b.status === 'pending' ? '<button type="button" class="btn btn--folere btn--sm js-admin-confirm-booking" data-id="' + b.id + '">Confirm</button>' : '') +
        '</div>'
      );
    }).join('');
  }
  function renderTrainees(){
    var el = document.getElementById('admin-trainee-list');
    if(trainees.length === 0){ el.innerHTML = '<p class="admin-empty">No trainee applications yet.</p>'; return; }
    el.innerHTML = trainees.map(function(t){
      return (
        '<div class="admin-row admin-row--stack">' +
          '<div class="admin-row-body"><h4>' + escapeHtml(t.name) + '<span class="admin-status admin-status--' + t.status + '">' + t.status + '</span></h4>' +
          '<p>' + escapeHtml(t.reason) + '</p><span class="admin-row-time">' + escapeHtml(t.phone) + ' · ' + relativeTime(t.createdAt) + '</span></div>' +
          (t.status === 'pending' ? '<button type="button" class="btn btn--folere btn--sm js-admin-approve-trainee" data-id="' + t.id + '">Approve</button>' : '') +
        '</div>'
      );
    }).join('');
  }
  function renderPosts(){
    var el = document.getElementById('admin-post-list');
    if(posts.length === 0){ el.innerHTML = '<p class="admin-empty">No posts yet — add one to feature it on the home page banner.</p>'; return; }
    el.innerHTML = posts.map(function(p){
      return (
        '<div class="admin-row">' +
          '<div class="admin-row-emoji">' + (p.emoji || '🎉') + '</div>' +
          '<div class="admin-row-body"><h4>' + escapeHtml(p.title) + '</h4><p>' + escapeHtml(p.message) + '</p></div>' +
          '<div class="admin-row-actions"><button type="button" class="admin-icon-action admin-icon-action--danger js-admin-delete-post" data-id="' + p.id + '" aria-label="Delete ' + escapeHtml(p.title) + '">' + icon('trash','icon--sm') + '</button></div>' +
        '</div>'
      );
    }).join('');
  }
  function renderFaqs(){
    var el = document.getElementById('admin-faq-list');
    if(faqs.length === 0){ el.innerHTML = '<p class="admin-empty">No FAQs yet — add one to show it on the FAQ page.</p>'; return; }
    el.innerHTML = faqs.map(function(f){
      return (
        '<div class="admin-row">' +
          '<div class="admin-row-body"><h4>' + escapeHtml(f.question) + '</h4><p>' + escapeHtml(f.answer) + '</p></div>' +
          '<div class="admin-row-actions">' +
            '<button type="button" class="admin-icon-action js-admin-edit-faq" data-id="' + f.id + '" aria-label="Edit ' + escapeHtml(f.question) + '">' + icon('edit','icon--sm') + '</button>' +
            '<button type="button" class="admin-icon-action admin-icon-action--danger js-admin-delete-faq" data-id="' + f.id + '" aria-label="Delete ' + escapeHtml(f.question) + '">' + icon('trash','icon--sm') + '</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }
  function renderServices(){
    var el = document.getElementById('admin-service-list');
    if(services.length === 0){ el.innerHTML = '<p class="admin-empty">No services yet — add one to show it on the Services page.</p>'; return; }
    el.innerHTML = services.map(function(s){
      return (
        '<div class="admin-row">' +
          '<div class="admin-row-emoji">' + icon(s.icon) + '</div>' +
          '<div class="admin-row-body"><h4>' + escapeHtml(s.title) + '</h4><p>' + escapeHtml(s.description) + '</p></div>' +
          '<div class="admin-row-actions">' +
            '<button type="button" class="admin-icon-action js-admin-edit-service" data-id="' + s.id + '" aria-label="Edit ' + escapeHtml(s.title) + '">' + icon('edit','icon--sm') + '</button>' +
            '<button type="button" class="admin-icon-action admin-icon-action--danger js-admin-delete-service" data-id="' + s.id + '" aria-label="Delete ' + escapeHtml(s.title) + '">' + icon('trash','icon--sm') + '</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }
  function renderSettingsForm(){
    var fields = {
      'set-whatsapp': 'whatsapp_number', 'set-email': 'email', 'set-address': 'contact_address',
      'set-hours': 'contact_hours', 'set-about-1': 'about_paragraph_1', 'set-about-2': 'about_paragraph_2',
      'set-instagram': 'social_instagram', 'set-facebook': 'social_facebook', 'set-tiktok': 'social_tiktok',
      'set-youtube': 'social_youtube', 'set-x': 'social_x', 'set-linkedin': 'social_linkedin'
    };
    Object.keys(fields).forEach(function(elId){
      var el = document.getElementById(elId);
      if(el && document.activeElement !== el){ el.value = siteSettings[fields[elId]] || ''; }
    });
  }
  function renderAllPanels(){
    renderOverview(); renderProducts(); renderOrders(); renderBookings(); renderTrainees(); renderPosts();
    renderFaqs(); renderServices(); renderSettingsForm();
  }
  function switchToTab(tabName){
    document.querySelectorAll('.js-admin-tab').forEach(function(t){ t.classList.toggle('is-active', t.dataset.tab === tabName); });
    document.querySelectorAll('.admin-panel').forEach(function(p){ p.classList.remove('is-active'); });
    var panel = document.getElementById('admin-panel-' + tabName);
    if(panel) panel.classList.add('is-active');
  }
  function setupTabs(){
    document.querySelectorAll('.js-admin-tab').forEach(function(tab){
      tab.addEventListener('click', function(){ switchToTab(tab.dataset.tab); });
    });
  }

  /* ============================================================
     PRODUCT MODAL
     ============================================================ */
  function updateImagePreview(value, emojiFallback){
    var preview = document.getElementById('p-image-preview');
    var removeBtn = document.getElementById('p-image-remove');
    if(value){
      preview.innerHTML = '<img src="' + value.replace(/"/g,'&quot;') + '" alt="">';
      removeBtn.hidden = false;
    } else {
      preview.innerHTML = '<span id="p-image-preview-emoji">' + (emojiFallback || '🍽️') + '</span>';
      removeBtn.hidden = true;
    }
  }
  function compressImageToBlob(file, callback){
    var reader = new FileReader();
    reader.onload = function(evt){
      var img = new Image();
      img.onload = function(){
        var maxDim = 640;
        var w = img.width, h = img.height;
        if(w > h && w > maxDim){ h = Math.round(h * maxDim / w); w = maxDim; }
        else if(h >= w && h > maxDim){ w = Math.round(w * maxDim / h); h = maxDim; }
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(function(blob){ callback(blob); }, 'image/jpeg', 0.72);
      };
      img.onerror = function(){ showToast("Couldn't read that image — try a different file."); };
      img.src = evt.target.result;
    };
    reader.onerror = function(){ showToast("Couldn't read that file."); };
    reader.readAsDataURL(file);
  }
  // Extracts the storage path from one of our own public URLs, so we know
  // it's safe to delete — never touches a pasted external URL.
  function extractStoragePath(url){
    var marker = '/storage/v1/object/public/product-images/';
    var idx = url ? url.indexOf(marker) : -1;
    return idx === -1 ? null : url.slice(idx + marker.length);
  }
  async function deleteProductImageIfOwned(url){
    var path = extractStoragePath(url);
    if(!path) return;
    try{ await supabaseClient.storage.from('product-images').remove([path]); }
    catch(err){ /* best-effort cleanup — a leftover file isn't worth failing the save/delete over */ }
  }
  var isUploadingImage = false;
  function setupImageUploadControls(){
    document.getElementById('p-image-file').addEventListener('change', function(e){
      var file = e.target.files[0];
      if(!file) return;
      if(file.type.indexOf('image/') !== 0){ showToast('Please choose an image file'); return; }
      if(file.size > 10 * 1024 * 1024){ showToast('That image is too large — try one under 10MB'); return; }
      var tempPreviewUrl = URL.createObjectURL(file);
      updateImagePreview(tempPreviewUrl);
      isUploadingImage = true;
      compressImageToBlob(file, async function(blob){
        try{
          var path = 'products/' + Date.now().toString(36) + Math.random().toString(36).slice(2,8) + '.jpg';
          var uploadRes = await supabaseClient.storage.from('product-images').upload(path, blob, {contentType: 'image/jpeg'});
          if(uploadRes.error) throw uploadRes.error;
          var publicUrl = supabaseClient.storage.from('product-images').getPublicUrl(path).data.publicUrl;
          document.getElementById('p-image').value = publicUrl;
          document.getElementById('p-image-url').value = '';
          updateImagePreview(publicUrl);
        } catch(err){
          showToast("Couldn't upload that image — " + err.message);
          updateImagePreview(document.getElementById('p-image').value || '');
        } finally {
          URL.revokeObjectURL(tempPreviewUrl);
          isUploadingImage = false;
        }
      });
    });
    document.getElementById('p-image-url').addEventListener('input', function(e){
      var url = e.target.value.trim();
      document.getElementById('p-image').value = url;
      if(url){ document.getElementById('p-image-file').value = ''; }
      updateImagePreview(url, document.getElementById('p-emoji').value.trim());
    });
    document.getElementById('p-image-remove').addEventListener('click', function(){
      document.getElementById('p-image').value = '';
      document.getElementById('p-image-url').value = '';
      document.getElementById('p-image-file').value = '';
      updateImagePreview('', document.getElementById('p-emoji').value.trim());
    });
    document.getElementById('p-emoji').addEventListener('input', function(){
      if(!document.getElementById('p-image').value){ updateImagePreview('', this.value.trim()); }
    });
  }
  var editingOriginalImage = null; // the image URL in place when the modal opened, so we can clean it up if replaced
  function openProductModal(productId){
    var backdrop = document.getElementById('product-modal-backdrop');
    var modal = document.getElementById('product-modal');
    var form = document.getElementById('product-form');
    var catSel = document.getElementById('p-category');
    catSel.innerHTML = CATEGORIES.map(function(c){ return '<option value="' + c.id + '">' + c.name + '</option>'; }).join('');
    form.reset();
    document.getElementById('p-image').value = '';
    ['p-name','p-desc'].forEach(function(id){
      var input = document.getElementById(id);
      input.classList.remove('has-error');
      input.nextElementSibling.classList.remove('is-visible');
    });
    if(productId){
      var p = findProduct(productId);
      document.getElementById('product-modal-title').textContent = 'Edit Product';
      document.getElementById('p-id').value = p.id;
      document.getElementById('p-name').value = p.name;
      catSel.value = p.category;
      document.getElementById('p-emoji').value = p.emoji;
      document.getElementById('p-price').value = p.price != null ? p.price : '';
      document.getElementById('p-price-label').value = p.priceLabel;
      document.getElementById('p-desc').value = p.desc;
      document.getElementById('p-badge').value = p.badge || '';
      document.getElementById('p-featured').checked = !!p.isFeatured;
      document.getElementById('p-image').value = p.image || '';
      if(p.image && /^https?:\/\//i.test(p.image)){ document.getElementById('p-image-url').value = p.image; }
      updateImagePreview(p.image || '', p.emoji);
      editingOriginalImage = p.image || null;
    } else {
      document.getElementById('product-modal-title').textContent = 'Add Product';
      document.getElementById('p-id').value = '';
      document.getElementById('p-featured').checked = false;
      updateImagePreview('', '🍽️');
      editingOriginalImage = null;
    }
    backdrop.classList.add('is-open'); modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false'); document.body.style.overflow = 'hidden';
  }
  function closeProductModal(){
    document.getElementById('product-modal-backdrop').classList.remove('is-open');
    document.getElementById('product-modal').classList.remove('is-open');
    document.getElementById('product-modal').setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }
  function setupProductModal(){
    document.querySelectorAll('.js-close-product-modal').forEach(function(b){ b.addEventListener('click', closeProductModal); });
    document.getElementById('product-form').addEventListener('submit', async function(e){
      e.preventDefault();
      if(isUploadingImage){ showToast('Still uploading the photo — try again in a moment'); return; }
      var id = document.getElementById('p-id').value;
      var name = document.getElementById('p-name').value.trim();
      var category = document.getElementById('p-category').value;
      var emoji = document.getElementById('p-emoji').value.trim() || (findCategory(category) ? findCategory(category).emoji : '🍽️');
      var priceRaw = document.getElementById('p-price').value;
      var priceLabelRaw = document.getElementById('p-price-label').value.trim();
      var desc = document.getElementById('p-desc').value.trim();
      var badge = document.getElementById('p-badge').value.trim();
      var isFeatured = document.getElementById('p-featured').checked;
      var image = document.getElementById('p-image').value.trim();

      var nameInput = document.getElementById('p-name');
      var descInput = document.getElementById('p-desc');
      nameInput.classList.toggle('has-error', !name);
      nameInput.nextElementSibling.classList.toggle('is-visible', !name);
      descInput.classList.toggle('has-error', !desc);
      descInput.nextElementSibling.classList.toggle('is-visible', !desc);
      if(!name || !desc) return;

      var payload = {
        name: name, category_id: category || null, description: desc,
        price_label: priceLabelRaw || (priceRaw !== '' ? formatPrice(Number(priceRaw)) : ''),
        price: priceRaw !== '' ? Number(priceRaw) : null,
        emoji: emoji, badge: badge || null, badge_style: badge ? 'folere' : null,
        is_featured: isFeatured, image_url: image || null
      };

      var submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      var res = id
        ? await supabaseClient.from('products').update(payload).eq('id', id).select().single()
        : await supabaseClient.from('products').insert(payload).select().single();
      submitBtn.disabled = false;
      if(res.error){ showToast(res.error.message); return; }
      if(editingOriginalImage && editingOriginalImage !== image){ deleteProductImageIfOwned(editingOriginalImage); }
      await loadProducts();
      renderProducts(); renderOverview();
      closeProductModal();
      showToast('Product saved');
    });
  }
  async function deleteProduct(id){
    var p = findProduct(id);
    if(!p) return;
    if(!window.confirm('Delete "' + p.name + '"? This cannot be undone.')) return;
    var res = await supabaseClient.from('products').delete().eq('id', id);
    if(res.error){ showToast(res.error.message); return; }
    deleteProductImageIfOwned(p.image);
    await loadProducts();
    renderProducts(); renderOverview();
    showToast('Product deleted');
  }

  /* ============================================================
     POST MODAL
     ============================================================ */
  function openPostModal(){
    var ctaSel = document.getElementById('post-cta-target');
    var options = [{id:'all', name:'Full Menu'}].concat(CATEGORIES);
    ctaSel.innerHTML = options.map(function(c){ return '<option value="' + c.id + '">' + c.name + '</option>'; }).join('');
    var form = document.getElementById('post-form');
    form.reset();
    ['post-title','post-message'].forEach(function(id){
      var input = document.getElementById(id);
      input.classList.remove('has-error');
      input.nextElementSibling.classList.remove('is-visible');
    });
    document.getElementById('post-modal-backdrop').classList.add('is-open');
    document.getElementById('post-modal').classList.add('is-open');
    document.getElementById('post-modal').setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function closePostModal(){
    document.getElementById('post-modal-backdrop').classList.remove('is-open');
    document.getElementById('post-modal').classList.remove('is-open');
    document.getElementById('post-modal').setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }
  function setupPostModal(){
    document.querySelectorAll('.js-close-post-modal').forEach(function(b){ b.addEventListener('click', closePostModal); });
    document.getElementById('post-form').addEventListener('submit', async function(e){
      e.preventDefault();
      var title = document.getElementById('post-title').value.trim();
      var message = document.getElementById('post-message').value.trim();
      var badge = document.getElementById('post-badge').value.trim();
      var emoji = document.getElementById('post-emoji').value.trim();
      var ctaTarget = document.getElementById('post-cta-target').value;

      var titleInput = document.getElementById('post-title');
      var msgInput = document.getElementById('post-message');
      titleInput.classList.toggle('has-error', !title);
      titleInput.nextElementSibling.classList.toggle('is-visible', !title);
      msgInput.classList.toggle('has-error', !message);
      msgInput.nextElementSibling.classList.toggle('is-visible', !message);
      if(!title || !message) return;

      var submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      var res = await supabaseClient.from('posts').insert({
        title: title, message: message, badge: badge || 'NEW', emoji: emoji || '🎉',
        cta_target: ctaTarget, cta_text: 'Order Now', is_active: true
      });
      submitBtn.disabled = false;
      if(res.error){ showToast(res.error.message); return; }
      await loadPosts();
      renderPosts(); renderOverview();
      closePostModal();
      showToast('Posted to home page');
    });
  }
  async function deletePost(id){
    var p = posts.filter(function(x){ return x.id === id; })[0];
    if(!p) return;
    var res = await supabaseClient.from('posts').delete().eq('id', id);
    if(res.error){ showToast(res.error.message); return; }
    await loadPosts();
    renderPosts(); renderOverview();
    showToast('Post deleted');
  }

  /* ============================================================
     FAQ MODAL
     ============================================================ */
  function openFaqModal(id){
    document.getElementById('faq-form').reset();
    document.getElementById('faq-id').value = '';
    if(id){
      var f = faqs.filter(function(x){ return x.id === id; })[0];
      if(!f) return;
      document.getElementById('faq-modal-title').textContent = 'Edit FAQ';
      document.getElementById('faq-id').value = f.id;
      document.getElementById('faq-question').value = f.question;
      document.getElementById('faq-answer').value = f.answer;
    } else {
      document.getElementById('faq-modal-title').textContent = 'Add FAQ';
    }
    document.getElementById('faq-modal-backdrop').classList.add('is-open');
    document.getElementById('faq-modal').classList.add('is-open');
    document.getElementById('faq-modal').setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function closeFaqModal(){
    document.getElementById('faq-modal-backdrop').classList.remove('is-open');
    document.getElementById('faq-modal').classList.remove('is-open');
    document.getElementById('faq-modal').setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }
  function setupFaqModal(){
    document.querySelectorAll('.js-close-faq-modal').forEach(function(b){ b.addEventListener('click', closeFaqModal); });
    document.getElementById('faq-form').addEventListener('submit', async function(e){
      e.preventDefault();
      var id = document.getElementById('faq-id').value;
      var questionInput = document.getElementById('faq-question');
      var answerInput = document.getElementById('faq-answer');
      var question = questionInput.value.trim();
      var answer = answerInput.value.trim();
      questionInput.classList.toggle('has-error', !question);
      questionInput.nextElementSibling.classList.toggle('is-visible', !question);
      answerInput.classList.toggle('has-error', !answer);
      answerInput.nextElementSibling.classList.toggle('is-visible', !answer);
      if(!question || !answer) return;

      var submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      var payload = {question: question, answer: answer};
      var res = id
        ? await supabaseClient.from('faqs').update(payload).eq('id', id)
        : await supabaseClient.from('faqs').insert(payload);
      submitBtn.disabled = false;
      if(res.error){ showToast(res.error.message); return; }
      await loadFaqs();
      renderFaqs();
      closeFaqModal();
      showToast('FAQ saved');
    });
  }
  async function deleteFaq(id){
    var f = faqs.filter(function(x){ return x.id === id; })[0];
    if(!f) return;
    if(!window.confirm('Delete this FAQ?')) return;
    var res = await supabaseClient.from('faqs').delete().eq('id', id);
    if(res.error){ showToast(res.error.message); return; }
    await loadFaqs();
    renderFaqs();
    showToast('FAQ deleted');
  }

  /* ============================================================
     SERVICE MODAL
     ============================================================ */
  function openServiceModal(id){
    document.getElementById('service-form').reset();
    document.getElementById('service-id').value = '';
    if(id){
      var s = services.filter(function(x){ return x.id === id; })[0];
      if(!s) return;
      document.getElementById('service-modal-title').textContent = 'Edit Service';
      document.getElementById('service-id').value = s.id;
      document.getElementById('service-title').value = s.title;
      document.getElementById('service-desc').value = s.description;
      document.getElementById('service-icon').value = s.icon;
    } else {
      document.getElementById('service-modal-title').textContent = 'Add Service';
    }
    document.getElementById('service-modal-backdrop').classList.add('is-open');
    document.getElementById('service-modal').classList.add('is-open');
    document.getElementById('service-modal').setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function closeServiceModal(){
    document.getElementById('service-modal-backdrop').classList.remove('is-open');
    document.getElementById('service-modal').classList.remove('is-open');
    document.getElementById('service-modal').setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }
  function setupServiceModal(){
    document.querySelectorAll('.js-close-service-modal').forEach(function(b){ b.addEventListener('click', closeServiceModal); });
    document.getElementById('service-form').addEventListener('submit', async function(e){
      e.preventDefault();
      var id = document.getElementById('service-id').value;
      var titleInput = document.getElementById('service-title');
      var descInput = document.getElementById('service-desc');
      var title = titleInput.value.trim();
      var desc = descInput.value.trim();
      var iconVal = document.getElementById('service-icon').value;
      titleInput.classList.toggle('has-error', !title);
      titleInput.nextElementSibling.classList.toggle('is-visible', !title);
      descInput.classList.toggle('has-error', !desc);
      descInput.nextElementSibling.classList.toggle('is-visible', !desc);
      if(!title || !desc) return;

      var submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      var payload = {title: title, description: desc, icon: iconVal};
      var res = id
        ? await supabaseClient.from('services').update(payload).eq('id', id)
        : await supabaseClient.from('services').insert(payload);
      submitBtn.disabled = false;
      if(res.error){ showToast(res.error.message); return; }
      await loadServices();
      renderServices();
      closeServiceModal();
      showToast('Service saved');
    });
  }
  async function deleteService(id){
    var s = services.filter(function(x){ return x.id === id; })[0];
    if(!s) return;
    if(!window.confirm('Delete "' + s.title + '"?')) return;
    var res = await supabaseClient.from('services').delete().eq('id', id);
    if(res.error){ showToast(res.error.message); return; }
    await loadServices();
    renderServices();
    showToast('Service deleted');
  }

  /* ============================================================
     SETTINGS FORM
     ============================================================ */
  function setupSettingsForm(){
    document.getElementById('settings-form').addEventListener('submit', async function(e){
      e.preventDefault();
      var rows = [
        {key:'whatsapp_number', value: document.getElementById('set-whatsapp').value.trim()},
        {key:'email', value: document.getElementById('set-email').value.trim()},
        {key:'contact_address', value: document.getElementById('set-address').value.trim()},
        {key:'contact_hours', value: document.getElementById('set-hours').value.trim()},
        {key:'about_paragraph_1', value: document.getElementById('set-about-1').value.trim()},
        {key:'about_paragraph_2', value: document.getElementById('set-about-2').value.trim()},
        {key:'social_instagram', value: document.getElementById('set-instagram').value.trim()},
        {key:'social_facebook', value: document.getElementById('set-facebook').value.trim()},
        {key:'social_tiktok', value: document.getElementById('set-tiktok').value.trim()},
        {key:'social_youtube', value: document.getElementById('set-youtube').value.trim()},
        {key:'social_x', value: document.getElementById('set-x').value.trim()},
        {key:'social_linkedin', value: document.getElementById('set-linkedin').value.trim()}
      ];
      var submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      var res = await supabaseClient.from('site_settings').upsert(rows, {onConflict: 'key'});
      submitBtn.disabled = false;
      if(res.error){ showToast(res.error.message); return; }
      await loadSiteSettings();
      renderSettingsForm();
      showToast('Settings saved');
    });
  }

  /* ============================================================
     CHANGE PASSWORD
     ============================================================ */
  function openPasswordModal(){
    var form = document.getElementById('password-form');
    form.reset();
    ['cp-current','cp-new','cp-confirm'].forEach(function(id){
      var input = document.getElementById(id);
      input.classList.remove('has-error');
      input.nextElementSibling.classList.remove('is-visible');
    });
    document.getElementById('password-modal-backdrop').classList.add('is-open');
    document.getElementById('password-modal').classList.add('is-open');
    document.getElementById('password-modal').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closePasswordModal(){
    document.getElementById('password-modal-backdrop').classList.remove('is-open');
    document.getElementById('password-modal').classList.remove('is-open');
    document.getElementById('password-modal').setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function setupPasswordModal(){
    document.getElementById('change-password-btn').addEventListener('click', openPasswordModal);
    document.querySelectorAll('.js-close-password-modal').forEach(function(b){ b.addEventListener('click', closePasswordModal); });
    document.getElementById('password-form').addEventListener('submit', async function(e){
      e.preventDefault();
      var currentInput = document.getElementById('cp-current');
      var newInput = document.getElementById('cp-new');
      var confirmInput = document.getElementById('cp-confirm');
      var current = currentInput.value;
      var next = newInput.value;
      var confirmVal = confirmInput.value;

      var newOk = next.length >= 6;
      var matchOk = next === confirmVal;
      newInput.classList.toggle('has-error', !newOk);
      newInput.nextElementSibling.classList.toggle('is-visible', !newOk);
      confirmInput.classList.toggle('has-error', !matchOk);
      confirmInput.nextElementSibling.classList.toggle('is-visible', !matchOk);
      if(!newOk || !matchOk) return;

      var submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      // Re-check the current password before changing it, by attempting a
      // real sign-in with it — this is the check Supabase's client exposes.
      var checkRes = await supabaseClient.auth.signInWithPassword({
        email: currentSession.user.email, password: current
      });
      if(checkRes.error){
        currentInput.classList.add('has-error');
        currentInput.nextElementSibling.classList.add('is-visible');
        submitBtn.disabled = false;
        return;
      }
      currentInput.classList.remove('has-error');
      currentInput.nextElementSibling.classList.remove('is-visible');

      var updateRes = await supabaseClient.auth.updateUser({password: next});
      submitBtn.disabled = false;
      if(updateRes.error){ showToast(updateRes.error.message); return; }
      closePasswordModal();
      showToast('Password updated');
    });
  }

  /* ============================================================
     APPROVALS
     ============================================================ */
  async function confirmOrder(id){
    var o = orders.filter(function(x){ return x.id === id; })[0];
    if(!o) return;
    var res = await supabaseClient.from('orders').update({status:'confirmed'}).eq('id', id);
    if(res.error){ showToast(res.error.message); return; }
    await loadOrders();
    renderOrders(); renderOverview();
    showToast('Order confirmed');
  }
  async function confirmBooking(id){
    var b = bookings.filter(function(x){ return x.id === id; })[0];
    if(!b) return;
    var res = await supabaseClient.from('bookings').update({status:'confirmed'}).eq('id', id);
    if(res.error){ showToast(res.error.message); return; }
    await loadBookings();
    renderBookings(); renderOverview();
    showToast('Booking confirmed');
  }
  async function approveTrainee(id){
    var t = trainees.filter(function(x){ return x.id === id; })[0];
    if(!t) return;
    var res = await supabaseClient.from('trainees').update({status:'approved'}).eq('id', id);
    if(res.error){ showToast(res.error.message); return; }
    await loadTrainees();
    renderTrainees(); renderOverview();
    showToast('Trainee approved');
  }

  /* ============================================================
     DELEGATED CLICKS + LIVE REFRESH
     ============================================================ */
  function setupDelegatedEvents(){
    document.addEventListener('click', function(e){
      var b;
      if((b = e.target.closest('.js-admin-add-product'))){ openProductModal(null); return; }
      if((b = e.target.closest('.js-admin-edit-product'))){ openProductModal(b.dataset.id); return; }
      if((b = e.target.closest('.js-admin-delete-product'))){ deleteProduct(b.dataset.id); return; }
      if((b = e.target.closest('.js-admin-confirm-order'))){ confirmOrder(b.dataset.id); return; }
      if((b = e.target.closest('.js-admin-confirm-booking'))){ confirmBooking(b.dataset.id); return; }
      if((b = e.target.closest('.js-admin-approve-trainee'))){ approveTrainee(b.dataset.id); return; }
      if((b = e.target.closest('.js-admin-add-post'))){ openPostModal(); return; }
      if((b = e.target.closest('.js-admin-delete-post'))){ deletePost(b.dataset.id); return; }
      if((b = e.target.closest('.js-admin-add-faq'))){ openFaqModal(null); return; }
      if((b = e.target.closest('.js-admin-edit-faq'))){ openFaqModal(b.dataset.id); return; }
      if((b = e.target.closest('.js-admin-delete-faq'))){ deleteFaq(b.dataset.id); return; }
      if((b = e.target.closest('.js-admin-add-service'))){ openServiceModal(null); return; }
      if((b = e.target.closest('.js-admin-edit-service'))){ openServiceModal(b.dataset.id); return; }
      if((b = e.target.closest('.js-admin-delete-service'))){ deleteService(b.dataset.id); return; }
      if((b = e.target.closest('.js-admin-stat-link'))){ switchToTab(b.dataset.tab); return; }
    });
  }
  // Orders/bookings/trainees now live in Postgres, reachable from any device —
  // so "seeing it update live" is a poll against the real API, not a localStorage
  // trick that only worked between tabs of the same browser.
  function setupLiveRefresh(){
    setInterval(async function(){
      if(!isAdminLoggedIn()) return;
      var prevOrders = orders.length, prevBookings = bookings.length, prevTrainees = trainees.length;
      await Promise.all([loadOrders(), loadBookings(), loadTrainees()]);
      renderOrders(); renderBookings(); renderTrainees(); renderOverview();
      if(orders.length > prevOrders) showToast('New order received');
      if(bookings.length > prevBookings) showToast('New booking received');
      if(trainees.length > prevTrainees) showToast('New trainee application');
    }, 20000);
  }

  function init(){
    setupAdminAuth();
    setupTabs();
    setupProductModal();
    setupImageUploadControls();
    setupPostModal();
    setupFaqModal();
    setupServiceModal();
    setupSettingsForm();
    setupPasswordModal();
    setupDelegatedEvents();
    setupLiveRefresh();
    // Fires immediately with whatever session already exists (or null), then
    // again on every login/logout/token refresh — renderApp() stays in sync.
    supabaseClient.auth.onAuthStateChange(function(event, session){
      currentSession = session;
      renderApp();
    });
  }
  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
