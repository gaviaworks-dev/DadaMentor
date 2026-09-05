/* ═══════════════════════════════════════════════════════════════════════
   ADMIN UI KİTİ · TARİH / SAAT SEÇİCİ — TEK ORTAK INIT
   ───────────────────────────────────────────────────────────────────────
   Tarih: 2026-09-04 · Beyar kararı, FIT admin revize parti 1
   flatpickr 4.6.13 · cdnjs · Türkçe locale (`l10n/tr.js` · ölçüldü: 200)

   ── SAYFA BAŞINA CONFIG YOK ──────────────────────────────────────────
   Alan tipi NİTELİKLE bildirilir, betik dağıtır:

       data-tarih="tarih"    tek tarih            04.09.2026
       data-tarih="saatli"   tarih + saat         04.09.2026 15:30
       data-tarih="aralik"   başlangıç–bitiş      tek widget, iki değer
       data-tarih="saat"     yalnız saat          15:30

   ── 🔴 NATIVE `<input type=date>` KALMAZ ─────────────────────────────
   Ölçüldü (2026-09-04): form ekranlarında native tarih girdisi
   tarayıcının kendi biçimini basıyordu — `09/15/2026`, yani AY/GÜN/YIL.
   Panelin geri kalanı `04.09.2026` yazıyor. Aynı ekranda iki tarih
   biçimi vardı ve biri yanlış sırada. Betik native girdiyi `text`e
   çevirir; değer ISO kalır, GÖRÜNEN biçim Türkçe olur.

   ── DEĞER İKİ KATMANLI ───────────────────────────────────────────────
   görünen  `input.value`            04.09.2026 15:30   (kullanıcı)
   değer    `input.dataset.iso`      2026-09-04T15:30   (form/doğrulama)
   Doğrulama ISO'yu okur; iki tarihi dize olarak karşılaştırmak ancak
   ISO'da doğrudur.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var HAZIR = { tarih: 0, aralik: 0, saat: 0, saatli: 0 };

  function ortak() {
    return {
      locale: (window.flatpickr && flatpickr.l10ns && flatpickr.l10ns.tr) || 'tr',
      time_24hr: true,                    /* 24 saat */
      allowInput: true,                   /* klavyeyle yazılabilir */
      disableMobile: true,                /* mobil native'e düşmesin — biçim kayar */
      /* ── L6 · AY/YIL HIZLI SEÇİM (2026-09-05 · parti 4) ──────────────
         `'static'` ayı DÜZ METİN yazar: 2019'da doğmuş bir kaydı bulmak
         için ok tuşuna 80 kez basmak gerekiyordu. `'dropdown'` ayı bir
         `<select>` yapar; yıl flatpickr'ın kendi sayı girdisidir ve
         ÜSTÜNE YAZILABİLİR (ok tuşu tek yol değil).
         ⚠ `allowInput` zaten açıktı — L6'nın "klavyeyle yazılabilir"
           yarısı parti 1'den beri koşuyor; ÖLÇÜLDÜ, yeniden yazılmadı. */
      monthSelectorType: 'dropdown',
      nextArrow: '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>',
      prevArrow: '<i class="fa-solid fa-chevron-left" aria-hidden="true"></i>',
    };
  }

  /* "Bugün" ve "Temizle" — flatpickr'ın kendi ayağı yok, kit ekliyor. */
  function ayakEkle(fp, tur) {
    if (!fp.calendarContainer || fp.calendarContainer.querySelector('.fp-kit-ayak')) return;
    var ayak = document.createElement('div');
    ayak.className = 'fp-kit-ayak';
    var bugun = document.createElement('button');
    bugun.type = 'button'; bugun.className = 'dugme hayalet kucuk'; bugun.textContent = 'Bugün';
    bugun.addEventListener('click', function () {
      if (tur === 'aralik') fp.setDate([new Date(), new Date()], true);
      else fp.setDate(new Date(), true);
    });
    var temizle = document.createElement('button');
    temizle.type = 'button'; temizle.className = 'dugme hayalet kucuk'; temizle.textContent = 'Temizle';
    temizle.addEventListener('click', function () { fp.clear(); fp.close(); });
    ayak.appendChild(bugun); ayak.appendChild(temizle);
    fp.calendarContainer.appendChild(ayak);
  }

  function isoYaz(girdi, tarihler, tur) {
    var iso = tarihler.map(function (d) {
      if (tur === 'saat') return d.toTimeString().slice(0, 5);
      var g = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
      return tur === 'saatli' ? g + 'T' + d.toTimeString().slice(0, 5) : g;
    }).join('/');
    girdi.dataset.iso = iso;
    /* Aralığın iki ucu ayrı okunabilsin — doğrulama bunu kullanır. */
    if (tur === 'aralik' && tarihler.length === 2) {
      girdi.dataset.isoBas = iso.split('/')[0];
      girdi.dataset.isoBit = iso.split('/')[1];
    }
  }

  /* ── Ö2 · TİPTEN TÜR TÜRETİLİR ────────────────────────────────────
     `data-tarih` bildirilmemişse tür girdinin KENDİ tipinden okunur.
     Varsayılanı körü körüne 'tarih' yapmak `datetime-local` alanının
     saat yarısını sessizce düşürürdü. */
  function turBul(girdi) {
    var bildirilen = girdi.getAttribute('data-tarih');
    if (bildirilen) return bildirilen;
    if (girdi.type === 'datetime-local') return 'saatli';
    if (girdi.type === 'time') return 'saat';
    return 'tarih';
  }

  function kurBir(girdi) {
    var tur = turBul(girdi);
    /* native girdiyi metne çevir — tarayıcının biçimi devreye girmesin */
    if (girdi.type === 'date' || girdi.type === 'datetime-local' || girdi.type === 'time') {
      var v = girdi.value;
      girdi.type = 'text';
      if (v) girdi.setAttribute('data-varsayilan-iso', v);
    }
    girdi.setAttribute('autocomplete', 'off');

    var cfg = ortak();
    if (tur === 'saat') { cfg.noCalendar = true; cfg.enableTime = true; cfg.dateFormat = 'H:i'; }
    else if (tur === 'saatli') { cfg.enableTime = true; cfg.dateFormat = 'd.m.Y H:i'; }
    else if (tur === 'aralik') { cfg.mode = 'range'; cfg.dateFormat = 'd.m.Y'; cfg.locale = cfg.locale; }
    else { cfg.dateFormat = 'd.m.Y'; }

    cfg.onReady = function (sec, dize, fp) { ayakEkle(fp, tur); };
    cfg.onChange = function (sec) {
      isoYaz(girdi, sec, tur);
      if (window.DM_ALAN_DENETLE) window.DM_ALAN_DENETLE(girdi);
    };
    /* Aralıkta bitiş < başlangıç SEÇİLEMEZ: range kipi bunu kendi
       sağlar (ikinci tıklama hangi yöne olursa olsun sıralar). İKİ AYRI
       ALAN kipinde ise minDate bağı kurulur. */
    var eslesme = girdi.getAttribute('data-aralik-baslangic') || girdi.getAttribute('data-aralik-bitis');
    if (girdi.hasAttribute('data-aralik-bitis') && eslesme) {
      var bas = document.querySelector('[data-aralik-baslangic="' + eslesme + '"]');
      if (bas) cfg.minDate = bas.value || null;
    }

    var fp = flatpickr(girdi, cfg);

    /* Başlangıç seçilince bitişin alt sınırı kayar. */
    if (girdi.hasAttribute('data-aralik-baslangic') && eslesme) {
      girdi.addEventListener('change', function () {
        var bit = document.querySelector('[data-aralik-bitis="' + eslesme + '"]');
        if (bit && bit._flatpickr) bit._flatpickr.set('minDate', girdi.value || null);
      });
    }

    /* Varsayılan değeri geri koy — native girdiden gelen ISO. */
    var vars = girdi.getAttribute('data-varsayilan-iso');
    if (vars) fp.setDate(vars, true);

    HAZIR[tur] = (HAZIR[tur] || 0) + 1;
    return fp;
  }

  /* ── GENEL BAKIŞ · "Tarih aralığı" süzgeci ────────────────────────────
     Beyar şartı: Bugün / Son 7 gün / Son 30 gün / Bu çeyrek / Özel aralık.
     "Özel aralık" seçilince flatpickr range açılır ve şeridin sayacı
     güncellenir. Hazır kalemler tarihi HESAPLAR — uydurma değer yok. */
  function hazirAralik(anahtar) {
    var b = new Date(), s = new Date(b);
    if (anahtar === 'bugun') return [b, b];
    if (anahtar === 'gun7') { s.setDate(b.getDate() - 6); return [s, b]; }
    if (anahtar === 'gun30') { s.setDate(b.getDate() - 29); return [s, b]; }
    if (anahtar === 'ceyrek') {
      var c = Math.floor(b.getMonth() / 3);
      return [new Date(b.getFullYear(), c * 3, 1), b];
    }
    return null;
  }
  function bicim(d) {
    return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + d.getFullYear();
  }

  function kurSuzgecAraligi() {
    document.querySelectorAll('[data-tarih-suzgec]').forEach(function (kap) {
      var etiket = kap.querySelector('[data-rol="tarih-etiket"]') || kap.querySelector('span');
      var gizli = kap.querySelector('input[data-tarih="aralik"]');
      if (!gizli) {
        gizli = document.createElement('input');
        gizli.type = 'text'; gizli.className = 'gorunmez-girdi';
        gizli.setAttribute('data-tarih', 'aralik');
        gizli.setAttribute('aria-label', 'Özel tarih aralığı');
        gizli.tabIndex = -1;
        kap.appendChild(gizli);
      }
      var fp = kurBir(gizli);
      kap.addEventListener('click', function (e) {
        var s = e.target.closest('[data-aralik]');
        if (!s) return;
        e.preventDefault();
        var anahtar = s.getAttribute('data-aralik');
        kap.querySelectorAll('[data-aralik]').forEach(function (x) {
          x.classList.toggle('aktif', x === s);
          x.setAttribute('aria-checked', String(x === s));
        });
        if (anahtar === 'ozel') { fp.open(); return; }
        var ara = hazirAralik(anahtar);
        if (!ara) return;
        fp.setDate(ara, true);
        if (etiket) etiket.textContent = s.textContent.trim();
        var tetik = document.querySelector('[aria-controls="' + kap.id + '"]');
        if (tetik) tetik.setAttribute('aria-expanded', 'false');
        kap.hidden = true;
        if (window.DM_SUZGEC_TAZELE) window.DM_SUZGEC_TAZELE();
      });
      fp.config.onChange.push(function (sec) {
        if (sec.length === 2 && etiket) etiket.textContent = bicim(sec[0]) + ' – ' + bicim(sec[1]);
        if (window.DM_SUZGEC_TAZELE) window.DM_SUZGEC_TAZELE();
      });
    });
  }

  function kur() {
    if (!window.flatpickr) return;
    if (window.flatpickr.l10ns && window.flatpickr.l10ns.tr) flatpickr.localize(flatpickr.l10ns.tr);
    /* ── Ö2 · KANCA `type="date"`İ DE KAPSAR ────────────────────────
       2026-09-05 · Gastro önerisi Ö2, sayıldı:
           çıplak type=date/datetime-local/time   gastro 23 · fit 0
       Kanca yalnız `input[data-tarih]` arıyordu; niteliksiz alanlar
       tarayıcının kendi `mm/dd/yyyy` yüzeyiyle çiziliyordu — panelin
       geri kalanı `04.09.2026` yazarken AYNI EKRANDA ikinci bir tarih
       biçimi, üstelik yanlış sırada. Kusur kuralın yokluğu değil,
       kancanın dar oluşuydu: dosya başındaki "native girdi KALMAZ"
       kararı zaten yazılıydı ve 23 alanda hiç koşmuyordu.
       (parti 3'ün "yazılmış bir kural, koşan bir kural değildir"
        dersinin bu turdaki karşılığı.)
       ⚠ Ad SÖZLEŞMESİ değişmedi: `data-tarih` hâlâ birincil bildirim
         ve türü O söyler; tip yalnız bildirilmemişse okunur. */
    document.querySelectorAll('input[data-tarih], input[type="date"], input[type="datetime-local"], input[type="time"]')
      .forEach(function (g) {
        if (g._flatpickr) return;
        if (g.closest('[data-tarih-suzgec]')) return; /* süzgeç kendi kuruyor */
        kurBir(g);
      });
    kurSuzgecAraligi();
    window.DM_TARIH_HAZIR = HAZIR;                    /* doğrulama okusun diye */
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur);
  else kur();
})();
