// ==UserScript==
// @name            manga comic downloader
// @namespace       https://baivong.github.io
// @description     Tải truyện tranh từ các trang chia sẻ ở Việt Nam. Nhấn Alt+Y để tải toàn bộ.
// @version         3.4.2
// @icon            https://i.imgur.com/ICearPQ.png
// @author          Zzbaivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           http://*.truyentranh8.com/*
// @match           https://*.truyentranh8.com/*
// @match           http://*.truyentranh8.net/*
// @match           https://*.truyentranh8.net/*
// @match           http://*.truyentranh8.org/*
// @match           https://*.truyentranh8.org/*
// @match           http://*.truyentranh86.com/*
// @match           https://*.truyentranh86.com/*
// @match           http://*.truyentranh869.com/*
// @match           https://*.truyentranh869.com/*
// @match           https://mangaxy.com/*
// @match           https://*.truyentranh.net/*
// @match           https://*.hamtruyen.com/*
// @match           https://*.hamtruyenmoi.com/*
// @match           https://*.a3manga.com/*
// @match           https://*.a3mnga.com/*
// @match           http://truyentranhtuan.com/*
// @match           https://truyentranhlh.net/*
// @match           https://truyenhay24h.com/*
// @match           https://thichtruyentranh.com/*
// @match           https://lxhentai.com/*
// @match           https://hentaivn.net/*
// @match           https://hentaivn.moe/*
// @match           https://otakusan.net/*
// @match           https://*.ngonphong.com/*
// @match           https://*.nettruyen.com/*
// @match           http://*.nettruyen.com/*
// @match           https://*.nettruyentop.com/*
// @match           http://*.nettruyentop.com/*
// @match           http://*.nettruyenonline.com/*
// @match           https://*.nettruyenonline.com/*
// @match           http://*.nettruyenapp.com/*
// @match           https://*.nettruyenapp.com/*
// @match           http://*.nettruyenpro.com/*
// @match           https://*.nettruyenpro.com/*
// @match           http://*.nettruyengo.com/*
// @match           https://*.nettruyengo.com/*
// @match           http://*.nettruyenmoi.com/*
// @match           http://nhattruyen.com/*
// @match           http://nhattruyengo.com/*
// @match           http://*.hamtruyentranh.net/*
// @match           https://ttmanga.com/*
// @match           http://truyen.vnsharing.site/*
// @match           http://*.blogtruyen.com/*
// @match           https://*.blogtruyen.com/*
// @match           https://*.blogtruyenmoi.com/*
// @match           http://*.blogtruyen.vn/*
// @match           https://*.blogtruyen.vn/*
// @match           http://*.blogtruyen.top/*
// @match           https://*.blogtruyen.top/*
// @match           https://truyensieuhay.com/*
// @match           http://truyenqq.com/*
// @match           http://truyenqq.net/*
// @match           http://truyenqqtop.com/*
// @match           http://truyenqqpro.com/*
// @match           https://hentaicube.net/*
// @match           https://hentaicb.top/*
// @match           http://*.tuthienbao.com/*
// @match           https://vietcomic.net/*
// @match           https://hamtruyentranh.com/*
// @match           https://khotruyentranhz.com/*
// @match           https://truyenvn.com/*
// @match           https://truyenvn.vip/*
// @match           https://truyenvnpro.com/*
// @match           https://*.saytruyen.net/*
// @match           https://*.saytruyen.com/*
// @match           https://*.sayhentai.net/*
// @match           https://cocomic.net/truyen-tranh/*
// @require         https://code.jquery.com/jquery-3.6.0.min.js
// @require         https://unpkg.com/@zip.js/zip.js@2.7.17/dist/zip.min.js
// @require         https://unpkg.com/file-saver@2.0.5/dist/FileSaver.min.js
// @require         https://cdn.jsdelivr.net/npm/web-streams-polyfill@2.0.2/dist/ponyfill.min.js
// @require         https://cdn.jsdelivr.net/npm/streamsaver@2.0.3/StreamSaver.min.js
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @require         https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js
// @require         https://cdn.jsdelivr.net/gh/Joe12387/detectIncognito@v1.3.0/dist/es5/detectIncognito.min.js
// @resource        success https://unpkg.com/facebook-sound-kit@2.0.0/Low_Volume_-20dB/Complete_and_Success/Success_2.m4a
// @resource        error https://unpkg.com/facebook-sound-kit@2.0.0/Low_Volume_-20dB/Errors_and_Cancel/Error_2.m4a
// @noframes
// @connect         *
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-start
// @grant           GM_addStyle
// @grant           GM_xmlhttpRequest
// @grant           GM.xmlHttpRequest
// @grant           GM.getResourceUrl
// @grant           GM_getResourceURL
// @grant           GM_registerMenuCommand
// ==/UserScript==

/* global zip, streamSaver, CryptoJS, detectIncognito */
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
   * Enable audio cues.
   * @type {Boolean}
   */
  var audioCues = true;

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
    'truyenqq.com',
    'truyenqqtop.com',
    'truyenqqpro.com',
    '.upanhmoi.net',
    'qqtaku.com',
    'qqtaku.net',
    'trangshop.net',
    '.beeng.net',
    '.beeng.org',
    'forumnt.com',
    'hoitruyentranh.com',
    'hoihentai.com',
    'i02.hentaivn.net',
    'truyentop1.com',
    'anhnhanh.org',
    'truyenvua.xyz',
    'hamtruyen.vn',
    '.xem-truyen.com',
  ];

  /**
   * HTTP referer
   * @param {Object} hostname
   */
  var referer = {
    'i8.xem-truyen.com': 'https://blogtruyenmoi.com',
    'i.blogtruyen.com': 'https://blogtruyen.com',
    'truyen.cloud': 'http://www.nettruyen.com',
    'proxy.truyen.cloud': 'http://www.nettruyen.com',
    'i.netsnippet.com': 'http://www.nettruyen.com/',
    'forumnt.com': 'http://www.nettruyen.com/',
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
    'mangaqq.net': 'http://truyenqqpro.com/',
    'mangaqq.com': 'http://truyenqqpro.com/',
    'truyenqq.net': 'http://truyenqqpro.com/',
    'truyenvua.xyz': 'http://truyenqqpro.com/',
    'i02.hentaivn.net': 'https://hentaivn.net/',
    'i1.hentaivn.net': 'https://hentaivn.net/',
    'i.imgur.com': 'https://imgur.com/',
  };

  /* === DO NOT CHANGE === */

  window.URL = window._URL;

  var successSound, errorSound;
  if (audioCues) {
    GM.getResourceUrl('success').then(function (url) {
      successSound = new Audio(url);
    });
    GM.getResourceUrl('error').then(function (url) {
      errorSound = new Audio(url);
    });
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

  var notyTimeout;
  function noty(txt, status) {
    function destroy() {
      var $noty = $doc.find('#mcd_noty_wrap');
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

    var $noty = $doc.find('#mcd_noty_wrap');
    if (!$noty.length) {
      var $wrap = $('<div>', {
          id: 'mcd_noty_wrap',
        }),
        $content = $('<div>', {
          id: 'mcd_noty_content',
          class: 'mcd_' + status,
          html: txt,
        }),
        $close = $('<div>', {
          id: 'mcd_noty_close',
          html: '&times;',
        });

      $noty = $wrap.append($content).append($close);
      $noty.appendTo('body');
    }

    $noty
      .find('#mcd_noty_content')
      .attr('class', 'mcd_' + status)
      .html(txt);

    $noty.fadeIn(300);
    clearTimeout(notyTimeout);

    $doc
      .on('click', '#mcd_noty_wrap', function () {
        destroy();
      })
      .on('mouseenter', '#mcd_noty_wrap', function () {
        clearTimeout(notyTimeout);
      })
      .on('mouseleave', '#mcd_noty_wrap', autoHide);

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

  function beforeleaving(e) {
    e.preventDefault();
    e.returnValue = '';
  }

  function cancelProgress() {
    linkError();
    inProgress = false;
    window.removeEventListener('beforeunload', beforeleaving);
    setTimeout(() => {
      if (dlAll.length || inProgress || !errorSound) return;
      errorSound.play();
    }, 0);
  }

  function notyError() {
    noty('Lỗi! Không tải được <strong>' + chapName + '</strong>', 'error');
    cancelProgress();
  }

  function notyImages() {
    noty('Lỗi! <strong>' + chapName + '</strong> không có dữ liệu', 'error');
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
    window.addEventListener('beforeunload', beforeleaving);
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

          var color = e.shiftKey ? 'violet' : 'purple';
          $(targetLink('[href="' + _link + '"]')).css({
            color: color,
            textDecoration: 'overline',
            textShadow: '0 0 1px ' + color + ', 0 0 1px ' + color + ', 0 0 1px ' + color,
          });
        }
      })
      .on('keyup', function (e) {
        if (e.key === 'Control' || e.key === 'Shift') {
          e.preventDefault();

          if (dlAll.length && inCustom) {
            if (e.key === 'Shift') inMerge = true;
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
    $(targetLink('[href$="' + dlAll[0] + '"]')).trigger('contextmenu');
  }

  function downloadAllOne() {
    inMerge = true;
    downloadAll();
  }

  async function saveFile(blob, zipName) {
    noty('Tải hoàn tất <strong>' + zipName + '</strong>', 'info');

    try {
      const { isPrivate } = await detectIncognito();
      if (isPrivate) throw 'isPrivate';

      const fileStream = streamSaver.createWriteStream(zipName, {
        size: blob.size,
      });
      const readableStream = blob.stream();

      if (window.WritableStream && readableStream.pipeTo) {
        return readableStream.pipeTo(fileStream);
      }
      window.writer = fileStream.getWriter();

      const reader = readableStream.getReader();
      const pump = () =>
        reader.read().then((res) => (res.done ? window.writer.close() : window.writer.write(res.value).then(pump)));
      pump();

      return;
    } catch (_err) {
      console.warn(_err);
      saveAs(blob, zipName);
    }
  }

  function genFileName() {
    return chapName
      .replace(/\s+/g, '_')
      .replace(/・/g, '·')
      .replace(/(^_+|_+$)/, '');
  }

  function endZip() {
    if (!inMerge) {
      zipFileStream = new TransformStream();
      zipFileBlobPromise = new Response(zipFileStream.readable).blob();
      zipWriter = new zip.ZipWriter(zipFileStream.writable, { zip64: true });
      downloadController = new AbortController();
      downloadSignal = downloadController.signal;
      zipData = [];
    }

    dlCurrent = 0;
    dlFinal = 0;
    dlTotal = 0;
    dlImages = [];

    hasDownloadError = false;
    inProgress = false;

    if (inAuto) {
      if (dlAll.length) {
        $(targetLink('[href$="' + dlAll[0] + '"]')).trigger('contextmenu');
      } else {
        inAuto = false;
        inCustom = false;
      }
    }

    setTimeout(() => {
      if (dlAll.length || inProgress || !successSound) return;
      successSound.play();
    }, 0);
  }

  async function genZip() {
    noty('Tạo file nén của <strong>' + chapName + '</strong>', 'warning');

    try {
      await Promise.all(zipData);
      await zipWriter.close();
      const zipFileBlob = await zipFileBlobPromise;

      saveFile(zipFileBlob, genFileName() + '.' + outputExt);
      linkSuccess();
      window.removeEventListener('beforeunload', beforeleaving);

      document.title = '[⇓] ' + tit;
      endZip();
    } catch (err) {
      console.error(err);
      if (downloadSignal.reason == err || (downloadSignal.reason && downloadSignal.reason.code == err.code)) {
        zip.terminateWorkers();
      }
      noty('Lỗi nén dữ liệu của <strong>' + chapName + '</strong>', 'error');
      cancelProgress();

      document.title = '[x] ' + tit;
      endZip();
    }
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
      urlObj,
      urlHost,
      headers = {};

    if (url.indexOf('//') === 0) url = location.protocol + url;
    urlObj = new URL(url);
    urlHost = urlObj.hostname;

    if (referer[urlHost]) {
      headers.referer = referer[urlHost];
      headers.origin = referer[urlHost];
    } else {
      headers.referer = location.origin;
      headers.origin = location.origin;
    }

    GM.xmlHttpRequest({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
      headers: headers,
      onload: function (response) {
        var imgExt = getImageType(response.response).ext;
        if (imgExt === 'gif') return next();

        if (
          !imgExt ||
          response.response.byteLength < 100 ||
          (response.statusText !== 'OK' && response.statusText !== '')
        ) {
          dlImgError(current, success, error, response, filename);
        } else {
          filename = filename + '.' + imgExt;
          success(response.response, filename);
        }
      },
      onerror: function (err) {
        dlImgError(current, success, error, err, filename);
      },
    });
  }

  function next() {
    noty('Đang tải xuống <strong>' + dlFinal++ + '/' + dlTotal + '</strong>', 'warning');
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
        function (buff, filename) {
          var fileData = zipWriter.add(path + filename, new Response(buff).body, {
            signal: downloadSignal,
            onend: next,
          });
          zipData.push(fileData);
        },
        function (err, filename) {
          zipData.push(
            zipWriter.add(path + filename + '_error.txt', new Blob([err.statusText + '\r\n' + err.finalUrl]).stream(), {
              signal: downloadSignal,
              onend: next,
            }),
          );
          noty(err.statusText, 'error');
          linkError();
        },
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
      images[i] =
        (!configs.imgSrc ? $img.data('src') || $img.data('original') : $img.attr(configs.imgSrc)) || $img.attr('src');
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
    if (!configs.imgSrc) {
      responseText = responseText.replace(/[\s\n]+src[\s\n]*=[\s\n]*/gi, ' data-src=');
    }
    responseText = responseText.replace(/^[^<]*/, '');

    if (configs.imgSrc) return $(responseText);
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

    $doc.on('contextmenu', configs.link, function (e) {
      e.preventDefault();
      hasDownloadError = false;
      if (!oneProgress()) return;

      rightClickEvent(e.currentTarget, callback);
    });

    notyReady();
  }

  function getA3Manga() {
    getSource(function ($data) {
      var chapterCode = $data.find('script:contains("htmlContent")');
      var chapterCrypto = $data.filter('script:contains("htmlContent")');
      if (!chapterCode.length || !chapterCrypto.length) {
        notyImages();
      } else {
        chapterCrypto = chapterCrypto.text().match(/(CryptoJSAesDecrypt\(.+?(?:(;}|htmlContent\);)))/g);

        var chapterDecrypt = new Function(
          chapterCode.text() + 'function ' + chapterCrypto[0] + 'return ' + chapterCrypto[1],
        );
        this.CryptoJS = CryptoJS;
        chapterDecrypt.apply(this);

        var chapterHTML = chapterDecrypt();
        var images = chapterHTML.match(/(?<=(data-(lqz53ud|3dn5rc9)="))(.+?)(?=")/g);
        if (!images) {
          notyImages();
          return;
        }

        images = images.map((imgLink) => {
          imgLink = imgLink.replace(/LqZ53ud|3Dn5rc9/g, '.');
          imgLink = imgLink.replace(/pPdp7FG|gNa8fuX/g, ':');
          imgLink = imgLink.replace(/9pyrBcb|hT3k3S6/g, '/');
          return imgLink;
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

        var type_server = 1;
        var slides_page;
        var slides_page_path = [];
        var use_server_gg = true;
        var slides_page_url_path = $data;

        if (slides_page_url_path.length > 0) {
          type_server = 2;
        } else {
          type_server = 1;
        }

        if (!use_server_gg) {
          type_server = 1;
        }
        if (type_server != 1) {
          slides_page = slides_page_url_path;
        } else {
          slides_page = slides_page_path;
          var i,
            j,
            length_chapter = slides_page.length - 1;
          for (i = 0; i < length_chapter; i++)
            for (j = i + 1; j < slides_page.length; j++)
              if (slides_page[j] < slides_page[i]) {
                var temp = slides_page[j];
                slides_page[j] = slides_page[i];
                slides_page[i] = temp;
              }
        }

        checkImages(slides_page);
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

  function getHentaiVN() {
    var chapterList = document.querySelector('#inner-listshowchapter');
    if (chapterList === null) return;

    noty('wait a moment...', 'warning');
    setTimeout(() => {
      chapterList.scrollIntoView();
    }, 0);

    var observer = new MutationObserver(function (mutations_list) {
      mutations_list.forEach(function (mutation) {
        if (mutation.type !== 'childList') return;
        if (!mutation.target.querySelector(configs.link)) return;

        getSource();
        observer.disconnect();
      });
    });

    observer.observe(chapterList, {
      attributes: false,
      childList: true,
      subtree: false,
    });
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
        withCredentials: true,
        headers: {
          host: 'otakusan.net',
        },
        onload: function () {
          GM.xmlHttpRequest({
            method: 'POST',
            url: '/Manga/UpdateView',
            responseType: 'json',
            withCredentials: true,
            headers: {
              host: 'otakusan.net',
              'content-length': 14,
              'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
            data: 'chapId=' + configs.href.match(/\/(\d+)\/.+$/)[1],
            onload: function (response) {
              var res = response.response;
              if (!res.chapid) {
                notyImages();
              } else {
                notySuccess(JSON.parse(res.view));
              }
            },
          });
        },
      });
    });

    notyReady();
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
    function decrypt(des, id) {
      id = id.substring(2, id.length - 3);
      var passphrase = CryptoJS.enc.Utf8.parse(id.toLowerCase());
      var iv = CryptoJS.enc.Utf8.parse('gqLOHUioQ0QjhuvI');
      var decrypted = CryptoJS.AES.decrypt(des, passphrase, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
      });
      var result = decrypted.toString(CryptoJS.enc.Utf8);
      return result;
    }

    getSource(function ($data) {
      if ($data.find('#wrap_alertvip').length) {
        notyImages();
        return;
      }

      var sID = $data.find('.content-chap-image').find('script:not([type]):first').text();
      sID = /\bgetContentchap\('(.+?)','(.+?)'\)/.exec(sID);
      if (!sID) {
        notyImages();
        return;
      }

      $.ajax({
        type: 'POST',
        url: '/Service.asmx/getContentChap',
        data: '{ sID: "' + sID[1] + '",chuc:"' + sID[2] + '" }',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: function (data) {
          if (data.Message) {
            notyImages();
            return;
          }

          data = JSON.parse(data.d);
          var $contents = decrypt(data.des, data.id);
          $contents = $($contents).filter('img');
          getImages($contents);
        },
        error: function () {
          notyImages();
        },
      });
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
    domainName = location.host,
    tit = document.title,
    $doc = $(document),
    // zipMime = outputExt === 'cbz' ? 'application/vnd.comicbook+zip' : 'application/zip',
    zipFileStream = new TransformStream(),
    zipFileBlobPromise = new Response(zipFileStream.readable).blob(),
    zipWriter = new zip.ZipWriter(zipFileStream.writable, { zip64: true }),
    downloadController = new AbortController(),
    downloadSignal = downloadController.signal,
    zipData = [],
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

  streamSaver.mitm = 'https://lelinhtinh.github.io/stream/mitm.html';

  GM_registerMenuCommand('Download All Chapters', downloadAll);
  GM_registerMenuCommand('Download All To One File', downloadAllOne);

  $doc.on('keydown', function (e) {
    if (e.code === 'KeyY' && e.altKey) {
      // Alt+Y
      e.preventDefault();
      e.shiftKey ? downloadAllOne() : downloadAll();
    }
  });

  GM_addStyle(
    '#mcd_noty_wrap{background:#fff;position:fixed;z-index:2147483647;right:20px;top:20px;min-width:150px;max-width:100%;padding:15px 25px;border:1px solid #ddd;border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.1),0 1px 10px rgba(0,0,0,.35);cursor:pointer}#mcd_noty_content{color:#444}#mcd_noty_content strong{font-weight:700}#mcd_noty_content.mcd_info strong{color:#2196f3}#mcd_noty_content.mcd_success strong{color:#4caf50}#mcd_noty_content.mcd_warning strong{color:#ffc107}#mcd_noty_content.mcd_error strong{color:#f44336}#mcd_noty_content strong.centered{display:block;text-align:center}#mcd_noty_close{position:absolute;right:0;top:0;font-size:18px;color:#ddd;height:20px;width:20px;line-height:20px;text-align:center}#mcd_noty_wrap:hover #mcd_noty_close{color:#333}',
  );

  switch (domainName) {
    case 'truyentranh8.com':
    case 'truyentranh8.net':
    case 'truyentranh8.org':
    case 'truyentranh869.com':
    case 'truyentranh86.com':
      configs = {
        link: '#ChapList a',
        name: function (_this) {
          return $('.breadcrumb li:last').text().trim() + ' ' + $(_this).find('span, strong, h2').text().trim();
        },
        contents: '#reading-detail',
      };
      break;
    case 'mangaxy.com':
      configs = {
        link: '#ChapList a',
        name: function (_this) {
          var title = $('h1.comics-title').text();
          var chapTitle = $(_this).find('div.episode-title').text();
          return `${title} ${chapTitle}`;
        },
        contents: '#reading-detail',
      };
      break;
    case 'truyentranh.net':
    case 'www.truyentranh.net':
      configs = {
        reverse: false,
        link: '.chapter-list-item-box a',
        name: function (_this) {
          return $('h1').text().trim() + ' ' + $(_this).text().trim();
        },
        contents: '.manga-reading-box',
      };
      break;
    case 'hamtruyen.com':
    case 'www.hamtruyen.com':
    case 'hamtruyenmoi.com':
      configs = {
        link: '.list-chaps a',
        name: 'h3.story-name',
        contents: '.list-images',
      };
      break;
    case 'm.hamtruyen.com':
      configs = {
        link: '.list-chap a',
        name: '.tentruyen',
        contents: '#content_chap',
      };
      break;
    case 'a3manga.com':
    case 'www.a3manga.com':
    case 'a3mnga.com':
    case 'www.a3mnga.com':
    case 'www.ngonphong.com':
      configs = {
        link: '.chapter-table a.text-capitalize',
        init: getA3Manga,
      };
      break;
    case 'truyentranhtuan.com':
      configs = {
        link: '.chapter-name a',
        init: getTruyenTranhTuan,
      };
      break;
    case 'truyentranhlh.net':
      configs = {
        link: '.list-chapters a',
        contents: '#chapter-content',
        name: function (_this) {
          return $('.series-name').text().trim() + ' ' + $(_this).find('.chapter-name').text().trim();
        },
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
    case 'lxhentai.com':
      configs = {
        link: '[style="max-height: 500px"] a',
        contents: '[class="text-center"]',
        name: function (_this) {
          return (
            $('.grow.text-lg.ml-1.text-ellipsis.font-semibold:first').text().trim() +
            ' ' +
            $(_this).find('span.text-ellipsis').text().trim()
          );
        },
      };
      break;
    case 'hentaivn.net':
    case 'hentaivn.moe':
      configs = [
        {
          link: '.listing a',
          name: function (_this) {
            var title = $('h1[itemprop="name"]').find('a').text();
            title = title.split('-')[0].trim();
            var chapTitle = $(_this).find('.chuong_t').attr('title');
            chapTitle = chapTitle.split('-')[1].trim();
            return `${title} ${chapTitle}`;
          },
          contents: '#image',
          init: getHentaiVN,
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
    case 'www.nettruyen.com':
    case 'nhattruyen.com':
    case 'nhattruyengo.com':
    case 'www.nettruyenapp.com':
    case 'www.nettruyenpro.com':
    case 'www.nettruyengo.com':
    case 'www.nettruyenmoi.com':
      configs = {
        link: '#nt_listchapter .chapter a',
        name: '.title-detail',
        contents: '.reading-detail.box_doc',
        imgSrc: 'data-original',
      };
      break;
    case 'www.nettruyentop.com':
    case 'www.nettruyenonline.com':
      configs = {
        link: '#nt_listchapter .chapter a',
        name: '.title-detail',
        contents: '.readimg,.reading-detail.box_doc',
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
    case 'blogtruyenmoi.com':
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
    case 'm.blogtruyenmoi.com':
      configs = {
        link: '.list-chapter a',
        name: function (_this) {
          return $('h1.title').text().trim() + ' ' + $(_this).find('span').text().trim();
        },
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
    case 'truyenqq.com':
    case 'truyenqq.net':
    case 'truyenqqtop.com':
    case 'truyenqqpro.com':
      configs = {
        link: '.works-chapter-list a',
        name: 'h1',
        contents: '.chapter_content',
      };
      break;
    case 'hentaicube.net':
    case 'hentaicb.top':
      configs = {
        link: '.wp-manga-chapter a',
        name: '.post-title',
        contents: '.reading-content',
        imgSrc: 'data-src',
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
    case 'khotruyentranhz.com':
      configs = {
        link: '#chapters-list-content .chapter-list a',
        name: 'h1',
        contents: '.box-chapter-content',
      };
      break;
    case 'truyenvn.com':
    case 'truyenvn.vip':
    case 'truyenvnpro.com':
      configs = {
        link: '#chapterList a',
        name: function (_this) {
          return $('h1.name').text().trim() + ' ' + $(_this).find('span:first').text().trim();
        },
        contents: '.content-text',
      };
      break;
    case 'saytruyen.net':
    case 'www.saytruyen.net':
    case 'saytruyen.com':
    case 'www.saytruyen.com':
    case 'sayhentai.net':
    case 'www.sayhentai.net':
    case 'sayhentai.tv':
      configs = {
        link: '.main-col .wp-manga-chapter a',
        name: '.post-title h1',
        contents: '#chapter_content',
      };
      break;
    case 'cocomic.net':
      configs = {
        link: '.chapter-list .citem a',
        name: 'h1',
        contents: '.chapter-content',
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
