/* İşletme Ekle — sayfa-lokal JS (FAZ 5). Referansın statik prototip JS'i
   (dm_user mock login/reg-done fazı) taşınmadı — bu dosya GERÇEK backend'e
   bağlı davranışlar içerir: İl→İlçe kademesi, hizmet/servis chip toggle,
   karakter sayaçları, medya ön-yükleme (up-zone→up-done) ve bölüm-nav
   scroll takibi. Savunmalı: her selector null-guard'lı, öğe yoksa sessizce çıkar. */
(function () {
  'use strict';

  var csrfToken = function () {
    var meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.content : '';
  };

  // ---- İl → İlçe kademesi (mekan-bul.js data-region-tree deseni İLE AYNI) ----
  function initCascade() {
    var wrap = document.getElementById('vaCascade');
    if (!wrap) return;

    var provinceSel = document.getElementById('vaProvince');
    var districtSel = document.getElementById('vaDistrict');
    if (!provinceSel || !districtSel) return;

    var tree = {};
    try {
      tree = JSON.parse(wrap.getAttribute('data-region-tree') || '{}');
    } catch (e) {
      tree = {};
    }

    var selectedDistrict = districtSel.getAttribute('data-selected') || '';

    function fillDistricts(provinceId, preselect) {
      var list = (tree[provinceId] && tree[provinceId].districts) || [];
      districtSel.innerHTML = '';

      var placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = districtSel.getAttribute('data-placeholder') || '';
      districtSel.appendChild(placeholder);

      list.forEach(function (d) {
        var opt = document.createElement('option');
        opt.value = String(d.id);
        opt.textContent = d.name;
        if (preselect && String(d.id) === String(preselect)) opt.selected = true;
        districtSel.appendChild(opt);
      });

      districtSel.disabled = list.length === 0;
    }

    if (provinceSel.value) {
      fillDistricts(provinceSel.value, selectedDistrict);
    } else {
      districtSel.disabled = true;
    }

    provinceSel.addEventListener('change', function () {
      fillDistricts(provinceSel.value, null);
    });
  }

  // ---- Hizmet chip'leri (uz-pick, en fazla N seçim) ----
  function initServiceChips() {
    var grid = document.getElementById('uzGrid');
    if (!grid) return;

    var max = parseInt(grid.getAttribute('data-max') || '5', 10);
    var counter = document.getElementById('uzCount');
    var picks = Array.prototype.slice.call(grid.querySelectorAll('.uz-pick'));

    function sync() {
      var onCount = picks.filter(function (b) { return b.classList.contains('on'); }).length;
      if (counter) counter.textContent = String(onCount);
      picks.forEach(function (b) {
        var input = b.querySelector('input');
        if (input) input.checked = b.classList.contains('on');
        if (!b.classList.contains('on')) {
          b.disabled = onCount >= max;
        }
      });
    }

    picks.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var onCount = picks.filter(function (b) { return b.classList.contains('on'); }).length;
        if (!btn.classList.contains('on') && onCount >= max) return;
        btn.classList.toggle('on');
        sync();
      });
    });

    sync();
  }

  // ---- Karakter sayaçları ----
  function initCounter(textareaId, counterId) {
    var el = document.getElementById(textareaId);
    var counter = document.getElementById(counterId);
    if (!el || !counter) return;

    function sync() { counter.textContent = String(el.value.length); }
    el.addEventListener('input', sync);
    sync();
  }

  // ---- Medya ön-yükleme (cover/menu: tekli — gallery: çoklu) ----
  function uploadFile(file, purpose, url) {
    var form = new FormData();
    form.append('file', file);
    form.append('purpose', purpose);

    return fetch(url, {
      method: 'POST',
      headers: { 'X-CSRF-TOKEN': csrfToken(), Accept: 'application/json' },
      body: form,
    }).then(function (res) {
      if (!res.ok) {
        /* A5 (Beyar kararı, şık (b)) — DURUM KODU catch'e TAŞINIR. Ölçülen
           kusur: misafirin yüklemesi 401 {"message":"Unauthenticated."}
           dönüyordu, gövdede `errors` YOK, catch de yalnız
           err.errors.file[0] okuduğu için kullanıcı hep "Dosya yüklenemedi."
           görüyordu. Mevcut sözleşme BOZULMADI — gövde `errors` taşıyorsa
           err.errors.file[0] yolu aynen çalışır, üstüne yalnız `status`
           iliştirilir. 413'te (nginx client_max_body_size) gövde JSON
           DEĞİL HTML gelir; res.json() reddeder, bu yüzden boş nesneye
           düşülür — yoksa hata yutulup hiç alert basılmazdı. */
        return res.json().catch(function () { return {}; }).then(function (body) {
          var err = (body && typeof body === 'object') ? body : {};
          err.status = res.status;
          throw err;
        });
      }
      return res.json();
    });
  }

  /* Yükleme hatasını kullanıcının anlayacağı cümleye çevirir. Bilinen üç
     kapı dışındaki her durumda BUGÜNKÜ davranış aynen korunur. Bildirim
     deseni bu dosyada `window.alert`tir; yeni bir bildirim bileşeni
     ÜRETİLMEDİ. */
  function uploadErrorMessage(err) {
    var status = err && err.status;

    if (status === 401) {
      return 'Görsel yüklemek için giriş yapman gerekiyor. /giris adresinden giriş yap, sonra görselleri ekle.';
    }
    if (status === 413) {
      return 'Dosya sunucunun kabul ettiğinden büyük. Görseli küçültüp ya da daha küçük bir dosya seçip yeniden dene.';
    }
    if (status === 419) {
      /* "Sayfayı yenile" derken yazdıklarının korunacağını SÖYLEMİYORUZ:
         yenileme formu boşaltır, tutulmayacak söz verilmez. */
      return 'Oturumun düştü. Yüklemeyi sürdürmek için sayfayı yenile — yenilemeden önce forma yazdıklarını bir yere kopyala.';
    }

    return (err && err.errors && err.errors.file && err.errors.file[0]) || 'Dosya yüklenemedi.';
  }

  function buildDoneRow(media, onRemove) {
    var row = document.createElement('div');
    row.className = 'up-done';
    var icon = (media.mime || '').indexOf('pdf') > -1 ? 'fa-file-lines' : 'fa-file-image';
    row.innerHTML =
      '<i class="fa-solid ' + icon + '" aria-hidden="true"></i> <span class="up-done-name"></span>' +
      '<button class="x" type="button" aria-label="Kaldır"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>';
    row.querySelector('.up-done-name').textContent = media.name || '';
    row.querySelector('.x').addEventListener('click', function () {
      row.remove();
      onRemove();
    });
    return row;
  }

  function initSingleUploader(zoneId, inputId, hiddenName, purpose, uploadUrl) {
    var zone = document.getElementById(zoneId);
    var fileInput = document.getElementById(inputId);
    if (!zone || !fileInput) return;

    var container = zone.parentElement;
    // Doğrulama hatası sonrası old() ile geri dönen alan: Blade zaten dolu
    // bir hidden input + .up-done satırı basmış olabilir — YENİDEN yaratma
    // (çift input = son değer kazanır ama gereksiz DOM/karışıklık).
    var hidden = container.querySelector('input[name="' + hiddenName + '"]');
    if (!hidden) {
      hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = hiddenName;
      container.appendChild(hidden);
    }
    if (hidden.value) zone.hidden = true;

    // Blade'in server-taraflı render ettiği (old() geri-dönüşü) .up-done
    // satırının kaldır butonu — buildDoneRow() üretmediği için kendi
    // listener'ı yok, burada bağlanır.
    var existingRow = container.querySelector('.up-done');
    if (existingRow) {
      var removeBtn = existingRow.querySelector('.x');
      if (removeBtn) {
        removeBtn.addEventListener('click', function () {
          existingRow.remove();
          hidden.value = '';
          zone.hidden = false;
        });
      }
    }

    zone.addEventListener('click', function () { fileInput.click(); });

    fileInput.addEventListener('change', function () {
      var file = fileInput.files[0];
      if (!file) return;

      zone.classList.add('is-loading');
      uploadFile(file, purpose, uploadUrl)
        .then(function (media) {
          hidden.value = media.id;
          zone.hidden = true;
          zone.classList.remove('is-loading');

          var existingDone = container.querySelector('.up-done');
          if (existingDone) existingDone.remove();

          var row = buildDoneRow(media, function () {
            hidden.value = '';
            zone.hidden = false;
          });
          container.insertBefore(row, zone.nextSibling);
        })
        .catch(function (err) {
          zone.classList.remove('is-loading');
          window.alert(uploadErrorMessage(err));
        })
        .finally(function () {
          fileInput.value = '';
        });
    });
  }

  function initGalleryUploader(zoneId, inputId, listId, purpose, uploadUrl, max) {
    var zone = document.getElementById(zoneId);
    var fileInput = document.getElementById(inputId);
    var list = document.getElementById(listId);
    if (!zone || !fileInput || !list) return;

    var count = 0;

    function refreshLimit() {
      zone.hidden = count >= max;
    }

    // old() geri-dönüşünde Blade'in ÖNCEDEN bastığı satırlar (kaldır
    // butonları buildDoneRow() dışı — burada bağlanır).
    Array.prototype.slice.call(list.querySelectorAll('.up-done')).forEach(function (row) {
      count++;
      var removeBtn = row.querySelector('.x');
      if (removeBtn) {
        removeBtn.addEventListener('click', function () {
          row.remove();
          count--;
          refreshLimit();
        });
      }
    });
    refreshLimit();

    zone.addEventListener('click', function () { fileInput.click(); });

    fileInput.addEventListener('change', function () {
      var files = Array.prototype.slice.call(fileInput.files || []);
      files = files.slice(0, Math.max(0, max - count));

      files.forEach(function (file) {
        zone.classList.add('is-loading');
        uploadFile(file, purpose, uploadUrl)
          .then(function (media) {
            count++;
            var hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = 'gallery_media_ids[]';
            hidden.value = media.id;

            var row = buildDoneRow(media, function () {
              hidden.remove();
              count--;
              refreshLimit();
            });
            row.appendChild(hidden);
            list.appendChild(row);
            refreshLimit();
          })
          .catch(function (err) {
            window.alert(uploadErrorMessage(err));
          })
          .finally(function () {
            zone.classList.remove('is-loading');
          });
      });

      fileInput.value = '';
    });
  }

  // ---- Bölüm nav (sn-nav) — scroll'a göre aktif işaretleme ----
  function initSectionNav() {
    var nav = document.getElementById('snNav');
    if (!nav) return;

    var items = Array.prototype.slice.call(nav.querySelectorAll('.sn-item'));
    if (!items.length || !('IntersectionObserver' in window)) return;

    var sections = items
      .map(function (a) { return document.querySelector(a.getAttribute('href')); })
      .filter(Boolean);

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = '#' + entry.target.id;
          items.forEach(function (a) {
            a.classList.toggle('is-active', a.getAttribute('href') === id);
          });
        });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );

    sections.forEach(function (s) { observer.observe(s); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initCascade();
    initServiceChips();
    initCounter('bioText', 'bioCount');
    initSectionNav();

    var form = document.getElementById('olForm');
    var mediaUrl = form ? form.getAttribute('data-va-media-url') : null;
    if (mediaUrl) {
      initSingleUploader('vaCoverZone', 'vaCoverFile', 'cover_media_id', 'cover', mediaUrl);
      initSingleUploader('vaMenuZone', 'vaMenuFile', 'menu_media_id', 'menu', mediaUrl);
      // EK-1 (kapanış turu) — belge yükleme, opsiyonel, kapak/menü İLE AYNI
      // tekli-yükleyici deseni.
      initSingleUploader('vaTaxDocZone', 'vaTaxDocFile', 'tax_document_media_id', 'vergi_levhasi', mediaUrl);
      initSingleUploader('vaLicenseDocZone', 'vaLicenseDocFile', 'license_document_media_id', 'ruhsat', mediaUrl);
      initGalleryUploader('vaGalleryZone', 'vaGalleryFile', 'vaGalleryList', 'gallery', mediaUrl, parseInt(document.getElementById('vaGalleryZone') ? document.getElementById('vaGalleryZone').getAttribute('data-max') : '12', 10));
    }
  });
})();
