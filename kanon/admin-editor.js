/* ═══════════════════════════════════════════════════════════════════════
   ADMIN UI KİTİ · ZENGİN METİN EDİTÖRÜ — TEK ORTAK INIT
   ───────────────────────────────────────────────────────────────────────
   Tarih: 2026-09-04 · parti 3 · Beyar kararı (madde 2)
   TinyMCE 7.3.0 · cdnjs self-hosted derleme · Tiny Cloud API ANAHTARI YOK

   ═══ DONÖR: GaviaWorks · DESİL ADMIN PANELİ ══════════════════════════
   Kaynak: `gaviaworks-dev/desil` →
           `public/admin-assets/js/sa-editor.js` (self-hosted TinyMCE 7.9.3)
   Kütüphane **aynı**: TinyMCE. Bu yüzden yapılandırma SIFIRDAN
   YAZILMADI, donörden alındı. Donörün kararı olan her ayar aynen geçti:

       toolbar_mode 'wrap' · menubar false · branding false ·
       promotion false · elementpath false · entity_encoding 'raw' ·
       convert_urls false · indent false · paste_data_images false ·
       height 480/220 · plugins lists advlist link code ·
       iki varyant (dolu · sade) ve varyantın ALAN TİPİNDEN türemesi

   Donörün araç çubuğu, sırası bozulmadan taşındı:
       undo redo | fontfamily fontsize | bold italic underline
       strikethrough | forecolor backcolor | subscript superscript |
       alignleft aligncenter alignright alignjustify | bullist numlist |
       link | <görsel> | removeformat code

   ── 🔴 DONÖRDE OLMAYAN ÜÇ KALEM — ölçülerek bildiriliyor ────────────
   Görev metni "tablo · başlık seviyeleri · tam ekran" da istiyordu.
   Donör bunların **hiçbirini taşımıyor** (araç çubuğunda `table` ·
   `blocks` · `fullscreen` yok, eklenti listesi `lists advlist link
   code`ten ibaret). Uydurulmadı, taklit de edilmedi: üçü de TinyMCE'nin
   KENDİ standart eklentileriyle eklendi (`table` · `fullscreen`) ve
   başlık seviyeleri kitin zaten taşıdığı `blocks` + `block_formats`
   ile geldi. Sıfırdan araç çubuğu yazılmadı.

   ── 🔴 `valid_elements` BEYAZ LİSTESİ KALDIRILDI ────────────────────
   Kitin önceki hâli dar bir beyaz liste taşıyordu:
       'p,br,strong/b,em/i,u,h2,h3,h4,ul,ol,li,a[…],blockquote,…'
   Donör böyle bir liste TAŞIMIYOR ve taşımaması şart: renk `span[style]`
   üretir, hizalama `style` yazar, alt/üst simge `sub`/`sup`, tablo ise
   `table[…]` nitelikleri ister. Liste kalsaydı yeni düğmelerin
   HEPSİ basılır, çıktı SESSİZCE silinirdi — ölü butonun editör
   içindeki hâli: düğme çalışıyor, imleç kıpırdıyor, sonuç kayboluyor.

   ── 🔴 GÖRSEL EKLEME · donörün kabuğu, maketin kilidi ───────────────
   Donörde düğme dosyayı `data-upload-url`e POST ediyor ve dönen `url`i
   imleç konumuna `<figure><img loading="lazy">` olarak basıyor.
   Panel bir MAKET ve kitin kilidi net: hiçbir eylem sunucuya gitmez.
   Uydurma bir uç nokta yazmak yerine düğmenin ŞEKLİ aynen taşındı —
   dosya seçici → imleç konumuna `<figure><img>` — dosya `FileReader`
   ile okunur, kaynak `data:` URI olur. Görsel GERÇEKTEN görünür,
   sunucuya hiçbir şey gitmez, toast bunu YAZAR.

   ── 🔴 FONT · ÖLÇÜ · RENK LİSTELERİ TOKENA BAĞLANDI ────────────────
   Donör `fontfamily`/`fontsize` düğmelerini TinyMCE'nin VARSAYILAN
   listeleriyle bırakıyor (Arial · Courier New · 8pt–36pt) ve renk
   seçici 40 hazır swatch açıyor. Kit sözleşmesi §1: *"yeni renk/font/
   ölçü uydurulmaz."* Üç liste de kitin kendi tokenlarından üretiliyor:
   font paneldeki gerçek yığın, ölçüler `--yazi-*`, renkler
   `--murekkep` · `--metin-ikincil` · `--aksan-koyu` · `--basari` ·
   `--uyari` · `--hata`. Donörün düğmeleri yaşıyor, değerleri panelin.

   ── SAPMALAR (donörden bilerek ayrılan iki ayar) ────────────────────
   1 · `statusbar` donörde **true**, burada **false**. Kit §7 bunu
       ölçerek kapatmıştı ("altında boş alan kalmasın") ve gerekçe
       duruyor: `elementpath` ve `branding` kapalıyken şerit boş kalıyor.
       Yükseklik zaten alan tipinden geliyor; büyütme ihtiyacı
       `fullscreen` düğmesiyle karşılanıyor.
   2 · `content_css` donörde ayrı bir dosya (`editor-content.css`).
       Burada `content_style` olarak SATIR İÇİ üretiliyor. Sebep
       ölçülmüş bir tuzak: TinyMCE'nin yüklediği dosya hiçbir ekranın
       `href`/`src`inde geçmez, deploy tarayıcısı onu GÖREMEZ ve
       yayında sessizce 404 olurdu (`@font-face` tuzağının kardeşi).
       Teknik aynı — donör de tokenları canlı `:root`tan okuyor.

   ── SAYFA BAŞINA CONFIG YOK ──────────────────────────────────────────
       <textarea class="alan-metin" data-editor="icerik">   → 480px dolu
       <textarea class="alan-metin" data-editor="aciklama"> → 220px sade

   ── TÜRKÇE ─────────────────────────────────────────────────────────
   `kanon/admin-editor-tr.js` artık donörün RESMÎ `langs/tr.js`i
   (424 dize). Eski hâli kitin elle yazdığı kısa listeydi; araç çubuğu
   büyüyünce listede olmayan her dize İngilizce dönerdi.
   ⚠ cdnjs'te dil paketi hâlâ YOK — bu turda 7.3.0 ve 7.9.3 için
     yeniden ölçüldü, ikisi de 404.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CDN = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/7.3.0';

  /* Yükseklik alan tipine göre — donörün 480/220 ölçüsü, kitin alan
     tipleriyle eşlendi. Dolu araç çubuğu uzun metin alanlarında. */
  var BOY = { icerik: 480, yasal: 480, cevap: 320, mesaj: 320, aciklama: 220, ozet: 220, not: 220 };

  /* ── DONÖRÜN ARAÇ ÇUBUĞU · sırası bozulmadan ────────────────────────
     Üç kalem donörde YOKTU ve görevle geldi: `blocks` (başlık seviyeleri) ·
     `table` · `fullscreen`. Yerleri donörün kendi mantığına göre seçildi:
     blocks font grubunun başına, table bağlantı grubuna, fullscreen
     `code`un yanına (ikisi de "görünümü değiştiren" kalem). */
  var ARAC =
    'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | ' +
    'forecolor backcolor | subscript superscript | ' +
    'alignleft aligncenter alignright alignjustify | bullist numlist | ' +
    'link blockquote table gorsel | removeformat code fullscreen';
  /* Donörün "simple" varyantı — bire bir. */
  var ARAC_SADE = 'undo redo | bold italic | bullist numlist | link';

  function tok(k, y) {
    var v = (getComputedStyle(document.documentElement).getPropertyValue(k) || '').trim();
    return v || y;
  }
  /* `var(--marka)` gibi dolaylı tokenlar ham hâlde döner; tarayıcıya
     çözdürülür — yoksa renk listesine formülün kendisi yazılır.
     (panel.js'in marka ayarlarında ölçülen aynı tuzak.) */
  var olcer = null;
  function renkCoz(ham, yedek) {
    if (!ham) return yedek;
    if (!olcer) { olcer = document.createElement('span'); olcer.style.display = 'none'; document.body.appendChild(olcer); }
    olcer.style.color = ''; olcer.style.color = ham;
    var m = getComputedStyle(olcer).color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return yedek;
    return '#' + [m[1], m[2], m[3]].map(function (x) { return ('0' + (+x).toString(16)).slice(-2); }).join('').toUpperCase();
  }

  function icerikCss() {
    /* Editörün İÇİ de kit tokenlarını okur — yazının ekrandaki hâliyle
       editördeki hâli aynı olsun. Değerler ÇÖZÜLMÜŞ geçirilir; iframe
       kök değişkenleri devralmaz. */
    var al = tok;
    return [
      'body{margin:16px;font-family:' + getComputedStyle(document.body).fontFamily + ';',
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
      'figure{margin:16px 0}figure img{display:block}',
      /* Tablo donörde yoktu; kanonun tablo ölçüleriyle çizilir. */
      'table{border-collapse:collapse;width:100%;margin:16px 0}',
      'table th,table td{border:1px solid ' + al('--cizgi', '#ECECEC') + ';padding:8px 12px;text-align:left}',
      'table th{background:' + al('--zemin', '#f9f9f9') + ';font-weight:700}',
    ].join('');
  }

  /* ── Görsel ekleme düğmesi — donörün `sitefigure`ının maket hâli ──── */
  function gorselDugmesi(ed) {
    ed.ui.registry.addButton('gorsel', {
      icon: 'image',
      tooltip: 'Görsel ekle — imleç konumuna',
      onAction: function () {
        var g = document.createElement('input');
        g.type = 'file'; g.accept = 'image/*'; g.style.display = 'none';
        document.body.appendChild(g);
        g.addEventListener('change', function () {
          var d = g.files && g.files[0];
          document.body.removeChild(g);
          if (!d) return;
          var oku = new FileReader();
          oku.onload = function () {
            ed.insertContent('<figure><img src="' + oku.result + '" alt="" loading="lazy"></figure>');
            if (window.DM_TOAST) window.DM_TOAST('Görsel eklendi — maket, dosya sunucuya YÜKLENMEDİ.', 'basarili');
          };
          oku.readAsDataURL(d);
        });
        g.click();
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
     ELLE YAZILMIŞ EDİTÖR KABUĞU — ALAN BAŞINA TEK EDİTÖR
     ───────────────────────────────────────────────────────────────────
     2026-09-04 · parti 3 · Beyar bildirdi (madde 5):
     *"İki editör bloğu 0 boşlukla bitişik, ikincisi farklı araç
     çubuğu — aynı alanda iki editör."*

     Ölçüldü — 83 ekranda **6** `.metin-duzenleyici` var, beş ekranda:
     anatomi-form · program-form · rehber-form (2) · sozluk-form ·
     sozluk-kategori-form. Kalıp altısında da AYNI:

         <textarea class="alan-metin" [data-editor] name="…">   ← GERÇEK alan
         <div class="metin-duzenleyici">
           <div class="duzenleyici-cubuk" role="toolbar">…</div> ← SAHTE çubuk
           <div class="duzenleyici-yuzey" contenteditable>…</div>

     Kabuğun düğmelerinin hiçbiri bağlı değil: `role="toolbar"` ve
     `aria-label` VAAT ediyor, karşılığı yok — §11'in tam tanımı. Ve
     `name` taşıyan gerçek alan textarea; kabuğun yüzeyi forma hiçbir şey
     göndermiyor. İkinci editör yalnız fazla değil, YANILTICI.

     KURAL: bir `.alan` bir editör taşır.
       · aynı alanda `data-editor` VARSA → kabuk kaldırılır (kopya)
       · YOKSA → textarea `data-editor` kazanır, kabuk kaldırılır
         (kabuğun yüzeyindeki metin kaybolmasın diye önce taşınır)

     ⚠ Kural KİTTE, sayfada değil: altı kabuk beş dosyada ve aynı kusur
       Gastro/Diet admin'e de gidecek. Devir belgesi §24-5 bu kalemi
       "her biri AYRI ölçülmeli" diye bırakmıştı; ölçüldü, kalıp tek.
     ═══════════════════════════════════════════════════════════════════ */
  function elleYazilaniKaldir() {
    var kaldirilan = 0, cevrilen = 0;
    document.querySelectorAll('.metin-duzenleyici').forEach(function (kabuk) {
      var alan = kabuk.closest('.alan') || kabuk.parentElement;
      if (!alan) return;
      if (!alan.querySelector('textarea[data-editor]')) {
        /* Yalnız kabuk var: `name` taşıyan textarea gerçek alandır. */
        var ta = alan.querySelector('textarea');
        if (ta) {
          var yuzey = kabuk.querySelector('.duzenleyici-yuzey');
          var icerik = yuzey ? (yuzey.innerHTML || '').trim() : '';
          if (icerik && !ta.value.trim()) ta.value = icerik;   /* yazı kaybolmaz */
          ta.setAttribute('data-editor', ta.getAttribute('data-editor') || 'aciklama');
          cevrilen++;
        }
      }
      kabuk.remove(); kaldirilan++;
    });
    window.DM_EDITOR_KABUK = { kaldirilan: kaldirilan, cevrilen: cevrilen };
  }

  /* Bir alanın TÜM yapılandırması tek yerde — hem ilk kurulum hem klon
     tazelemesi aynı ayarı okur. İkinci bir kopya KAYAR: klonlanan satırın
     editörü ötekinden farklı davranırdı. */
  var STIL = null, BOY_LISTE = null, YIGIN = null, RENKLER = null;
  function hazirla() {
    if (STIL !== null) return;
    STIL = icerikCss();
    /* Ölçüler tokendan; ikinci bir ölçek doğmaz (§1). */
    BOY_LISTE = ['13', '14', '15', '17', '20', '24']
      .map(function (n) { return tok('--yazi-' + n, n + 'px'); }).join(' ');
    YIGIN = getComputedStyle(document.body).fontFamily;
    RENKLER = [
      renkCoz(tok('--murekkep'), '#211E16'), 'Mürekkep',
      renkCoz(tok('--metin-ikincil'), '#717171'), 'İkincil metin',
      renkCoz(tok('--aksan-koyu'), '#00719F'), 'Marka',
      renkCoz(tok('--basari'), '#1E6B3A'), 'Başarı',
      renkCoz(tok('--uyari'), '#8A4B00'), 'Uyarı',
      renkCoz(tok('--hata'), '#8C1D18'), 'Hata',
      renkCoz(tok('--kagit'), '#FFFFFF'), 'Kağıt'
    ];
  }

  function ayar(t) {
    hazirla();
    var tip = t.getAttribute('data-editor') || 'aciklama';
    var boy = BOY[tip] || 220;
    var sade = boy <= 220;                     /* donörün `isSimple` ayrımı */
    if (!t.id) t.id = 'ed-' + Math.random().toString(36).slice(2, 8);
    return {
      target: t,
      base_url: CDN,
      license_key: 'gpl',           /* self-hosted GPL — Cloud anahtarı YOK */
      language: 'tr',
      /* dil paketi `admin-editor-tr.js` ile ZATEN yüklendi; TinyMCE'nin
         kendi `language_url`ü verilmez, yoksa cdnjs'te olmayan dosyayı
         ister ve 404 doğar. */
      plugins: sade ? 'lists link autolink' : 'lists advlist link code table fullscreen autolink',
      toolbar: sade ? ARAC_SADE : ARAC,
      toolbar_mode: 'wrap',         /* donör */
      menubar: false,
      statusbar: false,             /* sapma 1 — kit §7 */
      branding: false,
      promotion: false,
      elementpath: false,
      height: boy,
      resize: false,
      entity_encoding: 'raw',       /* donör */
      convert_urls: false,          /* donör */
      indent: false,                /* donör */
      paste_data_images: false,     /* donör */
      content_css: false,
      content_style: STIL,          /* sapma 2 — deploy tarayıcısı */
      block_formats: 'Paragraf=p; Başlık 2=h2; Başlık 3=h3; Başlık 4=h4',
      font_family_formats: 'Panel yazısı=' + YIGIN.replace(/;/g, ','),
      font_size_formats: BOY_LISTE,
      color_map: RENKLER,
      custom_colors: false,         /* palet kitin; serbest renk seçici yok */
      table_default_attributes: {},
      table_default_styles: {},
      link_default_target: null,
      link_title: false,
      /* ── YAPIŞTIRMADA BİÇİM TEMİZLEME ──────────────────────────────
         Donör yalnız `paste_data_images:false` taşıyor; görev metni
         "yapıştırma temizliği" de istiyordu ve kit bunu zaten ölçmüştü:
         Word/Docs'tan gelen `style`/`class`/`font` kitin tipografisini
         eziyor. Ücretsiz derlemede PowerPaste yok; temizlik ön işlemde.
         ⚠ Yalnız YAPIŞTIRILAN içeriğe dokunur — editörün kendi
           ürettiği `style` (renk · hizalama) korunur. */
      paste_preprocess: function (editor, args) {
        var d = document.createElement('div');
        d.innerHTML = args.content;
        d.querySelectorAll('*').forEach(function (el) {
          el.removeAttribute('style');
          el.removeAttribute('class');
          el.removeAttribute('id');
          el.removeAttribute('width');
          el.removeAttribute('height');
          if (/^(FONT|O:P|META|STYLE)$/.test(el.tagName)) {
            el.replaceWith.apply(el, Array.prototype.slice.call(el.childNodes));
          }
        });
        args.content = d.innerHTML;
      },
      setup: function (ed) {
        gorselDugmesi(ed);
        /* Değişiklik doğrulamaya bağlansın: editör textarea'yı ancak
           `save` ile günceller, kit ise textarea'yı okuyor. */
        ed.on('change keyup', function () { ed.save(); });
        ed.on('blur', function () {
          ed.save();
          if (window.DM_ALAN_DENETLE) window.DM_ALAN_DENETLE(t);
        });
      },    };
  }

  /* ═══════════════════════════════════════════════════════════════════
     KLONLANAN SATIRDA EDİTÖR — kabı taşıma, YENİDEN KUR
     ───────────────────────────────────────────────────────────────────
     `satir-ekle` bir satırı kopyalar. Kopyalanan satırda bir editör
     varsa TinyMCE'nin ürettiği `.tox` kabı da kopyalanır: ekranda İKİ
     editör görünür ama ikincisi ÖLÜDÜR (TinyMCE onu tanımaz, yazılan
     yazı hiçbir textarea'ya gitmez) ve `mce_` id'leri çiftlenir.
     Madde 5'in kusurunun kendi kendine yeniden doğması olurdu.
     ⚠ Değer boşaltması kitin işi; burada yalnız EDİTÖR KABI ele alınır.
     ═══════════════════════════════════════════════════════════════════ */
  function klonuTazele(kok) {
    if (!kok || !window.tinymce) return;
    kok.querySelectorAll('.tox.tox-tinymce').forEach(function (x) { x.remove(); });
    kok.querySelectorAll('textarea[data-editor]').forEach(function (t) {
      t.removeAttribute('id');
      t.style.display = ''; t.style.visibility = '';
      t.value = '';
      tinymce.init(ayar(t));
    });
  }
  window.DM_EDITOR_KLON = klonuTazele;

  function kur() {
    elleYazilaniKaldir();          /* önce kopya kabuklar düşer */
    var alanlar = document.querySelectorAll('textarea[data-editor]');
    if (!alanlar.length) return;
    /* TinyMCE yüklenemediyse textarea'lar ÇIPLAK ama görünür kalır —
       donörün geri düşüşü; gizli bir alan sonsuza kaybolur. */
    if (!window.tinymce) {
      alanlar.forEach(function (t) { t.style.visibility = 'visible'; });
      return;
    }
    tinymce.baseURL = CDN;      /* skin · tema · eklenti buradan gelir */
    alanlar.forEach(function (t) { tinymce.init(ayar(t)); });
  }


  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur);
  else kur();
})();
