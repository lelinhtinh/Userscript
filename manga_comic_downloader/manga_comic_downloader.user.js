// ==UserScript==
// @name            manga comic downloader
// @name:vi         manga comic downloader
// @namespace       https://baivong.github.io
// @description     Tải truyện tranh từ các trang chia sẻ ở Việt Nam. Nhấn Alt+Y để tải toàn bộ.
// @description:vi  Tải truyện tranh từ các trang chia sẻ ở Việt Nam. Nhấn Alt+Y để tải toàn bộ.
// @version         2.11.5
// @icon            https://i.imgur.com/ICearPQ.png
// @author          Zzbaivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           http://*.truyentranhtam.com/*
// @match           http://*.truyentranh8.org/*
// @match           http://*.truyentranh8.com/*
// @match           http://*.truyentranh869.com/*
// @match           http://*.truyentranh86.com/*
// @match           http://iutruyentranh.com/*
// @match           https://iutruyentranh.com/*
// @match           https://*.truyentranh.net/*
// @match           https://comicvn.net/*
// @match           https://beeng.net/*
// @match           https://*.hamtruyen.com/*
// @match           https://ntruyen.info/*
// @match           https://*.a3manga.com/*
// @match           http://truyentranhtuan.com/*
// @match           http://mangak.info/*
// @match           https://truyentranhlh.net/*
// @match           https://truyentranhlh.com/*
// @match           https://hocvientruyentranh.net/*
// @match           https://hocvientruyentranh.com/*
// @match           https://truyenhay24h.com/*
// @match           https://thichtruyentranh.com/*
// @match           http://truyen1.net/*
// @match           http://truyentranh1.info/*
// @match           http://*.hentailxx.com/*
// @match           https://*.hentailxx.com/*
// @match           https://hentaivn.net/*
// @match           https://otakusan.net/*
// @match           https://ngonphongcomics.com/*
// @match           http://*.nettruyen.com/*
// @match           http://nhattruyen.com/*
// @match           http://*.hamtruyentranh.net/*
// @match           https://ttmanga.com/*
// @match           http://truyen.vnsharing.site/*
// @match           https://blogtruyen.com/*
// @match           https://blogtruyen.vn/*
// @match           https://blogtruyen.top/*
// @match           https://truyensieuhay.com/*
// @match           http://truyenchon.com/*
// @match           http://truyenqq.com/*
// @match           https://sachvui.com/*
// @match           https://hentaicube.net/*
// @match           http://*.tuthienbao.com/*
// @match           https://vietcomic.net/*
// @match           https://hamtruyentranh.com/*
// @match           https://hoihentai.com/*
// @match           https://hoitruyentranh.com/*
// @match           https://truyenvn.com/*
// @require         https://code.jquery.com/jquery-3.5.1.min.js
// @require         https://unpkg.com/jszip@3.1.5/dist/jszip.min.js
// @require         https://unpkg.com/file-saver@2.0.2/dist/FileSaver.min.js
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @require         https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/crypto-js.min.js
// @require         https://cdn.jsdelivr.net/npm/selector-set@1.1.5/selector-set.js
// @require         https://cdn.jsdelivr.net/npm/selector-observer@2.1.6/dist/index.umd.js
// @noframes
// @connect         *
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-start
// @grant           GM_addStyle
// @grant           GM_xmlhttpRequest
// @grant           GM.xmlHttpRequest
// @grant           GM_registerMenuCommand
// ==/UserScript==

window._URL = window.URL || window.webkitURL;

jQuery(function ($) {
  /**
   * Output extension
   * @type {String} zip
   *                cbz
   *
   * Tips: Convert .zip to .cbz
   * Windows
   * $ ren *.zip *.cbz
   * Linux
   * $ rename 's/\.zip$/\.cbz/' *.zip
   */
  var outputExt = 'cbz'; // or 'zip'

  /**
   * Multithreading
   * @type {Number} [1 -> 32]
   */
  var threading = 4;

  /**
   * The number of times the download may be attempted.
   * @type {Number}
   */
  var tries = 5;

  /**
   * Image list will be ignored
   * @type {Array} url
   */
  var ignoreList = [
    'http://truyentranhtam.net/templates/main/images/gioithieubanbe3.png',
    'http://1.bp.blogspot.com/-U1SdU4_52Xs/WvLvn1OjvHI/AAAAAAAEugM/dLBgVGSeUN0bVy-FoFfIZvrCJ07YQew7wCHMYCw/s0/haybaoloi.png',
    '/public/images/loading.gif',
    'http://truyentranhlh.net/wp-content/uploads/2015/10/lhmanga.png',
    '/Content/Img/1eeef5d2-b936-496d-ba41-df1b21d0166a.jpg',
    '/Content/Img/d79886b3-3699-47b2-bbf4-af6149c2e8fb.jpg',
    'http://st.beeng.net/files/uploads/images/21/c8/21c8d2c3599c485e31f270675bc57e4c.jpeg',
    '00k9jbV.gif',
  ];

  /**
   * Keep the original url
   * @type {Array} key
   */
  var keepOriginal = [
    'proxy.truyen.cloud',
    '.ttmanga.com',
    '.fbcdn.net',
    'mangaqq.net',
    'mangaqq.com',
    'truyenqq.net',
    '.upanhmoi.net',
    'qqtaku.com',
    'qqtaku.net',
    'trangshop.net',
    '.beeng.net',
    'forumnt.com',
    'hoitruyentranh.com',
    'hoihentai.com',
    'i02.hentaivn.net',
    'truyentop1.com',
  ];

  /**
   * HTTP referer
   * @param {Object} hostname
   */
  var referer = {
    'i.blogtruyen.com': 'https://blogtruyen.com',
    'truyen.cloud': 'http://www.nettruyen.com',
    'proxy.truyen.cloud': 'http://www.nettruyen.com',
    'i.netsnippet.com': 'http://www.nettruyen.com/',
    'upload.forumnt.com': 'http://www.nettruyen.com/',
    'upload2.forumnt.com': 'http://www.nettruyen.com/',
    'upload.upanhmoi.net': 'https://upanhmoi.net',
    'upload2.upanhmoi.net': 'https://upanhmoi.net',
    'upload3.upanhmoi.net': 'https://upanhmoi.net',
    'upload4.upanhmoi.com': 'https://upanhmoi.com',
    'upload5.upanhmoi.com': 'https://upanhmoi.com',
    'upload6.upanhmoi.com': 'https://upanhmoi.com',
    'upload7.upanhmoi.com': 'https://upanhmoi.com',
    'upload8.upanhmoi.com': 'https://upanhmoi.com',
    'upload9.upanhmoi.com': 'https://upanhmoi.com',
    'img1.upanhmoi.net': 'https://upanhmoi.net',
    'img2.upanhmoi.net': 'https://upanhmoi.net',
    'proxy1.ttmanga.com': 'https://ttmanga.com',
    'proxy2.ttmanga.com': 'https://ttmanga.com',
    'proxy3.ttmanga.com': 'https://ttmanga.com',
    'cdn.lhmanga.com': 'https://truyentranhlh.net',
    'cdn1.lhmanga.com': 'https://truyentranhlh.net',
    'storage.fshare.vn': 'https://truyentranh.net',
    'ocumeo.com': 'https://www.a3manga.com/',
    'www.ocumeo.com': 'https://www.a3manga.com/',
    'mangaqq.net': 'http://truyenqq.com/',
    'mangaqq.com': 'http://truyenqq.com/',
    'truyenqq.net': 'http://truyenqq.com/',
    'i02.hentaivn.net': 'https://hentaivn.net/',
    'i1.hentaivn.net': 'https://hentaivn.net/',
  };

  /* === DO NOT CHANGE === */

  window.URL = window._URL;

  function isEmpty(el) {
    return !$.trim(el.html());
  }

  function getImageType(arrayBuffer) {
    if (!arrayBuffer.byteLength)
      return {
        mime: null,
        ext: null,
      };

    var ext = '',
      mime = '',
      dv = new DataView(arrayBuffer, 0, 5),
      numE1 = dv.getUint8(0, true),
      numE2 = dv.getUint8(1, true),
      hex = numE1.toString(16) + numE2.toString(16);

    switch (hex) {
      case '8950':
        ext = 'png';
        mime = 'image/png';
        break;
      case '4749':
        ext = 'gif';
        mime = 'image/gif';
        break;
      case 'ffd8':
        ext = 'jpg';
        mime = 'image/jpeg';
        break;
      case '424d':
        ext = 'bmp';
        mime = 'image/bmp';
        break;
      case '5249':
        ext = 'webp';
        mime = 'image/webp';
        break;
      default:
        ext = null;
        mime = null;
        break;
    }

    return {
      mime: mime,
      ext: ext,
    };
  }

  function noty(txt, status) {
    function destroy() {
      if (!$noty.length) return;
      $noty.fadeOut(300, function () {
        $noty.remove();
        $noty = [];
      });
      clearTimeout(notyTimeout);
    }

    function autoHide() {
      notyTimeout = setTimeout(function () {
        destroy();
      }, 2000);
    }

    if (!$noty.length) {
      var $wrap = $('<div>', {
          id: 'baivong_noty_wrap',
        }),
        $content = $('<div>', {
          id: 'baivong_noty_content',
          class: 'baivong_' + status,
          html: txt,
        }),
        $close = $('<div>', {
          id: 'baivong_noty_close',
          html: '&times;',
        });

      $noty = $wrap.append($content).append($close);
      $noty.appendTo('body').fadeIn(300);
    } else {
      $noty
        .find('#baivong_noty_content')
        .attr('class', 'baivong_' + status)
        .html(txt);

      $noty.show();
      clearTimeout(notyTimeout);
    }

    $noty
      .click(function () {
        destroy();
      })
      .hover(
        function () {
          clearTimeout(notyTimeout);
        },
        function () {
          autoHide();
        }
      );
    if (status !== 'warning' && status !== 'success') autoHide();
  }

  function targetLink(selector) {
    return configs.link
      .split(/\s*,\s*/)
      .map(function (i) {
        return i + selector;
      })
      .join(',');
  }

  function linkError() {
    $(targetLink('[href="' + configs.href + '"]')).css({
      color: 'red',
      textShadow: '0 0 1px red, 0 0 1px red, 0 0 1px red',
    });
    hasDownloadError = true;
  }

  function linkSuccess() {
    var $currLink = $(targetLink('[href="' + configs.href + '"]'));
    if (!hasDownloadError)
      $currLink.css({
        color: 'green',
        textShadow: '0 0 1px green, 0 0 1px green, 0 0 1px green',
      });
  }

  function cancelProgress() {
    linkError();
    $win.off('beforeunload');
  }

  function notyError() {
    noty('Lỗi! Không tải được <strong>' + chapName + '</strong>', 'error');
    inProgress = false;
    cancelProgress();
  }

  function notyImages() {
    noty('Lỗi! <strong>' + chapName + '</strong> không có dữ liệu', 'error');
    inProgress = false;
    cancelProgress();
  }

  function notySuccess(source) {
    if (threading < 1) threading = 1;
    if (threading > 32) threading = 32;

    dlImages = source.map(function (url) {
      return {
        url: url,
        attempt: tries,
      };
    });
    dlTotal = dlImages.length;
    addZip();

    noty('Bắt đầu tải <strong>' + chapName + '</strong>', 'warning');

    $win.on('beforeunload', function () {
      return 'Progress is running...';
    });
  }

  function notyWait() {
    document.title = '[…] ' + tit;

    noty('<strong>' + chapName + '</strong> đang lấy dữ liệu...', 'warning');

    dlAll = dlAll.filter(function (l) {
      return configs.href.indexOf(l) === -1;
    });

    $(targetLink('[href="' + configs.href + '"]')).css({
      color: 'orange',
      fontWeight: 'bold',
      fontStyle: 'italic',
      textDecoration: 'underline',
      textShadow: '0 0 1px orange, 0 0 1px orange, 0 0 1px orange',
    });
  }

  function dlAllGen() {
    dlAll = [];
    $(configs.link).each(function (i, el) {
      dlAll[i] = $(el).attr('href');
    });
    if (configs.reverse) dlAll.reverse();
  }

  function notyReady() {
    noty('Script đã <strong>sẵn sàng</strong> làm việc', 'info');

    dlAllGen();

    $doc
      .on('click', configs.link, function (e) {
        if (!e.ctrlKey && !e.shiftKey) return;

        e.preventDefault();
        var _link = $(this).attr('href');

        if (e.ctrlKey && e.shiftKey) {
          dlAll = dlAll.filter(function (l) {
            return _link.indexOf(l) === -1;
          });

          $(targetLink('[href="' + _link + '"]')).css({
            color: 'gray',
            fontWeight: 'bold',
            fontStyle: 'italic',
            textDecoration: 'line-through',
            textShadow: '0 0 1px gray, 0 0 1px gray, 0 0 1px gray',
          });
        } else {
          if (!inCustom) {
            dlAll = [];
            inCustom = true;
          }

          dlAll.push(_link);

          $(targetLink('[href="' + _link + '"]')).css({
            color: 'violet',
            textDecoration: 'overline',
            textShadow: '0 0 1px violet, 0 0 1px violet, 0 0 1px violet',
          });
        }
      })
      .on('keyup', function (e) {
        if (e.which === 17 || e.which === 16) {
          e.preventDefault();

          if (dlAll.length && inCustom) {
            if (e.which === 16) inMerge = true;
            downloadAll();
          }
        }
      });
  }

  function downloadAll() {
    if (inProgress || inAuto) return;
    if (!inCustom && !dlAll.length) dlAllGen();
    if (!dlAll.length) return;
    inAuto = true;
    $(targetLink('[href*="' + dlAll[0] + '"]')).trigger('contextmenu');
  }

  function downloadAllOne() {
    inMerge = true;
    downloadAll();
  }

  function genFileName() {
    chapName = chapName
      .replace(/\s+/g, '_')
      .replace(/・/g, '·')
      .replace(/(^_+|_+$)/, '');
    if (hasDownloadError) chapName = '__ERROR__' + chapName;
    return chapName;
  }

  function endZip() {
    if (!inMerge) {
      dlZip = new JSZip();
      dlPrevZip = false;
    }

    dlCurrent = 0;
    dlFinal = 0;
    dlTotal = 0;
    dlImages = [];

    hasDownloadError = false;
    inProgress = false;

    if (inAuto) {
      if (dlAll.length) {
        $(targetLink('[href*="' + dlAll[0] + '"]')).trigger('contextmenu');
      } else {
        inAuto = false;
        inCustom = false;
      }
    }
  }

  function genZip() {
    noty('Tạo file nén của <strong>' + chapName + '</strong>', 'warning');

    dlZip
      .generateAsync(
        {
          type: 'blob',
          compression: 'STORE',
        },
        function updateCallback(metadata) {
          noty('Đang nén file <strong>' + metadata.percent.toFixed(2) + '%</strong>', 'warning');
        }
      )
      .then(
        function (blob) {
          var zipName = genFileName() + '.' + outputExt;

          if (dlPrevZip) URL.revokeObjectURL(dlPrevZip);
          dlPrevZip = blob;

          noty(
            '<a href="' +
              URL.createObjectURL(dlPrevZip) +
              '" download="' +
              zipName +
              '"><strong>Click vào đây</strong></a> nếu trình duyệt không tự tải xuống',
            'success'
          );
          linkSuccess();

          $win.off('beforeunload');
          saveAs(blob, zipName);

          document.title = '[⇓] ' + tit;
          endZip();
        },
        function () {
          noty('Lỗi tạo file nén của <strong>' + chapName + '</strong>', 'error');
          cancelProgress();

          document.title = '[x] ' + tit;
          endZip();
        }
      );
  }

  /* global CryptoJS, chapterHTML */
  // Using for getA3Manga + getNgonPhongComics
  // eslint-disable-next-line no-unused-vars
  function CryptoJSAesDecrypt(passphrase, encrypted_json_string) {
    var obj_json = JSON.parse(encrypted_json_string);
    var encrypted = obj_json.ciphertext;
    var salt = CryptoJS.enc.Hex.parse(obj_json.salt);
    var iv = CryptoJS.enc.Hex.parse(obj_json.iv);
    var key = CryptoJS.PBKDF2(passphrase, salt, {
      hasher: CryptoJS.algo.SHA512,
      keySize: 64 / 8,
      iterations: 999,
    });
    var decrypted = CryptoJS.AES.decrypt(encrypted, key, { iv: iv });
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  function otakuSanFilter(url, level, index) {
    String.prototype.replaceAll = function (n, t) {
      var i = this;
      return i.replace(new RegExp(n, 'g'), t);
    };
    function encode(n) {
      return n.indexOf('%3A') > 0 || n.indexOf('%2F') > 0 ? n : encodeURIComponent(n);
    }
    var pattern, matched, dataip;
    if (typeof url == 'undefined' || url === null || url === '') return '/Content/Img/424450.jpg';
    if (url.indexOf('424450.jpg') > 0) return null;
    url = url
      .replaceAll('_h_', 'http')
      .replaceAll('_e_', '/extendContent/Manga/')
      .replaceAll('_r_', '/extendContent/MangaRaw/');
    url.indexOf('//') === 0 && (url = 'http:' + url);
    if (url.indexOf('[GDP]') === 0 || url.indexOf('drive.google.com') > 0)
      return level > 1
        ? '/api/Value/ImageSyncing?ip=34512351&url=' +
            encode(url.replace('[GDP]', 'https://drive.google.com/uc?export=view&id='))
        : url.replace('[GDP]', 'https://drive.google.com/uc?export=view&id=');
    if (
      (url.indexOf('[IS1]') >= 0 && (url = url.replace('[IS1]', 'https://imagepi.otakuscan.net/')),
      url.indexOf('[IS3]') >= 0 && (url = url.replace('[IS3]', 'http://image3.otakuscan.net/')),
      url.indexOf('[IO3]') >= 0 && (url = url.replace('[IO3]', 'http://image3.shopotaku.net/')),
      url.indexOf('/Content/Workshop/') >= 0)
    )
      return url;
    if (url.indexOf('/Content/Workshop/') >= 0) return url;
    if (
      (url.indexOf('i.blogtruyen') > 0 && level > 9 && (url = url.replace('i.blogtruyen', 'i2.blogtruyen')),
      url.indexOf('file-bato-orig.anyacg.co') > 0 &&
        (url = url.replace('file-bato-orig.anyacg.co', 'file-bato-orig.bato.to')),
      url.indexOf('file-comic') > 0 &&
        (url.indexOf('file-comic-1') > 0 && (url = url.replace('file-comic-1.anyacg.co', 'z-img-01.mangapark.net')),
        url.indexOf('file-comic-2') > 0 && (url = url.replace('file-comic-2.anyacg.co', 'z-img-02.mangapark.net')),
        url.indexOf('file-comic-3') > 0 && (url = url.replace('file-comic-3.anyacg.co', 'z-img-03.mangapark.net')),
        url.indexOf('file-comic-4') > 0 && (url = url.replace('file-comic-4.anyacg.co', 'z-img-04.mangapark.net')),
        url.indexOf('file-comic-5') > 0 && (url = url.replace('file-comic-5.anyacg.co', 'z-img-05.mangapark.net')),
        url.indexOf('file-comic-6') > 0 && (url = url.replace('file-comic-6.anyacg.co', 'z-img-06.mangapark.net')),
        url.indexOf('file-comic-9') > 0 && (url = url.replace('file-comic-9.anyacg.co', 'z-img-09.mangapark.net')),
        url.indexOf('file-comic-10') > 0 && (url = url.replace('file-comic-10.anyacg.co', 'z-img-10.mangapark.net')),
        url.indexOf('file-comic-99') > 0 &&
          (url = url.replace('file-comic-99.anyacg.co/uploads', 'file-bato-0001.bato.to'))),
      url.indexOf('cdn.nettruyen.com') > 0 &&
        (url = url.replace('cdn.nettruyen.com/Data/Images/', 'truyen.cloud/data/images/')),
      url.indexOf('http') >= 30 && (url = url.substr(url.indexOf('http'))),
      (url.indexOf('%2f%2f') > 0 || url.indexOf('%2F%2F') > 0) && (url = decodeURIComponent(url)),
      url.indexOf('url=') >= 1 && (url = url.substr(url.indexOf('url=') + 4)),
      (url.indexOf('blogspot') >= 1 || url.indexOf('fshare') >= 1) && (url = url.replace('http:', 'https:')),
      url.indexOf('blogspot') >= 0 && url.indexOf('http') < 0 && (url = 'https://' + url),
      url.indexOf('app/manga/uploads/') >= 0 && (url = 'https://lhscan.net/' + url),
      (url = url.replace('//cdn.adtrue.com/rtb/async.js', '')),
      url.indexOf('[ON2]') >= 0 ||
      url.indexOf('[OSN]') >= 0 ||
      url.indexOf('[TT3]') >= 0 ||
      url.indexOf('[GDT]') >= 0 ||
      url.indexOf('truyen.cloud') > 0 ||
      url.indexOf('fshare.vn') > 0 ||
      url.indexOf('[GDT]') === 0 ||
      url.indexOf('lhmanga') > 0 ||
      url.indexOf('blogtruyen') > 0 ||
      url.indexOf('lhscanlation') > 0 ||
      url.indexOf('hako') > 0 ||
      url.indexOf('manhwahentai.com') > 0 ||
      url.indexOf('uptruyen.com') > 0 ||
      url.indexOf('mangaqq') > 0 ||
      url.indexOf('otakuqq') > 0 ||
      url.indexOf('qqtaku') > 0 ||
      url.indexOf('trangshop') > 0 ||
      url.indexOf('ocumeo') > 0 ||
      url.indexOf('hamtruyen') > 0 ||
      url.indexOf('beeng.net') > 0 ||
      url.indexOf('rawdevart.com') > 0 ||
      url.indexOf('mangasy.com') > 0 ||
      url.indexOf('cdnqq.xyz') > 0 ||
      url.indexOf('imgmirror.club') > 0 ||
      url.indexOf('cdnimg.club') > 0 ||
      url.indexOf('forumnt') > 0 ||
      (url.indexOf('hiperdex') > 0 && level <= 1) ||
      url.indexOf('netsnippet') > 0 ||
      url.indexOf('mangakakalot') > 0 ||
      (url.indexOf('mangapark') > 0 && level > 1)
        ? (index == null && (index = 1), (url = '/api/Value/ImageSyncing?ip=34512351&url=' + encode(url)))
        : url.indexOf('merakiscans') > 0 ||
          url.indexOf('mangazuki') > 0 ||
          url.indexOf('ninjascans') > 0 ||
          url.indexOf('anyacg.co') > 0 ||
          url.indexOf('mangakatana') > 0 ||
          url.indexOf('zeroscans') > 0 ||
          url.indexOf('mangapark') > 0 ||
          url.indexOf('mangadex') > 0 ||
          url.indexOf('uptruyen') > 0 ||
          url.indexOf('hocvientruyentranh') > 0 ||
          url.indexOf('ntruyen.info') > 0 ||
          url.indexOf('chancanvas') > 0 ||
          url.indexOf('ff.cdnimg.club') > 0 ||
          url.indexOf('bato.to') > 0
          ? url.indexOf('googleusercontent') < 0 &&
          url.indexOf('otakusan') < 0 &&
          url.indexOf('otakuscan') < 0 &&
          url.indexOf('shopotaku') < 0 &&
          (url =
            'https://images2-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&gadget=a&no_expand=1&resize_h=0&rewriteMime=image%2F*&url=' +
            encode(url))
          : url.indexOf('imageinstant.com') > 0
            ? (url = 'https://images.weserv.nl/?url=' + encode(url))
            : url.indexOf('hiperdex') > 0 && level > 1 && (url = 'loading error page'),
      (pattern = /http:\/[^/]/g),
      (matched = pattern.exec(url)),
      matched != null && matched.length > 0 && (url = url.replace('http:/', 'http://')),
      (pattern = /https:\/[^/]/g),
      (matched = pattern.exec(url)),
      matched != null && matched.length > 0 && (url = url.replace('https:/', 'http://')),
      (dataip = 'err'),
      url.indexOf('otakusan.net_') > 0 && url.indexOf('vi=') < 0)
    )
      try {
        dataip = window.otakusanVi;
        !dataip && (dataip = 'err');
        level === 99 && (dataip = dataip.replace(dataip.substr(0, 4), '9120'));
        url += url.indexOf('?') > 0 ? '&vi=' + dataip : '?vi=' + dataip;
      } catch (e) {
        dataip = 'err';
      }
    return url;
  }

  function otakuSanHeader(url, headers) {
    if (
      url.indexOf('otakusan.net') > 0 &&
      url.indexOf('extendContent') > 0 &&
      url.indexOf('fetcher.otakusan.net') < 0 &&
      url.indexOf('image3.otakusan.net') < 0
    ) {
      headers['page-lang'] = window.otakusanSuccess[dlCurrent] + ',' + window.otakusanKey;
    } else {
      headers['page-lang'] = 'vn-lang';
    }
    return headers;
  }

  function dlImgError(current, success, error, err, filename) {
    if (dlImages[current].attempt <= 0) {
      dlFinal++;
      error(err, filename);
      return;
    }

    setTimeout(function () {
      dlImg(current, success, error);
      dlImages[current].attempt--;
    }, 2000);
  }

  function dlImg(current, success, error) {
    var url = dlImages[current].url,
      filename = ('0000' + dlCurrent).slice(-4),
      urlObj = new URL(url),
      urlHost = urlObj.hostname,
      headers = {};

    if (referer[urlHost]) {
      headers.referer = referer[urlHost];
      headers.origin = referer[urlHost];
    } else {
      headers.referer = location.origin;
      headers.origin = location.origin;
    }
    headers = otakuSanHeader(url, headers);

    GM.xmlHttpRequest({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
      headers: headers,
      onload: function (response) {
        var imgExt = getImageType(response.response).ext;

        if (imgExt === 'gif') {
          dlFinal++;
          next();
          return;
        }

        if (
          !imgExt ||
          response.response.byteLength < 100 ||
          (response.statusText !== 'OK' && response.statusText !== '')
        ) {
          dlImgError(current, success, error, response, filename);
        } else {
          filename = filename + '.' + imgExt;
          dlFinal++;
          success(response, filename);
        }
      },
      onerror: function (err) {
        dlImgError(current, success, error, err, filename);
      },
    });
  }

  function next() {
    noty('Đang tải xuống <strong>' + dlFinal + '/' + dlTotal + '</strong>', 'warning');
    if (dlFinal < dlCurrent) return;

    if (dlFinal < dlTotal) {
      addZip();
    } else {
      if (inMerge) {
        if (dlAll.length) {
          linkSuccess();
          endZip();
        } else {
          inMerge = false;
          genZip();
        }
      } else {
        genZip();
      }
    }
  }

  function addZip() {
    var max = dlCurrent + threading,
      path = '';

    if (max > dlTotal) max = dlTotal;
    if (inMerge) path = genFileName() + '/';

    for (dlCurrent; dlCurrent < max; dlCurrent++) {
      dlImg(
        dlCurrent,
        function (response, filename) {
          dlZip.file(path + filename, response.response);

          next();
        },
        function (err, filename) {
          dlZip.file(path + filename + '_error.txt', err.statusText + '\r\n' + err.finalUrl);

          noty(err.statusText, 'error');
          linkError();

          next();
        }
      );
    }
  }

  function imageIgnore(url) {
    return ignoreList.some(function (v) {
      return url.indexOf(v) !== -1;
    });
  }

  function protocolUrl(url) {
    if (url.indexOf('//') === 0) url = location.protocol + url;
    if (url.search(/https?:\/\//) !== 0) url = 'http://' + url;
    return url;
  }

  function redirectSSL(url) {
    if (
      url.search(/(i\.imgur\.com|\.blogspot\.com|\.fbcdn\.net|storage\.fshare\.vn)/i) !== -1 &&
      url.indexOf('http://') === 0
    )
      url = url.replace(/^http:\/\//, 'https://');

    return url;
  }

  function decodeUrl(url) {
    var parser = new DOMParser(),
      dom = parser.parseFromString('<!doctype html><body>' + url, 'text/html');

    return decodeURIComponent(dom.body.textContent);
  }

  function imageFilter(url) {
    url = decodeUrl(url);
    url = url.trim();
    url = url.replace(/^.+(&|\?)url=/, '');
    url = url.replace(/(https?:\/\/)lh(\d)(\.bp\.blogspot\.com)/, '$1$2$3');
    url = url.replace(/(https?:\/\/)lh\d\.(googleusercontent|ggpht)\.com/, '$14.bp.blogspot.com');
    url = url.replace(/\?.+$/, '');
    if (url.indexOf('imgur.com') !== -1) {
      url = url.replace(/(\/)(\w{5}|\w{7})(s|b|t|m|l|h)(\.(jpe?g|png|webp))$/, '$1$2$4');
    } else if (url.indexOf('blogspot.com') !== -1) {
      url = url.replace(/\/([^/]+-)?(Ic42)(-[^/]+)?\//, '/$2/');
      url = url.replace(/\/(((s|w|h)\d+|(w|h)\d+-(w|h)\d+))?-?(c|d|g)?\/(?=[^/]+$)/, '/');
      url += '?imgmax=16383';
    } else {
      url = url.replace(/(\?|&).+/, '');
    }
    url = encodeURI(url);
    url = protocolUrl(url);
    url = redirectSSL(url);

    return url;
  }

  function checkImages(images) {
    var source = [];

    if (!images.length) {
      notyImages();
    } else {
      $.each(images, function (i, v) {
        v = v.replace(/^[\s\n]+|[\s\n]+$/g, '');

        var keep = keepOriginal.some(function (key) {
          return v.indexOf(key) !== -1;
        });
        if (keep) {
          source.push(v);
          return;
        }

        if (imageIgnore(v) || typeof v === 'undefined') return;
        if (/[><"']/.test(v)) return;

        if (
          (v.indexOf(location.origin) === 0 || (v.indexOf('/') === 0 && v.indexOf('//') !== 0)) &&
          !/^(\.(jpg|png)|webp|jpeg)$/.test(v.slice(-4))
        ) {
          return;
        } else if (v.indexOf('http') !== 0 && v.indexOf('//') !== 0) {
          v = location.origin + (v.indexOf('/') === 0 ? '' : '/') + v;
        } else if (v.indexOf('http') === 0 || v.indexOf('//') === 0) {
          v = imageFilter(v);
        } else {
          return;
        }

        source.push(v);
      });

      notySuccess(source);
    }
  }

  function getImages($contents) {
    var images = [];
    $contents.each(function (i, v) {
      var $img = $(v);
      images[i] = !configs.imgSrc
        ? $img.data('cdn') || $img.data('src') || $img.data('original')
        : $img.attr(configs.imgSrc);
    });

    checkImages(images);
  }

  function getContents($source) {
    var method = 'find';
    if (configs.filter) method = 'filter';

    var $entry = $source[method](configs.contents).find('img');
    if (!$entry.length) {
      notyImages();
    } else {
      getImages($entry);
    }
  }

  function cleanSource(response) {
    var responseText = response.responseText;
    if (configs.imgSrc) return $(responseText);

    responseText = responseText.replace(/[\s\n]+src[\s\n]*=[\s\n]*/gi, ' data-src=');
    responseText = responseText.replace(/^[^<]*/, '');
    return $(responseText);
  }

  function rightClickEvent(_this, callback) {
    var $this = $(_this),
      name = configs.name;

    configs.href = $this.attr('href');
    chapName = $this.text().trim();

    if (typeof name === 'function') {
      chapName = name(_this, chapName);
    } else if (typeof name === 'string') {
      chapName = $(name).text().trim() + ' ' + chapName;
    }

    notyWait();

    GM.xmlHttpRequest({
      method: 'GET',
      url: configs.href,
      onload: function (response) {
        var $data = cleanSource(response);
        if (typeof callback === 'function') {
          callback($data);
        } else {
          getContents($data);
        }
      },
      onerror: function () {
        notyError();
      },
    });
  }

  function oneProgress() {
    if (inProgress) {
      noty('Chỉ được phép <strong>tải một truyện</strong> mỗi lần', 'error');
      return false;
    }
    inProgress = true;
    return true;
  }

  function getSource(callback) {
    var $link = $(configs.link);
    if (!$link.length) return;

    $link.on('contextmenu', function (e) {
      e.preventDefault();
      hasDownloadError = false;
      if (!oneProgress()) return;

      rightClickEvent(this, callback);
    });

    notyReady();
  }

  function getTruyenTranh8() {
    getSource(function ($data) {
      var packer = $data.find('#logoTT8,center').siblings('script:first').text().trim().split('eval')[1],
        lstImages = [];

      eval(eval(packer));
      checkImages(lstImages);
    });
  }

  function getIuTruyenTranh($data) {
    function init($data) {
      var $goiy = $data.find('.goiy');

      if ($goiy.length) {
        var comic_id, chap_index, chap_id;
        try {
          var matched = configs.href.match(/(\d+)-.*?\/c([\d.\-a-z]+)\.html\?id=(\d+)$/i);
          comic_id = matched[1];
          chap_index = matched[2];
          chap_id = matched[3];
          // eslint-disable-next-line no-empty
        } catch (error) {}

        var recentPassword = sessionStorage.getItem('recent-password');
        var pass = prompt(
          'Truyện yêu cầu nhập mật khẩu, gợi ý là:\n\n' +
            $goiy.text() +
            '\n\nSử dụng mã gõ tắt để nhập nhanh:\n{{ comic_id }}: ID truyện (' +
            comic_id +
            ')\n{{ chap_index }}: Thứ tự chương (' +
            chap_index +
            ')\n{{ chap_id }}: ID chương (' +
            chap_id +
            ')',
          recentPassword ? recentPassword : '{{ chap_index }}ltn'
        );

        if (!pass || !pass.trim()) {
          notyError();
          return;
        }
        pass = pass.trim();
        sessionStorage.setItem('recent-password', pass);

        pass = pass.replace(/\{\{\s*comic_id\s*\}\}/, comic_id);
        pass = pass.replace(/\{\{\s*chap_index\s*\}\}/, chap_index);
        pass = pass.replace(/\{\{\s*chap_id\s*\}\}/, chap_id);

        GM.xmlHttpRequest({
          method: 'POST',
          url: configs.href,
          data: 'act=doUnclock&pass=' + pass,
          headers: {
            withCredentials: true,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          onload: function (response) {
            getIuTruyenTranh(cleanSource(response));
          },
          onerror: function () {
            notyError();
          },
        });
        return;
      }

      var packer = $data.filter('div.wrapper').find('script:first').text().trim().split('eval')[1],
        lstImages = [];

      eval(eval(packer));
      checkImages(lstImages);
    }

    !$data ? getSource(init) : init($data);
  }

  function getNtruyen() {
    getSource(function ($data) {
      var $entry = $data.find('#containerListPage');
      if (!$entry.length) {
        notyImages();
      } else {
        if (isEmpty($entry)) {
          var id = configs.href.match(/\/(\d+)\/[\w\d-]+$/i)[1];
          $.ajax({
            type: 'post',
            url: '/MainHandler.ashx',
            data: JSON.stringify({
              id: 3,
              method: 'getChapter',
              params: [id],
            }),
            contentType: 'application/json',
            dataType: 'json',
          }).done(function (data) {
            var input = data.result.data.listPages,
              regex = /src="([^"]+)"/gi,
              matches,
              output = [];

            // eslint-disable-next-line no-cond-assign
            while ((matches = regex.exec(input))) {
              output.push(decodeURIComponent(matches[1]));
            }
            checkImages(output);
          });
        } else {
          configs.contents = '#containerListPage';
          getContents($data);
        }
      }
    });
  }

  function getA3Manga() {
    getSource(function ($data) {
      var $entry = $data.find('#chapter-content script');
      if (!$entry.length) {
        notyImages();
      } else {
        $entry = $entry.text().replace('document.write(chapterHTML);', '').trim();
        if (!$entry) {
          notyImages();
          return;
        }

        String.prototype.replaceAll = function (search, replacement) {
          var target = this;
          return target.split(search).join(replacement);
        };

        eval($entry);
        $entry = $(chapterHTML);

        var images = [];
        $entry.each(function (i, v) {
          var imgLink = $(v).data('9rqz');
          imgLink = imgLink.replaceAll('@9rQz^', '.');
          imgLink = imgLink.replaceAll('~4ZLsA*', ':');
          imgLink = imgLink.replaceAll('^u$UZ!QyI<yt_Z2}', '/');
          images.push(imgLink);
        });
        checkImages(images);
      }
    });
  }

  function getTruyenTranhTuan() {
    getSource(function ($data) {
      var $entry = $data.find('#read-title').next('script');
      if (!$entry.length) {
        notyImages();
      } else {
        $data = $entry.text().match(/var\s+slides_page_path\s*=\s*(.+?);/)[1];
        $data = JSON.parse($data);

        var slides_page = $data,
          length_chapter = slides_page.length - 1;

        for (var i = 0; i < length_chapter; i++) {
          for (var j = i + 1; j < slides_page.length; j++) {
            if (slides_page[j] < slides_page[i]) {
              var temp = slides_page[j];
              slides_page[j] = slides_page[i];
              slides_page[i] = temp;
            }
          }
        }

        checkImages(slides_page);
      }
    });
  }

  function getMangaK() {
    getSource(function ($data) {
      var $entry = $data.find('#content-chap script');
      if (!$entry.length) {
        notyImages();
      } else {
        $data = $entry.text().match(/var\s+content\s*=\s*(.+?);/)[1];
        $data = $data.trim().replace(/,[\s\n]*\]$/, ']');
        $data = JSON.parse($data);
        checkImages($data);
      }
    });
  }

  function getTruyenHay24h() {
    getSource(function ($data) {
      $data = $data.find('#dvContentChap').siblings('script').text();
      $data = $data.match(/GI2017\(([^;]+);/)[1];
      $data = $data.split(/[,']+/);

      $.post('/TH24Service.asmx/GetChapterImages', {
        PID: $data[0],
        ChapNumber: $data[1],
        cc18: $data[2],
        name: '',
        s: 0,
      })
        .done(function (response) {
          var images = [];
          $(response)
            .find('string')
            .each(function (i, v) {
              images[i] = v.textContent.replace(/\.(jpe?g|png)\w*$/, '.$1');
            });

          checkImages(images);
        })
        .fail(function () {
          notyError();
        });
    });
  }

  function getThichTruyenTranh() {
    getSource(function ($data) {
      $data = $data.find('#content_read').next('script').text();
      $data = $data.match(/https?:\/\/[^"]+/g);
      if (!$data.length) {
        notyImages();
      } else {
        checkImages($data);
      }
    });
  }

  function getTruyen1() {
    $(configs.link).on('contextmenu', function (e) {
      e.preventDefault();
      hasDownloadError = false;
      if (!oneProgress()) return;

      var $this = $(this);

      configs.href = $this.attr('href');
      chapName = $('h1.title').text().trim() + ' ' + $this.text().trim();
      notyWait();

      var chapKey = configs.href.match(/\/(\d+)\/[^/]+$/);
      if (!chapKey) {
        notyError();
        return;
      }
      chapKey = chapKey[1];

      $.ajax({
        url: '/MainHandler.ashx',
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify({
          id: 2,
          method: 'getChapter',
          params: [chapKey],
        }),
        contentType: 'application/json',
      })
        .done(function (response) {
          if (!response.result) {
            notyError();
            return;
          }
          if (response.result.hasErrors) {
            notyImages();
            return;
          }
          var data = response.result.data.listPages.match(/https?:\/\/[^"]+/g);
          if (!data.length) {
            notyImages();
          } else {
            checkImages(data);
          }
        })
        .fail(function () {
          notyError();
        });
    });

    notyReady();
  }

  function getOtakuSan() {
    var $link = $(configs.link);
    if (!$link.length) return;

    $link.on('contextmenu', function (e) {
      e.preventDefault();
      hasDownloadError = false;
      if (!oneProgress()) return;

      var $this = $(this);

      configs.href = $this.attr('href');
      chapName = $('h1.title').first().attr('title') + ' ' + $this.text().trim();
      notyWait();

      GM.xmlHttpRequest({
        method: 'GET',
        url: configs.href,
        onload: function (data) {
          var $data = cleanSource(data);
          window.otakusanVi = $data.find('#dataip').val();

          GM.xmlHttpRequest({
            method: 'POST',
            url: '/Manga/UpdateView',
            responseType: 'json',
            onload: function (response) {
              var res = response.response;
              if (!res.chapid) {
                notyImages();
              } else {
                window.otakusanKey = res.key;
                window.otakusanSuccess = res.isSuccess;

                var images = JSON.parse(res.view);
                $.each(images, function (i, v) {
                  images[i] = otakuSanFilter(v, 1, i);
                });
                notySuccess(images);
              }
            },
          });
        },
      });
    });

    notyReady();
  }

  function getNgonPhongComics() {
    getSource(function ($data) {
      var $entry = $data.filter('#chapter-content').find('script');
      if (!$entry.length) {
        notyImages();
      } else {
        $entry = $entry
          .text()
          .trim()
          .match(/^(.+?)document\.write\(chapterHTML\);/);
        if (!$entry) {
          notyImages();
          return;
        }

        String.prototype.replaceAll = function (search, replacement) {
          var target = this;
          return target.split(search).join(replacement);
        };

        eval($entry[1]);
        $entry = $(chapterHTML);

        var images = [];
        $entry.each(function (i, v) {
          var imgLink = $(v).data('9rpq');
          imgLink = imgLink.replaceAll('@9rpQ^', '.');
          imgLink = imgLink.replaceAll('~4ZLls*', ':');
          imgLink = imgLink.replaceAll('^u$UZ!Qy<yut_Z2}', '/');
          images.push(imgLink);
        });
        checkImages(images);
      }
    });
  }

  function getTtManga() {
    getSource(function ($data) {
      var data = $data.find('#divImage').siblings('script').first().text();
      if (!/lstImages\.push\("([^"]+)"\)/.test(data)) {
        notyImages();
      } else {
        var regex = /lstImages\.push\("([^"]+)"\)/gi,
          matches,
          output = [];

        // eslint-disable-next-line no-cond-assign
        while ((matches = regex.exec(data))) {
          output.push(decodeURIComponent(matches[1]));
        }
        checkImages(output);
      }
    });
  }

  function getTruyenSieuHay() {
    getSource(function ($data) {
      if ($data.find('#wrap_alertvip').length) {
        notyImages();
        return;
      }

      var sID = $data.find('.content-chap-image').find('script:not([type]):first').text();
      sID = /\bgetContentchap\('(\w+)'\)\B/.exec(sID);
      if (!sID) {
        notyImages();
        return;
      }
      sID = sID[1];

      $.ajax({
        type: 'POST',
        url: '/Service.asmx/getContentChap',
        data: '{ sID: "' + sID + '",chuc:"k" }',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: function (data) {
          if (data.Message) {
            notyImages();
            return;
          }

          var regex = /\s+src='(http[^']+)'/gi,
            matches,
            output = [];

          data = data.d;
          // eslint-disable-next-line no-cond-assign
          while ((matches = regex.exec(data))) {
            output.push(decodeURIComponent(matches[1]));
          }
          checkImages(output);
        },
        error: function () {
          notyImages();
        },
      });
    });
  }

  /* global SelectorObserver, SelectorSet */
  function getHentaiCube() {
    const observer = new SelectorObserver.default($('#manga-chapters-holder').get(0), SelectorSet);
    observer.observe('.listing-chapters_wrap', function () {
      var $link = $(configs.link);
      if (!$link.length) return;

      $link.on('contextmenu', function (e) {
        e.preventDefault();
        hasDownloadError = false;
        if (!oneProgress()) return;

        rightClickEvent(this);
      });

      notyReady();
    });
  }

  function getVietComic() {
    getSource(function ($data) {
      var data = $data.filter('script:not([src]):contains("Loadimage(i)")');
      if (!data.length) {
        notyImages();
        return;
      }

      data = data.text().match(/data\s=\s'(.+?)';/);
      if (!data) {
        notyImages();
        return;
      }

      data = data[1];
      data = data.split('|');
      checkImages(data);
    });
  }

  function getHoiTruyenTranh() {
    var $link = $(configs.link);
    if (!$link.length) return;

    $link.on('contextmenu', function (e) {
      e.preventDefault();
      hasDownloadError = false;
      if (!oneProgress()) return;

      var $this = $(this);
      configs.href = $this.attr('href');
      chapName = $(configs.name).text().trim() + ' ' + $this.text().trim();

      notyWait();

      var threadId = configs.href.match(/\/threads\/(\d+)\/?/)[1];
      GM.xmlHttpRequest({
        method: 'GET',
        url: '/load-post-data?thread_id=' + threadId + '&is_backup=false',
        onload: function (response) {
          var $data = cleanSource(response),
            $entry = $data.find('img');

          if (!$entry.length) {
            notyImages();
          } else {
            getImages($entry);
          }
        },
        onerror: function () {
          notyError();
        },
      });
    });

    notyReady();
  }

  function getTruyenVn() {
    getSource(function ($data) {
      var chapId = $data.find('[name="p"]:first').val();
      $.ajax({
        type: 'POST',
        url: '/wp-admin/admin-ajax.php',
        data: {
          action: 'z_do_ajax',
          _action: 'load_imgs_for_chapter',
          p: chapId,
        },
        dataType: 'json',
      })
        .done(function (res) {
          if (res.mes != '-1') {
            if (res.mes.length > 1) {
              checkImages(
                res.mes.map(function (img) {
                  return img.url;
                })
              );
            } else {
              notyImages();
            }
          } else {
            notyImages();
          }
        })
        .fail(function () {
          notyError();
        });
    });
  }

  var configsDefault = {
      reverse: true,
      link: '',
      name: '',
      contents: '',
      imgSrc: '',
      filter: false,
      init: getSource,
    },
    configs,
    chapName,
    $noty = [],
    notyTimeout,
    domainName = location.host,
    tit = document.title,
    $win = $(window),
    $doc = $(document),
    dlZip = new JSZip(),
    dlPrevZip = false,
    dlCurrent = 0,
    dlFinal = 0,
    dlTotal = 0,
    dlImages = [],
    dlAll = [],
    hasDownloadError = false,
    inProgress = false,
    inAuto = false,
    inCustom = false,
    inMerge = false;

  GM_registerMenuCommand('Download All Chapters', downloadAll);
  GM_registerMenuCommand('Download All To One File', downloadAllOne);

  $doc.on('keydown', function (e) {
    if (e.which === 89 && e.altKey) {
      // Alt+Y
      e.preventDefault();
      e.shiftKey ? downloadAllOne() : downloadAll();
    }
  });

  GM_addStyle(
    '#baivong_noty_wrap{display:none;background:#fff;position:fixed;z-index:2147483647;right:20px;top:20px;min-width:150px;max-width:100%;padding:15px 25px;border:1px solid #ddd;border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.1),0 1px 10px rgba(0,0,0,.35);cursor:pointer}#baivong_noty_content{color:#444}#baivong_noty_content strong{font-weight:700}#baivong_noty_content.baivong_info strong{color:#2196f3}#baivong_noty_content.baivong_success strong{color:#4caf50}#baivong_noty_content.baivong_warning strong{color:#ffc107}#baivong_noty_content.baivong_error strong{color:#f44336}#baivong_noty_content strong.centered{display:block;text-align:center}#baivong_noty_close{position:absolute;right:0;top:0;font-size:18px;color:#ddd;height:20px;width:20px;line-height:20px;text-align:center}#baivong_noty_wrap:hover #baivong_noty_close{color:#333}'
  );

  switch (domainName) {
    case 'truyentranhtam.com':
    case 'truyentranh8.org':
    case 'truyentranh869.com':
    case 'truyentranh86.com':
      configs = {
        link: '#ChapList a',
        name: function (_this) {
          return $('.breadcrumb li:last').text().trim() + ' ' + $(_this).find('span, strong, h2').text().trim();
        },
        init: getTruyenTranh8,
      };
      break;
    case 'm.truyentranhtam.com':
    case 'm.truyentranh8.org':
    case 'm.truyentranh869.com':
    case 'm.truyentranh86.com':
      configs = {
        link: '.chapter-link',
        name: 'h1',
        init: getTruyenTranh8,
      };
      break;
    case 'iutruyentranh.com':
      configs = {
        link: '#chaplist a',
      };
      getIuTruyenTranh();
      break;
    case 'truyentranh.net':
    case 'www.truyentranh.net':
      configs = {
        reverse: false,
        link: '.content a',
        name: function (_this) {
          return _this.title;
        },
        contents: '.paddfixboth-mobile',
      };
      break;
    case 'comicvn.net':
    case 'beeng.net':
      configs = {
        link: '#scrollbar a',
        name: function (_this) {
          return $('.detail h4').text().trim() + ' ' + $(_this).find('.titleComic').text().trim();
        },
        contents: '#lightgallery',
        imgSrc: 'data-src',
      };
      break;
    case 'hamtruyen.com':
    case 'www.hamtruyen.com':
      configs = {
        link: '.tenChapter a',
        name: '.tentruyen',
        contents: '#content_chap',
      };
      break;
    case 'm.hamtruyen.com':
      configs = {
        link: '.list-chap a',
        name: '.tentruyen',
        contents: '#content_chap',
      };
      break;
    case 'ntruyen.info':
      configs = {
        link: '.cellChapter a',
        name: 'h1',
        init: getNtruyen,
      };
      break;
    case 'a3manga.com':
    case 'www.a3manga.com':
      configs = {
        link: '.table-striped a',
        init: getA3Manga,
      };
      break;
    case 'truyentranhtuan.com':
      configs = {
        link: '.chapter-name a',
        init: getTruyenTranhTuan,
      };
      break;
    case 'mangak.info':
      configs = {
        link: '.chapter-list a',
        init: getMangaK,
      };
      break;
    case 'truyentranhlh.com':
    case 'truyentranhlh.net':
      configs = {
        link: '.list-chapters a',
        contents: '#chapter-content',
        name: function (_this) {
          return $('.series-name').text().trim() + ' ' + $(_this).find('.chapter-name').text().trim();
        },
      };
      break;
    case 'hocvientruyentranh.com':
    case 'hocvientruyentranh.net':
      configs = {
        link: '.table-scroll a',
        name: '.__name',
        contents: '.manga-container',
      };
      break;
    case 'truyenhay24h.com':
      configs = {
        link: '.nano .chapname a',
        name: '.name_sp',
        init: getTruyenHay24h,
      };
      break;
    case 'thichtruyentranh.com':
      configs = {
        reverse: false,
        link: '#listChapterBlock .ul_listchap a',
        init: getThichTruyenTranh,
      };
      break;
    case 'truyen1.net':
    case 'truyentranh1.info':
      configs = {
        link: '#MainContent_CenterContent_detailStoryControl_listChapter a',
        init: getTruyen1,
      };
      break;
    case 'hentailxx.com':
    case 'www.hentailxx.com':
    case 'm.hentailxx.com':
      configs = {
        link: '#listChuong .col-5 a',
        name: 'h1.title-detail',
        contents: '#content_chap',
      };
      break;
    case 'hentaivn.net':
      configs = [
        {
          link: '.listing a',
          name: function (_this) {
            return $(_this).find('.chuong_t').attr('title');
          },
          contents: '#image',
        },
        {
          link: '.episodes a',
          name: '[itemprop="name"] b',
          contents: '#image',
        },
      ];
      break;
    case 'otakusan.net':
      configs = {
        link: '.read-chapter a',
        name: 'h1.header',
        init: getOtakuSan,
      };
      break;
    case 'ngonphongcomics.com':
      configs = {
        link: '.comic-intro .table-striped a',
        name: '.info-title',
        init: getNgonPhongComics,
      };
      break;
    case 'www.nettruyen.com':
    case 'nhattruyen.com':
      configs = {
        link: '#nt_listchapter .row a',
        name: '.title-detail',
        contents: '.reading-detail.box_doc',
      };
      break;
    case 'www.hamtruyentranh.net':
      configs = {
        link: '#examples a',
        name: function (_this) {
          var $clone = $(_this).clone();
          $clone.find('span').remove();
          return $('.title-manga').text().trim() + ' ' + $clone.text().trim();
        },
        contents: '.each-page',
      };
      break;
    case 'ttmanga.com':
      configs = {
        link: '#list-chapter a',
        init: getTtManga,
      };
      break;
    case 'truyen.vnsharing.site':
      configs = {
        link: '#manga-chaplist a',
        contents: '.read_content',
      };
      break;
    case 'blogtruyen.com':
    case 'blogtruyen.vn':
    case 'blogtruyen.top':
    case 'www.blogtruyen.com':
    case 'www.blogtruyen.vn':
    case 'www.blogtruyen.top':
      configs = {
        link: '#list-chapters .title a',
        contents: '#content',
      };
      break;
    case 'm.blogtruyen.com':
    case 'm.blogtruyen.vn':
    case 'm.blogtruyen.top':
      configs = {
        link: '#listChapter a',
        contents: '.content',
      };
      break;
    case 'truyensieuhay.com':
      configs = {
        link: '#chapter-list-flag a',
        name: 'h1',
        init: getTruyenSieuHay,
      };
      break;
    case 'truyenchon.com':
      configs = {
        link: '#nt_listchapter .chapter a',
        name: 'h1',
        contents: '.reading-detail',
      };
      break;
    case 'truyenqq.com':
      configs = {
        link: '.works-chapter-list a',
        name: 'h1',
        contents: '.story-see-content',
      };
      break;
    case 'sachvui.com':
      configs = {
        reverse: false,
        link: '#list-chapter a[href^="https://sachvui.com/doc-sach/"]',
        name: 'h1.ebook_title',
        contents: '.noi_dung_online',
      };
      break;
    case 'hentaicube.net':
      configs = {
        link: '.wp-manga-chapter a',
        name: '.post-title',
        contents: '.reading-content',
        imgSrc: 'data-src',
        init: getHentaiCube,
      };
      break;
    case 'tuthienbao.com':
    case 'www.tuthienbao.com':
      configs = {
        link: 'a[id^="thread_title_"]',
        contents: '.quotecontent',
      };
      break;
    case 'vietcomic.net':
      configs = {
        link: '.chapter-list a:not([rel="nofollow"])',
        name: function (_this, chapName) {
          return $('.manga-info-text h1').text().trim() + ' ' + chapName;
        },
        init: getVietComic,
      };
      break;
    case 'hamtruyentranh.com':
      configs = {
        reverse: false,
        link: '#chaps .chapter-title a:not([target])',
        name: 'h1',
        contents: '.table-responsive',
        imgSrc: 'id-source',
      };
      break;
    case 'hoihentai.com':
    case 'hoitruyentranh.com':
      configs = {
        reverse: false,
        link: '.chapterList a',
        name: 'h1.title',
        init: getHoiTruyenTranh,
      };
      break;
    case 'truyenvn.com':
      configs = {
        link: '#chapterList a',
        name: function (_this) {
          return $('h1.name').text().trim() + ' ' + $(_this).find('span:first').text().trim();
        },
        init: getTruyenVn,
      };
      break;
    default:
      configs = {};
      break;
  }

  if (Array.isArray(configs)) {
    var isMobile = /mobi|android|touch|mini/i.test(navigator.userAgent.toLowerCase());
    configs = configs[isMobile ? 1 : 0];
  }
  if (!configs) return;

  configs = $.extend(configsDefault, configs);
  configs.init();
});
