/* =====================================================================
   DADAGASTRO · PARTİ 3 · AJAN B — SÜRÜCÜ
   ÜRETİLİR, ELLE DÜZENLENMEZ: scripts/gastro-p3-ajan-b.mjs
   Kapsam: puf-noktasi-ekle.html · tarif-ekle.html
     1) Aranabilir çoklu çip seçici (K5) — malzemelerden öneri
     2) "Metin" alanının kelime sayacı
   Yeni bileşen açmaz; kanonun `.coklu-secim` / `.acilir-yuzey`
   markup'ını sürer.
   ===================================================================== */
(function () {
  'use strict';
  if (window.__dmP3B) return; window.__dmP3B = true;

  var $  = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };

  /* ═══ 1 · ETİKET SEÇİCİ ══════════════════════════════════════════════
     Markup enjektörden gelir; burada YALNIZ davranış var.
     Seçenek listesi sayfadaki `.acilir-kalem[data-etiket]` düğümleridir —
     JS'te ikinci bir liste TUTULMAZ (iki liste kayar). */
  function etiketSeciciKur(kok) {
    var kutu   = $('[data-ek-etiket-kutu]', kok);
    var yuzey  = $('[data-ek-etiket-yuzey]', kok);
    var ara    = $('[data-ek-etiket-ara]', kok);
    var liste  = $('[data-ek-etiket-liste]', kok);
    var bos    = $('[data-ek-etiket-bos]', kok);
    var gizli  = $('[data-ek-etiket-deger]', kok);
    var temizle= $('[data-ek-etiket-temizle]', kok);
    var tutucu = $('[data-ek-etiket-tutucu]', kok);
    if (!kutu || !yuzey || !liste) return;

    var secili = [];   /* sıra KULLANICININ seçme sırası */

    function kalemler() { return $$('.acilir-kalem[data-etiket]', liste); }

    function cipCiz() {
      $$('.coklu-cip', kutu).forEach(function (c) { c.remove(); });
      secili.forEach(function (ad) {
        var c = document.createElement('span');
        c.className = 'coklu-cip';
        c.appendChild(document.createTextNode(ad));
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', ad + ' etiketini kaldır');
        b.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          sec(ad, false);
        });
        c.appendChild(b);
        kutu.insertBefore(c, tutucu);
      });
      if (tutucu) tutucu.hidden = secili.length > 0;
    }

    function yaz() {
      if (gizli) gizli.value = secili.join(',');
      var say = $('[data-ek-etiket-say]', kok.closest('.alan') || document);
      if (say) say.textContent = secili.length ? secili.length + ' etiket' : 'seçilmedi';
      cipCiz();
      kalemler().forEach(function (k) {
        var v = secili.indexOf(k.dataset.etiket) > -1;
        k.classList.toggle('aktif', v);
        k.setAttribute('aria-selected', v ? 'true' : 'false');
        var i = k.querySelector('i');
        if (i) i.className = v ? 'fa-solid fa-square-check' : 'fa-regular fa-square';
      });
      /* Form durumu değişti — yayın kartının sayaçları bunu dinliyor. */
      if (gizli) { try { gizli.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {} }
    }

    function sec(ad, deger) {
      var i = secili.indexOf(ad);
      if (deger && i < 0) secili.push(ad);
      if (!deger && i > -1) secili.splice(i, 1);
      yaz();
    }

    /* ── Süzgeç ── */
    function suz() {
      var q = (ara && ara.value || '').trim().toLocaleLowerCase('tr');
      var gorunen = 0;
      kalemler().forEach(function (k) {
        var v = !q || k.dataset.etiket.toLocaleLowerCase('tr').indexOf(q) > -1;
        k.hidden = !v;
        if (v) gorunen++;
      });
      if (bos) bos.hidden = gorunen > 0;
    }

    /* ── ÖNERİ · malzemelerden ────────────────────────────────────────
       Kural kümesi bir ARAYÜZ SEZGİSİDİR, veri değildir: hiçbir tarif
       verisi okunmuyor, kullanıcının O ANDA yazdığı malzeme adları
       taranıyor. Öneri hiçbir şeyi kendiliğinden SEÇMEZ — yalnız
       listede işaretler ve sebebini yazar. Karar kullanıcınındır. */
    var OLUMSUZ = {   /* "şu kelimelerin HİÇBİRİ yoksa öner" */
      'Vegan':        ['et','kıyma','tavuk','hindi','balık','ton','karides','kuzu','dana','sucuk','pastırma','jambon','süt','yoğurt','peynir','kaşar','lor','yumurta','tereyağ','krema','kaymak','bal','jelatin','ayran','labne','kefir'],
      'Vejetaryen':   ['et','kıyma','tavuk','hindi','balık','ton','karides','kuzu','dana','sucuk','pastırma','jambon','jelatin','ançüez'],
      'Glutensiz':    ['un','ekmek','bulgur','makarna','irmik','arpa','buğday','yufka','erişte','mantı','şehriye','kuskus','malt','galeta','çavdar','kepek'],
      'Laktozsuz':    ['süt','yoğurt','peynir','kaşar','lor','tereyağ','krema','kaymak','ayran','labne','kefir','muhallebi'],
      'Şeker ilavesiz':['şeker','pekmez','bal','şurup','glikoz','fruktoz','çikolata','krem şanti']
    };
    var OLUMLU = {    /* "şu kelimelerden biri varsa öner" */
      'Yüksek lifli':      ['mercimek','nohut','fasulye','barbunya','bulgur','yulaf','kepek','brokoli','ıspanak','pırasa','enginar','armut','elma','chia','keten'],
      'Protein ağırlıklı': ['et','kıyma','tavuk','hindi','balık','ton','karides','yumurta','mercimek','nohut','fasulye','peynir','lor','yoğurt','kinoa'],
      'Acılı':             ['acı','pul biber','isot','jalapeno','sriracha','arnavut biber','acı biber','tabasco','harissa']
    };
    var AZYAG = ['yağ','tereyağ','krema','kaymak','margarin','zeytinyağ','ayçiçek'];

    function malzemeAdlari() {
      return $$('[data-ek-malzemeler] .ek-msatir .ek-ad')
        .map(function (i) { return (i.value || '').trim().toLocaleLowerCase('tr'); })
        .filter(function (s) { return s.length > 1; });
    }
    function gecer(adlar, kelimeler) {
      return adlar.some(function (a) {
        return kelimeler.some(function (k) { return a.indexOf(k) > -1; });
      });
    }
    function onerileriTazele() {
      var adlar = malzemeAdlari();
      var oneri = {};
      /* 🔴 EN AZ ÜÇ MALZEME ŞARTI. "Et yok" iddiası BOŞ listede de
         doğrudur ve anlamsızdır; öneri ancak sayılabilir bir liste
         varken bilgi taşır. Değer ölçülmedi, GEREKÇELİ seçildi ve
         raporda açık kalem olarak duruyor. */
      if (adlar.length >= 3) {
        Object.keys(OLUMSUZ).forEach(function (ad) {
          if (!gecer(adlar, OLUMSUZ[ad])) oneri[ad] = 'malzemelerde karşılığı yok';
        });
        if (!gecer(adlar, AZYAG)) oneri['Az yağlı'] = 'malzemelerde karşılığı yok';
      }
      if (adlar.length >= 1) {
        Object.keys(OLUMLU).forEach(function (ad) {
          if (gecer(adlar, OLUMLU[ad])) oneri[ad] = 'malzeme listesinden';
        });
      }
      kalemler().forEach(function (k) {
        var ad = k.dataset.etiket;
        var rozet = k.querySelector('.etiket-oneri');
        if (oneri[ad]) {
          if (!rozet) {
            rozet = document.createElement('span');
            rozet.className = 'etiket-oneri';
            k.appendChild(rozet);
          }
          rozet.textContent = 'Öneri';
          k.title = 'Öneri — ' + oneri[ad];
        } else if (rozet) { rozet.remove(); k.removeAttribute('title'); }
      });
      /* Önerilenler listenin BAŞINA çıkar; seçenek SİLİNMEZ, sıra değişir. */
      var hepsi = kalemler();
      hepsi.slice().sort(function (a, b) {
        var oa = oneri[a.dataset.etiket] ? 0 : 1, ob = oneri[b.dataset.etiket] ? 0 : 1;
        if (oa !== ob) return oa - ob;
        return hepsi.indexOf(a) - hepsi.indexOf(b);
      }).forEach(function (k) { liste.appendChild(k); });
      var not = $('[data-ek-etiket-oneri-not]', kok);
      var n = Object.keys(oneri).length;
      if (not) not.textContent = n ? n + ' etiket malzemelerinden öneriliyor.' : '';
    }

    /* ── Aç / kapat ── */
    function ac(v) {
      yuzey.hidden = !v;
      kutu.setAttribute('aria-expanded', v ? 'true' : 'false');
      if (v) { onerileriTazele(); suz(); if (ara) ara.focus(); }
    }
    kutu.addEventListener('click', function () { ac(yuzey.hidden); });
    if (ara) ara.addEventListener('input', suz);
    liste.addEventListener('click', function (e) {
      var k = e.target.closest('.acilir-kalem[data-etiket]');
      if (!k) return;
      sec(k.dataset.etiket, secili.indexOf(k.dataset.etiket) < 0);
    });
    if (temizle) temizle.addEventListener('click', function () { secili = []; yaz(); });
    document.addEventListener('click', function (e) {
      if (!yuzey.hidden && !kok.contains(e.target)) ac(false);
    });
    kok.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !yuzey.hidden) { ac(false); kutu.focus(); }
    });
    /* Malzeme satırları değiştikçe öneri tazelenir — liste açıkken de. */
    document.addEventListener('input', function (e) {
      if (e.target && e.target.classList && e.target.classList.contains('ek-ad')) {
        if (!yuzey.hidden) onerileriTazele();
      }
    });
    var mkap = $('[data-ek-malzemeler]');
    if (mkap && window.MutationObserver) {
      new MutationObserver(function () { if (!yuzey.hidden) onerileriTazele(); })
        .observe(mkap, { childList: true, subtree: true });
    }

    yaz();
  }

  /* ═══ 2 · "METİN" ALANI · KELİME SAYACI ══════════════════════════════
     `admin-editor.js` her `change`/`keyup`ta `ed.save()` çağırıp
     textarea'ya `input` olayı gönderiyor (kanonun kendi şerhi) —
     sayaç o olaya bağlanır, TinyMCE'nin iç API'sine değil. Editör
     yüklenmese bile çıplak textarea aynı olayı gönderir. */
  function metinSayaciKur(alan) {
    var kart = alan.closest('[data-ek-metin]');
    if (!kart) return;
    var b = kart.querySelector('[data-ek-sayac="metin"] b');
    if (!b) return;
    function say() {
      var d = document.createElement('div');
      d.innerHTML = alan.value || '';
      var t = (d.textContent || '').replace(/\s+/g, ' ').trim();
      b.textContent = t ? t.split(' ').length : 0;
    }
    alan.addEventListener('input', say);
    alan.addEventListener('change', say);
    say();
  }

  /* ═══ 3 · RAYIN KAYDIRMA GÖSTERGESİ ═════════════════════════════════
     Sınıf yalnız ray GERÇEKTEN taşarken ve dibe inilmemişken durur.
     Sabit bir süs değil; `scrollHeight`/`clientHeight` ölçülerek
     konur ve kalkar. 1080 altında ray statik olduğu için hiç girmez. */
  function rayGostergesi(ray) {
    function tazele() {
      var tasar = ray.scrollHeight - ray.clientHeight > 2;
      var dipte = ray.scrollTop + ray.clientHeight >= ray.scrollHeight - 2;
      ray.classList.toggle('ek-ray-tasar', tasar && !dipte);
    }
    ray.addEventListener('scroll', tazele, { passive: true });
    window.addEventListener('resize', tazele, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(tazele).observe(ray);
    tazele();
  }

  function kur() {
    $$('.ek-ray').forEach(rayGostergesi);
    $$('[data-ek-etiket-coklu]').forEach(etiketSeciciKur);
    $$('textarea[data-ek-metin-alan]').forEach(metinSayaciKur);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur);
  else kur();
})();
