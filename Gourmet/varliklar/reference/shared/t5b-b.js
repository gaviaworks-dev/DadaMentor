/* T5B · GOURMET — kulvar B sürücüsü. Yalnız ajan B yazar.
   BU TURDA SÜRÜCÜ YAZILMADI. Kulvarın (go-arama · go-404 · go-hata-500 ·
   go-cevrimdisi · go-bakim) davranış kusuru ölçüldü ve HİÇBİRİ JS ile
   çözülmüyor:
     · Görüş Bildir açılış/kapanış — DONÖRLE EŞİT ölçüldü (b-modal.mjs):
         kapalı: display block · opacity 0 · visibility hidden · .show YOK
         açık  : display block · opacity 1 · visibility visible · .show VAR
       14 Gourmet sayfasının 14'ünde @1440; @390'da tetik dört markada da
       görünmez (donörde de öyle) — bu bir fark değil.
     · Dış adrese POST (140–145 sayfa), eksik `.fb-success`, iç içe
       `#moOverlay`/`#lkOverlay` → üçü de MARKUP kusuru, lead kalemi.
       Buradan `action` sökmek 148 sayfada davranış değiştirirdi ve
       gönderimin gideceği bir maket yüzeyi de yok (`.fb-success` yok) —
       kusuru düzeltmez, sessizleştirirdi. YAZILMADI, bildirildi.
   Ayrıntı ve sayılar: `docs/gourmet-t5b-ajan-b-rapor.md`. */
