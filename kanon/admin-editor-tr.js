/* ═══════════════════════════════════════════════════════════════════════
   TinyMCE · TÜRKÇE DİZELER — kitin kendi dil kaydı
   ───────────────────────────────────────────────────────────────────────
   🔴 NEDEN VAR: cdnjs'in TinyMCE derlemesi dil paketi TAŞIMIYOR.
      Ölçüldü 2026-09-04: `.../tinymce/7.3.0/langs/tr.js` → HTTP 404.
      Resmî `tr.js` Tiny'nin kendi sunucusunda ve anahtar istiyor;
      kit anahtar kullanmıyor (Beyar kararı).

   KAPSAM: yalnız `admin-editor.js`in araç çubuğunda ve bağlantı
   penceresinde GERÇEKTEN görünen dizeler. Liste kısa tutuldu; burada
   olmayan bir dize İngilizce kalır ve bu GÖRÜLÜR — sessiz boşluk yok.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.tinymce || !tinymce.addI18n) return;
  tinymce.addI18n('tr', {
    /* araç çubuğu */
    'Bold': 'Kalın',
    'Italic': 'İtalik',
    'Underline': 'Altı çizili',
    'Undo': 'Geri al',
    'Redo': 'Yinele',
    'Bullet list': 'Madde listesi',
    'Numbered list': 'Numaralı liste',
    'Blockquote': 'Alıntı',
    'Insert/edit link': 'Bağlantı ekle / düzenle',
    'Remove link': 'Bağlantıyı kaldır',
    'Source code': 'Kaynak kodu',
    'Blocks': 'Biçim',
    'Formats': 'Biçimler',
    'Paragraph': 'Paragraf',
    'Heading 2': 'Başlık 2',
    'Heading 3': 'Başlık 3',
    'Heading 4': 'Başlık 4',
    /* bağlantı penceresi */
    'Insert link': 'Bağlantı ekle',
    'Url': 'Adres',
    'Text to display': 'Görünecek metin',
    'Title': 'Başlık',
    'Open link in...': 'Bağlantıyı şurada aç…',
    'Current window': 'Bu pencerede',
    'New window': 'Yeni pencerede',
    'None': 'Yok',
    /* genel pencere düğmeleri */
    'Save': 'Kaydet',
    'Cancel': 'Vazgeç',
    'Close': 'Kapat',
    'Ok': 'Tamam',
    /* erişilebilirlik / durum */
    'Rich Text Area': 'Zengin metin alanı',
    'Rich Text Area. Press ALT-0 for help.': 'Zengin metin alanı. Yardım için ALT-0.',
    'Powered by {0}': '{0} ile',
  });
})();
