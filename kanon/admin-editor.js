/* ═══════════════════════════════════════════════════════════════════════
   ADMIN UI KİTİ · ZENGİN METİN EDİTÖRÜ — TEK ORTAK INIT
   ───────────────────────────────────────────────────────────────────────
   Tarih: 2026-09-04 · Beyar kararı, FIT admin revize parti 1
   TinyMCE 7.3.0 · cdnjs self-hosted derleme · Tiny Cloud API ANAHTARI YOK

   ── SAYFA BAŞINA CONFIG YOK ──────────────────────────────────────────
   Bu dosya tek başına yeter. Ekran yalnız `data-editor` niteliği taşır;
   yükseklik ve araç çubuğu ALAN TİPİNDEN türer, ekrandan değil.

       <textarea class="alan-metin" data-editor="icerik">   → 400px
       <textarea class="alan-metin" data-editor="aciklama"> → 160px

   ── HANGİ ALANLARA ───────────────────────────────────────────────────
   Çok satırlı, BİÇİMLİ metin taşıyan alanlar:
       açıklama · içerik · özet · kısa/detaylı cevap · mesaj · iç not ·
       yasal metin içeriği
   🔴 GİRMEZ: tek satır alanlar, slug/adres, kod, anahtar, JSON, kısa
      etiket. Ayrım niteliğe bağlı — otomatik tarama YOK. Bir textarea'yı
      editöre çevirmek metni HTML'e döndürür; slug alanında bu veriyi
      bozar. Kapsam kararı ekranı basanın, betiğin değil.

   ── 🔴 TÜRKÇE DİL PAKETİ · CDNJS'TE YOK ──────────────────────────────
   Ölçüldü: `cdnjs.../tinymce/7.3.0/langs/tr.js` → 404. TinyMCE dil
   paketleri cdnjs derlemesine dahil değil; resmî kaynağı Tiny'nin kendi
   sunucusu ve o da anahtar istiyor. Uydurma bir CDN adresi yazmak yerine
   kitin KENDİ dil kaydı `kanon/admin-editor-tr.js` olarak duruyor ve
   yalnız BU araç çubuğunun dizelerini çeviriyor. Eksik dize İngilizce
   kalır — sessizce boş dönmez.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CDN = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/7.3.0';

  /* Yükseklik alan tipine göre — Beyar ölçüsü. */
  var BOY = { icerik: 400, aciklama: 160, ozet: 160, cevap: 240, mesaj: 240, not: 160, yasal: 400 };

  /* Sade araç çubuğu: kalın · italik · başlık · liste · bağlantı ·
     alıntı · geri al/yinele · kaynak kodu. Menü çubuğu KAPALI. */
  var ARAC = 'undo redo | bold italic | blocks | bullist numlist | link blockquote | code';
  /* Açıklama/özet gibi kısa alanlarda başlık ve alıntı gereksiz. */
  var ARAC_KISA = 'undo redo | bold italic | bullist numlist | link | code';

  function icerikCss() {
    /* Editörün İÇİ de kit tokenlarını okur — yazının ekrandaki hâliyle
       editördeki hâli aynı olsun. Değerler ÇÖZÜLMÜŞ hâlde geçirilir;
       iframe kök değişkenleri devralmaz. */
    var k = getComputedStyle(document.documentElement);
    var al = function (t, y) { return (k.getPropertyValue(t) || '').trim() || y; };
    return [
      'body{margin:16px;font-family:' + (getComputedStyle(document.body).fontFamily) + ';',
      'font-size:' + al('--yazi-14', '14px') + ';line-height:1.6;',
      'color:' + al('--murekkep', '#211E16') + ';background:' + al('--kagit', '#fff') + ';}',
      'p{margin:0 0 12px}',
      'h2,h3,h4{margin:24px 0 8px;color:' + al('--murekkep', '#211E16') + ';font-weight:800}',
      'h2{font-size:' + al('--yazi-20', '20px') + '}h3{font-size:' + al('--yazi-17', '17px') + '}',
      'h4{font-size:' + al('--yazi-15', '15px') + '}',
      'ul,ol{margin:0 0 12px;padding-left:22px}li{margin:0 0 4px}',
      'a{color:' + al('--aksan-koyu', '#00719F') + '}',
      'blockquote{margin:16px 0;padding:8px 16px;border-left:3px solid ' + al('--cizgi', '#ECECEC') +
        ';color:' + al('--metin-ikincil', '#5B564C') + '}',
      'img{max-width:100%;height:auto}',
    ].join('');
  }

  function kur() {
    var alanlar = document.querySelectorAll('textarea[data-editor]');
    if (!alanlar.length) return;
    if (!window.tinymce) return;

    tinymce.baseURL = CDN;      /* skin · tema · eklenti buradan gelir */

    alanlar.forEach(function (t) {
      var tip = t.getAttribute('data-editor') || 'aciklama';
      var boy = BOY[tip] || 200;
      var kisa = boy <= 200;
      if (!t.id) t.id = 'ed-' + Math.random().toString(36).slice(2, 8);

      tinymce.init({
        target: t,
        base_url: CDN,
        license_key: 'gpl',           /* self-hosted GPL — Cloud anahtarı YOK */
        language: 'tr',
        menubar: false,
        statusbar: false,
        branding: false,
        promotion: false,
        height: boy,
        resize: false,                /* boy alan tipinden gelir, kullanıcıdan değil */
        plugins: 'lists link code autolink',
        toolbar: kisa ? ARAC_KISA : ARAC,
        block_formats: 'Paragraf=p; Başlık 2=h2; Başlık 3=h3; Başlık 4=h4',
        content_css: false,
        content_style: icerikCss(),
        /* ── YAPIŞTIRMADA BİÇİM TEMİZLEME ──────────────────────────────
           Word/Docs'tan gelen `style` · `class` · `font` nitelikleri
           kitin tipografisini eziyordu. Ücretsiz derlemede PowerPaste
           yok; temizlik ön işlemde yapılır. */
        paste_data_images: false,
        paste_preprocess: function (editor, args) {
          var d = document.createElement('div');
          d.innerHTML = args.content;
          d.querySelectorAll('*').forEach(function (el) {
            el.removeAttribute('style');
            el.removeAttribute('class');
            el.removeAttribute('id');
            el.removeAttribute('width');
            el.removeAttribute('height');
            if (/^(FONT|SPAN|O:P|META|STYLE)$/.test(el.tagName)) {
              el.replaceWith.apply(el, Array.prototype.slice.call(el.childNodes));
            }
          });
          args.content = d.innerHTML;
        },
        valid_elements: 'p,br,strong/b,em/i,u,h2,h3,h4,ul,ol,li,a[href|title|target|rel],'
                      + 'blockquote,code,pre,hr,table,thead,tbody,tr,th,td,img[src|alt]',
        link_default_target: null,
        link_title: false,
        setup: function (ed) {
          /* Değişiklik doğrulamaya bağlansın: editör textarea'yı ancak
             `save` ile günceller, kit ise textarea'yı okuyor. */
          ed.on('change keyup', function () { ed.save(); });
          ed.on('blur', function () {
            ed.save();
            if (window.DM_ALAN_DENETLE) window.DM_ALAN_DENETLE(t);
          });
        },
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur);
  else kur();
})();
