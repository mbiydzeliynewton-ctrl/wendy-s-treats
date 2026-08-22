(function(){
  'use strict';

  /* ============================================================
     CONFIG
     ============================================================ */
  var CONFIG = {
    whatsappNumber: '237682389897', // Wendy's WhatsApp / contact number
    email: 'hello@wendystreats.com', // TODO: replace with real email
    social: {
      whatsapp: '',
      instagram: 'https://www.instagram.com/wendystreats237',
      facebook: 'https://facebook.com/wendystreats',      // TODO: confirm real handle
      tiktok: 'https://tiktok.com/@wendystreats',         // TODO: confirm real handle
      youtube: 'https://youtube.com/@wendystreats',       // TODO: confirm real handle
      x: 'https://x.com/wendystreats',                    // TODO: confirm real handle
      linkedin: 'https://linkedin.com/company/wendystreats' // TODO: confirm real handle
    }
  };
  CONFIG.social.whatsapp = 'https://wa.me/' + CONFIG.whatsappNumber;

  /* ============================================================
     SUPABASE
     Get these two values from Supabase → Project Settings → API.
     The anon key is designed to be public — it only ever grants
     what the Row Level Security policies in supabase_schema.sql
     allow. Never put the service_role key in this file.
     ============================================================ */
  var SUPABASE_URL = 'YOUR_SUPABASE_URL';
  var SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
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
     mapProduct/mapCategory/mapPost translate the database's
     snake_case columns into the exact shape the rendering code
     below already expects, so nothing downstream has to change.
     ============================================================ */
  function mapCategory(row){
    return { id: row.id, name: row.name, emoji: row.emoji };
  }
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

  var CATEGORIES = [];
  var PRODUCTS = [];
  async function loadCatalog(){
    var results = await Promise.all([
      supabaseClient.from('categories').select('*').order('sort_order'),
      supabaseClient.from('products').select('*').eq('is_active', true)
    ]);
    if(results[0].error){ console.error('Failed to load categories:', results[0].error.message); CATEGORIES = []; }
    else { CATEGORIES = results[0].data.map(mapCategory); }
    if(results[1].error){ console.error('Failed to load products:', results[1].error.message); PRODUCTS = []; }
    else { PRODUCTS = results[1].data.map(mapProduct); }
  }

  var FAQS = [];
  function mapFaq(row){ return {id: row.id, q: row.question, a: row.answer}; }
  async function loadFaqs(){
    var res = await supabaseClient.from('faqs').select('*').order('sort_order');
    if(res.error){ console.error('Failed to load FAQs:', res.error.message); FAQS = []; return; }
    FAQS = res.data.map(mapFaq);
  }

  var SERVICES = [];
  function mapService(row){ return {id: row.id, icon: row.icon, title: row.title, desc: row.description}; }
  async function loadServices(){
    var res = await supabaseClient.from('services').select('*').order('sort_order');
    if(res.error){ console.error('Failed to load services:', res.error.message); SERVICES = []; return; }
    SERVICES = res.data.map(mapService);
  }

  // Site-wide editable text: contact details, socials, the WhatsApp number,
  // and the About page story. Loaded once, then applied over the CONFIG
  // defaults above (which stay as a fallback if a key is ever missing).
  var SITE_SETTINGS = {};
  async function loadSiteSettings(){
    var res = await supabaseClient.from('site_settings').select('*');
    if(res.error){ console.error('Failed to load site settings:', res.error.message); return; }
    SITE_SETTINGS = {};
    res.data.forEach(function(row){ SITE_SETTINGS[row.key] = row.value; });
  }
  function setting(key, fallback){
    return (SITE_SETTINGS[key] !== undefined && SITE_SETTINGS[key] !== '') ? SITE_SETTINGS[key] : fallback;
  }
  function applySiteSettings(){
    CONFIG.whatsappNumber = setting('whatsapp_number', CONFIG.whatsappNumber);
    CONFIG.email = setting('email', CONFIG.email);
    CONFIG.social.instagram = setting('social_instagram', CONFIG.social.instagram);
    CONFIG.social.facebook = setting('social_facebook', CONFIG.social.facebook);
    CONFIG.social.tiktok = setting('social_tiktok', CONFIG.social.tiktok);
    CONFIG.social.youtube = setting('social_youtube', CONFIG.social.youtube);
    CONFIG.social.x = setting('social_x', CONFIG.social.x);
    CONFIG.social.linkedin = setting('social_linkedin', CONFIG.social.linkedin);
    CONFIG.social.whatsapp = 'https://wa.me/' + CONFIG.whatsappNumber;

    var p1 = document.getElementById('about-p1');
    if(p1){ p1.textContent = setting('about_paragraph_1', p1.textContent); }
    var p2 = document.getElementById('about-p2');
    if(p2){ p2.textContent = setting('about_paragraph_2', p2.textContent); }
    var emailEl = document.getElementById('contact-email-text');
    if(emailEl){ emailEl.textContent = CONFIG.email; }
    var addressEl = document.getElementById('contact-address-text');
    if(addressEl){ addressEl.textContent = setting('contact_address', addressEl.textContent); }
    var hoursEl = document.getElementById('contact-hours-text');
    if(hoursEl){ hoursEl.innerHTML = escapeHtml(setting('contact_hours', hoursEl.textContent)).replace(/\n/g, '<br>'); }
  }

  function renderServices(){
    var el = document.getElementById('services-grid');
    if(!el || SERVICES.length === 0) return;
    el.innerHTML = SERVICES.map(function(s){
      return '<div class="service-card"><div class="service-icon">' + icon(s.icon) + '</div><h3>' + escapeHtml(s.title) + '</h3><p>' + escapeHtml(s.desc) + '</p></div>';
    }).join('');
  }

  var SOCIAL_LIST = [
    {key:'whatsapp', icon:'whatsapp'},
    {key:'instagram', icon:'instagram'},
    {key:'facebook', icon:'facebook'},
    {key:'tiktok', icon:'tiktok'},
    {key:'youtube', icon:'youtube'},
    {key:'x', icon:'x'},
    {key:'linkedin', icon:'linkedin'}
  ];

  var HERO_SLIDES_DEFAULT = [
    {badge:'Fresh Today', titleTop:'Cakes Baked', titleBottom:'With Love', sub:'100% homemade birthday cakes, custom-designed and baked fresh to order.', cta:'Order a Cake', target:'cakes', emoji:'🎂', stamp:['100%','Homemade','Made to Order']},
    {badge:'Cameroonian Favorites', titleTop:'Savory Bites,', titleBottom:'Golden & Crisp', sub:'Meat pies, scotch eggs, fish rolls & more, baked golden every day.', cta:'Order Savories', target:'savory', emoji:'🥧', stamp:['Baked','Fresh','Daily']},
    {badge:'Local & Refreshing', titleTop:'Foléré &', titleBottom:'Kossam, Chilled', sub:'Traditional Cameroonian drinks, made the authentic way and chilled to order.', cta:'Order Drinks', target:'drinks', emoji:'🍹', stamp:['100%','Local','Recipes']}
  ];
  var posts = [];
  function postToSlide(post){
    return {
      badge: post.badge || 'NEW', titleTop: post.title, titleBottom: '',
      sub: post.message, cta: post.ctaText || 'Order Now', target: post.ctaTarget || 'all',
      emoji: post.emoji || '🎉', stamp: ['Limited','Time','Offer']
    };
  }
  function getHeroSlides(){
    var live = posts.filter(function(p){ return p.active !== false; }).map(postToSlide);
    return live.concat(HERO_SLIDES_DEFAULT);
  }

  var notifications = [];
  // The notification bell is just a view over `posts` — there's no separate
  // notifications table. Per-visitor "have I seen this" state lives in
  // localStorage since it's a local UI preference, not data that needs to
  // sync anywhere.
  var READ_POSTS_KEY = 'wt_read_post_ids';
  function getReadPostIds(){
    try{ var raw = localStorage.getItem(READ_POSTS_KEY); return raw !== null ? JSON.parse(raw) : []; }
    catch(e){ return []; }
  }
  function markPostsRead(ids){
    try{
      var existing = getReadPostIds();
      ids.forEach(function(id){ if(existing.indexOf(id) === -1) existing.push(id); });
      localStorage.setItem(READ_POSTS_KEY, JSON.stringify(existing));
    } catch(e){}
  }
  function buildNotifications(){
    var readIds = getReadPostIds();
    notifications = posts.map(function(post){
      return {
        id: post.id,
        message: post.title + (post.message ? ' — ' + post.message : ''),
        time: post.createdAt,
        read: readIds.indexOf(post.id) !== -1
      };
    });
  }
  async function loadPosts(){
    var res = await supabaseClient.from('posts').select('*').eq('is_active', true).order('created_at', {ascending:false});
    if(res.error){ console.error('Failed to load posts:', res.error.message); posts = []; }
    else { posts = res.data.map(mapPost); }
    buildNotifications();
  }

  var SIMPLE_ROUTES = ['home','menu','services','booking','about','faq','contact','profile'];
  var PAGE_TITLES = {
    menu:'Full Menu',
    services:"Why Wendy's Treats",
    booking:'Book Your Order',
    about:'About Us',
    faq:'FAQs',
    contact:'Contact Us',
    profile:'Your Activity'
  };

  /* ============================================================
     STATE
     ============================================================ */
  var cart = []; // {id, qty} — kept in memory only, resets on reload
  var activityLog = []; // {icon, title, detail, time} — kept in memory only, resets on reload
  var heroIndex = 0;
  var heroTimer = null;
  var toastTimer = null;

  /* ============================================================
     UTILITIES
     ============================================================ */
  function formatPrice(n){ return n.toLocaleString('en-US') + ' FCFA'; }
  function icon(name, extraClass){ return '<svg class="icon' + (extraClass ? ' ' + extraClass : '') + '"><use href="#icon-' + name + '"/></svg>'; }
  function findProduct(id){ for(var i=0;i<PRODUCTS.length;i++){ if(PRODUCTS[i].id===id) return PRODUCTS[i]; } return null; }
  function findCategory(id){ for(var i=0;i<CATEGORIES.length;i++){ if(CATEGORIES[i].id===id) return CATEGORIES[i]; } return null; }
  function buildWhatsAppLink(message){ return 'https://wa.me/' + CONFIG.whatsappNumber + '?text=' + encodeURIComponent(message); }
  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function prefersReducedMotion(){
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function logActivity(iconName, title, detail){
    var now = new Date();
    var time = now.toLocaleDateString('en-US', {month:'short', day:'numeric'}) + ' · ' + now.toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'});
    activityLog.push({icon:iconName, title:title, detail:detail, time:time});
  }

  /* ============================================================
     ROUTER — one HTML file, several "pages", shown/hidden by hash
     ============================================================ */
  function parseHash(){
    var raw = location.hash.replace(/^#\/?/, '');
    if(!raw) return {route:'home'};
    var parts = raw.split('/').map(function(s){
      try{ return decodeURIComponent(s); }catch(e){ return s; }
    });
    if(parts[0] === 'category'){ return {route:'category', categoryId: parts[1] || 'all'}; }
    if(parts[0] === 'search'){ return {route:'category', categoryId:'all', query:(parts[1]||'').toLowerCase()}; }
    if(SIMPLE_ROUTES.indexOf(parts[0]) > -1){ return {route:parts[0]}; }
    return {route:'home'};
  }
  function categoryPageTitle(id, query){
    if(query) return 'Results for "' + query + '"';
    if(id === 'all') return 'All Treats';
    var c = findCategory(id);
    return c ? c.name : 'Menu';
  }
  function syncBottomNavActive(route){
    document.querySelectorAll('.js-bottom-link').forEach(function(i){
      var r = i.dataset.route;
      var active = r === route || (r === 'menu' && route === 'category');
      i.classList.toggle('is-active', active);
    });
  }
  function showPage(parsed){
    var route = parsed.route;
    document.querySelectorAll('.app-page').forEach(function(p){ p.classList.remove('is-active'); });
    var target = document.getElementById('page-' + route);
    if(!target){ target = document.getElementById('page-home'); route = 'home'; }

    if(route === 'category'){ renderCategoryPage(parsed.categoryId, parsed.query); }
    if(route === 'profile'){ renderProfilePage(); }

    void target.offsetWidth; // reflow so the entrance animation replays every time
    target.classList.add('is-active');
    target.setAttribute('tabindex', '-1');
    target.focus({preventScroll:true});

    var isHome = route === 'home';
    var searchRow = document.getElementById('home-search-row');
    if(searchRow) searchRow.hidden = !isHome;
    var titleText = isHome ? '' : (route === 'category' ? categoryPageTitle(parsed.categoryId, parsed.query) : (PAGE_TITLES[route] || ''));
    document.title = titleText ? (titleText + " | Wendy's Treats") : "Wendy's Treats | Homemade Cakes, Snacks & Local Drinks in Cameroon";

    syncBottomNavActive(route);
    window.scrollTo(0, 0);
  }
  function renderRoute(){ showPage(parseHash()); }

  /* ============================================================
     RENDER: PRODUCT CARDS, PAGES DRIVEN BY CATEGORY DATA
     ============================================================ */
  function badgeHtml(p){
    if(!p.badge) return '';
    return '<div class="stamp-badge stamp-badge--' + (p.badgeStyle||'folere') + '"><span>' + escapeHtml(p.badge) + '</span></div>';
  }
  function productVisualHtml(p){
    if(p.image){
      return '<div class="product-visual"><img src="' + p.image.replace(/"/g,'&quot;') + '" alt="" loading="lazy"></div>';
    }
    return '<div class="product-visual product-visual--' + p.category + '"><span class="product-emoji">' + p.emoji + '</span></div>';
  }
  function productCardHtml(p){
    var actionBtn = p.type === 'booking'
      ? '<a href="#/booking" class="card-action-btn card-action-book js-book-item" data-preset-category="' + p.category + '" aria-label="Book ' + escapeHtml(p.name) + '">' + icon('calendar') + '</a>'
      : '<button class="card-action-btn js-add-item" data-id="' + p.id + '" aria-label="Add ' + escapeHtml(p.name) + ' to cart">' + icon('plus') + '</button>';
    return (
      '<article class="product-card">' +
        badgeHtml(p) +
        productVisualHtml(p) +
        '<div class="product-info">' +
          '<h3>' + escapeHtml(p.name) + '</h3>' +
          '<p class="product-desc">' + escapeHtml(p.desc) + '</p>' +
          '<div class="product-footer">' +
            '<span class="product-price">' + escapeHtml(p.priceLabel) + '</span>' +
            actionBtn +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }
  function renderFavorites(){
    var el = document.getElementById('favorites-grid');
    if(!el) return;
    el.innerHTML = PRODUCTS.filter(function(p){ return p.isFeatured; }).map(productCardHtml).join('');
  }
  function renderCatIconRow(){
    var el = document.getElementById('cat-icon-row');
    if(!el) return;
    var all = [{id:'all', name:'All', emoji:'🍽️'}].concat(CATEGORIES);
    el.innerHTML = all.map(function(c){
      return '<a class="cat-icon-item" href="#/category/' + c.id + '"><span class="cat-icon-circle">' + c.emoji + '</span><span class="cat-icon-label">' + c.name + '</span></a>';
    }).join('');
  }
  function renderMenuDirectory(){
    var el = document.getElementById('menu-cat-tiles');
    if(!el) return;
    var tiles = [{id:'all', name:'All Treats', emoji:'🍽️'}].concat(CATEGORIES);
    el.innerHTML = tiles.map(function(c){
      var count = c.id === 'all' ? PRODUCTS.length : PRODUCTS.filter(function(p){ return p.category === c.id; }).length;
      return (
        '<a class="cat-tile" href="#/category/' + c.id + '">' +
          '<span class="cat-tile-emoji">' + c.emoji + '</span>' +
          '<span class="cat-tile-text"><span class="cat-tile-name">' + c.name + '</span><span class="cat-tile-count">' + count + (count===1?' item':' items') + '</span></span>' +
          '<span class="cat-tile-arrow">' + icon('chevron-right','icon--sm') + '</span>' +
        '</a>'
      );
    }).join('');
  }
  function renderCategoryPagePills(activeId){
    var el = document.getElementById('category-page-pills');
    if(!el) return;
    var all = [{id:'all', name:'All', emoji:'🍽️'}].concat(CATEGORIES);
    el.innerHTML = all.map(function(c){
      var active = c.id === activeId ? ' is-active' : '';
      return '<a class="pill' + active + '" href="#/category/' + c.id + '"><span class="pill-emoji">' + c.emoji + '</span>' + c.name + '</a>';
    }).join('');
  }
  function renderCategoryPage(categoryId, query){
    var id = categoryId || 'all';
    var list = id === 'all' ? PRODUCTS.slice() : PRODUCTS.filter(function(p){ return p.category === id; });
    if(query){
      list = list.filter(function(p){ return p.name.toLowerCase().indexOf(query) > -1 || p.desc.toLowerCase().indexOf(query) > -1; });
    }
    var countEl = document.getElementById('category-page-count');
    var gridEl = document.getElementById('category-page-grid');
    if(countEl) countEl.textContent = list.length + (list.length === 1 ? ' treat' : ' treats') + (query ? ' found' : '');
    if(gridEl){
      gridEl.innerHTML = list.length ? list.map(productCardHtml).join('') : '<p class="menu-empty">No treats found. Try a different category or search.</p>';
    }
    renderCategoryPagePills(query ? null : id);
  }
  function activityItemHtml(a){
    return (
      '<div class="activity-item">' +
        '<div class="activity-icon">' + icon(a.icon) + '</div>' +
        '<div class="activity-body">' +
          '<h4>' + escapeHtml(a.title) + '</h4>' +
          '<p>' + escapeHtml(a.detail) + '</p>' +
          '<span class="activity-time">' + a.time + '</span>' +
        '</div>' +
      '</div>'
    );
  }
  function renderProfilePage(){
    var el = document.getElementById('activity-list');
    if(!el) return;
    if(activityLog.length === 0){
      el.innerHTML = (
        '<div class="activity-empty">' + icon('user','icon--lg') +
        '<p>No activity yet — your bookings and orders will show up here.</p>' +
        '<a href="#/category/all" class="btn btn--folere btn--sm">Browse Menu</a>' +
        '</div>'
      );
      return;
    }
    el.innerHTML = activityLog.slice().reverse().map(activityItemHtml).join('');
  }

  function renderBookingCategorySelect(){
    var sel = document.getElementById('b-category');
    if(!sel) return;
    var html = '<option value="">Not sure / Other</option>';
    CATEGORIES.forEach(function(c){ html += '<option value="' + c.name + '">' + c.name + '</option>'; });
    sel.innerHTML = html;
  }
  function renderFaq(){
    var el = document.getElementById('faq-list');
    if(!el) return;
    el.innerHTML = FAQS.map(function(f, i){
      return '<div class="faq-item"><button class="faq-question" aria-expanded="false"><span>' + escapeHtml(f.q) + '</span>' + icon('chevron-down') + '</button><div class="faq-answer"><div class="faq-answer-inner">' + escapeHtml(f.a) + '</div></div></div>';
    }).join('');
    el.querySelectorAll('.faq-item').forEach(function(item){
      var btn = item.querySelector('.faq-question');
      var answer = item.querySelector('.faq-answer');
      btn.addEventListener('click', function(){
        var isOpen = item.classList.contains('is-open');
        el.querySelectorAll('.faq-item').forEach(function(other){
          other.classList.remove('is-open');
          other.querySelector('.faq-question').setAttribute('aria-expanded','false');
          other.querySelector('.faq-answer').style.maxHeight = null;
        });
        if(!isOpen){
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded','true');
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    });
  }
  function renderInstagram(){
    var el = document.getElementById('instagram-grid');
    if(!el) return;
    var emojis = ['🎂','🧁','🥧','🍹','🥛','🍨'];
    el.innerHTML = emojis.map(function(e){
      return '<a class="insta-tile" href="' + CONFIG.social.instagram + '" target="_blank" rel="noopener" aria-label="View on Instagram">' + e + '</a>';
    }).join('');
  }
  function renderSocialRow(containerId){
    var el = document.getElementById(containerId);
    if(!el) return;
    el.innerHTML = SOCIAL_LIST.map(function(s){
      return '<a class="social-icon-link" href="' + CONFIG.social[s.key] + '" target="_blank" rel="noopener" aria-label="' + s.key + '">' + icon(s.icon) + '</a>';
    }).join('');
  }

  /* ============================================================
     HERO CAROUSEL (rotating content within the Home page)
     ============================================================ */
  function heroSlideHtml(s){
    return (
      '<div class="hero-slide-inner">' +
        '<div class="hero-slide-text">' +
          '<span class="hero-badge">' + escapeHtml(s.badge) + '</span>' +
          '<h2>' + escapeHtml(s.titleTop) + '<em>' + escapeHtml(s.titleBottom) + '</em></h2>' +
          '<p class="hero-sub">' + escapeHtml(s.sub) + '</p>' +
          '<a href="#/category/' + s.target + '" class="btn btn--primary">' + escapeHtml(s.cta) + ' ' + icon('arrow-right','icon--sm') + '</a>' +
        '</div>' +
        '<div class="hero-slide-visual">' +
          '<div class="hero-glow"></div>' +
          '<span class="hero-slide-emoji">' + s.emoji + '</span>' +
          '<div class="hero-stamp"><div class="hero-stamp-text"><span class="l1">' + s.stamp[0] + '</span><span class="l2">' + s.stamp[1] + '</span><span class="l3">' + s.stamp[2] + '</span></div></div>' +
        '</div>' +
      '</div>'
    );
  }
  function renderHeroDots(){
    var el = document.getElementById('hero-dots');
    if(!el) return;
    var slides = getHeroSlides();
    el.innerHTML = slides.map(function(s, i){
      return '<button type="button" class="hero-dot' + (i===heroIndex?' is-active':'') + ' js-hero-dot" data-index="' + i + '" aria-label="Show slide ' + (i+1) + '"></button>';
    }).join('');
  }
  function renderHeroSlide(immediate){
    var el = document.getElementById('hero-slide');
    if(!el) return;
    var slides = getHeroSlides();
    if(heroIndex >= slides.length) heroIndex = 0;
    if(immediate){
      el.innerHTML = heroSlideHtml(slides[heroIndex]);
    } else {
      el.style.opacity = 0;
      setTimeout(function(){
        el.innerHTML = heroSlideHtml(slides[heroIndex]);
        el.style.opacity = 1;
      }, 180);
    }
    renderHeroDots();
  }
  function goToHeroSlide(i){
    var slides = getHeroSlides();
    heroIndex = (i + slides.length) % slides.length;
    renderHeroSlide(false);
  }
  function startHeroAutoplay(){
    stopHeroAutoplay();
    if(prefersReducedMotion()) return;
    heroTimer = setInterval(function(){ goToHeroSlide(heroIndex+1); }, 6000);
  }
  function stopHeroAutoplay(){ if(heroTimer){ clearInterval(heroTimer); heroTimer = null; } }

  /* ============================================================
     SEARCH + FILTER ENTRY POINTS
     ============================================================ */
  function submitSearch(){
    var input = document.getElementById('site-search');
    if(!input) return;
    var q = input.value.trim();
    if(q){ location.hash = '#/search/' + encodeURIComponent(q.toLowerCase()); }
  }
  function setupSearch(){
    var input = document.getElementById('site-search');
    if(!input) return;
    input.addEventListener('search', submitSearch);
    input.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); submitSearch(); } });
  }
  function setupFilterButton(){
    var btn = document.getElementById('filter-toggle');
    if(!btn) return;
    btn.addEventListener('click', function(){ location.hash = '#/menu'; });
  }
  function relativeTime(ts){
    var mins = Math.floor((Date.now() - ts) / 60000);
    if(mins < 1) return 'Just now';
    if(mins < 60) return mins + 'm ago';
    var hrs = Math.floor(mins / 60);
    if(hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  }
  function renderNotifList(){
    var el = document.getElementById('notif-list');
    if(!el) return;
    if(notifications.length === 0){
      el.innerHTML = '<p class="notif-empty">No notifications yet.</p>';
      return;
    }
    el.innerHTML = notifications.map(function(n){
      return (
        '<div class="notif-item' + (n.read ? ' is-read' : '') + '">' +
          '<span class="notif-dot-indicator"></span>' +
          '<div class="notif-item-body"><p>' + escapeHtml(n.message) + '</p><span class="notif-item-time">' + relativeTime(n.time) + '</span></div>' +
        '</div>'
      );
    }).join('');
  }
  function updateNotifBadge(){
    var dot = document.querySelector('#notif-btn .icon-btn__dot');
    if(!dot) return;
    dot.style.display = notifications.some(function(n){ return !n.read; }) ? 'block' : 'none';
  }
  function openNotifModal(){
    var backdrop = document.getElementById('notif-modal-backdrop');
    var modal = document.getElementById('notif-modal');
    if(!backdrop || !modal) return;
    renderNotifList();
    backdrop.classList.add('is-open');
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    notifications.forEach(function(n){ n.read = true; });
    markPostsRead(posts.map(function(p){ return p.id; }));
    updateNotifBadge();
  }
  function closeNotifModal(){
    var backdrop = document.getElementById('notif-modal-backdrop');
    var modal = document.getElementById('notif-modal');
    if(!backdrop || !modal) return;
    backdrop.classList.remove('is-open');
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function setupNotifButton(){
    var btn = document.getElementById('notif-btn');
    if(btn) btn.addEventListener('click', openNotifModal);
    document.querySelectorAll('.js-close-notif-modal').forEach(function(b){ b.addEventListener('click', closeNotifModal); });
    updateNotifBadge();
  }

  /* ============================================================
     CART
     ============================================================ */
  function addToCart(id){
    var existing = null;
    for(var i=0;i<cart.length;i++){ if(cart[i].id===id){ existing = cart[i]; break; } }
    if(existing){ existing.qty += 1; } else { cart.push({id:id, qty:1}); }
    renderCart();
    showToast('Added to cart');
  }
  function removeFromCart(id){ cart = cart.filter(function(c){ return c.id !== id; }); renderCart(); }
  function changeQty(id, delta){
    var item = null;
    for(var i=0;i<cart.length;i++){ if(cart[i].id===id){ item = cart[i]; break; } }
    if(!item) return;
    item.qty += delta;
    if(item.qty <= 0){ removeFromCart(id); return; }
    renderCart();
  }
  function setQty(id, rawValue){
    var item = null;
    for(var i=0;i<cart.length;i++){ if(cart[i].id===id){ item = cart[i]; break; } }
    if(!item) return;
    var n = parseInt(rawValue, 10);
    if(isNaN(n) || n < 1){ removeFromCart(id); return; }
    item.qty = n;
    renderCart();
  }
  function cartCount(){ return cart.reduce(function(sum,c){ return sum + c.qty; }, 0); }
  function cartSubtotal(){
    return cart.reduce(function(sum,c){ var p = findProduct(c.id); return sum + (p && p.price ? p.price * c.qty : 0); }, 0);
  }
  function renderCart(){
    var count = cartCount();
    var badge = document.getElementById('cart-count');
    if(badge){
      if(count > 0){ badge.style.display = 'flex'; badge.textContent = count; } else { badge.style.display = 'none'; }
    }
    var itemsEl = document.getElementById('cart-items');
    if(itemsEl){
      if(cart.length === 0){
        itemsEl.innerHTML = '<div class="cart-empty">' + icon('cart','icon--lg') + '<p>Your cart is empty — browse the menu to add treats.</p><a href="#/category/all" class="btn btn--folere btn--sm js-close-cart-nav">Browse Menu</a></div>';
      } else {
        itemsEl.innerHTML = cart.map(function(c){
          var p = findProduct(c.id);
          if(!p) return '';
          var lineTotal = p.price ? formatPrice(p.price * c.qty) : p.priceLabel;
          var thumb = p.image ? '<img src="' + p.image.replace(/"/g,'&quot;') + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">' : p.emoji;
          return (
            '<div class="cart-item">' +
              '<div class="cart-item-emoji">' + thumb + '</div>' +
              '<div class="cart-item-info"><h5>' + escapeHtml(p.name) + '</h5><div class="cart-item-price">' + lineTotal + '</div>' +
                '<div class="qty-stepper">' +
                  '<button class="qty-btn js-qty-dec" data-id="' + p.id + '" aria-label="Decrease quantity">' + icon('minus') + '</button>' +
                  '<input type="number" class="qty-input js-qty-input" data-id="' + p.id + '" value="' + c.qty + '" min="1" step="1" inputmode="numeric" aria-label="Quantity for ' + escapeHtml(p.name) + '">' +
                  '<button class="qty-btn js-qty-inc" data-id="' + p.id + '" aria-label="Increase quantity">' + icon('plus') + '</button>' +
                '</div></div>' +
              '<button class="cart-item-remove js-remove-item" data-id="' + p.id + '" aria-label="Remove ' + escapeHtml(p.name) + '">' + icon('close') + '</button>' +
            '</div>'
          );
        }).join('');
      }
    }
    var subtotalEl = document.getElementById('cart-subtotal');
    if(subtotalEl) subtotalEl.textContent = formatPrice(cartSubtotal());
  }
  function openCart(){
    document.getElementById('cart-drawer').classList.add('is-open');
    document.getElementById('cart-backdrop').classList.add('is-open');
    document.getElementById('cart-drawer').setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function closeCart(){
    document.getElementById('cart-drawer').classList.remove('is-open');
    document.getElementById('cart-backdrop').classList.remove('is-open');
    document.getElementById('cart-drawer').setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }
  async function checkoutCart(){
    if(cart.length === 0){ showToast('Your cart is empty'); return; }
    var message = "Hello Wendy's Treats! I'd like to place an order:\n\n";
    var itemCount = cartCount();
    var itemsSnapshot = [];
    cart.forEach(function(c){
      var p = findProduct(c.id);
      if(!p) return;
      var line = p.price ? formatPrice(p.price * c.qty) : p.priceLabel;
      message += '• ' + p.name + ' x' + c.qty + ' — ' + line + '\n';
      itemsSnapshot.push({productId:c.id, name:p.name, qty:c.qty, lineLabel:line});
    });
    message += '\n*Total: ' + formatPrice(cartSubtotal()) + '*\n\nPlease confirm availability and delivery details.';

    // Best-effort save so it shows up in the admin dashboard. If Supabase is
    // unreachable this still resolves, and WhatsApp — the part that actually
    // has to work — opens regardless.
    try{
      var orderRes = await supabaseClient.from('orders').insert({subtotal: cartSubtotal()}).select().single();
      if(orderRes.error) throw orderRes.error;
      var orderItemsPayload = itemsSnapshot.map(function(it){
        return {order_id: orderRes.data.id, product_id: it.productId, product_name: it.name, quantity: it.qty, line_label: it.lineLabel};
      });
      var itemsRes = await supabaseClient.from('order_items').insert(orderItemsPayload);
      if(itemsRes.error) throw itemsRes.error;
    } catch(err){
      console.error('Failed to save order:', err.message || err);
    }

    window.open(buildWhatsAppLink(message), '_blank');
    logActivity('cart', 'Order Sent', itemCount + (itemCount === 1 ? ' item' : ' items') + ' · ' + formatPrice(cartSubtotal()));
    showToast('Redirecting to WhatsApp…');
  }

  /* ============================================================
     BOOKING FORM
     ============================================================ */
  function setupBookingForm(){
    var form = document.getElementById('booking-form');
    if(!form) return;
    var addressGroup = document.getElementById('address-group');
    var radios = form.querySelectorAll('input[name="deliveryMethod"]');
    function syncAddressVisibility(){
      var selected = form.querySelector('input[name="deliveryMethod"]:checked');
      addressGroup.classList.toggle('is-visible', !!selected && selected.value === 'Delivery');
    }
    radios.forEach(function(r){ r.addEventListener('change', syncAddressVisibility); });
    syncAddressVisibility();

    form.addEventListener('submit', async function(e){
      e.preventDefault();
      var name = form.name.value.trim();
      var phone = form.phone.value.trim();
      var nameInput = document.getElementById('b-name');
      var phoneInput = document.getElementById('b-phone');
      var phoneOk = phone.replace(/[^0-9]/g,'').length >= 8;

      nameInput.classList.toggle('has-error', !name);
      nameInput.nextElementSibling.classList.toggle('is-visible', !name);
      phoneInput.classList.toggle('has-error', !phoneOk);
      phoneInput.nextElementSibling.classList.toggle('is-visible', !phoneOk);
      if(!name || !phoneOk){ (name ? phoneInput : nameInput).focus(); return; }

      var orderType = form.orderType.value;
      var category = form.category.value;
      var date = form.date.value;
      var deliveryMethod = form.deliveryMethod.value;
      var address = form.address.value.trim();
      var notes = form.notes.value.trim();

      var message = "Hello Wendy's Treats! I'd like to make a booking.\n\n";
      message += '*Name:* ' + name + '\n';
      message += '*Phone:* ' + phone + '\n';
      message += '*Order Type:* ' + orderType + '\n';
      if(category) message += '*Category:* ' + category + '\n';
      if(date) message += '*Date Needed:* ' + date + '\n';
      message += '*Delivery Method:* ' + deliveryMethod + '\n';
      if(deliveryMethod === 'Delivery' && address) message += '*Address:* ' + address + '\n';
      if(notes) message += '*Notes:* ' + notes + '\n';

      // Best-effort save so it shows up in the admin dashboard. WhatsApp —
      // the part that actually has to work — opens regardless of this.
      try{
        var bookingRes = await supabaseClient.from('bookings').insert({
          name: name, phone: phone, order_type: orderType,
          category_name: category || null, needed_on: date || null,
          delivery_method: deliveryMethod, address: address || null, notes: notes || null
        });
        if(bookingRes.error) throw bookingRes.error;
      } catch(err){
        console.error('Failed to save booking:', err.message || err);
      }

      window.open(buildWhatsAppLink(message), '_blank');
      logActivity('calendar', 'Booking Sent', orderType + (date ? ' · ' + date : ''));
      document.getElementById('booking-success').classList.add('is-visible');
      showToast('Redirecting to WhatsApp…');
    });
  }
  function setupWhatsAppDirect(){
    var directLink = document.querySelector('.js-whatsapp-direct');
    if(directLink){
      directLink.href = buildWhatsAppLink("Hello Wendy's Treats! I have a question.");
      directLink.target = '_blank';
      directLink.rel = 'noopener';
    }
  }
  function openTraineeModal(){
    var backdrop = document.getElementById('trainee-modal-backdrop');
    var modal = document.getElementById('trainee-modal');
    if(!backdrop || !modal) return;
    backdrop.classList.add('is-open');
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    var nameInput = document.getElementById('t-name');
    if(nameInput) setTimeout(function(){ nameInput.focus(); }, 260);
  }
  function closeTraineeModal(){
    var backdrop = document.getElementById('trainee-modal-backdrop');
    var modal = document.getElementById('trainee-modal');
    if(!backdrop || !modal) return;
    backdrop.classList.remove('is-open');
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }
  function setupTraineeModal(){
    document.querySelectorAll('.js-open-trainee-modal').forEach(function(b){ b.addEventListener('click', openTraineeModal); });
    document.querySelectorAll('.js-close-trainee-modal').forEach(function(b){ b.addEventListener('click', closeTraineeModal); });

    var form = document.getElementById('trainee-form');
    if(!form) return;
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      var name = form.name.value.trim();
      var phone = form.phone.value.trim();
      var reason = form.reason.value.trim();
      var nameInput = document.getElementById('t-name');
      var phoneInput = document.getElementById('t-phone');
      var reasonInput = document.getElementById('t-reason');
      var phoneOk = phone.replace(/[^0-9]/g,'').length >= 8;

      nameInput.classList.toggle('has-error', !name);
      nameInput.nextElementSibling.classList.toggle('is-visible', !name);
      phoneInput.classList.toggle('has-error', !phoneOk);
      phoneInput.nextElementSibling.classList.toggle('is-visible', !phoneOk);
      reasonInput.classList.toggle('has-error', !reason);
      reasonInput.nextElementSibling.classList.toggle('is-visible', !reason);
      if(!name || !phoneOk || !reason){ return; }

      var message = "Hello Wendy's Treats! I'd like to apply as a trainee.\n\n";
      message += '*Name:* ' + name + '\n';
      message += '*Phone:* ' + phone + '\n';
      message += '*Why I want to train:* ' + reason + '\n';

      // Best-effort save so it shows up in the admin dashboard. WhatsApp —
      // the part that actually has to work — opens regardless of this.
      try{
        var traineeRes = await supabaseClient.from('trainees').insert({name: name, phone: phone, reason: reason});
        if(traineeRes.error) throw traineeRes.error;
      } catch(err){
        console.error('Failed to save trainee application:', err.message || err);
      }

      window.open(buildWhatsAppLink(message), '_blank');
      logActivity('graduation', 'Trainee Application', 'Application sent via WhatsApp');
      closeTraineeModal();
      form.reset();
      showToast("Application sent! We'll be in touch on WhatsApp.");
    });
  }

  /* ============================================================
     UI: HEADER, MOBILE NAV, TOAST
     ============================================================ */
  function setupHeaderScroll(){
    var header = document.getElementById('site-header');
    if(!header) return;
    function onScroll(){ header.classList.toggle('is-scrolled', window.scrollY > 8); }
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  }
  function setupMobileNav(){
    var nav = document.getElementById('mobile-nav');
    var openBtn = document.getElementById('menu-toggle');
    var closeBtn = document.getElementById('mobile-nav-close');
    if(!nav || !openBtn) return;
    function open(){ nav.classList.add('is-open'); nav.setAttribute('aria-hidden','false'); document.body.style.overflow = 'hidden'; }
    function close(){ nav.classList.remove('is-open'); nav.setAttribute('aria-hidden','true'); document.body.style.overflow = ''; }
    openBtn.addEventListener('click', open);
    if(closeBtn) closeBtn.addEventListener('click', close);
    nav.querySelectorAll('.js-mobile-link').forEach(function(link){ link.addEventListener('click', close); });
  }
  function showToast(msg){
    var toast = document.getElementById('toast');
    var text = document.getElementById('toast-text');
    if(!toast || !text) return;
    text.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toast.classList.remove('is-visible'); }, 2400);
  }

  /* ============================================================
     DELEGATED CLICK EVENTS (interactions with side effects)
     ============================================================ */
  function setupDelegatedEvents(){
    document.addEventListener('click', function(e){
      var addBtn = e.target.closest('.js-add-item');
      if(addBtn){ addToCart(addBtn.dataset.id); return; }

      var bookBtn = e.target.closest('.js-book-item');
      if(bookBtn){
        var sel = document.getElementById('b-category');
        if(sel){
          var cat = findCategory(bookBtn.dataset.presetCategory);
          if(cat) sel.value = cat.name;
        }
        return; // href="#/booking" navigates natively
      }

      var heroDotBtn = e.target.closest('.js-hero-dot');
      if(heroDotBtn){ goToHeroSlide(parseInt(heroDotBtn.dataset.index,10)); startHeroAutoplay(); return; }

      var cartToggleBtn = e.target.closest('.js-cart-toggle');
      if(cartToggleBtn){ openCart(); return; }

      var cartCloseBtn = e.target.closest('.cart-close-btn');
      if(cartCloseBtn){ closeCart(); return; }

      if(e.target.id === 'cart-backdrop'){ closeCart(); return; }

      var qtyInc = e.target.closest('.js-qty-inc');
      if(qtyInc){ changeQty(qtyInc.dataset.id, 1); return; }

      var qtyDec = e.target.closest('.js-qty-dec');
      if(qtyDec){ changeQty(qtyDec.dataset.id, -1); return; }

      var removeBtn = e.target.closest('.js-remove-item');
      if(removeBtn){ removeFromCart(removeBtn.dataset.id); return; }

      var checkoutBtn = e.target.closest('#cart-checkout-btn');
      if(checkoutBtn){ checkoutCart(); return; }

      var bulkPresetBtn = e.target.closest('.js-preset-bulk');
      if(bulkPresetBtn){
        var orderSel = document.getElementById('b-order-type');
        if(orderSel) orderSel.value = 'Bulk / Event Order';
        return; // href="#/booking" navigates natively
      }

      var cartNavBtn = e.target.closest('.js-close-cart-nav');
      if(cartNavBtn){ closeCart(); return; } // href navigates natively
    });

    document.addEventListener('change', function(e){
      var qtyInput = e.target.closest('.js-qty-input');
      if(qtyInput){ setQty(qtyInput.dataset.id, qtyInput.value); return; }
    });
  }

  /* ============================================================
     CONTACT PAGE DYNAMIC TEXT
     ============================================================ */
  function setupContactExtras(){
    var copyrightText = '© ' + new Date().getFullYear() + " Wendy's Treats. All rights reserved.";
    var yearLine = document.getElementById('current-year-line');
    if(yearLine){ yearLine.textContent = copyrightText; }
    var homeYearLine = document.getElementById('home-footer-year');
    if(homeYearLine){ homeYearLine.textContent = copyrightText; }
    var waText = document.getElementById('footer-whatsapp-text');
    if(waText){ waText.textContent = '+' + CONFIG.whatsappNumber.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4'); }
    var waLink = document.getElementById('footer-whatsapp-link');
    if(waLink){ waLink.href = CONFIG.social.whatsapp; }
  }
  /* ============================================================
     INIT
     ============================================================ */
  async function init(){
    await Promise.all([loadCatalog(), loadPosts(), loadFaqs(), loadServices(), loadSiteSettings()]);
    applySiteSettings();

    renderCatIconRow();
    renderFavorites();
    renderMenuDirectory();
    renderBookingCategorySelect();
    renderFaq();
    renderServices();
    renderInstagram();
    renderSocialRow('footer-social');
    renderSocialRow('mobile-nav-social');
    renderSocialRow('home-footer-social');
    renderCart();
    renderHeroSlide(true);
    startHeroAutoplay();
    setupBookingForm();
    setupWhatsAppDirect();
    setupTraineeModal();
    setupHeaderScroll();
    setupMobileNav();
    setupSearch();
    setupFilterButton();
    setupNotifButton();
    setupDelegatedEvents();
    setupContactExtras();

    window.addEventListener('hashchange', renderRoute);
    renderRoute();

    if(parseHash().route === 'home'){
      setTimeout(function(){ showToast("Hello, Treat Lover! 🍰 Home-baked. Always fresh."); }, 900);
    }
  }

  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
