/* T5B/T5C · LEAD form sürücüsü — yalnız lead kulvarı yazar.
   K15 · `moForm` ve `olForm` gerçek gönderim yapıp maketi yok ediyordu
   (ölçüldü: tam sayfa gezinmesi, DOM 273045 → 208, başarı yüzeyi yok).
   `fbForm`un sürücüsü (`t5-b.js`) okundu ve aynı kip uygulandı:
   preventDefault + gönderim anında ÜRETİLEN başarı yüzeyi + forma dönüş.
   Panel statik markup'a YAZILMAZ: paketin dalı panelin VARLIĞINA bakıp
   modalı sayfa açılışında açıyor (ajan B ölçtü, kip B/C).
   Metin donörün `fb-success`inden birebir; tek değişken özne adı ve o da
   sayfanın kendi sözcüğü ("öner" · "başvuru"). Yeni sınıf/renk yok. */
(function () {
  'use strict';

  /* İdempotans bayrağı `window`da: DOM'a yazılan bayrak kaydedilmiş
     kopyada donar ve dinleyici hiç bağlanmaz. `k11b`nin bayrağıyla
     karıştırılmadı — ayrı ad, ayrı yer. */
  if (window.__t5cLeadForm) return;
  window.__t5cLeadForm = true;

  var KALIP =
    '<span class="ok"><i class="fa-solid fa-flask" aria-hidden="true"></i></span>' +
    '<BAS>{ad}n gönderilmedi — burası maket</BAS>' +
    '<p>Yazdıkların hiçbir yere iletilmedi ve kaydedilmedi. Bu ekran, canlı ' +
    'sürümde gönderimden sonra göreceğin adımın yerini tutuyor.</p>' +
    '<button class="btn btn-ghost fb-again" type="button" id="{geri}">Forma dön</button>';

  function panelHTML(ad, bas, geri) {
    return KALIP.split('{ad}').join(ad).split('{geri}').join(geri)
                .split('<BAS>').join('<' + bas + '>')
                .split('</BAS>').join('</' + bas + '>');
  }

  /* tek kip, iki özne. `kap` panelin gireceği yer; null ise formun ardına. */
  function bagla(formId, panelId, geriId, sinif, bas, ad, kapSecici, sifirlayicilar) {
    var f = document.getElementById(formId);
    if (!f) return 0;                       /* özne yok — bu sayfada yok */

    function panelSok() {
      var s = document.getElementById(panelId);
      if (s && s.parentNode) s.parentNode.removeChild(s);
      f.hidden = false;
    }

    function panelAc() {
      if (document.getElementById(panelId)) return;   /* çift gönderim */
      f.hidden = true;
      var d = document.createElement('div');
      d.className = sinif;
      d.id = panelId;
      d.innerHTML = panelHTML(ad, bas, geriId);
      var kap = kapSecici ? document.querySelector(kapSecici) : null;
      if (kap) kap.appendChild(d); else f.insertAdjacentElement('afterend', d);
      /* Odak panelin KENDİ düğmesine: donörün markup'ına `role`/`aria-live`
         EKLENMİYOR (donörde yok), ama panel dinamik doğduğu için odak
         taşınmazsa ekran okuyucu hiç haber alamaz. `t5-b.js` ile aynı çözüm. */
      var g = document.getElementById(geriId);
      if (g) {
        g.addEventListener('click', panelSok);
        try { g.focus({ preventScroll: true }); } catch (e) { g.focus(); }
      }
    }

    f.addEventListener('submit', function (e) {
      /* 🔴 GEZİNMEYİ DURDUR. Ölçüldü: form kendi adresine POST ediyor,
         tam sayfa gezinmesi oluyor ve MAKET YOK OLUYOR. Panelin metni de
         "hiçbir yere iletilmedi" diyor — gönderimi gerçekten durdurmak o
         beyanı DOĞRU kılıyor. */
      e.preventDefault();
      panelAc();
    });

    /* Kapanış/yeniden açılışta forma dönülür; aksi hâlde panel bir sonraki
       açılışta karşılardı. `stopPropagation` YOK: paketin kendi dinleyicisi
       de koşmalı (kayıtlı ders: stopPropagation delegasyonu öldürür). */
    (sifirlayicilar || []).forEach(function (sec) {
      Array.prototype.forEach.call(document.querySelectorAll(sec), function (el) {
        el.addEventListener('click', panelSok);
      });
    });
    return 1;
  }

  function kur() {
    var n = 0;
    /* moForm · Mekân Öner modalı — kabuk `fb-*`, panel `.fb-success`,
       başlık `h4` (CSS'te `.fb-success h4` var). */
    n += bagla('moForm', 'moSuccess', 'moAgain', 'fb-success', 'h4', 'Öneri',
               '#moModal .fb-body',
               ['#moClose', '#moCancel', '#moOverlay', '#mekanOnerBtn', '[data-mo-open]']);
    /* olForm · isletme-ekle — modal değil, sayfa bölümü. Panel `.ol-success`
       (sayfanın kendi CSS'inde tanımlı), başlık `h2` (`.ol-success h2`),
       yer: formun ardı — donör Fit'te `#olSuccess` tam orada. */
    n += bagla('olForm', 'olSuccess', 'olAgain', 'ol-success', 'h2', 'Başvuru',
               null, []);
    window.__t5cLeadForm = n;               /* ölçülebilir: kaç özne bağlandı */
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', kur, { once: true });
  else kur();
})();
