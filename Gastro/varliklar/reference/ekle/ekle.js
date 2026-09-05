/* =====================================================================
   DADAGASTRO · İÇERİK EKLEME YÜZEYLERİ — SÜRÜCÜ (ajan C, parti 2)
   ---------------------------------------------------------------------
   Kapsam: puf-noktasi-ekle · tarif-ekle · g-video-serilerim
   🔴 KURAL: "ölü düğme 0". Bu dosyadaki her kanca, sayfadaki GÖRÜNÜR bir
      düğmenin karşılığıdır; karşılığı olmayan kanca yazılmaz.
   🔴 DURUM BAYRAĞI DOM'A YAZILMAZ. Bu depoda kayıtlı kusur: kaydedilmiş
      render DOM'undaki "kuruldum" bayrağı ikinci yüklemede dinleyicinin
      hiç bağlanmamasına yol açıyor. Bayrak modül kapsamında yaşar.
   ===================================================================== */
(function () {
  'use strict';
  var d = document;
  if (!d.querySelector('[data-ek-form],[data-ek-seriler]')) return;

  var $  = function (s, k) { return (k || d).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || d).querySelectorAll(s)); };
  var el = function (t, sinif, metin) {
    var n = d.createElement(t);
    if (sinif) n.className = sinif;
    if (metin != null) n.textContent = metin;
    return n;
  };

  /* ═══ 1 · GÖRÜNÜRLÜK (L7) ═════════════════════════════════════════
     `Profil- detayları.pdf §1.4` — "içeriği ücretsiz veya abonelere özel
     yapma". Seçim forma `name="gorunurluk"` ile yazılır; yayın kartının
     kenar şeridi, durum satırı ve rozeti seçimle birlikte DEĞİŞİR. */
  var GORUNURLUK = {
    herkes: {
      sinif: '',
      ikon: 'fa-globe',
      metin: 'Herkese açık yayımlanır. Yayına alındığında arama sonuçlarında ve listelerde herkes görebilir.'
    },
    abone: {
      sinif: 'abone',
      ikon: 'fa-lock',
      metin: 'Yalnız sana abone olanlar görebilir. Şef profilinde "Abonelere özel" rozetiyle listelenir.'
    }
  };

  /* 🔴 KAPSAM ZORUNLU — ÖLÇÜLDÜ 2026-09-05, etkileşim kapısı yakaladı.
     İlk yazımda seçim BELGE ÇAPINDA okunuyordu (`$('…:checked')` ilk
     işaretli radyoyu döndürür) ve sonuç BÜTÜN kartlara yazılıyordu.
     `g-video-serilerim.html`de ÜÇ ayrı form var ve her birinin kendi
     `name="gorunurluk"` grubu var: "Seri Oluştur"da abone seçilince
     rozet DEĞİŞMİYORDU, çünkü belgedeki ilk işaretli radyo hâlâ
     "Video Ekle" formunun "herkes"iydi. Kapsam artık radyonun kendi
     formu; formsuz kap için belge. */
  function gorunurlukUygula(kap) {
    var kaplar = kap ? [kap] : $$('form[data-ek-form]');
    if (!kaplar.length) kaplar = [d];
    kaplar.forEach(function (k) {
      var secili = k.querySelector('input[name="gorunurluk"]:checked');
      if (!secili) return;
      var d0 = GORUNURLUK[secili.value] || GORUNURLUK.herkes;
      $$('[data-ek-yayin]', k).forEach(function (y) { y.classList.toggle('abone', d0.sinif === 'abone'); });
      $$('[data-ek-durum]', k).forEach(function (s) {
        var i = s.querySelector('i');
        if (i) i.className = 'fa-solid ' + d0.ikon;
        var t = s.querySelector('span');
        if (t) t.textContent = d0.metin;
      });
      $$('[data-ek-rozet]', k).forEach(function (r) {
        r.textContent = secili.value === 'abone' ? 'Abonelere özel' : 'Herkese açık';
        r.className = 'durum-hapi ' + (secili.value === 'abone' ? 'bekleyen' : 'cozulen');
      });
    });
  }
  $$('input[name="gorunurluk"]').forEach(function (r) {
    r.addEventListener('change', function () { gorunurlukUygula(r.closest('form') || d); });
  });
  gorunurlukUygula();
  $$('input[name="gorunurluk"]').forEach(function (r) {
    r.addEventListener('change', function () { if (typeof hazirTazele === 'function') hazirTazele(); });
  });

  /* ═══ 2 · SAYAÇLAR ════════════════════════════════════════════════ */
  function sayaclariTazele() {
    $$('[data-ek-sayac]').forEach(function (s) {
      var tur = s.getAttribute('data-ek-sayac');
      var b = s.querySelector('b');
      if (!b) return;
      if (tur === 'blok')    b.textContent = $$('[data-ek-bloklar] .ek-blok').length;
      if (tur === 'gorsel')  b.textContent = $$('[data-ek-gorseller] .ek-gorsel').length;
      if (tur === 'malzeme') b.textContent = $$('[data-ek-malzemeler] .ek-msatir').length;
      if (tur === 'alternatif') b.textContent = $$('[data-ek-malzemeler] .ek-alt').filter(function (i) { return i.value.trim(); }).length;
      if (tur === 'adim')    b.textContent = $$('[data-ek-adim]').length;
      if (tur === 'seri')    b.textContent = $$('[data-ek-seri]').length;
      if (tur === 'bolum')   b.textContent = $$('[data-ek-seri] .ek-bolum').length;
    });
    if (typeof hazirTazele === 'function') hazirTazele();
  }

  /* ═══ 2-B · PAYLAŞIMA HAZIR — CANLI ÖNİZLEME ══════════════════════
     Donörün `.send-panel`i ("Onaya göndermeden önce önizle") burada
     GERÇEK önizleme. Kaynağı form; yeni veri UYDURULMAZ: başlık, kategori,
     kapak görseli ve blok sayısı doğrudan alanlardan okunur.
     Eksik satırının düğmesi ölü değil — eksik alana odak verir.  */
  function hazirTazele() {
    var kart = $('[data-ek-hazir]');
    if (!kart) return;
    var form = $('form[data-ek-form]') || d;

    var baslik = (form.querySelector('#pufBaslik') || {}).value || '';
    var kSec   = form.querySelector('#pufKategori');
    var kategori = kSec && kSec.value ? kSec.value : '';
    var blok   = $$('[data-ek-bloklar] .ek-blok').length;
    var kapak  = form.querySelector('[data-ek-gorseller="kapak"] .ek-gorsel.ek-kapakli img') ||
                 form.querySelector('[data-ek-gorseller="kapak"] .ek-gorsel img');
    var abone  = ((form.querySelector('input[name="gorunurluk"]:checked') || {}).value === 'abone');

    var b = kart.querySelector('[data-ek-onizleme-baslik]');
    if (b) { b.textContent = baslik.trim() || 'Başlığın burada görünecek'; b.classList.toggle('bos', !baslik.trim()); }
    var k = kart.querySelector('[data-ek-onizleme-kategori]');
    if (k) { k.textContent = kategori || 'Kategori seçilmedi'; k.classList.toggle('bos', !kategori); }
    var n = kart.querySelector('[data-ek-onizleme-blok]');
    if (n) n.textContent = blok + ' blok';
    var g = kart.querySelector('[data-ek-onizleme-gorunurluk]');
    if (g) { g.textContent = abone ? 'Abonelere özel' : 'Herkese açık';
             g.className = 'durum-hapi ' + (abone ? 'bekleyen' : 'cozulen'); }

    /* kapak: satır içi style YASAK — <img> ile çizilir */
    var yuva = kart.querySelector('[data-ek-onizleme-gorsel]');
    if (yuva) {
      var eski = yuva.querySelector('img');
      if (kapak && (!eski || eski.src !== kapak.src)) {
        if (eski) eski.remove();
        var im = d.createElement('img'); im.src = kapak.src; im.alt = 'Kapak görseli önizlemesi';
        yuva.appendChild(im);
      } else if (!kapak && eski) { eski.remove(); }
      var bos = yuva.querySelector('.ek-onizleme-bos');
      if (bos) bos.hidden = !!kapak;
    }

    var durum = { baslik: !!baslik.trim(), kategori: !!kategori, blok: blok > 0 };
    var tamamSay = 0;
    $$('[data-ek-hazir-kalem]', kart).forEach(function (li) {
      var ad = li.getAttribute('data-ek-hazir-kalem');
      var ok = !!durum[ad];
      if (ok) tamamSay++;
      li.classList.toggle('tamam', ok);
      var im = li.querySelector('.ek-hazir-im');
      if (im) im.className = 'ek-hazir-im fa-solid ' + (ok ? 'fa-circle-check' : 'fa-circle');
    });
    var rozet = kart.querySelector('[data-ek-hazir-rozet]');
    if (rozet) {
      var toplam = $$('[data-ek-hazir-kalem]', kart).length;
      rozet.textContent = tamamSay + '/' + toplam + ' hazır';
      rozet.className = 'durum-hapi ' + (tamamSay === toplam ? 'cozulen' : 'kapali');
    }
    kart.classList.toggle('hazir-tam', tamamSay === $$('[data-ek-hazir-kalem]', kart).length);
  }

  /* eksik satırı → eksik alana odak. Ölü düğme sınamasının geçtiği yer. */
  d.addEventListener('click', function (e) {
    var t = e.target.closest('[data-ek-eksik]');
    if (!t) return;
    e.preventDefault();
    var hedef = d.querySelector(t.getAttribute('data-ek-eksik'));
    if (!hedef) return;
    hedef.scrollIntoView({ block: 'center', behavior: 'smooth' });
    try { hedef.focus({ preventScroll: true }); } catch (x) { hedef.focus(); }
    var alan = hedef.closest('.alan') || hedef.closest('.ek-ekle-satiri');
    if (alan) { alan.classList.add('ek-isaret'); setTimeout(function () { alan.classList.remove('ek-isaret'); }, 1400); }
  });

  d.addEventListener('input',  hazirTazele);
  d.addEventListener('change', hazirTazele);

  /* karakter sayacı — `maxlength` taşıyan alanların etiketinde */
  $$('[data-ek-sayim]').forEach(function (girdi) {
    var hedef = $('[data-ek-sayim-hedef="' + girdi.getAttribute('data-ek-sayim') + '"]');
    if (!hedef) return;
    var yaz = function () { hedef.textContent = girdi.value.length + '/' + (girdi.getAttribute('maxlength') || '—'); };
    girdi.addEventListener('input', yaz); yaz();
  });

  /* ═══ 3 · İÇERİK BLOKLARI ═════════════════════════════════════════ */
  var BLOK = {
    baslik:   { ad: 'Ara başlık', ikon: 'fa-heading' },
    paragraf: { ad: 'Paragraf', ikon: 'fa-align-left' },
    gorsel:   { ad: 'Görsel',   ikon: 'fa-image' },
    video:    { ad: 'Video',    ikon: 'fa-film' }
  };

  function blokKur(tur) {
    var t = BLOK[tur] || BLOK.paragraf;
    var kap = el('div', 'ek-blok');
    kap.setAttribute('data-tur', tur);

    var no = el('span', 'ek-blok-no', '1');
    var govde = el('div', 'ek-blok-govde');

    var etiket = el('span', 'ek-blok-tur');
    etiket.innerHTML = '<i class="fa-solid ' + t.ikon + '" aria-hidden="true"></i> ' + t.ad;
    govde.appendChild(etiket);

    if (tur === 'baslik') {
      var bg = el('input', 'alan-girdi ek-blok-baslik');
      bg.type = 'text'; bg.name = 'blok-baslik'; bg.maxLength = 80;
      bg.placeholder = 'Ara başlık — okuyucu göz gezdirirken buradan yakalar';
      bg.setAttribute('aria-label', 'Ara başlık metni');
      govde.appendChild(bg);
    }
    if (tur === 'paragraf') {
      var ta = el('textarea', 'alan-girdi alan-metin');
      ta.name = 'blok-paragraf';
      ta.placeholder = 'Püf noktasını anlat — tek bir fikir, net cümlelerle.';
      ta.setAttribute('aria-label', 'Paragraf metni');
      govde.appendChild(ta);
    }
    if (tur === 'gorsel') {
      var alan = el('div', 'birak-alani');
      alan.setAttribute('data-ek-birak', '');
      alan.innerHTML =
        '<span><i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i></span>' +
        '<b>Görseli sürükle ya da seçmek için tıkla</b>' +
        '<small>PNG veya JPG · en az 1200px genişlik</small>';
      var gir = d.createElement('input');
      gir.type = 'file'; gir.accept = 'image/*'; gir.className = 'yalniz-okuyucu';
      gir.name = 'blok-gorsel'; gir.setAttribute('aria-label', 'Blok görseli seç');
      alan.appendChild(gir);
      govde.appendChild(alan);
      var izgara = el('div', 'ek-gorseller');
      izgara.setAttribute('data-ek-gorseller', 'blok');
      govde.appendChild(izgara);
      var acik = el('input', 'alan-girdi');
      acik.type = 'text'; acik.name = 'blok-gorsel-aciklama';
      acik.placeholder = 'Görsel açıklaması (isteğe bağlı)';
      acik.setAttribute('aria-label', 'Görsel açıklaması');
      govde.appendChild(acik);
      birakAlaniBagla(alan);
    }
    if (tur === 'video') {
      govde.appendChild(videoAlaniKur('blok-video'));
    }

    var yan = el('div', 'ek-blok-yan');
    yan.innerHTML =
      '<button type="button" class="ek-yukari" data-ek-yukari title="Yukarı taşı" aria-label="Bloğu yukarı taşı"><i class="fa-solid fa-chevron-up" aria-hidden="true"></i></button>' +
      '<button type="button" class="ek-asagi"  data-ek-asagi  title="Aşağı taşı"  aria-label="Bloğu aşağı taşı"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
      '<button type="button" class="ek-sil"    data-ek-sil    title="Bloğu sil"   aria-label="Bloğu sil"><i class="fa-solid fa-trash-can" aria-hidden="true"></i></button>';

    kap.appendChild(no); kap.appendChild(govde); kap.appendChild(yan);
    return kap;
  }

  /* Numara yalan söylemesin: her değişiklikten sonra yeniden yazılır. */
  function bloklariNumarala() {
    $$('[data-ek-bloklar]').forEach(function (liste) {
      var b = $$('.ek-blok', liste);
      b.forEach(function (x, i) {
        var n = x.querySelector('.ek-blok-no'); if (n) n.textContent = i + 1;
        var y = x.querySelector('[data-ek-yukari]'), a = x.querySelector('[data-ek-asagi]');
        if (y) y.disabled = i === 0;
        if (a) a.disabled = i === b.length - 1;
      });
      var bos = liste.parentNode.querySelector('[data-ek-bos]');
      if (bos) bos.hidden = b.length > 0;
    });
    sayaclariTazele();
  }

  $$('[data-ek-ekle]').forEach(function (dugme) {
    dugme.addEventListener('click', function () {
      var liste = $('[data-ek-bloklar]');
      if (!liste) return;
      var yeni = blokKur(dugme.getAttribute('data-ek-ekle'));
      liste.appendChild(yeni);
      bloklariNumarala();
      var odak = yeni.querySelector('textarea,input[type="text"],input[type="url"],button');
      if (odak) odak.focus();
    });
  });

  /* ═══ 4 · SIRALAMA + SİLME (blok · malzeme · seri · bölüm) ════════
     Tek yetkili: kap sınıfına göre komşu bulunur, `insertBefore` ile
     yer değiştirir. `.ek-blok`ta numara, seride sıra rozeti tazelenir. */
  d.addEventListener('click', function (e) {
    var y = e.target.closest('[data-ek-yukari]'),
        a = e.target.closest('[data-ek-asagi]'),
        s = e.target.closest('[data-ek-sil]');
    if (!y && !a && !s) return;
    var dugme = y || a || s;
    var satir = dugme.closest('.ek-blok,.ek-msatir,.ek-mgrup,.ek-seri,.ek-bolum');
    if (!satir) return;
    e.preventDefault();
    if (s) {
      satir.remove();
    } else if (y) {
      var onc = satir.previousElementSibling;
      if (onc) satir.parentNode.insertBefore(satir, onc);
    } else {
      var son = satir.nextElementSibling;
      if (son) satir.parentNode.insertBefore(son, satir);
    }
    bloklariNumarala(); malzemeTazele(); serileriTazele();
  });

  /* ═══ 5 · GÖRSEL YÜKLEME ══════════════════════════════════════════
     Gerçek dosya okunur (`URL.createObjectURL`); ızgara satır içi style
     olmadan `<img src>` ile çizilir. Kapak yıldızı ilk görsele düşer,
     tıklayınca değişir. */
  function gorselKur(url, ad, izgara) {
    var kutu = el('div', 'ek-gorsel');
    var img = d.createElement('img');
    img.src = url; img.alt = ad || 'Yüklenen görsel';
    kutu.appendChild(img);
    var muhur = el('span', 'ek-kapak-muhur');
    muhur.innerHTML = '<i class="fa-solid fa-star" aria-hidden="true"></i> Kapak';
    kutu.appendChild(muhur);
    var arac = el('span', 'ek-gorsel-arac');
    arac.innerHTML =
      '<button type="button" data-ek-kapak title="Kapak yap" aria-label="Kapak görseli yap"><i class="fa-solid fa-star" aria-hidden="true"></i></button>' +
      '<button type="button" data-ek-gorsel-sil title="Görseli kaldır" aria-label="Görseli kaldır"><i class="fa-solid fa-trash-can" aria-hidden="true"></i></button>';
    kutu.appendChild(arac);
    izgara.appendChild(kutu);
    if (!izgara.querySelector('.ek-gorsel.ek-kapakli')) kutu.classList.add('ek-kapakli');
    sayaclariTazele();
  }

  d.addEventListener('click', function (e) {
    var k = e.target.closest('[data-ek-kapak]');
    var sil = e.target.closest('[data-ek-gorsel-sil]');
    if (!k && !sil) return;
    e.preventDefault();
    var kutu = (k || sil).closest('.ek-gorsel');
    var izgara = kutu.parentNode;
    if (k) {
      $$('.ek-gorsel', izgara).forEach(function (x) { x.classList.remove('ek-kapakli'); });
      kutu.classList.add('ek-kapakli');
    } else {
      var kapakti = kutu.classList.contains('ek-kapakli');
      kutu.remove();
      var kalan = izgara.querySelector('.ek-gorsel');
      if (kapakti && kalan) kalan.classList.add('ek-kapakli');
      sayaclariTazele();
    }
  });

  function birakAlaniBagla(alan) {
    var girdi = alan.querySelector('input[type="file"]');
    if (!girdi) return;
    var izgara = alan.parentNode.querySelector('[data-ek-gorseller]');
    var al = function (dosyalar) {
      if (!izgara) return;
      Array.prototype.slice.call(dosyalar).forEach(function (f) {
        if (!/^image\//.test(f.type)) return;
        gorselKur(URL.createObjectURL(f), f.name, izgara);
      });
    };
    alan.addEventListener('click', function (e) {
      if (e.target === girdi) return;
      girdi.click();
    });
    alan.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); girdi.click(); }
    });
    girdi.addEventListener('change', function () { al(girdi.files); girdi.value = ''; });
    ['dragover', 'dragenter'].forEach(function (t) {
      alan.addEventListener(t, function (e) { e.preventDefault(); alan.classList.add('uzerinde'); });
    });
    ['dragleave', 'drop'].forEach(function (t) {
      alan.addEventListener(t, function (e) { e.preventDefault(); alan.classList.remove('uzerinde'); });
    });
    alan.addEventListener('drop', function (e) { if (e.dataTransfer) al(e.dataTransfer.files); });
  }
  $$('[data-ek-birak]').forEach(birakAlaniBagla);

  /* ═══ 6 · VİDEO GİRDİSİ — iki kip, GERÇEK bağ denetimi ════════════
     Kip 1: dosya yükleme. Kip 2: YouTube / Vimeo bağlantısı.
     Bağ denetimi biçimseldir (ağ isteği YOK): tanınan barındırıcı ve
     kimlik deseni aranır, tanınmayan bağ hata satırı açar. */
  var VIDEO_DESEN = [
    { ad: 'YouTube', re: /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i },
    { ad: 'Vimeo',   re: /^(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:video\/)?(\d{6,})/i }
  ];

  function videoAlaniKur(ad) {
    var kap = el('div', 'ek-video');
    kap.innerHTML =
      '<div class="ek-kip" role="group" aria-label="Video kaynağı">' +
        '<button class="cip" type="button" data-ek-kip="dosya" aria-pressed="true"><i class="fa-solid fa-file-video" aria-hidden="true"></i> Dosya yükle</button>' +
        '<button class="cip" type="button" data-ek-kip="bag" aria-pressed="false"><i class="fa-brands fa-youtube" aria-hidden="true"></i> Bağlantı yapıştır</button>' +
      '</div>';
    var pDosya = el('div', 'ek-kip-pano');
    pDosya.setAttribute('data-ek-kip-pano', 'dosya');
    var alan = el('div', 'birak-alani');
    alan.setAttribute('data-ek-video-birak', '');
    alan.innerHTML =
      '<span><i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i></span>' +
      '<b>Video dosyasını sürükle ya da seçmek için tıkla</b>' +
      '<small>MP4 veya MOV · en çok 2 GB</small>';
    var gir = d.createElement('input');
    gir.type = 'file'; gir.accept = 'video/*'; gir.className = 'yalniz-okuyucu';
    gir.name = ad + '-dosya'; gir.setAttribute('aria-label', 'Video dosyası seç');
    alan.appendChild(gir);
    var secildi = el('p', 'alan-yardim');
    secildi.hidden = true;
    pDosya.appendChild(alan); pDosya.appendChild(secildi);

    var pBag = el('div', 'ek-kip-pano');
    pBag.setAttribute('data-ek-kip-pano', 'bag'); pBag.hidden = true;
    var url = d.createElement('input');
    url.type = 'url'; url.className = 'alan-girdi'; url.name = ad + '-bag';
    url.placeholder = 'https://www.youtube.com/watch?v=…';
    url.setAttribute('aria-label', 'Video bağlantısı');
    url.setAttribute('data-ek-video-bag', '');
    var onizleme = el('p', 'ek-video-onizleme');
    onizleme.setAttribute('role', 'status');
    var hata = el('span', 'alan-hata');
    hata.innerHTML = '<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> Bağlantıyı tanıyamadım. YouTube ya da Vimeo adresi yapıştır.';
    pBag.appendChild(url); pBag.appendChild(onizleme); pBag.appendChild(hata);

    kap.appendChild(pDosya); kap.appendChild(pBag);

    gir.addEventListener('change', function () {
      var f = gir.files && gir.files[0];
      secildi.hidden = !f;
      if (f) secildi.innerHTML = '<i class="fa-solid fa-circle-check" aria-hidden="true"></i> <span>' +
        f.name + ' · ' + (f.size / 1048576).toFixed(1) + ' MB seçildi</span>';
    });
    alan.addEventListener('click', function (e) { if (e.target !== gir) gir.click(); });

    url.addEventListener('input', function () {
      var v = url.value.trim();
      if (!v) { onizleme.classList.remove('goster'); hata.classList.remove('goster'); url.classList.remove('hatali'); return; }
      var bulunan = null;
      VIDEO_DESEN.forEach(function (p) { if (!bulunan && p.re.test(v)) bulunan = p; });
      if (bulunan) {
        var kimlik = v.match(bulunan.re)[1];
        onizleme.innerHTML = '<i class="fa-solid fa-circle-play" aria-hidden="true"></i> ' +
          bulunan.ad + ' videosu tanındı · kimlik ' + kimlik;
        onizleme.classList.add('goster'); hata.classList.remove('goster'); url.classList.remove('hatali');
      } else {
        onizleme.classList.remove('goster'); hata.classList.add('goster'); url.classList.add('hatali');
      }
    });
    return kap;
  }

  /* sayfada markup ile duran video alanlarını da bağla */
  $$('[data-ek-video-yuva]').forEach(function (yuva) {
    yuva.appendChild(videoAlaniKur(yuva.getAttribute('data-ek-video-yuva') || 'video'));
  });

  d.addEventListener('click', function (e) {
    var k = e.target.closest('[data-ek-kip]');
    if (!k) return;
    e.preventDefault();
    var kap = k.closest('.ek-video') || k.closest('[data-ek-kip-kap]');
    if (!kap) return;
    var secim = k.getAttribute('data-ek-kip');
    $$('[data-ek-kip]', kap).forEach(function (x) {
      x.setAttribute('aria-pressed', String(x === k));
    });
    $$('[data-ek-kip-pano]', kap).forEach(function (p) {
      p.hidden = p.getAttribute('data-ek-kip-pano') !== secim;
    });
  });

  /* ═══ 7 · MALZEME SATIRLARI (tarif-ekle) ══════════════════════════
     "Alternatifi" alanı BURADA doğar. Tarif detayındaki ikame popover'ı
     (`.ing-pop`) bu alandan beslenir; alan boşsa detayda düğme BASILMAZ.
     Bu yüzden yer tutucu bunu açıkça söylüyor. */
  var BIRIMLER = ['Su bardağı', 'Çay bardağı', 'Yemek kaşığı', 'Tatlı kaşığı', 'Çay kaşığı',
    'Gram', 'Kilogram', 'Mililitre', 'Litre', 'Adet', 'Paket', 'Dilim', 'Tutam', 'Diş', 'Demet'];

  function malzemeSatiriKur() {
    var s = el('div', 'ek-msatir');
    var miktar = '<input class="alan-girdi ek-miktar" type="text" name="malzeme-miktar" placeholder="Miktar" aria-label="Miktar">';
    var birim = '<select class="alan-secim ek-birim" name="malzeme-birim" aria-label="Birim">' +
      '<option value="">Birim</option>' +
      BIRIMLER.map(function (b) { return '<option>' + b + '</option>'; }).join('') + '</select>';
    var adi = '<input class="alan-girdi ek-ad" type="text" name="malzeme-ad" placeholder="Malzeme adı" aria-label="Malzeme adı">';
    var alt = '<input class="alan-girdi ek-alt" type="text" name="malzeme-alternatif" placeholder="Alternatifi — boşsa tarifte gösterilmez" aria-label="Malzemenin alternatifi">';
    var arac = '<span class="ek-msatir-arac">' +
      '<button type="button" data-ek-yukari title="Yukarı taşı" aria-label="Malzemeyi yukarı taşı"><i class="fa-solid fa-chevron-up" aria-hidden="true"></i></button>' +
      '<button type="button" data-ek-asagi title="Aşağı taşı" aria-label="Malzemeyi aşağı taşı"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
      '<button type="button" class="ek-sil" data-ek-sil title="Satırı sil" aria-label="Malzeme satırını sil"><i class="fa-solid fa-trash-can" aria-hidden="true"></i></button>' +
      '</span>';
    s.innerHTML = miktar + birim + adi + alt + arac;
    return s;
  }

  function malzemeGrubuKur() {
    var g = el('div', 'ek-mgrup');
    g.innerHTML =
      '<input class="alan-girdi" type="text" name="malzeme-grup" placeholder="Grup adı — örneğin Hamur" aria-label="Malzeme grubu adı">' +
      '<span class="ek-msatir-arac">' +
      '<button type="button" data-ek-yukari title="Yukarı taşı" aria-label="Grubu yukarı taşı"><i class="fa-solid fa-chevron-up" aria-hidden="true"></i></button>' +
      '<button type="button" data-ek-asagi title="Aşağı taşı" aria-label="Grubu aşağı taşı"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
      '<button type="button" class="ek-sil" data-ek-sil title="Grubu kaldır" aria-label="Grubu kaldır"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
      '</span>';
    return g;
  }

  function malzemeTazele() {
    $$('[data-ek-malzemeler]').forEach(function (liste) {
      var hepsi = $$('.ek-msatir,.ek-mgrup', liste);
      hepsi.forEach(function (x, i) {
        var y = x.querySelector('[data-ek-yukari]'), a = x.querySelector('[data-ek-asagi]');
        if (y) y.disabled = i === 0;
        if (a) a.disabled = i === hepsi.length - 1;
      });
      var bos = liste.parentNode.querySelector('[data-ek-bos="malzeme"]');
      if (bos) bos.hidden = hepsi.length > 0;
    });
    sayaclariTazele();
  }

  $$('[data-ek-msatir-ekle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var liste = $('[data-ek-malzemeler]'); if (!liste) return;
      var yeni = malzemeSatiriKur(); liste.appendChild(yeni);
      malzemeTazele(); yeni.querySelector('input').focus();
    });
  });
  $$('[data-ek-mgrup-ekle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var liste = $('[data-ek-malzemeler]'); if (!liste) return;
      var yeni = malzemeGrubuKur(); liste.appendChild(yeni);
      malzemeTazele(); yeni.querySelector('input').focus();
    });
  });
  d.addEventListener('input', function (e) {
    if (e.target.classList && e.target.classList.contains('ek-alt')) sayaclariTazele();
  });

  /* ═══ 8 · ADIM ŞERİDİ (tarif-ekle) ════════════════════════════════ */
  function adimGoster(no) {
    $$('[data-ek-adim]').forEach(function (p) { p.hidden = p.getAttribute('data-ek-adim') !== String(no); });
    $$('[data-ek-adimlar] li').forEach(function (li) {
      var k = li.getAttribute('data-adim');
      li.classList.toggle('acik', k === String(no));
      li.setAttribute('aria-current', k === String(no) ? 'step' : 'false');
    });
    var ust = $('[data-ek-adimlar]');
    if (ust) ust.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  $$('[data-ek-adimlar] li').forEach(function (li) {
    li.addEventListener('click', function () { adimGoster(li.getAttribute('data-adim')); });
    li.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); li.click(); }
    });
  });
  $$('[data-ek-ileri]').forEach(function (b) {
    b.addEventListener('click', function () { adimGoster(b.getAttribute('data-ek-ileri')); });
  });
  $$('[data-ek-geri]').forEach(function (b) {
    b.addEventListener('click', function () { adimGoster(b.getAttribute('data-ek-geri')); });
  });

  /* ═══ 9 · TASLAK + ONAYA GÖNDER ═══════════════════════════════════
     Taslak: tarayıcıda saklanır (`localStorage`), satır durumu yazılır.
     Gönder: zorunlu alanlar denetlenir; eksikse ilk eksik alana odaklanır
     ve hata satırı açılır — sessizce başarılı olmaz. */
  function zorunluDenetle(form) {
    var eksik = [];
    $$('[required]', form).forEach(function (a) {
      var bos = !String(a.value || '').trim();
      a.classList.toggle('hatali', bos);
      var kutu = a.closest('.alan');
      var h = kutu && kutu.querySelector('.alan-hata');
      if (h) h.classList.toggle('goster', bos);
      if (bos) eksik.push(a);
    });
    return eksik;
  }

  $$('[data-ek-taslak]').forEach(function (b) {
    b.addEventListener('click', function () {
      var form = b.closest('form') || $('[data-ek-form]');
      var anahtar = 'dm_gastro_taslak_' + (form.getAttribute('data-ek-form') || 'genel');
      var veri = {};
      $$('input,textarea,select', form).forEach(function (a) {
        if (a.type === 'file') return;
        if (a.type === 'radio' && !a.checked) return;
        if (!a.name) return;
        (veri[a.name] = veri[a.name] || []).push(a.value);
      });
      try { localStorage.setItem(anahtar, JSON.stringify({ t: Date.now(), veri: veri })); } catch (e) {}
      var not = $('[data-ek-taslak-not]');
      if (not) {
        var s = new Date();
        not.textContent = 'Taslak kaydedildi · ' +
          String(s.getHours()).padStart(2, '0') + '.' + String(s.getMinutes()).padStart(2, '0');
        not.hidden = false;
      }
    });
  });

  $$('[data-ek-gonder]').forEach(function (b) {
    b.addEventListener('click', function () {
      var form = b.closest('form') || $('[data-ek-form]');
      var eksik = zorunluDenetle(form);
      var ozet = $('[data-ek-ozet]');
      if (eksik.length) {
        if (ozet) {
          ozet.textContent = eksik.length + ' zorunlu alan boş. Kırmızı işaretli alanları doldur, sonra yeniden gönder.';
          ozet.hidden = false;
        }
        eksik[0].focus();
        return;
      }
      if (ozet) ozet.hidden = true;
      var pano = $('[data-ek-gonderildi]');
      if (pano) {
        pano.hidden = false;
        pano.scrollIntoView({ block: 'center', behavior: 'smooth' });
        var r = pano.querySelector('[data-ek-gonderildi-rozet]');
        var secili = $('input[name="gorunurluk"]:checked');
        if (r && secili) r.textContent = secili.value === 'abone' ? 'Abonelere özel' : 'Herkese açık';
      }
    });
  });

  /* ═══ 10 · VİDEO SERİLERİM ════════════════════════════════════════ */
  function serileriTazele() {
    var kap = $('[data-ek-seriler]');
    if (!kap) return;
    var seriler = $$('[data-ek-seri]', kap);
    seriler.forEach(function (s, i) {
      var n = s.querySelector('.ek-seri-no'); if (n) n.textContent = i + 1;
      var y = s.querySelector('.ek-seri-arac [data-ek-yukari]'),
          a = s.querySelector('.ek-seri-arac [data-ek-asagi]');
      if (y) y.disabled = i === 0;
      if (a) a.disabled = i === seriler.length - 1;
      var bolumler = $$('.ek-bolum', s);
      bolumler.forEach(function (b, j) {
        var bn = b.querySelector('.ek-bolum-no'); if (bn) bn.textContent = (j + 1) + '.';
        var by = b.querySelector('[data-ek-yukari]'), ba = b.querySelector('[data-ek-asagi]');
        if (by) by.disabled = j === 0;
        if (ba) ba.disabled = j === bolumler.length - 1;
      });
      var say = s.querySelector('[data-ek-bolum-say]');
      if (say) say.textContent = bolumler.length + ' bölüm';
    });
    var bos = $('[data-ek-bos="seri"]');
    if (bos) bos.hidden = seriler.length > 0;
    sayaclariTazele();
  }

  function bolumSatiriKur(ad, meta, abone) {
    var li = el('li', 'ek-bolum');
    li.innerHTML =
      '<span class="ek-bolum-no">1.</span>' +
      '<span class="ek-bolum-kimlik"><b></b><span></span></span>' +
      '<span class="durum-hapi ' + (abone ? 'bekleyen' : 'cozulen') + '">' +
        '<i class="fa-solid ' + (abone ? 'fa-lock' : 'fa-globe') + '" aria-hidden="true"></i> ' +
        (abone ? 'Abonelere özel' : 'Herkese açık') + '</span>' +
      '<span class="ek-bolum-arac">' +
        '<button type="button" data-ek-yukari title="Yukarı taşı" aria-label="Bölümü yukarı taşı"><i class="fa-solid fa-chevron-up" aria-hidden="true"></i></button>' +
        '<button type="button" data-ek-asagi title="Aşağı taşı" aria-label="Bölümü aşağı taşı"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
        '<button type="button" data-ek-sil title="Bölümü kaldır" aria-label="Bölümü kaldır"><i class="fa-solid fa-trash-can" aria-hidden="true"></i></button>' +
      '</span>';
    li.querySelector('.ek-bolum-kimlik b').textContent = ad;
    li.querySelector('.ek-bolum-kimlik span').textContent = meta;
    return li;
  }

  /* seri oluştur — formdaki gerçek değerleri okur, listeye seri basar */
  $$('[data-ek-seri-olustur]').forEach(function (b) {
    b.addEventListener('click', function () {
      var form = b.closest('form');
      var ad = form.querySelector('[name="seri-ad"]');
      var ozet = form.querySelector('[name="seri-ozet"]');
      var eksik = zorunluDenetle(form);
      var uyari = form.querySelector('[data-ek-ozet]');
      if (eksik.length) {
        if (uyari) { uyari.textContent = 'Seriye bir ad ver.'; uyari.hidden = false; }
        eksik[0].focus(); return;
      }
      if (uyari) uyari.hidden = true;
      var abone = (form.querySelector('input[name="gorunurluk"]:checked') || {}).value === 'abone';
      var kap = $('[data-ek-seriler]');
      var seri = el('div', 'ek-seri');
      seri.setAttribute('data-ek-seri', '');
      seri.innerHTML =
        '<div class="ek-seri-bas">' +
          '<span class="ek-seri-no">1</span>' +
          '<span class="ek-seri-kimlik"><b></b><span></span></span>' +
          '<span class="durum-hapi kapali" data-ek-bolum-say>0 bölüm</span>' +
          '<span class="ek-seri-arac">' +
            '<button type="button" data-ek-yukari title="Seriyi yukarı taşı" aria-label="Seriyi yukarı taşı"><i class="fa-solid fa-chevron-up" aria-hidden="true"></i></button>' +
            '<button type="button" data-ek-asagi title="Seriyi aşağı taşı" aria-label="Seriyi aşağı taşı"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
            '<button type="button" data-ek-sil title="Seriyi kaldır" aria-label="Seriyi kaldır"><i class="fa-solid fa-trash-can" aria-hidden="true"></i></button>' +
          '</span>' +
        '</div>' +
        '<ul class="ek-bolumler"></ul>' +
        '<div class="ek-seri-ayak">' +
          '<button class="dugme hayalet kucuk" type="button" data-ek-bolum-ekle><i class="fa-solid fa-plus" aria-hidden="true"></i> Bölüm ekle</button>' +
          '<span class="not">Bölüm sırası bu listedeki sıradır; okları kullanarak değiştir.</span>' +
        '</div>';
      seri.querySelector('.ek-seri-kimlik b').textContent = ad.value.trim();
      seri.querySelector('.ek-seri-kimlik span').textContent =
        (ozet && ozet.value.trim() ? ozet.value.trim() + ' · ' : '') +
        (abone ? 'Abonelere özel' : 'Herkese açık');
      kap.appendChild(seri);
      form.reset(); gorunurlukUygula(form); serileriTazele();
      seri.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  });

  /* bölüm ekle — seri içindeki listeye gerçek satır basar */
  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-ek-bolum-ekle]');
    if (!b) return;
    e.preventDefault();
    var seri = b.closest('[data-ek-seri]');
    var liste = seri.querySelector('.ek-bolumler');
    var no = $$('.ek-bolum', seri).length + 1;
    var abone = /Abonelere özel/.test(seri.querySelector('.ek-seri-kimlik span').textContent);
    liste.appendChild(bolumSatiriKur('Bölüm ' + no, 'Başlık ve video henüz eklenmedi', abone));
    serileriTazele();
  });

  /* video ekle formu — seçilen seriye bölüm olarak düşer */
  $$('[data-ek-video-ekle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var form = b.closest('form');
      var eksik = zorunluDenetle(form);
      var uyari = form.querySelector('[data-ek-ozet]');
      if (eksik.length) {
        if (uyari) { uyari.textContent = 'Videoya bir başlık ver.'; uyari.hidden = false; }
        eksik[0].focus(); return;
      }
      if (uyari) uyari.hidden = true;
      var baslik = form.querySelector('[name="video-baslik"]').value.trim();
      var sure = (form.querySelector('[name="video-sure"]') || {}).value || '';
      var hedef = form.querySelector('[name="video-seri"]');
      var abone = (form.querySelector('input[name="gorunurluk"]:checked') || {}).value === 'abone';
      var seriler = $$('[data-ek-seri]');
      var seri = seriler[hedef && hedef.selectedIndex >= 0 ? hedef.selectedIndex : 0];
      if (!seri) {
        if (uyari) { uyari.textContent = 'Önce bir seri oluştur; video bir serinin bölümü olarak yayımlanır.'; uyari.hidden = false; }
        return;
      }
      seri.querySelector('.ek-bolumler')
        .appendChild(bolumSatiriKur(baslik, (sure ? sure + ' dk · ' : '') + 'yeni yüklendi', abone));
      form.reset(); gorunurlukUygula(form); serileriTazele();
      var sonuc = form.querySelector('[data-ek-sonuc]');
      if (sonuc) {
        sonuc.textContent = '"' + baslik + '" — ' + seri.querySelector('.ek-seri-kimlik b').textContent +
          ' serisine bölüm olarak eklendi.';
        sonuc.hidden = false;
      }
    });
  });

  /* seri seçeneklerini gerçek serilerden doldur */
  function seriSecenekleriniTazele() {
    var sec = $('[name="video-seri"]');
    if (!sec) return;
    var onceki = sec.value;
    sec.innerHTML = '';
    $$('[data-ek-seri]').forEach(function (s) {
      var o = d.createElement('option');
      o.textContent = s.querySelector('.ek-seri-kimlik b').textContent;
      sec.appendChild(o);
    });
    if (onceki) sec.value = onceki;
  }

  var _serileriTazele = serileriTazele;
  serileriTazele = function () { _serileriTazele(); seriSecenekleriniTazele(); };


  /* ═══ 12 · ETİKET ÇİPLERİ ═════════════════════════════════════════
     `.cip.suzgec` düğmeleri seçilebilir olmalı; aksi hâlde ekranda
     duran ama hiçbir şey yapmayan bir düğme kalırdı ("ölü düğme 0").
     Seçim `aria-pressed` ile ilan edilir ve gizli alana yazılır. */
  var etiketKap = $('[data-ek-etiketler]');
  if (etiketKap) {
    var gizli = etiketKap.parentNode.querySelector('[data-ek-etiket-deger]');
    var etiketYaz = function () {
      var secili = $$('.cip[aria-pressed="true"]', etiketKap).map(function (c) { return c.textContent.trim(); });
      if (gizli) gizli.value = secili.join(', ');
      var say = etiketKap.parentNode.querySelector('[data-ek-etiket-say]');
      if (say) say.textContent = secili.length ? secili.length + ' etiket' : 'seçilmedi';
    };
    $$('.cip', etiketKap).forEach(function (c) {
      c.addEventListener('click', function () {
        var acik = c.getAttribute('aria-pressed') === 'true';
        c.setAttribute('aria-pressed', String(!acik));
        c.classList.toggle('aktif', !acik);
        etiketYaz();
      });
    });
    etiketYaz();
  }

  /* ═══ 13 · İLK ÇİZİM ══════════════════════════════════════════════ */
  bloklariNumarala();
  malzemeTazele();
  serileriTazele();
  sayaclariTazele();
})();
