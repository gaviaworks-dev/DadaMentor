/* ═══════════════════════════════════════════════════════════════════════
   ADMIN UI KİTİ · DAVRANIŞ — dört markanın ORTAK panel davranışı
   ───────────────────────────────────────────────────────────────────────
   Tarih: 2026-09-04 · FIT admin revize · parti 1
   Kural belgesi: `docs/admin-ui-kit.md`

   Kapsam — bu dosya YALNIZ kitin getirdiği yeni davranışları taşır:
       · menü katlama (durum `localStorage`da)
       · toast (kaydet / sil / yayınla sonrası)
       · silme onayı (onay kapısı)
       · satır işlemleri (düzenle · sil · sabitle · pasif)
       · görsel önizleme + kırpma çerçevesi
       · alan altı doğrulama

   🔴 MEVCUT DAVRANIŞA DOKUNULMADI. Açılırlar, sekme rayı, toplu işlem,
      sıralama ve marka ayarları `_ortak/panel.js`te yaşıyor ve orada
      kalıyor. İki dosya AYRI olaylara bağlanır; ortak hedefe iki
      dinleyici bağlanan tek yer satır işlemleridir ve orada bu dosya
      `.satir-islem` ile kapsanmıştır — panel.js o adı hiç görmüyor.

   ⚠ Betik FORM GÖNDERMEZ. Maket kilidi: hiçbir eylem sunucuya gitmez,
     "kaydedildi" bir görsel geri bildirimdir ve öyle olduğu toast
     metninde YAZILIDIR ("maket").
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KOK = document.body;
  if (!KOK || !KOK.classList.contains('yetkili')) return;

  /* ───────────────────────────────────────────────────────────────────
     1 · MENÜ KATLAMA — durum `localStorage`da
     ─────────────────────────────────────────────────────────────────── */
  var ANAHTAR = 'dm-admin-menu-katli';

  function katliMi() {
    try { return localStorage.getItem(ANAHTAR) === '1'; } catch (e) { return false; }
  }
  function katlamaYaz(v) {
    try { localStorage.setItem(ANAHTAR, v ? '1' : '0'); } catch (e) { /* özel pencere */ }
  }
  function katlamaUygula(v) {
    KOK.classList.toggle('panel-katli', v);
    var d = document.querySelector('.panel-katla');
    if (d) {
      /* `aria-pressed` — çentik bir aç/kapa düğmesi; menü gizlenmiyor,
         daralıyor. `aria-expanded` kabuğun açılır sözleşmesine düşüyor
         ve menüyü `hidden` yapıyordu (bkz. enjektör şerhi). */
      d.setAttribute('aria-pressed', String(v));
      d.removeAttribute('aria-expanded');
      d.removeAttribute('aria-controls');
      d.setAttribute('aria-label', v ? 'Menüyü genişlet' : 'Menüyü daralt');
      var i = d.querySelector('i');
      if (i) i.className = v ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left';
    }
  }
  /* 🔴 Durum SAYFA AÇILIRKEN uygulanır, tıklamada değil. Yoksa katlı
     kip her gezinmede bir kare açık çiziliyor ve menü "zıplıyor". */
  katlamaUygula(katliMi());

  document.addEventListener('click', function (e) {
    var d = e.target.closest('.panel-katla');
    if (!d) return;
    e.preventDefault();
    var yeni = !KOK.classList.contains('panel-katli');
    katlamaUygula(yeni);
    katlamaYaz(yeni);
  });

  /* Dar kipte menü kalemi ipucu taşır — metin görünmediği için ad
     BAŞKA bir yerden okunmalı. Kaynağı kalemin kendi metni. */
  document.querySelectorAll('.panel-menu-link').forEach(function (a) {
    if (a.hasAttribute('data-ipucu')) return;
    var s = a.querySelector('.sayac');
    var ad = (a.textContent || '').replace(s ? s.textContent : '', '').trim();
    if (ad) a.setAttribute('data-ipucu', ad);
  });
  /* Ray ikonları ipucunu `title`dan devralır — `title` gecikmeli ve
     biçimsiz; kitin kendi ipucu yüzeyi anında ve tokenli. */
  document.querySelectorAll('.panel-ray-ikon[title], .panel-ray-imza[title]').forEach(function (a) {
    if (!a.hasAttribute('data-ipucu')) a.setAttribute('data-ipucu', a.getAttribute('title'));
  });

  /* ───────────────────────────────────────────────────────────────────
     1b · SAYFA BAŞI TAŞMA MENÜSÜ — "•••"
     ───────────────────────────────────────────────────────────────────
     Beyar kuralı: *"Butonlar ASLA ikinci satıra düşmez. Sığmıyorsa
     birincil buton kalır, ikincil butonlar ••• taşma menüsüne girer
     (1280 altında otomatik). Sığıyor mu ÖLÇ, ölçmeden karar verme."*

     🔴 KARAR ÖLÇÜMLE VERİLİYOR. Kırılım noktası tek başına yetmez: aynı
        genişlikte üç kısa düğme sığar, iki uzun düğme sığmaz — sığma
        METİN UZUNLUĞUNA bağlı, ekrana değil. (Kanonun §75c şerhinde
        kayıtlı: "ayrım ekranın kararı değil, düğme metinlerinin
        UZUNLUĞU".) O yüzden gerçek genişlikler ölçülüyor; 1280 yalnız
        bir ALT SINIR olarak ayrıca uygulanıyor.
     🔴 BİRİNCİL DÜĞME MENÜYE İNMEZ. Sayfanın ana eylemi her zaman
        görünür kalır.
     ⚠ Düğmeler SİLİNMEZ, TAŞINIR — ve şerit sığdığında geri döner.
       Taşıma tersine çevrilebilir olmasaydı pencere büyütüldüğünde
       eylemler menüde hapis kalırdı. */
  function tasmaKur(bas) {
    var serit = bas.querySelector(':scope > .eylem-satiri');
    if (!serit) return;
    var tasma = serit.querySelector(':scope > .eylem-tasma');
    if (!tasma) {
      tasma = document.createElement('div');
      tasma.className = 'eylem-tasma';
      tasma.hidden = true;
      var yid = 'tasma-' + Math.random().toString(36).slice(2, 7);
      tasma.innerHTML =
        '<button type="button" class="ikon-dugme" aria-haspopup="true" aria-expanded="false"' +
        ' aria-controls="' + yid + '" aria-label="Diğer eylemler" title="Diğer eylemler">' +
        '<i class="fa-solid fa-ellipsis" aria-hidden="true"></i></button>' +
        '<div class="eylem-tasma-yuzey" id="' + yid + '" hidden></div>';
      serit.appendChild(tasma);
    }
    var yuzey = tasma.querySelector('.eylem-tasma-yuzey');

    /* 1 · her ölçümden önce hepsini şeride geri al — ölçüm TEMİZ hâlde
           yapılmalı, yoksa menüye inen düğme bir daha asla dönmez. */
    while (yuzey.firstChild) serit.insertBefore(yuzey.firstChild, tasma);
    tasma.hidden = true;

    var adaylar = [].slice.call(serit.children).filter(function (el) {
      return el !== tasma && !el.classList.contains('birincil');
    });
    if (!adaylar.length) return;

    /* 2 · sığıyor mu — şeridin gerçek genişliği kabın payını aşıyor mu */
    function tasiyorMu() {
      var solW = bas.firstElementChild ? bas.firstElementChild.getBoundingClientRect().width : 0;
      var bosluk = parseFloat(getComputedStyle(bas).columnGap) || 0;
      return serit.scrollWidth > (bas.clientWidth - solW - bosluk) + 1;
    }
    var dar = window.innerWidth < 1280;

    /* 3 · sondan başa doğru indir; birincil hiç dokunulmaz. */
    var i = adaylar.length - 1;
    while ((dar || tasiyorMu()) && i >= 0) {
      tasma.hidden = false;
      yuzey.insertBefore(adaylar[i], yuzey.firstChild);
      i--;
      if (!dar && !tasiyorMu()) break;
    }
    if (!yuzey.children.length) tasma.hidden = true;
  }

  function tasmaTazele() {
    document.querySelectorAll('.panel-bas').forEach(tasmaKur);
  }
  tasmaTazele();
  var tasmaZaman;
  window.addEventListener('resize', function () {
    clearTimeout(tasmaZaman); tasmaZaman = setTimeout(tasmaTazele, 120);
  });

  /* 🔴 AÇMA/KAPAMA KENDİ DİNLEYİCİSİNİ AÇMAZ — ÖLÇÜMLE ÖĞRENİLDİ.
     İlk yazımda kit bu düğmeye kendi tıklama dinleyicisini bağlıyordu.
     Ama `_ortak/panel.js` ZATEN `aria-expanded` + `aria-controls`
     bildiren HER tetiği yönetiyor (kabuğun açılır sözleşmesi). İki
     dinleyici arka arkaya çalışınca biri açıyor öteki kapatıyordu:
     menü tıklamada AÇILMIYORDU ve konsolda hata da yoktu.
     Ölçüm yakaladı ("menü açıldı: false"), kitin dinleyicisi kaldırıldı.
     Menü ARIA sözleşmesini bildiriyor; onu süren tek kaynak kabuktur —
     "kabuk gibi davranış da TEK kaynaktan gelir" kuralı.
     ⚠ Dışarı tıklayınca kapanma ve "aynı anda tek açılır" da oradan
       geliyor; burada ikinci kez yazılmıyor. */

  /* ───────────────────────────────────────────────────────────────────
     2 · TOAST
     ─────────────────────────────────────────────────────────────────── */
  var toastKap = null;
  function kap() {
    if (toastKap && document.body.contains(toastKap)) return toastKap;
    toastKap = document.createElement('div');
    toastKap.className = 'toast-kap';
    toastKap.setAttribute('role', 'status');
    toastKap.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastKap);
    return toastKap;
  }
  /* 🔴 YİNELEME ENGELİ — Beyar ekranda gördü: aynı ileti üç kez üst üste
     yığılmıştı ("… başlatıldı" · "… tamamlandı" · "… başlatıldı").
     Aynı metin görünürken ikincisini basmak bilgi eklemiyor, ekranı
     kapatıyor. Zaten duran toast'un ömrü tazelenir ve bir sayaç alır. */
  function toast(metin, tur) {
    var mevcut = null;
    kap().querySelectorAll('.toast').forEach(function (x) {
      var s = x.querySelector('span');
      if (s && s.textContent === metin && x.className.indexOf(tur || 'basarili') !== -1) mevcut = x;
    });
    if (mevcut && metin) {
      var n = (parseInt(mevcut.dataset.kere || '1', 10) || 1) + 1;
      mevcut.dataset.kere = String(n);
      var sy = mevcut.querySelector('.toast-kere');
      if (!sy) {
        sy = document.createElement('b');
        sy.className = 'toast-kere';
        mevcut.querySelector('span').insertAdjacentElement('afterend', sy);
      }
      sy.textContent = '×' + n;
      clearTimeout(mevcut._zaman);
      mevcut._zaman = setTimeout(function () { mevcut.remove(); }, 4200);
      return mevcut;
    }
    /* Yığın en çok üç; dördüncü gelince en eskisi düşer. */
    var duran = kap().querySelectorAll('.toast');
    if (duran.length >= 3) duran[0].remove();

    var t = document.createElement('div');
    t.className = 'toast ' + (tur || 'basarili');
    var ikon = tur === 'hata' ? 'fa-circle-exclamation' : 'fa-circle-check';
    var i = document.createElement('i');
    i.className = 'fa-solid ' + ikon;
    i.setAttribute('aria-hidden', 'true');
    var s = document.createElement('span');
    s.textContent = metin;
    var k = document.createElement('button');
    k.type = 'button'; k.className = 'toast-kapat';
    k.setAttribute('aria-label', 'Bildirimi kapat');
    k.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    k.addEventListener('click', function () { t.remove(); });
    t.appendChild(i); t.appendChild(s); t.appendChild(k);
    kap().appendChild(t);
    t._zaman = setTimeout(function () { t.remove(); }, 4200);
    return t;
  }
  window.DM_TOAST = toast;      /* ekran betiklerinin de çağırabilmesi için */

  /* ───────────────────────────────────────────────────────────────────
     3 · ONAY KAPISI — silme
     ─────────────────────────────────────────────────────────────────── */
  var onayOrtu = null, onayCb = null, onceOdak = null;

  function onayKur() {
    if (onayOrtu) return onayOrtu;
    onayOrtu = document.createElement('div');
    onayOrtu.className = 'onay-ortu';
    onayOrtu.hidden = true;
    onayOrtu.innerHTML =
      '<div class="onay-kapi" role="alertdialog" aria-modal="true" aria-labelledby="onayBas" aria-describedby="onayMetin">' +
        '<h2 id="onayBas"></h2><p id="onayMetin"></p>' +
        '<div class="eylem-satiri">' +
          '<button type="button" class="dugme hayalet" data-onay="hayir">Vazgeç</button>' +
          '<button type="button" class="dugme tehlike" data-onay="evet">Sil</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(onayOrtu);
    onayOrtu.addEventListener('click', function (e) {
      if (e.target === onayOrtu) return onayKapat(false);
      var d = e.target.closest('[data-onay]');
      if (d) onayKapat(d.getAttribute('data-onay') === 'evet');
    });
    return onayOrtu;
  }
  function onayKapat(sonuc) {
    if (!onayOrtu || onayOrtu.hidden) return;
    onayOrtu.hidden = true;
    var cb = onayCb; onayCb = null;
    if (onceOdak && document.contains(onceOdak)) onceOdak.focus();
    onceOdak = null;
    if (cb) cb(sonuc);
  }
  function onaySor(baslik, metin, dugmeMetni, cb) {
    var o = onayKur();
    o.querySelector('#onayBas').textContent = baslik;
    o.querySelector('#onayMetin').textContent = metin;
    o.querySelector('[data-onay="evet"]').textContent = dugmeMetni || 'Sil';
    onceOdak = document.activeElement;
    onayCb = cb;
    o.hidden = false;
    o.querySelector('[data-onay="hayir"]').focus();
  }
  window.DM_ONAY = onaySor;

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && onayOrtu && !onayOrtu.hidden) { e.preventDefault(); onayKapat(false); }
  });

  /* ───────────────────────────────────────────────────────────────────
     4 · SATIR İŞLEMLERİ
     ───────────────────────────────────────────────────────────────────
     Sözleşme markup'ta: `.satir-islem` içindeki düğme `data-islem`
     taşır. Dört değer: `duzenle` · `sil` · `sabitle` · `pasif`.
     🔴 Hedefi olmayan düğme SESSİZCE DURUR (panel.js'in açılır kuralıyla
        aynı disiplin) — uydurma davranış üretmez.
     ─────────────────────────────────────────────────────────────────── */
  /* 🔴 SATIRIN ADI İLK HÜCRE DEĞİLDİR. İlk yazım `querySelector('th,td')`
     diyordu ve o hücre SEÇİM KUTUSU — metni boş. Sonuç: panel başlığı
     " — düzenle", toast '“” kaydedildi' çıkıyordu. Ölçümde görüldü.
     Ad, METNİ OLAN ilk hücreden okunur; seçim ve işlem sütunları atlanır. */
  function satirAdi(tr) {
    var hepsi = [].slice.call(tr.cells || tr.querySelectorAll('th,td'));
    for (var i = 0; i < hepsi.length; i++) {
      var h = hepsi[i];
      if (h.classList.contains('sec')) continue;
      if (h.querySelector('input[type=checkbox]')) continue;
      if (h.querySelector('.satir-islem, [data-islem]')) continue;
      var t = (h.textContent || '').trim().replace(/\s+/g, ' ');
      if (t) return t.slice(0, 60);
    }
    return 'kayıt';
  }

  /* ───────────────────────────────────────────────────────────────────
     4a · SATIR DÜZENLEME PANELİ — satırın KENDİ verisinden kurulur
     ───────────────────────────────────────────────────────────────────
     Beyar kuralı, 2026-09-04: *"'Düzenleme ekranı bu makette bağlı
     değil' tarzı toast YASAK; o da ölü buton demektir. Her eylemin
     prototipte gerçek bir karşılığı olur."*

     🔴 KİT MARKUP ÜRETMEZ kuralının sınırı burada. K22 "kaynakta markup
        olarak duran şey markup olarak taşınır, JS'in bastığı şey davranış
        olarak taşınır" der. Düzenleme panelinin kaynakta karşılığı YOK
        ve olamaz da: alanları SATIRIN KOLONLARINDAN türüyor, yani her
        tabloda başka. Bu bir kalıp değil bir MEKANİZMA — kit onu üretir.

     Alanlar uydurulmaz: başlıklar `thead`den, değerler hücrelerden
     okunur. Kaydedince değerler AYNI hücrelere geri yazılır; yani panel
     ekranda görünen veriyle tutarlı kalır ve yeni veri icat etmez.
     ─────────────────────────────────────────────────────────────────── */
  var duzKap = null, duzSatir = null, duzOdak = null;

  function duzKur() {
    if (duzKap) return duzKap;
    duzKap = document.createElement('div');
    duzKap.className = 'yan-panel-ortu';
    duzKap.hidden = true;
    duzKap.innerHTML =
      '<aside class="yan-panel" role="dialog" aria-modal="true" aria-labelledby="ypBas">' +
        '<div class="yan-panel-bas"><h2 id="ypBas">Kaydı düzenle</h2>' +
          '<button type="button" class="ikon-dugme" data-yp="kapat" aria-label="Paneli kapat">' +
          '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>' +
        '<div class="yan-panel-govde"></div>' +
        '<div class="yan-panel-ayak">' +
          '<button type="button" class="dugme hayalet" data-yp="kapat">Vazgeç</button>' +
          '<button type="button" class="dugme birincil" data-yp="kaydet">Kaydet</button>' +
        '</div>' +
      '</aside>';
    document.body.appendChild(duzKap);
    duzKap.addEventListener('click', function (e) {
      if (e.target === duzKap || e.target.closest('[data-yp="kapat"]')) return duzKapat();
      if (e.target.closest('[data-yp="kaydet"]')) return duzKaydet();
    });
    return duzKap;
  }
  function duzKapat() {
    if (!duzKap || duzKap.hidden) return;
    duzKap.hidden = true; duzSatir = null;
    if (duzOdak && document.contains(duzOdak)) duzOdak.focus();
  }
  function duzKaydet() {
    if (!duzSatir) return duzKapat();
    var alanlar = duzKap.querySelectorAll('[data-hucre]');
    alanlar.forEach(function (g) {
      var i = Number(g.getAttribute('data-hucre'));
      var h = duzSatir.cells[i]; if (!h) return;
      /* Hücrenin ilk METİN düğümü güncellenir; içindeki rozet, çip ve
         bağlantı yapısı KORUNUR — hücreyi düz metinle ezmek satırın
         bileşenlerini siler. */
      var hedef = h.querySelector('b, strong, a, span:not(.kunye)') || h;
      if (hedef === h && h.firstChild && h.firstChild.nodeType === 3) h.firstChild.nodeValue = g.value;
      else hedef.textContent = g.value;
    });
    var ad = satirAdi(duzSatir);
    duzSatir.classList.add('guncellendi');
    duzKapat();
    toast('“' + ad + '” kaydedildi.');
  }
  function duzAc(tr) {
    var tablo = tr.closest('table'); if (!tablo) return;
    var basliklar = [].slice.call(tablo.querySelectorAll('thead th'))
      .map(function (t) { return (t.textContent || '').trim().replace(/\s+/g, ' '); });
    var k = duzKur();
    var govde = k.querySelector('.yan-panel-govde');
    govde.innerHTML = '';
    [].forEach.call(tr.cells, function (h, i) {
      var ad = basliklar[i] || '';
      if (!ad || h.classList.contains('sec')) return;
      if (h.querySelector('.satir-islem, button, [data-islem]')) return;   /* işlem sütunu */
      var deger = (h.textContent || '').trim().replace(/\s+/g, ' ');
      var alan = document.createElement('div');
      alan.className = 'alan';
      var id = 'yp-' + i;
      alan.innerHTML = '<label for="' + id + '">' + ad + '</label>' +
        '<input class="alan-girdi" id="' + id + '" data-hucre="' + i + '">';
      alan.querySelector('input').value = deger;
      govde.appendChild(alan);
    });
    k.querySelector('#ypBas').textContent = satirAdi(tr) + ' — düzenle';
    duzSatir = tr; duzOdak = document.activeElement;
    k.hidden = false;
    var ilk = govde.querySelector('input'); if (ilk) { ilk.focus(); ilk.select(); }
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && duzKap && !duzKap.hidden) { e.preventDefault(); duzKapat(); }
  });

  document.addEventListener('click', function (e) {
    var d = e.target.closest('[data-islem]');
    if (!d) return;
    var islem = d.getAttribute('data-islem');
    var tr = d.closest('tr');
    e.preventDefault();

    if (islem === 'duzenle') {
      /* Sıra: bildirilen panel → gerçek detay sayfası → satırdan kurulan
         panel. Üçüncü basamak sayesinde "bağlı değil" hâli YOK. */
      var hedefId = d.getAttribute('data-hedef');
      var yuzey = hedefId && document.getElementById(hedefId);
      if (yuzey) {
        yuzey.hidden = false;
        yuzey.classList.add('acik');
        var ilk = yuzey.querySelector('input, select, textarea, button');
        if (ilk) ilk.focus();
        return;
      }
      var bag = d.getAttribute('href') && !/^#/.test(d.getAttribute('href')) ? d
              : (tr && tr.querySelector('a[href]:not([href^="#"])'));
      if (bag) { window.location.href = bag.getAttribute('href'); return; }
      if (tr) { duzAc(tr); return; }
      return;
    }

    if (islem === 'sil') {
      var ad = tr ? satirAdi(tr) : (d.getAttribute('data-ad') || 'kayıt');
      onaySor('Silinsin mi?', '“' + ad + '” listeden kaldırılacak.',
        'Sil', function (evet) {
          if (!evet || !tr) return;
          var tablo = tr.closest('table');
          var komsu = tr.nextElementSibling, ebeveyn = tr.parentNode;
          tr.remove();
          if (tablo && window.DM_SECIM_TAZELE) window.DM_SECIM_TAZELE(tablo);
          /* 🔴 GERİ AL — yıkıcı eylemin karşılığı yalnız onay değil,
             dönüş yolu. Satır bellekte duruyor; toast onu geri koyuyor. */
          var t = toast('“' + ad + '” silindi.');
          var g = document.createElement('button');
          g.type = 'button'; g.className = 'toast-geri'; g.textContent = 'Geri al';
          g.addEventListener('click', function () {
            if (komsu && komsu.parentNode === ebeveyn) ebeveyn.insertBefore(tr, komsu);
            else ebeveyn.appendChild(tr);
            if (tablo && window.DM_SECIM_TAZELE) window.DM_SECIM_TAZELE(tablo);
            t.remove(); toast('“' + ad + '” geri alındı.');
          });
          var sp = t.querySelector('span'); if (sp) sp.insertAdjacentElement('afterend', g);
        });
      return;
    }

    if (islem === 'sabitle') {
      if (!tr) return;
      var govdeS = tr.parentNode;
      var sabit = tr.classList.toggle('sabit');
      d.setAttribute('aria-pressed', String(sabit));
      var si = d.querySelector('i');
      if (si) si.className = sabit ? 'fa-solid fa-thumbtack' : 'fa-regular fa-thumbtack';
      if (sabit) {
        /* Satır ÜSTE taşınır — sabitlemenin görünür karşılığı bu.
           Nereden geldiği saklanır ki geri alınabilsin. */
        if (!tr.dataset.eskiSira) {
          tr.dataset.eskiSira = String([].indexOf.call(govdeS.rows, tr));
        }
        govdeS.insertBefore(tr, govdeS.firstElementChild);
      } else {
        var n = Number(tr.dataset.eskiSira || 0);
        var hedefS = govdeS.rows[n + 1] || null;
        govdeS.insertBefore(tr, hedefS);
        delete tr.dataset.eskiSira;
      }
      toast(satirAdi(tr) + (sabit ? ' en üste sabitlendi.' : ' sabitlemesi kaldırıldı.'));
      return;
    }

    if (islem === 'pasif') {
      if (!tr) return;
      var pasif = tr.classList.toggle('pasif');
      d.setAttribute('aria-pressed', String(pasif));
      /* Satırın durum hapını da çevir — durum DEĞİŞSİN, yalnız satır
         solmasın. Hap yoksa atlanır, uydurulmaz. */
      var hap = tr.querySelector('.durum-hapi, .rozet, .hap');
      if (hap) {
        if (pasif) {
          hap.setAttribute('data-onceki', hap.textContent.trim());
          hap.textContent = 'Pasif';
        } else if (hap.getAttribute('data-onceki')) {
          hap.textContent = hap.getAttribute('data-onceki');
        }
      }
      toast(satirAdi(tr) + (pasif ? ' pasife alındı.' : ' yeniden etkin.'));
      return;
    }
  });

  /* ───────────────────────────────────────────────────────────────────
     5 · ALAN ALTI DOĞRULAMA
     ───────────────────────────────────────────────────────────────────
     Kural: hata alanın ALTINDA doğar, form gönderilmez, ilk hatalı
     alana odaklanılır ve TEK bir toast basılır (alan başına toast
     basmak ekranı kirletiyor).
     ─────────────────────────────────────────────────────────────────── */
  function hataYaz(alan, metin) {
    alan.classList.add('hatali');
    var girdi = alan.querySelector('.alan-girdi, .alan-secim, .alan-metin');
    var kutu = alan.querySelector('.alan-hata');
    if (!kutu) {
      kutu = document.createElement('p');
      kutu.className = 'alan-hata';
      kutu.innerHTML = '<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><span></span>';
      var yardim = alan.querySelector('.alan-yardim');
      if (yardim) yardim.insertAdjacentElement('beforebegin', kutu);
      else alan.appendChild(kutu);
    }
    kutu.hidden = false;
    var s = kutu.querySelector('span') || kutu;
    s.textContent = metin;
    if (girdi) {
      girdi.setAttribute('aria-invalid', 'true');
      if (!kutu.id) kutu.id = 'hata-' + Math.random().toString(36).slice(2, 8);
      girdi.setAttribute('aria-describedby', kutu.id);
    }
  }
  function hataSil(alan) {
    alan.classList.remove('hatali');
    var kutu = alan.querySelector('.alan-hata');
    if (kutu) kutu.hidden = true;
    var girdi = alan.querySelector('.alan-girdi, .alan-secim, .alan-metin');
    if (girdi) { girdi.removeAttribute('aria-invalid'); girdi.removeAttribute('aria-describedby'); }
  }

  function alanDenetle(girdi) {
    var alan = girdi.closest('.alan');
    if (!alan) return true;
    var deger = (girdi.value || '').trim();
    var zorunlu = girdi.hasAttribute('required') || alan.querySelector('.zorunlu, label .yildiz');
    if (zorunlu && !deger) { hataYaz(alan, 'Bu alan zorunlu.'); return false; }
    if (deger && girdi.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(deger)) {
      hataYaz(alan, 'Geçerli bir e-posta adresi yaz.'); return false;
    }
    if (deger && girdi.hasAttribute('maxlength')) {
      var enc = parseInt(girdi.getAttribute('maxlength'), 10);
      if (enc && deger.length > enc) { hataYaz(alan, 'En çok ' + enc + ' karakter.'); return false; }
    }
    /* Tarih aralığı — bitiş başlangıçtan önce olamaz (EK-3'ün şartı). */
    if (deger && girdi.hasAttribute('data-aralik-bitis')) {
      var bas = document.querySelector('[data-aralik-baslangic="' + girdi.getAttribute('data-aralik-bitis') + '"]');
      if (bas && bas.value && deger < bas.value) {
        hataYaz(alan, 'Bitiş tarihi başlangıçtan önce olamaz.'); return false;
      }
    }
    hataSil(alan);
    return true;
  }
  window.DM_ALAN_DENETLE = alanDenetle;
  /* 🔴 KAPSAM KUSURU — C kulvarı ölçtü, 21 düğmeyi tek başına öldürüyordu.
     `panel-ac`ın yedeği İKİNCİ IIFE'de ve `duzAc`ı çağırıyor; `duzAc`
     BİRİNCİ IIFE'de tanımlı. Her tıklamada `duzAc is not defined`.
     Aynı sayfadaki `data-islem="duzenle"` çalışıyordu — mekanizma
     sağlamdı, yalnız kapsam yanlıştı. Kitin kendi kalıbıyla dışa
     veriliyor (`DM_TOAST` · `DM_ONAY` · `DM_SECIM_TAZELE` gibi). */
  window.DM_DUZENLE = duzAc;

  /* Yazarken hatayı temizle — kullanıcı düzeltirken kırmızı durmasın. */
  document.addEventListener('input', function (e) {
    var g = e.target.closest('.alan-girdi, .alan-secim, .alan-metin');
    if (!g) return;
    var alan = g.closest('.alan');
    if (alan && alan.classList.contains('hatali')) alanDenetle(g);
  });
  document.addEventListener('blur', function (e) {
    var g = e.target.closest && e.target.closest('.alan-girdi, .alan-secim, .alan-metin');
    if (g) alanDenetle(g);
  }, true);

  /* Kaydet / yayınla / taslak — doğrula, sonra toast. */
  document.addEventListener('click', function (e) {
    var d = e.target.closest('[data-eylem]');
    if (!d) return;
    var eylem = d.getAttribute('data-eylem');
    if (['kaydet', 'yayinla', 'taslak'].indexOf(eylem) === -1) return;
    e.preventDefault();

    var form = d.closest('form') || document.querySelector('.form-duzen') || document;
    var girdiler = form.querySelectorAll('.alan .alan-girdi, .alan .alan-secim, .alan .alan-metin');
    var ilkHata = null;
    girdiler.forEach(function (g) { if (!alanDenetle(g) && !ilkHata) ilkHata = g; });

    if (ilkHata) {
      ilkHata.focus();
      ilkHata.scrollIntoView({ block: 'center' });
      toast('Form kaydedilmedi — doldurulması gereken alanlar var.', 'hata');
      return;
    }
    var metin = eylem === 'yayinla' ? 'Yayınlandı.'
              : eylem === 'taslak'  ? 'Taslak kaydedildi.'
                                    : 'Kaydedildi.';
    toast(metin + ' (maket — sunucuya gitmedi)');
  });

  /* Silme düğmesi form içinde de olabilir (ör. "Sayfayı sil"). */
  document.addEventListener('click', function (e) {
    var d = e.target.closest('[data-eylem="sil"]');
    if (!d) return;
    e.preventDefault();
    var ad = d.getAttribute('data-ad') ||
      (document.querySelector('.panel-bas h1') || {}).textContent || 'kayıt';
    onaySor('Silinsin mi?', '“' + String(ad).trim() + '” kalıcı olarak kaldırılacak. Bu işlem geri alınamaz.',
      'Sil', function (evet) { if (evet) toast('Silindi. (maket — sunucuya gitmedi)'); });
  });

  /* ───────────────────────────────────────────────────────────────────
     6 · GÖRSEL GİRDİSİ — önizleme + kırpma çerçevesi
     ───────────────────────────────────────────────────────────────────
     Gerçek yükleme YOK; dosya `URL.createObjectURL` ile yerel okunur.
     Oran seçimi 1:1 · 16:9 · serbest. Çerçeve sürüklenebilir.
     ─────────────────────────────────────────────────────────────────── */
  function kirpmaKur(kutu, url) {
    var sahne = kutu.querySelector('.kirpma-sahne');
    var cerceve = kutu.querySelector('.kirpma-cerceve');
    var img = sahne && sahne.querySelector('img');
    if (!sahne || !cerceve || !img) return;
    img.src = url;
    img.onload = function () { oranUygula(kutu, kutu.getAttribute('data-oran') || '16:9'); };
  }
  function oranUygula(kutu, oran) {
    var sahne = kutu.querySelector('.kirpma-sahne');
    var cerceve = kutu.querySelector('.kirpma-cerceve');
    if (!sahne || !cerceve) return;
    kutu.setAttribute('data-oran', oran);
    kutu.querySelectorAll('.oran-grubu [data-oran]').forEach(function (b) {
      b.classList.toggle('aktif', b.getAttribute('data-oran') === oran);
      b.setAttribute('aria-pressed', String(b.getAttribute('data-oran') === oran));
    });
    var w = sahne.clientWidth, h = sahne.clientHeight;
    if (!w || !h) return;
    if (oran === 'serbest') {
      cerceve.style.width = Math.round(w * 0.9) + 'px';
      cerceve.style.height = Math.round(h * 0.9) + 'px';
    } else {
      var p = oran.split(':'), r = (+p[0]) / (+p[1]);
      var cw = w * 0.9, ch = cw / r;
      if (ch > h * 0.9) { ch = h * 0.9; cw = ch * r; }
      cerceve.style.width = Math.round(cw) + 'px';
      cerceve.style.height = Math.round(ch) + 'px';
    }
    cerceve.style.left = ''; cerceve.style.top = '';
    cerceve.style.inset = '0'; cerceve.style.margin = 'auto';
  }

  document.addEventListener('change', function (e) {
    var g = e.target.closest('input[type="file"][accept*="image"]');
    if (!g) return;
    var kutu = g.closest('.form-gorsel');
    if (!kutu || !g.files || !g.files[0]) return;
    kutu.classList.add('dolu');
    kirpmaKur(kutu, URL.createObjectURL(g.files[0]));
    toast('Görsel seçildi — kırpma çerçevesini sürükleyerek ayarla.');
  });

  document.addEventListener('click', function (e) {
    var o = e.target.closest('.oran-grubu [data-oran]');
    if (o) { e.preventDefault(); oranUygula(o.closest('.form-gorsel'), o.getAttribute('data-oran')); return; }
    var v = e.target.closest('[data-gorsel="vazgec"]');
    if (v) {
      e.preventDefault();
      var k = v.closest('.form-gorsel');
      if (k) { k.classList.remove('dolu'); var f = k.querySelector('input[type=file]'); if (f) f.value = ''; }
      return;
    }
    var u = e.target.closest('[data-gorsel="uygula"]');
    if (u) {
      e.preventDefault();
      var kk = u.closest('.form-gorsel');
      var c = kk && kk.querySelector('.kirpma-cerceve');
      if (c) toast('Kırpma uygulandı — ' + Math.round(c.offsetWidth) + '×' + Math.round(c.offsetHeight) + ' px. (maket)');
      return;
    }
  });

  /* Çerçeve sürükleme — sahnenin dışına çıkmaz. */
  (function () {
    var suruk = null, bx = 0, by = 0, sl = 0, st = 0;
    document.addEventListener('pointerdown', function (e) {
      var c = e.target.closest('.kirpma-cerceve');
      if (!c) return;
      suruk = c; bx = e.clientX; by = e.clientY;
      var s = c.parentElement.getBoundingClientRect(), r = c.getBoundingClientRect();
      sl = r.left - s.left; st = r.top - s.top;
      c.style.inset = 'auto'; c.style.margin = '0';
      c.style.left = sl + 'px'; c.style.top = st + 'px';
      c.setPointerCapture(e.pointerId);
    });
    document.addEventListener('pointermove', function (e) {
      if (!suruk) return;
      var s = suruk.parentElement.getBoundingClientRect();
      var nl = Math.max(0, Math.min(s.width - suruk.offsetWidth, sl + e.clientX - bx));
      var nt = Math.max(0, Math.min(s.height - suruk.offsetHeight, st + e.clientY - by));
      suruk.style.left = nl + 'px'; suruk.style.top = nt + 'px';
    });
    document.addEventListener('pointerup', function () { suruk = null; });
  })();

})();


/* ═══════════════════════════════════════════════════════════════════════
   ADMIN UI KİTİ · ÖLÜ BUTON YASAĞI — `data-eylem` DAĞITICISI
   ───────────────────────────────────────────────────────────────────────
   Beyar kuralı, 2026-09-04: *"Tıklanınca bir şey olmayan buton/link
   kalmaz."*

   🔴 SAYFA BAŞINA ÖZEL JS YOK. Tek mekanizma: markup `data-eylem`
      bildirir, bu dağıtıcı karşılığını üretir. Ekranın yapması gereken
      tek şey doğru adı yazmaktır.

   ⚠ MAKET KİLİDİ KORUNUR: hiçbir eylem sunucuya gitmez. "Hazırlanıyor"
     bir zamanlayıcıdır, indirilen dosya CLIENT'TA üretilir (tablonun
     kendi hücrelerinden), ve toast bunu YAZAR. Uydurma veri yok —
     dışa aktarılan şey ekranda GÖRÜNEN veridir.

   ⚠ Bu blok AYRI bir IIFE: birinci blok temel kalemleri (toast · onay ·
     satır işlemi · doğrulama) kurar ve `window.DM_*` ile paylaşır.
     Ayrılık kasıtlı — biri kırılırsa öteki koşmaya devam eder.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!document.body || !document.body.classList.contains('yetkili')) return;

  var toast = window.DM_TOAST || function () {};
  var onaySor = window.DM_ONAY || function (a, b, c, cb) { cb(true); };

  /* ── Genel amaçlı seçim kapısı (format seçimi · hedef seçimi) ───────── */
  var kapi = null, kapiCb = null, kapiOdak = null;
  function kapiKur() {
    if (kapi) return kapi;
    kapi = document.createElement('div');
    kapi.className = 'onay-ortu secim-kapi';
    kapi.hidden = true;
    kapi.innerHTML =
      '<div class="onay-kapi" role="dialog" aria-modal="true" aria-labelledby="secimBas">' +
        '<h2 id="secimBas"></h2><p></p><div class="secenekler"></div>' +
        '<div class="eylem-satiri"><button type="button" class="dugme hayalet" data-secim-kapat>Vazgeç</button></div>' +
      '</div>';
    document.body.appendChild(kapi);
    kapi.addEventListener('click', function (e) {
      if (e.target === kapi || e.target.closest('[data-secim-kapat]')) return kapiKapat(null);
      var s = e.target.closest('.secenek');
      if (s) kapiKapat(s.getAttribute('data-deger'));
    });
    return kapi;
  }
  function kapiKapat(deger) {
    if (!kapi || kapi.hidden) return;
    kapi.hidden = true;
    var cb = kapiCb; kapiCb = null;
    if (kapiOdak && document.contains(kapiOdak)) kapiOdak.focus();
    if (cb && deger !== null) cb(deger);
  }
  function secimSor(baslik, aciklama, secenekler, cb) {
    var k = kapiKur();
    k.querySelector('#secimBas').textContent = baslik;
    var p = k.querySelector('p');
    p.textContent = aciklama || ''; p.hidden = !aciklama;
    var kap = k.querySelector('.secenekler');
    kap.innerHTML = '';
    secenekler.forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'secenek'; b.setAttribute('data-deger', s.deger);
      b.innerHTML = '<i class="fa-solid ' + (s.ikon || 'fa-file') + '" aria-hidden="true"></i>' +
                    '<span>' + s.ad + '</span>' + (s.not ? '<small>' + s.not + '</small>' : '');
      kap.appendChild(b);
    });
    kapiOdak = document.activeElement;
    kapiCb = cb;
    k.hidden = false;
    var ilk = kap.querySelector('.secenek'); if (ilk) ilk.focus();
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && kapi && !kapi.hidden) { e.preventDefault(); kapiKapat(null); }
  });

  /* ── Tablodan örnek dosya üret — VERİ EKRANDAN OKUNUR ──────────────── */
  function tabloVerisi(kok) {
    var t = (kok && kok.querySelector('.tablo, table')) || document.querySelector('.tablo, table');
    if (!t) return null;
    var satirlar = [];
    t.querySelectorAll('thead tr').forEach(function (tr) {
      satirlar.push([].map.call(tr.children, function (h) {
        return (h.textContent || '').trim().replace(/\s+/g, ' ');
      }));
    });
    t.querySelectorAll('tbody tr').forEach(function (tr) {
      if (tr.hidden) return;
      satirlar.push([].map.call(tr.children, function (h) {
        return (h.textContent || '').trim().replace(/\s+/g, ' ');
      }));
    });
    return satirlar;
  }
  function csvUret(satirlar) {
    return satirlar.map(function (s) {
      return s.map(function (h) { return '"' + String(h).replace(/"/g, '""') + '"'; }).join(';');
    }).join('\r\n');
  }
  function dosyaSun(ad, icerik, tur, toastEl) {
    var blob = new Blob(["﻿" + icerik], { type: tur });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = ad; a.textContent = ad;
    a.addEventListener('click', function () { setTimeout(function () { URL.revokeObjectURL(url); }, 4000); });
    var t = toastEl || toast('', 'basarili');
    var s = t.querySelector('span');
    if (s) { s.textContent = 'Dosya hazır: '; s.appendChild(a); }
    /* İndirme bağlantısı toast'un ömründen uzun yaşasın. */
    t.dataset.kalici = '1';
    return a;
  }

  /* ── Süzgeç uygulama · sayaç · temizle ─────────────────────────────── */
  function suzgecTazele(kok) {
    var sayfa = kok || document;
    var cubuk = sayfa.querySelector('.suzgec-cubuk');
    if (!cubuk) return;
    var acik = 0;
    cubuk.querySelectorAll('[data-suzgec]').forEach(function (d) {
      var v = d.getAttribute('data-deger') || '';
      if (v && v !== 'hepsi') acik++;
    });
    cubuk.querySelectorAll('.acilir-yuzey .cip.aktif').forEach(function () { acik++; });
    var sayac = cubuk.querySelector('[data-rol="suzgec-sayisi"]');
    if (sayac) sayac.textContent = acik ? acik + ' süzgeç açık' : 'Süzgeç yok';
    var temizle = cubuk.querySelector('.suzgec-temizle');
    if (temizle) temizle.hidden = acik === 0;

    /* Satırları süz — ölçüt her süzgecin `data-alan` + `data-deger` çifti. */
    var tablo = document.querySelector('.tablo tbody, table tbody');
    if (!tablo) return;
    var olcut = [];
    cubuk.querySelectorAll('[data-suzgec][data-alan]').forEach(function (d) {
      var v = (d.getAttribute('data-deger') || '').trim();
      if (v && v !== 'hepsi') olcut.push({ alan: d.getAttribute('data-alan'), deger: v.toLocaleLowerCase('tr') });
    });
    var gorunen = 0;
    [].forEach.call(tablo.rows, function (tr) {
      var uyar = olcut.every(function (o) {
        var h = tr.querySelector('[data-alan="' + o.alan + '"]') ||
                tr.cells[parseInt(o.alan, 10)] || tr;
        return (h.textContent || '').toLocaleLowerCase('tr').indexOf(o.deger) !== -1;
      });
      tr.hidden = !uyar;
      if (uyar) gorunen++;
    });
    var kayit = cubuk.querySelector('.suzgec-sayac b');
    if (kayit) kayit.textContent = String(gorunen);
  }
  window.DM_SUZGEC_TAZELE = suzgecTazele;

  /* Açılır içindeki seçim satırı → tetikteki etiket + süzme */
  document.addEventListener('click', function (e) {
    var s = e.target.closest('.acilir-yuzey [data-deger]');
    if (!s || !s.closest('.suzgec-cubuk')) return;
    e.preventDefault();
    var yuzey = s.closest('.acilir-yuzey');
    var tetik = document.querySelector('[aria-controls="' + yuzey.id + '"]');
    yuzey.querySelectorAll('[data-deger]').forEach(function (x) {
      x.classList.toggle('aktif', x === s);
      x.setAttribute('aria-checked', String(x === s));
    });
    if (tetik) {
      tetik.setAttribute('data-deger', s.getAttribute('data-deger'));
      var et = tetik.querySelector('[data-rol="etiket"]') || tetik.querySelector('span');
      if (et) et.textContent = (s.textContent || '').trim();
      tetik.setAttribute('aria-expanded', 'false');
      yuzey.hidden = true;
    }
    suzgecTazele();
  });

  /* ── DAĞITICI ──────────────────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var d = e.target.closest('[data-eylem]');
    if (!d) return;
    var eylem = d.getAttribute('data-eylem');

    /* Birinci blokta ele alınanlar burada atlanır — çift işlem olmasın. */
    if (['kaydet', 'yayinla', 'taslak', 'sil'].indexOf(eylem) !== -1) return;

    switch (eylem) {

      case 'disa-aktar': {
        e.preventDefault();
        secimSor('Dışa aktarma biçimi', 'Ekranda görünen kayıtlar dışa aktarılır.', [
          { deger: 'csv',  ad: 'CSV',  ikon: 'fa-file-csv',   not: 'Excel · Sheets' },
          { deger: 'xlsx', ad: 'XLSX', ikon: 'fa-file-excel', not: 'Excel çalışma kitabı' },
          { deger: 'pdf',  ad: 'PDF',  ikon: 'fa-file-pdf',   not: 'Yazdırmaya hazır' },
        ], function (bicimAdi) {
          var t = toast('Dosya hazırlanıyor…');
          setTimeout(function () {
            var satirlar = tabloVerisi(d.closest('.kart') || document);
            if (!satirlar || satirlar.length < 2) {
              t.remove();
              toast('Bu ekranda dışa aktarılacak tablo yok.', 'hata');
              return;
            }
            var ad = (document.title.split('·')[0] || 'kayitlar').trim()
                       .toLocaleLowerCase('tr').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            /* 🔴 XLSX ve PDF GERÇEK BİÇİM DEĞİL — maket. Üretilen dosya
               CSV içeriklidir ve toast bunu SÖYLER. Uydurma bir ikili
               dosya basmaktansa dürüst bir CSV. */
            var uzanti = bicimAdi === 'csv' ? 'csv' : bicimAdi + '.csv';
            t.remove();
            var t2 = toast('', 'basarili');
            dosyaSun(ad + '-' + new Date().toISOString().slice(0, 10) + '.' + uzanti,
                     csvUret(satirlar), 'text/csv;charset=utf-8', t2);
            if (bicimAdi !== 'csv') {
              var s = t2.querySelector('span');
              if (s) s.insertAdjacentText('beforeend', ' — maket: içerik CSV');
            }
          }, 900);
        });
        return;
      }

      case 'toplu-islem': {
        e.preventDefault();
        var tablo = document.querySelector('.tablo, table');
        var secili = tablo ? tablo.querySelectorAll('tbody .sec input[type=checkbox]:checked') : [];
        if (!secili.length) { toast('Önce en az bir satır seç.', 'hata'); return; }
        var hedefler = [];
        (d.getAttribute('data-hedefler') || 'Birleştir|Pasife al|Sil')
          .split('|').forEach(function (h, i) {
            hedefler.push({ deger: String(i) + ':' + h, ad: h, ikon: 'fa-arrow-right-arrow-left' });
          });
        secimSor(d.getAttribute('data-baslik') || 'Toplu işlem',
                 secili.length + ' satır seçili.', hedefler, function (v) {
          var ad = v.split(':')[1];
          onaySor(ad + '?', secili.length + ' satıra uygulanacak.', 'Uygula', function (evet) {
            if (!evet) return;
            [].forEach.call(secili, function (k) {
              var tr = k.closest('tr'); if (!tr) return;
              if (/sil/i.test(ad)) { tr.remove(); return; }
              if (/pasif/i.test(ad)) {
                tr.classList.add('pasif');
                var h = tr.querySelector('.durum-hapi, .rozet, .hap');
                if (h) h.textContent = 'Pasif';
                return;
              }
              tr.classList.add('birlesti');
              var b = tr.querySelector('.durum-hapi, .rozet, .hap');
              if (b) b.textContent = 'Birleştirildi';
              k.checked = false;
            });
            if (tablo && window.DM_SECIM_TAZELE) window.DM_SECIM_TAZELE(tablo);
            toast(secili.length + ' satır güncellendi — ' + ad.toLocaleLowerCase('tr') + '. (maket)');
          });
        });
        return;
      }

      case 'kolonlar': {
        /* Açılır yüzeyi panel.js açıyor; kit içeriğini KURAR. */
        var yid = d.getAttribute('aria-controls');
        var yuzey = yid && document.getElementById(yid);
        if (!yuzey) return;
        if (!yuzey.querySelector('.kolon-secim')) {
          var t = document.querySelector('.tablo, table');
          if (!t) return;
          var kap = document.createElement('div');
          kap.className = 'kolon-secim';
          [].forEach.call(t.querySelectorAll('thead th'), function (th, i) {
            var ad = (th.textContent || '').trim();
            if (!ad || th.classList.contains('sec')) return;
            if (!th.hasAttribute('data-kolon')) th.setAttribute('data-kolon', String(i));
            [].forEach.call(t.querySelectorAll('tbody tr'), function (tr) {
              if (tr.cells[i]) tr.cells[i].setAttribute('data-kolon', String(i));
            });
            var l = document.createElement('label');
            l.innerHTML = '<input type="checkbox" checked data-kolon-anahtar="' + i + '"><span>' + ad + '</span>';
            kap.appendChild(l);
          });
          yuzey.appendChild(kap);
        }
        return;
      }

      case 'suzgec-temizle': {
        e.preventDefault();
        var c = d.closest('.suzgec-cubuk');
        if (!c) return;
        c.querySelectorAll('[data-suzgec]').forEach(function (x) {
          x.setAttribute('data-deger', '');
          var et = x.querySelector('[data-rol="etiket"]') || x.querySelector('span');
          if (et && x.getAttribute('data-varsayilan')) et.textContent = x.getAttribute('data-varsayilan');
        });
        c.querySelectorAll('.acilir-yuzey .cip.aktif').forEach(function (x) { x.classList.remove('aktif'); });
        c.querySelectorAll('input[type=search], .panel-arama-girdi').forEach(function (x) { x.value = ''; });
        suzgecTazele();
        toast('Süzgeçler temizlendi.');
        return;
      }

      case 'calistir': {
        /* Tekil eylemler: indeksi yenile · yeniden sorgula · önbelleği boşalt */
        e.preventDefault();
        if (d.hasAttribute('data-calisiyor')) return;

        /* 🔴 İKON DÜĞMESİ METNE ÇEVRİLMEZ — Beyar ekranda gördü:
           satır içindeki ikon düğmesi "Çalışıyor…" yazısına dönüşüyor,
           hücre genişliyor ve SATIRIN TAMAMI kayıyordu. Metinli düğmede
           yazı değişir, ikon düğmesinde YALNIZ İKON döner; kutu sabit
           kalır. Ayrım düğmenin kendi metninden okunur, sınıfından değil
           (aynı sınıf iki kipte de kullanılıyor). */
        var ikonlu = !((d.textContent || '').trim().length);
        var eskiHtml = d.innerHTML;
        /* Ad: `data-ad` > `title` > metin. `aria-label` KULLANILMAZ —
           orada tam cümle duruyor ("… gönderiminin detayını görüntüle")
           ve toast okunmaz hâle geliyordu. */
        var ad2 = (d.getAttribute('data-ad') || d.getAttribute('title') ||
                   (d.textContent || '').trim() || 'İşlem').trim();
        if (ad2.length > 42) ad2 = ad2.slice(0, 41).trim() + '…';
        d.setAttribute('data-calisiyor', '1');
        d.setAttribute('aria-busy', 'true');
        var ikon = d.querySelector('i');
        if (ikonlu && ikon) ikon.className = 'fa-solid fa-rotate';
        else d.innerHTML = '<i class="fa-solid fa-rotate" aria-hidden="true"></i> Çalışıyor…';
        /* 🔴 TEK TOAST. Başlangıç düğmenin kendisinde görünüyor
           (dönen ikon + `aria-busy`); ayrıca toast basmak aynı bilgiyi
           iki kez söylüyordu ve yığını dolduruyordu. */
        setTimeout(function () {
          d.removeAttribute('data-calisiyor');
          d.removeAttribute('aria-busy');
          d.innerHTML = eskiHtml;
          /* Zaman damgası — hedef `data-damga` ile bildirilir. */
          var dmg = d.getAttribute('data-damga') && document.querySelector(d.getAttribute('data-damga'));
          if (dmg) {
            var n = new Date();
            dmg.textContent = ('0' + n.getDate()).slice(-2) + '.' + ('0' + (n.getMonth() + 1)).slice(-2) + '.' +
              n.getFullYear() + ' ' + ('0' + n.getHours()).slice(-2) + ':' + ('0' + n.getMinutes()).slice(-2);
          }
          toast(ad2 + ' tamamlandı. (maket)');
        }, 1400);
        return;
      }

      case 'panel-ac': {
        e.preventDefault();
        var pid = d.getAttribute('data-hedef');
        var p = pid && document.getElementById(pid);
        /* Hedefi bildirilmemiş panel açma isteği: satır bağlamındaysa
           satır panelini açar, değilse sayfa başındaki birincil eyleme
           düşer. Hiçbir dalda "bağlı değil" denmez. */
        if (!p) {
          var trP = d.closest('tr');
          if (trP && window.DM_DUZENLE) { window.DM_DUZENLE(trP); return; }
          var bir = document.querySelector('.panel-bas .dugme.birincil[href]');
          if (bir) { window.location.href = bir.getAttribute('href'); return; }
          toast('Bu eylem için bir hedef bildirilmemiş.', 'hata');
          return;
        }
        p.hidden = false; p.classList.add('acik');
        var ilkAlan = p.querySelector('input,select,textarea,button');
        if (ilkAlan) ilkAlan.focus();
        return;
      }

      /* ── SAYFALAMA ────────────────────────────────────────────────
         Ölü buton taramasında sayfalama düğmeleri kırmızı verdi ve
         kitte karşılığı YOKTU. Maket verisi tek sayfa olduğu için
         gerçek sayfalama yapılamaz; yapılan şey DURUMUN dönmesi:
         aktif sayfa değişir, `aria-current` taşınır, sayaç güncellenir.
         🔴 Uydurma satır üretilmiyor — "sayfa 2'de kayıt yok" demek
            yerine sayfa numarası dönüyor ve satırlar duruyor; toast
            bunun maket olduğunu SÖYLÜYOR. */
      case 'sayfala': {
        e.preventDefault();
        var kapS = d.closest('.sayfalama') || d.parentElement;
        var dugmeler = [].slice.call(kapS.querySelectorAll('.sayfa-dugme:not(.ok)'));
        var simdiki = kapS.querySelector('.sayfa-dugme.aktif');
        var hedefD = d;
        if (d.classList.contains('ok')) {
          var i = dugmeler.indexOf(simdiki);
          var ileri = /sonraki|next/i.test(d.getAttribute('aria-label') || d.textContent || '');
          hedefD = dugmeler[Math.max(0, Math.min(dugmeler.length - 1, i + (ileri ? 1 : -1)))];
          if (!hedefD || hedefD === simdiki) { toast('Bu yönde başka sayfa yok.', 'hata'); return; }
        }
        dugmeler.forEach(function (x) {
          x.classList.toggle('aktif', x === hedefD);
          if (x === hedefD) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current');
        });
        var bilgi = document.querySelector('[data-rol="sayfa-bilgi"]');
        if (bilgi) bilgi.textContent = 'Sayfa ' + (hedefD.textContent || '').trim();
        toast('Sayfa ' + (hedefD.textContent || '').trim() + '. (maket — tek sayfa veri var)');
        return;
      }

      /* ── DURUM DEĞİŞTİREN EYLEM ───────────────────────────────────
         "Askıya al" · "Engelle" gibi satır işlemi OLMAYAN, sayfanın
         öznesine uygulanan durum eylemleri. Hedef durum `data-durum`
         ile bildirilir; hap metni oraya döner. */
      case 'durum': {
        e.preventDefault();
        var yeniDurum = d.getAttribute('data-durum') || (d.textContent || '').trim();
        var hapKap = (d.getAttribute('data-hap') && document.querySelector(d.getAttribute('data-hap')))
                   || document.querySelector('.panel-bas .durum-hapi, .panel-bas .rozet, .panel-bas .hap');
        /* Hap yoksa düğmenin kendisi durumu taşır — "bağlı değil" demek
         yerine görünür bir karşılık üretilir. */
      if (!hapKap) {
        d.classList.add('aktif');
        d.setAttribute('aria-pressed', 'true');
        toast('Durum "' + yeniDurum + '" olarak güncellendi. (maket)');
        return;
      }
        hapKap.textContent = yeniDurum;
        d.setAttribute('aria-pressed', 'true');
        toast('Durum "' + yeniDurum + '" olarak güncellendi. (maket)');
        return;
      }

      /* ── YIKICI AMA SİLME OLMAYAN EYLEM ──────────────────────────
         "Anonimleştir" gibi geri alınamaz ama kaydı kaldırmayan
         eylemler. Silme onayının kardeşi; düğme metni onay kapısına
         taşınır, "Sil" yazılmaz. */
      case 'yikici': {
        e.preventDefault();
        var adY = (d.getAttribute('data-ad') || d.textContent || 'Bu işlem').trim();
        onaySor(adY + '?', (d.getAttribute('data-uyari') ||
          'Bu işlem geri alınamaz.'), adY, function (evet) {
          if (evet) toast(adY + ' uygulandı. (maket — sunucuya gitmedi)');
        });
        return;
      }

      /* ── SATIR EKLE ──────────────────────────────────────────────
         Listeye yeni bir boş satır açar. Kalıp SAYFADAN gelir: son
         satır kopyalanıp alanları boşaltılır — kit markup ÜRETMEZ
         (K22'nin "kabuk davranış sürer, markup üretmez" kuralı). */
      case 'satir-ekle': {
        e.preventDefault();
        var liste = (d.getAttribute('data-hedef') && document.querySelector(d.getAttribute('data-hedef')))
                  || (d.closest('.kart') || document).querySelector('.tablo tbody, .kalem-listesi');
        var son = liste && liste.lastElementChild;
        /* Kalıp yoksa TEK ALANLI bir satır açılır: eylem yine bir şey
           yapar, kullanıcı bir şey yazabilir. */
        if (!son) {
          if (!liste) { liste = (d.closest('.kart') || document.body); }
          var bos = document.createElement('div');
          bos.className = 'kalem-satiri yeni';
          bos.innerHTML = '<input class="alan-girdi" placeholder="Yeni kalem">';
          liste.appendChild(bos);
          bos.querySelector('input').focus();
          toast('Yeni kalem eklendi.');
          return;
        }
        var yeniSatir = son.cloneNode(true);
        yeniSatir.querySelectorAll('input, textarea').forEach(function (x) {
          if (x.type === 'checkbox' || x.type === 'radio') x.checked = false; else x.value = '';
        });
        yeniSatir.querySelectorAll('select').forEach(function (x) { x.selectedIndex = 0; });
        yeniSatir.classList.add('yeni');
        liste.appendChild(yeniSatir);
        var ilkG = yeniSatir.querySelector('input, select, textarea');
        if (ilkG) ilkG.focus();
        toast('Yeni satır eklendi.');
        return;
      }

      /* ── GİT · gerçek bir hedefe götürür ────────────────────────
         C kulvarı 13 düğme bildirdi ("…loga git" · "PDF görüntüle" ·
         "Geçmişi görüntüle" · "Paket değiştir") — hepsi bir yere
         gitmek istiyor ve kitte adı yoktu. Hedef `data-hedef` ile
         bildirilir; nitelik bir SAYFA adıysa oraya gider, bir `#id` ise
         o bölüme kaydırır ve kısa bir vurgu bırakır.
         🔴 Hedefi olmayan `git` sessizce durmaz: sayfada aynı adı taşıyan
            bir bölüm arar, onu da bulamazsa kullanıcıya söyler. */
      case 'git': {
        e.preventDefault();
        var hedefG = d.getAttribute('data-hedef') || d.getAttribute('href') || '';
        if (hedefG && !/^#/.test(hedefG)) { window.location.href = hedefG; return; }
        var bolge = hedefG ? document.querySelector(hedefG) : null;
        if (!bolge) {
          var ad = (d.getAttribute('data-ad') || d.textContent || '').trim();
          bolge = [].slice.call(document.querySelectorAll('.kart-baslik, h2, h3'))
            .filter(function (x) { return ad && (x.textContent || '').trim().indexOf(ad.split(' ')[0]) !== -1; })[0];
          if (bolge) bolge = bolge.closest('.kart') || bolge;
        }
        if (!bolge) { toast('Bu eylem için bir hedef bildirilmemiş.', 'hata'); return; }
        bolge.scrollIntoView({ block: 'start' });
        bolge.classList.add('guncellendi');
        setTimeout(function () { bolge.classList.remove('guncellendi'); }, 1600);
        return;
      }

      case 'panel-kapat': {
        e.preventDefault();
        var kapali = d.closest('[id]');
        if (kapali) { kapali.hidden = true; kapali.classList.remove('acik'); }
        return;
      }
    }
  });

  /* Kolon gizle/göster */
  document.addEventListener('change', function (e) {
    var k = e.target.closest('[data-kolon-anahtar]');
    if (!k) return;
    var i = k.getAttribute('data-kolon-anahtar');
    document.querySelectorAll('[data-kolon="' + i + '"]').forEach(function (h) {
      h.classList.toggle('gizli', !k.checked);
    });
  });

  /* Arama kutusu da bir süzgeçtir. */
  document.addEventListener('input', function (e) {
    var g = e.target.closest('.suzgec-cubuk input[type=search], .suzgec-cubuk .panel-arama-girdi');
    if (!g) return;
    var q = (g.value || '').trim().toLocaleLowerCase('tr');
    var tb = document.querySelector('.tablo tbody, table tbody');
    if (!tb) return;
    var n = 0;
    [].forEach.call(tb.rows, function (tr) {
      var uy = !q || (tr.textContent || '').toLocaleLowerCase('tr').indexOf(q) !== -1;
      tr.hidden = !uy; if (uy) n++;
    });
    var kayit = document.querySelector('.suzgec-sayac b');
    if (kayit) kayit.textContent = String(n);
  });

})();
