/* =====================================================================
   dm-p3-a.js — AJAN A · g-mutfak-defterim · PARTİ 3
   YALNIZ bu sayfadan yüklenir. Hiçbir metin/sayı ÜRETMEZ; bütün
   değerler sayfanın kendi markup'ından okunur.

   🔴 SÜRÜCÜ İCAT EDİLMEDİ — A4'ün kalbi kaynağın kendi sözleşmesini
      uygular: `portal-Co4op6F_.js` içindeki
      `.r-save:not([data-save-toggle])` dalı `.saved` sınıfını takas
      eder ve <i>'nin `fa-solid`/`fa-regular` çiftini değiştirir.
      Diğer dal (`[data-save-toggle]`) sunucuya POST atıyor; makette
      form `action` taşımadığı için HİÇBİR ŞEY yapmaz. Bu sayfa portal
      paketini yüklemiyor (ölçüldü: 3 betik), bu yüzden aynı sözleşme
      burada yeniden kuruldu — davranış değişmedi, kapsam değişti.
   ===================================================================== */
(function () {
  'use strict';

  var yakin = function (h, s) { return h && h.closest ? h.closest(s) : null; };
  function kartBul(el) { return yakin(el, '.r-card, .dk-puf'); }

  /* ── A2 · ÜÇ İKON DÜĞME VE PANELLERİ ───────────────────────────── */
  function panelleriKapat(haric) {
    document.querySelectorAll('[data-p3a-ac][aria-expanded="true"]').forEach(function (b) {
      if (b === haric) return;
      b.setAttribute('aria-expanded', 'false');
      var p = document.getElementById(b.getAttribute('aria-controls'));
      if (p) p.hidden = true;
    });
  }

  function panelAc(dugme) {
    var panel = document.getElementById(dugme.getAttribute('aria-controls'));
    if (!panel) return;
    var acik = dugme.getAttribute('aria-expanded') === 'true';
    panelleriKapat(dugme);
    dugme.setAttribute('aria-expanded', acik ? 'false' : 'true');
    panel.hidden = acik;
    /* Odak YALNIZ form panelinde ilerletilir. Menü panelinde odağı
       programla taşımak, fareyle açan kullanıcıya :focus-visible
       halkasını bastırıyordu (ekran görüntüsüyle görüldü); menü
       düğmenin hemen ardından geldiği için Tab zaten oraya iner. */
    if (!acik) {
      var ilk = panel.querySelector('input, textarea');
      if (ilk) ilk.focus();
    }
  }

  /* Kart başlığını güncelle — h4 içinde <a> varsa onun metni değişir. */
  function baslikYaz(kart, metin) {
    var h4 = kart.querySelector('h4'); if (!h4 || !metin) return false;
    var a = h4.querySelector('a');
    (a || h4).textContent = metin;
    kart.setAttribute('data-ad', metin.toLocaleLowerCase('tr'));
    return true;
  }

  /* Durum hapı — menü kaleminin uyguladığı/geri aldığı hâl. */
  var DURUM_KIP = { 'Taslağa al': ['Taslak', 'bekleyen'], 'Yayından kaldır': ['Yayında değil', 'bekleyen'] };
  function durumUygula(kart, etiket, kip) {
    var hap = kart.querySelector('.dk-durum');
    if (hap) {
      hap.className = hap.className.replace(/\b(acik|bekleyen|cozulen)\b/g, '').trim() + ' ' + kip;
      hap.textContent = etiket;
    }
    kart.setAttribute('data-durum', etiket);
  }

  function onaySatiri(dugme) {
    var v = document.createElement('div');
    v.className = 'dk-onay';
    v.innerHTML = '<span>Bu kart silinsin mi?</span>' +
      '<button class="dugme hayalet kucuk" type="button" data-p3a-eylem="sil-vazgec">Vazgeç</button>' +
      '<button class="dugme birincil kucuk" type="button" data-p3a-eylem="sil-onay">' +
      '<i class="fa-solid fa-trash-can" aria-hidden="true"></i> Sil</button>';
    dugme.parentNode.insertBefore(v, dugme.nextSibling);
    v.querySelector('[data-p3a-eylem="sil-onay"]').focus();
  }

  function silindiSeridi(kart) {
    if (kart.querySelector('.dk-silindi')) return;
    var s = document.createElement('div');
    s.className = 'dk-silindi';
    s.innerHTML = '<i class="fa-solid fa-trash-can" aria-hidden="true"></i>' +
      '<span>Silindi</span>' +
      '<button class="dugme hayalet kucuk" type="button" data-p3a-eylem="geri-al">' +
      '<i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Geri al</button>';
    kart.appendChild(s);
  }

  /* ── A4 · KALP ─────────────────────────────────────────────────
     🔴 DELEGASYONLA BAĞLANAMAZ — kapı yakaladı, düğme ÖLÜYDÜ.
     Donörün markup'ı kalbi <form onclick="event.stopPropagation()">
     içine koyuyor (tarifler.html'in kendi kalıbı); tıklama document'e
     HİÇ ulaşmıyor. Kaynağın kendi sürücüsü de zaten DOĞRUDAN bağlıyor
     (portal-*.js: querySelectorAll('.r-save…').forEach(addEventListener)).
     Ders: "kapı sorduğu soruyu ölçer" — yapısal ölçüt (kalp var mı,
     dolu mu) YEŞİLDİ; kusuru yalnız TIKLAMA ölçütü gördü. */
  function kalpTakas(e) {
    var kalp = e.currentTarget;
    e.preventDefault(); e.stopPropagation();
    var kayitli = !kalp.classList.contains('saved');
    kalp.classList.toggle('saved', kayitli);
    var ik = kalp.querySelector('i');
    if (ik) { ik.classList.toggle('fa-solid', kayitli); ik.classList.toggle('fa-regular', !kayitli); }
    kalp.setAttribute('aria-pressed', kayitli ? 'true' : 'false');
    var et = kayitli ? 'Kayıttan çıkar' : 'Yeniden kaydet';
    kalp.setAttribute('aria-label', et); kalp.setAttribute('title', et);
    var kk = yakin(kalp, '.r-card');
    if (kk) {
      kk.classList.toggle('dk-kayit-cikti', !kayitli);
      var kap = kk.querySelector('.dk-kayit-durum');
      var d = kap ? kap.querySelector('span') : null;
      if (d && kap) d.textContent = kap.getAttribute(kayitli ? 'data-p3a-kayitli' : 'data-p3a-cikti') || d.textContent;
      /* 🔴 GERİ ALMA BAĞLANTISI · SAYFANIN KENDİ KURALI, uydurulmadı:
         "#kaydettiklerim" girişi aynen şunu yazıyor — "Bir kaydı
         kaldırmak listeyi bozmaz, kart YERİNDE SOLAR ve GERİ ALMA
         bağlantısı BEŞ SANİYE görünür." Kural markup'ta değil METİNDE
         duruyordu; "kaynağın kuralı dosyasında yazılıdır". */
      if (kap) {
        var g = kap.querySelector('[data-p3a-eylem="kayit-geri"]');
        clearTimeout(kap._z);
        if (kayitli) { if (g) g.remove(); }
        else {
          if (!g) {
            g = document.createElement('button');
            g.className = 'dugme hayalet kucuk dk-kayit-geri';
            g.type = 'button';
            g.setAttribute('data-p3a-eylem', 'kayit-geri');
            g.innerHTML = '<i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Geri al';
            kap.appendChild(g);
          }
          kap._z = setTimeout(function () { if (g && g.parentNode) g.remove(); }, 5000);
        }
      }
    }
  }
  document.querySelectorAll('[data-p3a="kalp"]').forEach(function (b) {
    b.addEventListener('click', kalpTakas);
  });

  document.addEventListener('click', function (e) {
    var h = e.target;

    /* açılır düğmeler */
    var ac = yakin(h, '[data-p3a-ac]');
    if (ac) { e.preventDefault(); panelAc(ac); return; }

    var ey = yakin(h, '[data-p3a-eylem]');
    if (ey) {
      var tur = ey.getAttribute('data-p3a-eylem');
      var kart = kartBul(ey);
      var panel = yakin(ey, '.dk-pop');

      if (tur === 'kapat' && panel) {
        e.preventDefault();
        var dg = document.querySelector('[aria-controls="' + panel.id + '"]');
        if (dg) panelAc(dg);
        return;
      }
      if (tur === 'kaydet' && panel && kart) {
        e.preventDefault();
        var bAlan = panel.querySelector('[data-p3a-alan="baslik"]');
        var oAlan = panel.querySelector('[data-p3a-alan="ozet"]');
        var yeni = bAlan ? bAlan.value.trim() : '';
        if (!yeni) { if (bAlan) { bAlan.classList.add('hatali'); bAlan.focus(); } return; }
        if (bAlan) bAlan.classList.remove('hatali');
        baslikYaz(kart, yeni);
        if (oAlan) oAlan.setAttribute('data-p3a-deger', oAlan.value.trim());
        var ayak = panel.querySelector('.dk-pop-ayak');
        var not = panel.querySelector('.dk-pop-durum');
        if (!not && ayak) { not = document.createElement('span'); not.className = 'dk-pop-durum'; ayak.insertBefore(not, ayak.firstChild); }
        if (not) {
          not.textContent = 'Kaydedildi';
          clearTimeout(not._z); not._z = setTimeout(function () { not.textContent = ''; }, 2400);
        }
        return;
      }
      if (tur === 'durum' && kart) {
        e.preventDefault();
        var etiket = ey.getAttribute('data-p3a-durum') || '';
        if (ey.classList.contains('aktif')) {
          durumUygula(kart, kart.getAttribute('data-p3a-durum0') || etiket,
                            kart.getAttribute('data-p3a-durumkip0') || 'acik');
          ey.classList.remove('aktif');
        } else {
          var kip = DURUM_KIP[etiket] || [etiket, 'bekleyen'];
          durumUygula(kart, kip[0], kip[1]);
          if (panel) panel.querySelectorAll('.acilir-kalem.aktif').forEach(function (o) { o.classList.remove('aktif'); });
          ey.classList.add('aktif');
        }
        return;
      }
      if (tur === 'sil') {
        e.preventDefault();
        if (!ey.nextElementSibling || !ey.nextElementSibling.classList.contains('dk-onay')) onaySatiri(ey);
        return;
      }
      if (tur === 'sil-vazgec') { e.preventDefault(); var o = yakin(ey, '.dk-onay'); if (o) o.remove(); return; }
      if (tur === 'sil-onay' && kart) {
        e.preventDefault();
        var oo = yakin(ey, '.dk-onay'); if (oo) oo.remove();
        panelleriKapat(null);
        kart.setAttribute('data-p3a-silindi', '1');
        silindiSeridi(kart);
        return;
      }
      if (tur === 'kayit-geri') {
        e.preventDefault();
        var kk2 = yakin(ey, '.r-card');
        var kalp2 = kk2 ? kk2.querySelector('[data-p3a="kalp"]') : null;
        if (kalp2) kalp2.click();
        return;
      }
      if (tur === 'geri-al' && kart) {
        e.preventDefault();
        kart.removeAttribute('data-p3a-silindi');
        var st = kart.querySelector('.dk-silindi'); if (st) st.remove();
        return;
      }
    }

    /* dışarı tıklama panelleri kapatır */
    if (!yakin(h, '.dk-pop')) panelleriKapat(null);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var acik = document.querySelector('[data-p3a-ac][aria-expanded="true"]');
      if (acik) { panelleriKapat(null); acik.focus(); }
    }
  });

  /* ── A5 · NOT TÜRÜ · "Yeni not yaz" ile aynı satırda ────────────── */
  (function () {
    var kap = document.querySelector('[data-p3a="not-tur"]');
    var liste = document.getElementById('dk-not-liste');
    if (!kap) return;
    var cipler = [].slice.call(kap.querySelectorAll('.dk-tur-cip'));

    function secili() {
      var a = kap.querySelector('.dk-tur-cip.aktif');
      return a ? a.getAttribute('data-p3a-tur') : 'serbest';
    }
    function uygula() {
      var d = document.querySelector('.dk-not-yeni'); if (!d) return;
      var s = d.querySelector('#dkNotTarif'); if (!s) return;
      var alan = s.closest('.alan') || s;
      var bagli = secili() === 'bagli';
      alan.hidden = !bagli;
      if (!bagli) s.value = '';
    }
    function sec(c) {
      cipler.forEach(function (o) {
        var a = o === c;
        o.classList.toggle('aktif', a);
        o.setAttribute('aria-checked', a ? 'true' : 'false');
      });
      uygula();
    }
    kap.addEventListener('click', function (e) {
      var c = yakin(e.target, '.dk-tur-cip'); if (!c) return;
      sec(c);
    });
    kap.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var i = cipler.indexOf(document.activeElement); if (i < 0) return;
      e.preventDefault();
      var j = (i + (e.key === 'ArrowRight' ? 1 : cipler.length - 1)) % cipler.length;
      cipler[j].focus(); sec(cipler[j]);
    });
    /* Düzenleyici p2 betiği tarafından basılıyor; SIRA VARSAYILMAZ —
       liste değişimini izle (kayıtlı ders: "bağlandı bayrağı"). */
    if (liste && window.MutationObserver) {
      new MutationObserver(function () { uygula(); }).observe(liste, { childList: true });
    }
    uygula();
  })();

  /* ── A6 · SEKME RAYI · kaydırma göstergesi ──────────────────────── */
  (function () {
    var ray = document.querySelector('.pf-tabbar [role="tablist"]');
    var nav = document.querySelector('[data-p3a="ray-nav"]');
    if (!ray || !nav) return;
    var geri = nav.querySelector('[data-p3a-ray="geri"]');
    var ileri = nav.querySelector('[data-p3a-ray="ileri"]');

    function guncelle() {
      var tasma = ray.scrollWidth - ray.clientWidth;
      nav.hidden = tasma <= 1;
      var sol = ray.scrollLeft > 1, sag = ray.scrollLeft < tasma - 1;
      ray.classList.toggle('dk-ray-solda', !nav.hidden && sol);
      ray.classList.toggle('dk-ray-sagda', !nav.hidden && sag);
      if (geri) geri.disabled = !sol;
      if (ileri) ileri.disabled = !sag;
    }
    function gorunurYap(el) {
      var r = el.getBoundingClientRect(), rr = ray.getBoundingClientRect();
      if (r.left < rr.left) ray.scrollLeft -= (rr.left - r.left) + 12;
      else if (r.right > rr.right) ray.scrollLeft += (r.right - rr.right) + 12;
      /* UÇ YAKININDA UCA YAPIŞ — ölçüldü: son sekmeye kaydırdıktan sonra
         4px artık kalıyordu; ok etkin görünüyor ama neredeyse hiçbir şey
         yapmıyor ve kenar solması "daha var" diyor. */
      var son = ray.scrollWidth - ray.clientWidth;
      if (ray.scrollLeft > son - 24) ray.scrollLeft = son;
      else if (ray.scrollLeft < 24) ray.scrollLeft = 0;
    }
    nav.addEventListener('click', function (e) {
      var b = yakin(e.target, '[data-p3a-ray]'); if (!b) return;
      var adim = Math.max(120, ray.clientWidth * 0.7);
      ray.scrollBy({ left: b.getAttribute('data-p3a-ray') === 'ileri' ? adim : -adim, behavior: 'smooth' });
    });
    ray.addEventListener('click', function (e) {
      var s = yakin(e.target, '.sekme'); if (s) setTimeout(function () { gorunurYap(s); guncelle(); }, 0);
    });
    ray.addEventListener('scroll', guncelle, { passive: true });
    window.addEventListener('resize', guncelle);
    guncelle();
  })();
})();
