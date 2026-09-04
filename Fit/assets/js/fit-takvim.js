/* =====================================================================
   FIT_TAKVIM — programı TAKVİME oturtan tek kaynak  (R10 · belge §4 · §4.3 · §5.2)
   ---------------------------------------------------------------------
   Neden ayrı dosya: seans tarihlerini üreten mantık iki sayfada da lazım
   (program-detay-v1 sözleşmeyi kurarken önizler, fit-planim-programim-v1
   aylık görünümü ve yedi planlama işlemini bunun üstüne kurar). Aynı 150
   satırı iki HTML'e kopyalamak, iki ayrı takvim demekti.

   Bu dosya DEPOYA YAZMAZ. Yalnız `FIT_SHELL.state`'in program nesnesini
   okuyup tarih üretir. Yazma tek kapıdan: FIT_SHELL.state.programPlanla().

   Şema v2 sözleşmesi (fit-shell.js · sahibi lead):
     program.baslangic  'YYYY-MM-DD' | null
     program.gunler     [1..7]  1=Pazartesi … 7=Pazar   (ISO-8601 gün no)
     program.saat       'HH:MM' | null

   ------------------------------------------------------------------
   SÖZLEŞME — `window.FIT_TAKVIM` yüzeyi (sonraki turlar buradan okusun)
   ------------------------------------------------------------------
   Sabitler
     GUN_KISA[7]  'Pzt'…'Paz'      · index 0 = ISO gün 1 (Pazartesi)
     GUN_TAM[7]   'Pazartesi'…     · GUN_TEK[7] tek harf · AY[12]

   Tarih yardımcıları (hepsi YEREL, saat dilimi çevirmesi yok)
     bugun()            → Date (yerel gün başı)
     gunBasi(d)         → Date · ekleGun(d,n) → Date
     ayrist('YYYY-MM-DD'| Date) → Date | null
     ymd(d)             → 'YYYY-MM-DD'
     gunNo(d)           → 1..7  (1 = Pazartesi, ISO-8601)
     tarihTR(d, kisa)   → '25 Ağustos 2026' | '25 Ağu'
     gunTarih(d)        → 'Pzt 25 Ağu'
     yakinAd(d)         → 'Bugün' | 'Yarın' | 'Dün' | 'Pzt 25 Ağu'

   Program → takvim
     seanslar(p, sinir) → [{no, tarih:Date, ymd, durum, tasindi}]
                          durum ∈ yapildi · bugun · otelendi · gelecek
     sonraki(p)         → tek seans | null  (bugünkü > en yakın gelecek > en eski ötelenmiş)
     gunlerMetni([1,3,5]) → 'Pzt · Çar · Cum'

   Dışa aktarma
     ics(p, sure)       → RFC 5545 metni | null   (sure varsayılan 45 dk)
     icsIndir(p, adGovde) → bool  (Blob ile GERÇEK indirme; sahte değil)
     googleUrl(p)       → Google TEMPLATE bağlantısı (RRULE ile tüm seri) | null

   `p` her yerde `FIT_SHELL.state.read().program` nesnesidir. Bu dosya
   DEPOYA YAZMAZ; yazma tek kapıdan: programPlanla / seansTasi /
   dinlenmeEkle / dinlenmeKaldir (fit-shell.js · sahibi lead).
   ------------------------------------------------------------------

   TARİH KURALI: her şey YEREL tarihtir, saat dilimi yoktur.
   `new Date('2026-08-25')` UTC gece yarısı olarak ayrıştırılır ve UTC+3'te
   günü kaydırabilir; bu yüzden ayrıştırma `ayrist()` ile elle yapılır ve
   karşılaştırmalar `ymd()` metniyle yapılır, Date nesnesiyle değil.
   ===================================================================== */
(function(){
  'use strict';

  var GUN_KISA = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
  var GUN_TAM  = ['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
  var GUN_TEK  = ['P','S','Ç','P','C','C','P'];
  var AY       = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                  'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

  function iki(n){ return (n<10?'0':'')+n; }

  /* yerel gün başlangıcı — saat/dakika sıfırlanmış Date */
  function gunBasi(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function bugun(){ return gunBasi(new Date()); }

  /* 'YYYY-MM-DD' → yerel Date (UTC kayması yok) */
  function ayrist(s){
    if(s instanceof Date) return gunBasi(s);
    if(typeof s !== 'string') return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if(!m) return null;
    var d = new Date(+m[1], +m[2]-1, +m[3]);
    return isNaN(d) ? null : d;
  }
  function ymd(d){ return d ? d.getFullYear()+'-'+iki(d.getMonth()+1)+'-'+iki(d.getDate()) : ''; }

  /* ISO gün numarası: 1=Pazartesi … 7=Pazar (getDay() 0=Pazar verir) */
  function gunNo(d){ var g = d.getDay(); return g===0 ? 7 : g; }

  function ekleGun(d, n){ var x = new Date(d.getTime()); x.setDate(x.getDate()+n); return x; }

  function tarihTR(d, kisa){
    if(!d) return '';
    return d.getDate()+' '+(kisa ? AY[d.getMonth()].slice(0,3) : AY[d.getMonth()]) +
           (kisa ? '' : ' '+d.getFullYear());
  }
  /* "Pzt 25 Ağu" — takvim satırlarının kimliği */
  function gunTarih(d){ return d ? GUN_KISA[gunNo(d)-1]+' '+tarihTR(d, true) : ''; }

  /* Bugüne göre insanca ad — "Bugün" / "Yarın" / "Pzt 25 Ağu" */
  function yakinAd(d){
    if(!d) return '';
    var f = Math.round((gunBasi(d) - bugun()) / 86400000);
    if(f === 0) return 'Bugün';
    if(f === 1) return 'Yarın';
    if(f === -1) return 'Dün';
    return gunTarih(d);
  }

  /* ------------------------------------------------------------------
     SEANS ÜRETİMİ — programın takvimdeki gerçek karşılığı
     ------------------------------------------------------------------
     baslangic'ten başlar, gunler[] kalıbına düşen her tarihi bir seans
     sayar ve 1..toplam diye numaralar. Dönen her kayıt:
       {no, tarih, ymd, durum, tasindi}
     durum ∈ yapildi · bugun · otelendi · gelecek

     İKİ İSTİSNA KATMANI (şema v2 · §4.3):
       program.dinlenmeler[]  — o TARİH antrenman günü sayılmaz, kalıp
                                bozulmaz; sonraki seans bir sonraki uygun
                                güne kayar. "Bu cuma dinleniyorum" demek.
       program.tasimalar{}    — TEK seansın tarihini kalıptan bağımsız
                                başka bir güne koyar. Kalıbı değiştirmez.
     Sıra `no`'ya göredir; takvim çizimi için tarihe göre sıralamak
     çağıranın işi (`.ymd` anahtarıyla aranır).

     "otelendi" bilerek böyle: tarihi geçmiş ama tamamlanmamış seans
     BAŞARISIZLIK DEĞİL. Program kullanıcıyı geri saymaz; seans ileriye
     ötelenir. Arayüz dili bu addan türüyor, ceza dili üretilemiyor.
     ------------------------------------------------------------------ */
  function seanslar(p, sinir){
    var out = [];
    if(!p) return out;
    var bas = ayrist(p.baslangic);
    var gunler = (p.gunler||[]).slice().sort(function(a,b){ return a-b; });
    if(!bas || !gunler.length) return out;

    var toplam = Math.max(0, +p.toplam || 0);
    if(sinir) toplam = Math.min(toplam, sinir);
    var biten  = Math.max(0, +p.biten  || 0);
    var bug = ymd(bugun());
    var dinlenme = p.dinlenmeler || [];
    var tasima   = p.tasimalar   || {};

    var d = bas, no = 0, guvenlik = 0;
    while(no < toplam && guvenlik++ < toplam*10 + 60){
      var t0 = ymd(d);
      if(gunler.indexOf(gunNo(d)) >= 0 && dinlenme.indexOf(t0) < 0){
        no++;
        var ozel = tasima[String(no)];
        var gun  = ozel ? (ayrist(ozel) || d) : d;
        var t    = ymd(gun);
        out.push({
          no: no, tarih: gun, ymd: t, tasindi: !!ozel,
          durum: no <= biten ? 'yapildi'
               : t === bug   ? 'bugun'
               : t <  bug    ? 'otelendi'
               : 'gelecek'
        });
      }
      d = ekleGun(d, 1);
    }
    return out;
  }

  /* Sıradaki seans: bugünkü varsa o, yoksa TARİHÇE en yakın gelecek, o da
     yoksa en eski ötelenmiş. Taşınmış seans `no` sırasını bozabildiği için
     dizinin sırasına değil tarihe bakılır. */
  function enYakin(liste){
    return liste.sort(function(a,b){ return a.ymd < b.ymd ? -1 : a.ymd > b.ymd ? 1 : a.no-b.no; })[0] || null;
  }
  function sonraki(p){
    var s = seanslar(p);
    var f = function(d){ return s.filter(function(x){ return x.durum===d; }); };
    var b = f('bugun');
    if(b.length) return enYakin(b);
    var g = f('gelecek');
    if(g.length) return enYakin(g);
    var o = f('otelendi');
    return o.length ? enYakin(o) : null;
  }

  /* haftalık kalıbın insanca özeti: "Pzt · Çar · Cum" */
  function gunlerMetni(gunler){
    return (gunler||[]).slice().sort(function(a,b){ return a-b; })
      .map(function(g){ return GUN_KISA[g-1]; }).join(' · ');
  }

  /* ------------------------------------------------------------------
     .ics — GERÇEK takvim dosyası, sahte indirme değil
     ------------------------------------------------------------------
     Her seans bir VEVENT. Saat kuruluysa zamanlı etkinlik + 30 dk önce
     VALARM (hatırlatma saati burada gerçekten karşılığını buluyor);
     saat yoksa tüm-gün etkinliği. RFC 5545 satır katlaması uygulanır.
     ------------------------------------------------------------------ */
  function kacir(s){
    return String(s==null?'':s).replace(/\\/g,'\\\\').replace(/;/g,'\\;')
             .replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
  }
  /* RFC 5545: satır 75 oktetten uzun olamaz, devamı tek boşlukla katlanır */
  function katla(satir){
    var b = [], s = satir;
    while(s.length > 74){ b.push(s.slice(0,74)); s = ' ' + s.slice(74); }
    b.push(s);
    return b.join('\r\n');
  }
  function damga(){
    var d = new Date();
    return d.getUTCFullYear()+iki(d.getUTCMonth()+1)+iki(d.getUTCDate())+'T'+
           iki(d.getUTCHours())+iki(d.getUTCMinutes())+iki(d.getUTCSeconds())+'Z';
  }
  function ics(p, sure){
    var s = seanslar(p);
    if(!s.length) return null;
    var saat = /^\d{2}:\d{2}$/.test(p.saat||'') ? p.saat : null;
    var dk   = sure || 45;
    var L = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//DadaFit//Program//TR',
             'CALSCALE:GREGORIAN','METHOD:PUBLISH',
             'X-WR-CALNAME:'+kacir(p.ad||'DadaFit programı')];
    s.forEach(function(x){
      var g = x.tarih, tag = g.getFullYear()+iki(g.getMonth()+1)+iki(g.getDate());
      L.push('BEGIN:VEVENT');
      L.push('UID:dadafit-'+(p.slug||'program')+'-'+x.no+'-'+tag+'@dadafit.local');
      L.push('DTSTAMP:'+damga());
      if(saat){
        var hh = +saat.slice(0,2), mm = +saat.slice(3,5);
        var bit = new Date(g.getFullYear(), g.getMonth(), g.getDate(), hh, mm+dk);
        L.push('DTSTART;TZID=Europe/Istanbul:'+tag+'T'+iki(hh)+iki(mm)+'00');
        L.push('DTEND;TZID=Europe/Istanbul:'+
               bit.getFullYear()+iki(bit.getMonth()+1)+iki(bit.getDate())+'T'+
               iki(bit.getHours())+iki(bit.getMinutes())+'00');
      }else{
        L.push('DTSTART;VALUE=DATE:'+tag);
        L.push('DTEND;VALUE=DATE:'+(function(){ var n=ekleGun(g,1);
          return n.getFullYear()+iki(n.getMonth()+1)+iki(n.getDate()); })());
      }
      L.push(katla('SUMMARY:'+kacir((p.ad||'Antrenman')+' — Gün '+x.no)));
      L.push(katla('DESCRIPTION:'+kacir('DadaFit programı · '+x.no+'/'+(p.toplam||s.length)+
             ' · Bu bir prototip kaydıdır, kişiye özel antrenman reçetesi değildir.')));
      if(saat){
        L.push('BEGIN:VALARM','TRIGGER:-PT30M','ACTION:DISPLAY',
               katla('DESCRIPTION:'+kacir((p.ad||'Antrenman')+' 30 dakika sonra')),'END:VALARM');
      }
      L.push('END:VEVENT');
    });
    L.push('END:VCALENDAR');
    return L.join('\r\n')+'\r\n';
  }

  /* .ics'i tarayıcıda indir — Blob, sahte bağlantı yok */
  function icsIndir(p, adGovde){
    var metin = ics(p);
    if(!metin) return false;
    var url = URL.createObjectURL(new Blob([metin], {type:'text/calendar;charset=utf-8'}));
    var a = document.createElement('a');
    a.href = url;
    a.download = (adGovde || 'dadafit-program') + '.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 4000);
    return true;
  }

  /* Google Takvim — TEMPLATE bağlantısı TÜM SERİYİ kurar (RRULE ile).
     Sahte değil: bağlantı Google'ın gerçek şablon uç noktası. */
  var GBYDAY = ['MO','TU','WE','TH','FR','SA','SU'];
  function googleUrl(p){
    var ilk = sonraki(p) || seanslar(p)[0];
    if(!ilk) return null;
    var g = ilk.tarih, tag = g.getFullYear()+iki(g.getMonth()+1)+iki(g.getDate());
    var saat = /^\d{2}:\d{2}$/.test(p.saat||'') ? p.saat : null;
    var dates;
    if(saat){
      var hh=+saat.slice(0,2), mm=+saat.slice(3,5);
      var bit=new Date(g.getFullYear(),g.getMonth(),g.getDate(),hh,mm+45);
      dates = tag+'T'+iki(hh)+iki(mm)+'00/'+
              bit.getFullYear()+iki(bit.getMonth()+1)+iki(bit.getDate())+'T'+
              iki(bit.getHours())+iki(bit.getMinutes())+'00';
    }else{
      var n = ekleGun(g,1);
      dates = tag+'/'+n.getFullYear()+iki(n.getMonth()+1)+iki(n.getDate());
    }
    var kalan = Math.max(1, (+p.toplam||1) - (+p.biten||0));
    var byday = (p.gunler||[]).slice().sort(function(a,b){return a-b;})
                  .map(function(x){ return GBYDAY[x-1]; }).join(',');
    var q = ['action=TEMPLATE',
             'text='+encodeURIComponent(p.ad||'DadaFit antrenmanı'),
             'dates='+dates,
             'ctz=Europe/Istanbul',
             'details='+encodeURIComponent('DadaFit programı · '+(p.toplam||0)+' antrenman')];
    if(byday) q.push('recur='+encodeURIComponent('RRULE:FREQ=WEEKLY;BYDAY='+byday+';COUNT='+kalan));
    return 'https://calendar.google.com/calendar/render?'+q.join('&');
  }

  window.FIT_TAKVIM = {
    GUN_KISA:GUN_KISA, GUN_TAM:GUN_TAM, GUN_TEK:GUN_TEK, AY:AY,
    iki:iki, gunBasi:gunBasi, bugun:bugun, ayrist:ayrist, ymd:ymd,
    gunNo:gunNo, ekleGun:ekleGun, tarihTR:tarihTR, gunTarih:gunTarih,
    yakinAd:yakinAd, seanslar:seanslar, sonraki:sonraki,
    gunlerMetni:gunlerMetni, ics:ics, icsIndir:icsIndir, googleUrl:googleUrl
  };
})();
