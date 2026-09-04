/* DadaGastro — paylaşılan otomatik tamamlama çekirdeği.
 *
 * ## Neden bu dosya var
 *
 * Projede iki ayrı "öneri açılır listesi" kodu vardı ve ikisi de eksikti:
 *
 *   - `resources/js/ui.js` içindeki `bindSearchAutocomplete` — `ac-*` token
 *     ailesini kullanır ama HİÇBİR view `[data-srch-box]` basmadığı için
 *     ÖLÜ KOD; hiç bağlanmıyor.
 *   - `public/reference/arama/arama.js` — canlı olan bu; `.ac-opt`/`.ac-grp`
 *     ile çalışıyor, ama klavyeyle gezilemiyor (yalnız Escape dinliyor).
 *
 * Yani "klavyeyle gezilebilen öneri listesi" projede HİÇ yoktu. Üçüncü bir
 * kopya yazmak yerine davranış TEK yerde toplandı: bu dosya sunum yapmaz,
 * yalnız davranışı kurar (istek/gecikme/yarış kilidi/klavye/erişilebilirlik)
 * ve sınıf adlarını `ac-*` ailesinden alır — `tokens.css` zaten
 * `.ac-item:hover, .ac-item.is-active` kuralını taşıyor, klavye seçimi ile
 * fare üzerinde durma AYNI görünür.
 *
 * H2 (2026-08-08) — `[data-srch-box]` GERÇEKTEN kullanılıyor artık
 * (Gourmet mekân listesi konum kutusu) ama o çağıran (`resources/js/
 * autocomplete.js`) klavye gezinmesi OLMAYAN kendi kopyasını taşıyordu.
 * Üçüncü bir kopya yerine BU çekirdek TEK kaynak yapıldı; ikinci çağıran
 * da AYNI dosyayı kullanır — Vite `import` DEĞİL (bu dosya `export`
 * taşımıyor, proje `@rollup/plugin-commonjs` da kurulu değil — Rollup
 * üretim derlemesi `module.exports`'u sessizce `undefined` yapardı, bu
 * ÖLÇÜLDÜ önce denendi sonra vazgeçildi), `resources/views/gourmet/
 * mekan-liste/_hero.blade.php`nin KENDİSİ bu dosyayı düz `<script>` ile
 * (Vite paketinden ÖNCE, senkron) yükler — `resources/js/autocomplete.js`
 * de tıpkı Dada Route gibi `window.DadaAutocomplete`yi okur. Yani iki
 * çağıran da AYNI global nesneyi paylaşır, dosyanın kendisi hâlâ Vite
 * DIŞINDA, tek bir yerde, değişmeden duruyor.
 *
 * Düz `<script>` olarak yüklenebilir (kopuk mod sayfaları Vite paketini
 * yüklemez) ve `window.DadaAutocomplete` altında durur.
 *
 * ## Sözleşme
 *
 *   DadaAutocomplete.bind(input, {
 *     panel,                      // öneri kabı (zorunlu)
 *     fetch(q) -> Promise<list>,  // öneri kaynağı (zorunlu)
 *     onSelect(item, input),      // seçim (zorunlu)
 *     minChars, debounceMs,       // varsayılan 1 ve 180
 *     emptyText,                  // boş sonuç satırı; null ise panel kapanır
 *     icon,                       // kalem ikonu (FontAwesome sınıfı)
 *     itemContent(item, button),  // İSTEĞE BAĞLI — verilirse satırın İÇİNİ
 *                                 // (ikon/etiket/alt-metin) bu fonksiyon
 *                                 // doldurur; çağıran kendi markup'ını
 *                                 // (ör. tür rozeti) korur. Verilmezse
 *                                 // varsayılan ikon+etiket(+alt) basılır —
 *                                 // Dada Route BUNU vermiyor, davranışı
 *                                 // değişmedi.
 *     escapeOverflow,             // İSTEĞE BAĞLI — true ise panel açılınca
 *                                 // `position:fixed` + JS ile hesaplanmış
 *                                 // koordinata taşınır: `overflow:hidden`
 *                                 // taşıyan bir atadan (ör. koyu hero
 *                                 // bandı) kırpılmaz. Varsayılan false —
 *                                 // Dada Route BUNU vermiyor, mevcut
 *                                 // `position:absolute` yerleşimi AYNEN
 *                                 // sürüyor.
 *   })
 *
 * Öneri nesnesi: `{ label, sub, type, value }` — `label` zorunlu, gerisi
 * isteğe bağlı. `sub` ikincil satırdır (ilçede ilin adı gibi).
 */
(function (global) {
  'use strict';

  var BOUND = 'dadaAcBound';

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function bind(input, options) {
    if (!input || !options || !options.panel || typeof options.fetch !== 'function') return null;
    // Aynı input iki kez bağlanırsa her tuşta iki istek gider ve iki ayrı
    // "aktif satır" imleci birbirini ezer.
    if (input.dataset[BOUND]) return null;
    input.dataset[BOUND] = '1';

    var panel = options.panel;
    var minChars = options.minChars == null ? 1 : options.minChars;
    var debounceMs = options.debounceMs == null ? 180 : options.debounceMs;
    var icon = options.icon || 'fa-location-dot';
    var emptyText = options.emptyText === undefined ? null : options.emptyText;
    var itemContent = typeof options.itemContent === 'function' ? options.itemContent : null;
    var escapeOverflow = !!options.escapeOverflow;

    var timer = null;
    var seq = 0;
    var items = [];
    var active = -1;

    /* Erişilebilirlik: alan bir combobox, panel bir listbox. Ekran okuyucu
     * "6 öneriden 2.si" diyebilsin diye aktif satır `aria-activedescendant`
     * ile işaretlenir — odak inputta KALIR, listeye atlamaz. */
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    if (!panel.id) panel.id = 'dada-ac-' + Math.random().toString(36).slice(2, 9);
    input.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'listbox');

    function close() {
      panel.hidden = true;
      panel.innerHTML = '';
      panel.classList.remove('is-open');
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      items = [];
      active = -1;
    }

    /* H1 (2026-08-08) — `escapeOverflow` true olan çağıranlarda panel
     * `position:fixed`e alınır ve koordinatı input'un GERÇEK viewport
     * konumuna JS ile kilitlenir. `overflow:hidden` taşıyan bir ata (ör.
     * Gourmet mekân listesi hero bandı `.ke-top`) yalnız KENDİ yerleşim
     * bağlamındaki (normal akış / kendine göre absolute) kutuları kırpar;
     * `position:fixed` viewport'a göre konumlandığı için o kırpmadan
     * ETKİLENMEZ (ölçüldü: panel 15 öneride 602px yükseklik istiyor, hero
     * bandı 390px'te 737px'te bitiyor — DOM'daki mevcut absolute yerleşim
     * öğeleri 528-737px arasında hero'nun içinde kalıp KIRPILIYORDU).
     * Dada Route bu bayrağı vermiyor — mevcut `position:absolute` CSS
     * yerleşimi (tokens.css/dada-route.css) hiç dokunulmadan sürüyor.
     *
     * KAPANIŞ TURU R4 (2026-08-08) — H1 kendisi eksikti: panel DOM'da
     * `.searchcard.mkl-hero-search` (form) İÇİNDE kalıyordu ve o formun
     * `backdrop-filter:blur(6px)` kuralı (mekan-liste.css:280, kaynak-
     * transfer — SİLİNMEZ) CSS'e göre `position:fixed` torunları için YENİ
     * bir containing block açar (transform/filter/perspective/contain'le
     * AYNI davranış). `left`/`top`'a viewport koordinatı yazılıyordu ama
     * tarayıcı bunu o formun kutusuna göre yorumluyordu — ÖLÇÜLDÜ: form
     * rect (132, 300.6), panel'e yazılan (433.9, 358.6), gerçek render
     * rect (566.9, 660.2) = form + yazılan DEĞER, ondalığa kadar örtüşüyor.
     * Önceki tur yalnız `transform/filter/contain/will-change/zoom`i
     * taradı, `backdrop-filter`i ATLADI. Çözüm: panel `body`nin doğrudan
     * çocuğuna taşınır (yalnız escapeOverflow'da, tek seferlik) — `body`/
     * `html`de containing-block açan hiçbir özellik YOK (aynı ölçümle
     * doğrulandı), `position:fixed` artık gerçekten viewport'a göre
     * konumlanır. `.ac-panel/.ac-item` kuralları tokens.css/mekan-liste.css
     * içinde ata'ya bağlı DEĞİL (global seçici) — taşımak görünümü
     * değiştirmez. Dada Route escapeOverflow vermediği için bu taşıma
     * çalışmaz, davranışı etkilenmez. */
    if (escapeOverflow && panel.parentNode !== document.body) {
      document.body.appendChild(panel);
    }

    function positionPanel() {
      if (!escapeOverflow) return;
      var r = input.getBoundingClientRect();
      panel.style.position = 'fixed';
      panel.style.left = r.left + 'px';
      panel.style.top = (r.bottom + 6) + 'px';
      panel.style.width = r.width + 'px';
      panel.style.right = 'auto';
    }

    function openPanel() {
      positionPanel();
      panel.hidden = false;
      panel.classList.add('is-open');
      input.setAttribute('aria-expanded', 'true');
    }

    if (escapeOverflow) {
      // Panel açıkken sayfa kayarsa/pencere yeniden boyutlanırsa konum
      // bayatlamasın diye yeniden hizalanır; kapalıyken no-op (ucuz check).
      var reposition = function () { if (!panel.hidden) positionPanel(); };
      window.addEventListener('scroll', reposition, true);
      window.addEventListener('resize', reposition);
    }

    function highlight(next) {
      var buttons = panel.querySelectorAll('.ac-item');
      if (!buttons.length) return;
      if (active >= 0 && buttons[active]) buttons[active].classList.remove('is-active');
      active = next;
      if (active < 0) { input.removeAttribute('aria-activedescendant'); return; }
      var current = buttons[active];
      current.classList.add('is-active');
      input.setAttribute('aria-activedescendant', current.id);
      // Uzun listede klavyeyle inerken seçili satır görünür kalsın.
      if (current.scrollIntoView) current.scrollIntoView({ block: 'nearest' });
    }

    function choose(index) {
      var item = items[index];
      if (!item) return;
      close();
      options.onSelect(item, input);
    }

    function render(list) {
      items = list || [];
      panel.innerHTML = '';

      if (!items.length) {
        if (emptyText === null) { close(); return; }
        var none = el('div', 'ac-empty');
        none.textContent = emptyText;
        panel.appendChild(none);
        openPanel();
        active = -1;

        return;
      }

      items.forEach(function (item, index) {
        var button = el('button', 'ac-item');
        button.type = 'button';
        button.id = panel.id + '-' + index;
        button.setAttribute('role', 'option');
        button.setAttribute('aria-selected', 'false');

        if (itemContent) {
          // Çağıran kendi markup'ını basar (ör. mekân listesi konum
          // kutusunun İl/İlçe/Semt tür rozeti) — klavye/aria/yarış-kilidi
          // mantığı burada ortak KALIR, yalnız satırın İÇİ değişir.
          itemContent(item, button);
        } else {
          var mark = el('i', 'fa-solid ' + icon);
          mark.setAttribute('aria-hidden', 'true');
          button.appendChild(mark);

          var label = el('span', 'ac-item__label');
          label.textContent = item.label;
          button.appendChild(label);

          if (item.sub) {
            var sub = el('span', 'ac-item__sub');
            sub.textContent = item.sub;
            button.appendChild(sub);
          }
        }

        // `mousedown` KULLANILIR, `click` değil: input'tan çıkan blur, click
        // ateşlenmeden paneli kapatabilir ve tıklama boşa düşer.
        button.addEventListener('mousedown', function (event) {
          event.preventDefault();
          choose(index);
        });
        button.addEventListener('mouseenter', function () { highlight(index); });

        panel.appendChild(button);
      });

      openPanel();
      // Hiçbir satır ön-seçili DEĞİL: Enter'a basan kullanıcı yazdığını
      // kaybetmemeli, önce ok tuşuyla bilerek seçmeli.
      active = -1;
    }

    function query() {
      var value = input.value.trim();
      clearTimeout(timer);

      if (value.length < minChars) { close(); return; }

      var mine = ++seq;

      timer = setTimeout(function () {
        options.fetch(value).then(function (list) {
          // Yarış kilidi: yavaş dönen eski istek yenisinin sonucunu EZMESİN.
          if (mine !== seq) return;
          render(list);
        }).catch(function () {
          if (mine === seq) close();
        });
      }, debounceMs);
    }

    input.addEventListener('input', query);

    input.addEventListener('keydown', function (event) {
      var open = !panel.hidden;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (!open) { query(); return; }
        highlight(active + 1 >= items.length ? 0 : active + 1);

        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (!open) return;
        highlight(active - 1 < 0 ? items.length - 1 : active - 1);

        return;
      }

      if (event.key === 'Enter') {
        // Seçim yapılmadıysa Enter'a KARIŞILMAZ — form kendi işini görsün.
        if (!open || active < 0) return;
        event.preventDefault();
        choose(active);

        return;
      }

      if (event.key === 'Escape') {
        if (!open) return;
        event.preventDefault();
        close();

        return;
      }

      if (event.key === 'Tab' && open) close();
    });

    input.addEventListener('blur', function () {
      // Panel içi mousedown zaten seçimi yaptı; gecikme yalnız tarayıcının
      // odak sırasını tamamlamasına alan açar.
      setTimeout(close, 120);
    });

    return { close: close, refresh: query };
  }

  global.DadaAutocomplete = { bind: bind };
})(window);
