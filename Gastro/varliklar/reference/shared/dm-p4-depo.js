/* =====================================================================
   ORTAK · PARTİ 4 — MAKET DEPO + TOAST + MODAL
   ---------------------------------------------------------------------
   BAĞI lead attı; İÇERİĞİNİ yalnız lead yazar.
   KAYNAK BURASI: scripts/p4-varlik/dm-p4-depo.js — ağaca kopyalanır.

   NİYE VAR — dört kulvar da "durum kalıcı · toast gerçek" istiyor
   (L3 alışveriş listesi · A2 modal · B1 erişim anahtarı · L6 plan
   taslağı). Dördü kendi deposunu yazsaydı aynı sekmede dört ayrı
   `localStorage` sözleşmesi olurdu; tek kaynak burada.

   🔴 BU BİR MAKET. Arka uç yok; durum yalnız o tarayıcıda yaşar.
      Depo bunu SAKLAMAZ — `dmDepo.maket === true` ve arayüz bunu
      yazmak zorunda. "Kaydedildi" diyen ama hiçbir yere gitmeyen bir
      yüzey yalan söyler; "bu makette tarayıcına kaydedildi" söylemez.

   🔴 localStorage HER OKUMADA ATABİLİR (gizli pencere, site verisi
      kapalı, önizleme yakalayıcısı). Her okuma/yazma try/catch içinde
      ve depo boş dönerse arayüz DOĞRU çizilir — deponun kayıtlı dersi.
      Erişilemezse bellek içi yedeğe düşer: sayfa ömrü boyunca çalışır,
      yenilenince sıfırlanır. Sessizce ölmez.
   ===================================================================== */
(function () {
  'use strict';
  if (window.dmDepo) return;                       /* iki kez bağlanmaz */

  var ANAHTAR = 'dm-gastro-p4';
  var bellek = null;                    /* localStorage erişilemezse yedek */
  var erisilebilir = (function () {
    try { var k = ANAHTAR + '::sinama'; localStorage.setItem(k, '1');
          localStorage.removeItem(k); return true; } catch (e) { return false; }
  })();

  function hamOku() {
    if (!erisilebilir) return bellek || {};
    try { return JSON.parse(localStorage.getItem(ANAHTAR) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function hamYaz(o) {
    bellek = o;
    if (!erisilebilir) return false;
    try { localStorage.setItem(ANAHTAR, JSON.stringify(o)); return true; }
    catch (e) { return false; }
  }

  function yay(bolum, ayrinti) {
    try {
      document.dispatchEvent(new CustomEvent('dm-depo', {
        detail: Object.assign({ bolum: bolum }, ayrinti || {}) }));
    } catch (e) {}
  }

  /* ── REYON EŞLEMESİ ────────────────────────────────────────────────
     🔴 DONÖRDE REYON NİTELİĞİ YOK — parti 2'de ölçüldü: tarif
     detayının `.ing-row`u reyon taşımıyor. Reyon ADLARI uydurulmadı,
     prototipin kendi `#addReyon` seçeneklerinden alındı
     (dadamutfak-view/alisveris-listesi-v1.html · 11 seçenek, SIRASI
     bozulmadan). Eşleşme anahtar kelimeyle yapılır; eşleşmeyen kalem
     "Bakkaliye"ye değil, prototipte de olmayan bir yere DEĞİL, ilk
     eşleşmesizler kovası olan `bakkal`a düşer ve satırında kaynağı
     yazar — kullanıcı yanlışsa taşıyabilir. */
  var REYONLAR = [
    { k:'manav',        ad:'Manav',                 ikon:'fa-carrot' },
    { k:'kasap',        ad:'Kasap & Şarküteri',     ikon:'fa-drumstick-bite' },
    { k:'sut',          ad:'Süt & Kahvaltılık',     ikon:'fa-cheese' },
    { k:'firin',        ad:'Fırın & Ekmek',         ikon:'fa-bread-slice' },
    { k:'bakliyat',     ad:'Bakliyat & Makarna',    ikon:'fa-wheat-awn' },
    { k:'baharat',      ad:'Baharat & Sos',         ikon:'fa-mortar-pestle' },
    { k:'icecek',       ad:'İçecekler',             ikon:'fa-mug-hot' },
    { k:'atistirmalik', ad:'Atıştırmalık',          ikon:'fa-cookie-bite' },
    { k:'donuk',        ad:'Donuk Ürünler',         ikon:'fa-snowflake' },
    { k:'bakkal',       ad:'Bakkaliye',             ikon:'fa-basket-shopping' },
    { k:'temizlik',     ad:'Temizlik & Ev',         ikon:'fa-spray-can-sparkles' }
  ];
  var ESLEME = [
    ['manav',    ['domates','biber','soğan','sogan','salatalık','salatalik','maydanoz','limon','mantar','patates','patlıcan','patlican','kabak','havuç','havuc','marul','roka','dereotu','nane','sarımsak','sarimsak','elma','muz','portakal','ıspanak','ispanak','pırasa','pirasa','lahana','brokoli','karnabahar','avokado','çilek','cilek','üzüm','uzum','zeytin','turp','kereviz','bezelye','fasulye taze','semizotu','tere','fesleğen','feslegen','incir','armut','şeftali','seftali','kayısı','kayisi','narenciye','misir taze','taze']],
    ['kasap',    ['kıyma','kiyma','et','tavuk','hindi','kuzu','dana','but','göğüs','gogus','pastırma','pastirma','sucuk','salam','jambon','sosis','ciğer','ciger','kanat','pirzola','kuşbaşı','kusbasi','balık','balik','hamsi','levrek','çipura','cipura','somon','karides','midye','kalamar','kuyruk yağı','kuyruk yagi']],
    ['sut',      ['süt','sut','yoğurt','yogurt','peynir','kaşar','kasar','lor','tereyağ','tereyag','krema','kaymak','ayran','yumurta','labne','çökelek','cokelek','margarin']],
    ['firin',    ['ekmek','lavaş','lavas','yufka','pide','bazlama','simit','galeta','tost ekmeği','baget','hamur']],
    ['bakliyat', ['pirinç','pirinc','bulgur','mercimek','nohut','fasulye','barbunya','makarna','şehriye','sehriye','irmik','un','nişasta','nisasta','yulaf','kuskus','couscous','kinoa','arpa','buğday','bugday','tarhana','mısır unu','misir unu']],
    ['baharat',  ['tuz','karabiber','pul biber','kimyon','kekik','nane kuru','sumak','tarçın','tarcin','zerdeçal','zerdecal','köri','kori','safran','vanilya','kabartma','maya','sos','ketçap','ketcap','mayonez','hardal','sirke','salça','salca','soya','limon suyu','zeytinyağı','zeytinyagi','ayçiçek','aycicek','yağ','yag','bal','pekmez','şeker','seker','tahin','susam','kakao','çikolata','cikolata','ceviz','fındık','findik','badem','antep fıstığ','antep fistig','fıstık','fistik','kuş üzümü','kus uzumu','kuru üzüm','kuru uzum','hindistan cevizi','jelatin','glikoz','baharat']],
    ['icecek',   ['su','maden suyu','soda','çay','cay','kahve','meyve suyu','kola','gazoz','şarap','sarap','bira']],
    ['donuk',    ['dondurulmuş','dondurulmus','donuk','dondurma']],
    ['temizlik', ['deterjan','sabun','bulaşık','bulasik','çamaşır','camasir','peçete','pecete','streç','strec','folyo','poşet','poset','pişirme kağıdı','pisirme kagidi']]
  ];
  function reyonBul(ad) {
    var a = String(ad || '').toLocaleLowerCase('tr');
    for (var i = 0; i < ESLEME.length; i++)
      for (var j = 0; j < ESLEME[i][1].length; j++)
        if (a.indexOf(ESLEME[i][1][j]) !== -1) return ESLEME[i][0];
    return 'bakkal';
  }
  function reyonKaydi(k) {
    for (var i = 0; i < REYONLAR.length; i++) if (REYONLAR[i].k === k) return REYONLAR[i];
    return REYONLAR[REYONLAR.length - 2];
  }

  var slugla = function (t) {
    return String(t || '').toLocaleLowerCase('tr')
      .replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g')
      .replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c')
      .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  };

  /* ═══ ALIŞVERİŞ LİSTESİ ═══════════════════════════════════════════ */
  function liste() { var d = hamOku(); return Array.isArray(d.alisveris) ? d.alisveris : []; }
  function listeYaz(l) { var d = hamOku(); d.alisveris = l; var ok = hamYaz(d); yay('alisveris', { liste:l, kalici:ok }); return ok; }

  function kalemVar(ad) { var id = slugla(ad); return liste().some(function (k) { return k.id === id; }); }

  /* Kalem eklenir; AYNI kalem başka tariften de geliyorsa satır
     ÇOĞALTILMAZ — kaynak listesine eklenir ve miktar satırı büyür.
     (Sayfanın kendi cümlesi: "aynı malzeme tek satırda toplanır".) */
  function ekle(kalem) {
    var l = liste(), id = slugla(kalem.ad);
    var v = null;
    for (var i = 0; i < l.length; i++) if (l[i].id === id) { v = l[i]; break; }
    if (v) {
      var yeni = false;
      (kalem.kaynak || []).forEach(function (k) {
        if (!v.kaynak.some(function (x) { return x.slug === k.slug; })) { v.kaynak.push(k); yeni = true; }
      });
      if (kalem.miktar && v.miktar.indexOf(kalem.miktar) === -1) { v.miktar += ' + ' + kalem.miktar; yeni = true; }
      if (yeni) listeYaz(l);
      return { durum: yeni ? 'birlesti' : 'zaten', kalem: v };
    }
    var r = kalem.reyon || reyonBul(kalem.ad);
    v = { id:id, ad:kalem.ad, miktar:kalem.miktar || '', reyon:r,
          kaynak:kalem.kaynak || [], alindi:false, el:!!kalem.el, eklendi:Date.now() };
    l.push(v); listeYaz(l);
    return { durum:'eklendi', kalem:v };
  }
  function cikar(id) {
    var l = liste(), n = l.filter(function (k) { return k.id !== id; });
    if (n.length === l.length) return false;
    listeYaz(n); return true;
  }
  function isaretle(id, alindi) {
    var l = liste(), d = false;
    l.forEach(function (k) { if (k.id === id) { k.alindi = !!alindi; d = true; } });
    if (d) listeYaz(l); return d;
  }
  function temizle(yalnizAlinan) {
    var l = liste();
    listeYaz(yalnizAlinan ? l.filter(function (k) { return !k.alindi; }) : []);
  }

  /* ═══ GENEL BÖLÜM DEPOSU — B1 · L6 · A2 buradan yazar ══════════════ */
  function bolumOku(ad, vars) { var d = hamOku(); return (ad in d) ? d[ad] : vars; }
  function bolumYaz(ad, deger) { var d = hamOku(); d[ad] = deger; var ok = hamYaz(d); yay(ad, { deger:deger, kalici:ok }); return ok; }

  window.dmDepo = {
    maket: true,
    kalici: erisilebilir,
    REYONLAR: REYONLAR,
    slugla: slugla,
    reyonBul: reyonBul,
    reyonKaydi: reyonKaydi,
    liste: liste, ekle: ekle, cikar: cikar, isaretle: isaretle,
    temizle: temizle, kalemVar: kalemVar,
    oku: bolumOku, yaz: bolumYaz
  };

  /* Başka sekmede değişirse bu sekme de haberdar olur. */
  window.addEventListener('storage', function (e) {
    if (e.key === ANAHTAR) yay('*', { disaridan:true });
  });

  /* ═══ TOAST ═══════════════════════════════════════════════════════
     dmToast('Listeye eklendi', { tip:'basarili', alt:'Domates · 1 kg',
                                  geri:{ metin:'Geri al', cb:fn } }) */
  var kap = null;
  function toastKap() {
    if (kap && document.body.contains(kap)) return kap;
    kap = document.querySelector('.dm-toast-kap');
    if (!kap) {
      kap = document.createElement('div');
      kap.className = 'dm-toast-kap';
      kap.setAttribute('role', 'status');
      kap.setAttribute('aria-live', 'polite');
      document.body.appendChild(kap);
    }
    return kap;
  }
  var IKON = { basarili:'fa-circle-check', hata:'fa-circle-exclamation', bilgi:'fa-circle-info' };
  window.dmToast = function (metin, se) {
    se = se || {};
    var tip = se.tip || 'basarili';
    var t = document.createElement('div');
    t.className = 'dm-toast ' + tip;
    var i = document.createElement('i');
    i.className = 'fa-solid ' + (IKON[tip] || IKON.bilgi);
    i.setAttribute('aria-hidden', 'true');
    var g = document.createElement('div');
    g.className = 'dm-toast-govde';
    var b = document.createElement('b'); b.textContent = metin; g.appendChild(b);
    if (se.alt) { var s = document.createElement('span'); s.textContent = se.alt; g.appendChild(s); }
    t.appendChild(i); t.appendChild(g);
    if (se.geri && typeof se.geri.cb === 'function') {
      var gb = document.createElement('button');
      gb.type = 'button'; gb.className = 'dm-toast-geri';
      gb.textContent = se.geri.metin || 'Geri al';
      gb.addEventListener('click', function () { se.geri.cb(); kaldir(); });
      t.appendChild(gb);
    }
    var k = document.createElement('button');
    k.type = 'button'; k.className = 'dm-toast-kapat';
    k.setAttribute('aria-label', 'Bildirimi kapat');
    k.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    k.addEventListener('click', kaldir);
    t.appendChild(k);
    toastKap().appendChild(t);
    var zaman = setTimeout(kaldir, se.sure || 4200);
    function kaldir() {
      clearTimeout(zaman);
      if (!t.parentNode) return;
      t.classList.add('cikis');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 180);
    }
    return { kapat: kaldir };
  };

  /* ═══ MODAL ═══════════════════════════════════════════════════════
     dmModal.ac(el) / .kapat(el) — odak tuzağı + Escape + geri dönüş.
     Perde tek: sayfada kaç modal olursa olsun bir `.dm-modal-ortu`. */
  var ortu = null, acikModal = null, oncekiOdak = null;
  function perde() {
    if (ortu && document.body.contains(ortu)) return ortu;
    ortu = document.querySelector('.dm-modal-ortu');
    if (!ortu) {
      ortu = document.createElement('div');
      ortu.className = 'dm-modal-ortu';
      document.body.appendChild(ortu);
    }
    ortu.addEventListener('click', function () { if (acikModal) window.dmModal.kapat(acikModal); });
    return ortu;
  }
  var ODAKLANIR = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  window.dmModal = {
    ac: function (el) {
      if (!el) return;
      oncekiOdak = document.activeElement;
      perde().classList.add('acik');
      el.classList.add('acik');
      el.removeAttribute('hidden');
      document.body.classList.add('dm-modal-acik');
      acikModal = el;
      var ilk = el.querySelector(ODAKLANIR);
      if (ilk) ilk.focus();
    },
    kapat: function (el) {
      el = el || acikModal;
      if (!el) return;
      el.classList.remove('acik');
      el.setAttribute('hidden', '');
      if (acikModal === el) acikModal = null;
      if (!acikModal) {
        perde().classList.remove('acik');
        document.body.classList.remove('dm-modal-acik');
      }
      if (oncekiOdak && oncekiOdak.focus) oncekiOdak.focus();
    },
    acikMi: function () { return !!acikModal; }
  };
  document.addEventListener('keydown', function (e) {
    if (!acikModal) return;
    if (e.key === 'Escape') { e.preventDefault(); window.dmModal.kapat(acikModal); return; }
    if (e.key !== 'Tab') return;
    var o = [].slice.call(acikModal.querySelectorAll(ODAKLANIR))
              .filter(function (x) { return x.offsetParent !== null; });
    if (!o.length) return;
    var ilk = o[0], son = o[o.length - 1];
    if (e.shiftKey && document.activeElement === ilk) { e.preventDefault(); son.focus(); }
    else if (!e.shiftKey && document.activeElement === son) { e.preventDefault(); ilk.focus(); }
  });
})();
