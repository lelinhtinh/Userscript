// ==UserScript==
// @name            MCD
// @namespace       https://lelinhtinh.github.io
// @description     Manga Comic Downloader. Shortcut: Alt+Y.
// @version         1.5.1
// @icon            https://i.imgur.com/GAM6cCg.png
// @author          Zzbaivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           https://www.kuaikanmanhua.com/*
// @match           https://newtoki*.*/webtoon/*
// @match           https://manhwa18.net/*
// @match           https://manytoon.com/comic/*
// @match           https://18comic.org/album/*
// @require         https://code.jquery.com/jquery-3.5.1.min.js
// @require         https://unpkg.com/jszip@3.1.5/dist/jszip.min.js
// @require         https://unpkg.com/file-saver@2.0.2/dist/FileSaver.min.js
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
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
  var outputExt = 'zip'; // or 'zip'

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
  var ignoreList = [];

  /**
   * Keep the original url
   * @type {Array} key
   */
  var keepOriginal = ['kkmh.com'];

  /**
   * HTTP referer
   * @param {Object} hostname
   */
  var referer = {};

  /* === DO NOT CHANGE === */

  window.URL = window._URL;

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
        },
      );
    if (status !== 'warning' && status !== 'success') autoHide();
  }

  function targetLink(selector) {
    return configs.link
      .split(/\s*,\s*/)
      .map((i) => i + selector)
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
    window.removeEventListener('beforeunload', beforeleaving);
  }

  function notyError() {
    noty('ERR! Cannot download <strong>' + chapName + '</strong>', 'error');
    inProgress = false;
    cancelProgress();
  }

  function notyImages() {
    noty('ERR! <strong>' + chapName + '</strong> empty data', 'error');
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

    noty('Start downloading <strong>' + chapName + '</strong>', 'warning');
    window.addEventListener('beforeunload', beforeleaving);
  }

  function notyWait() {
    document.title = '[…] ' + tit;

    noty('<strong>' + chapName + '</strong> is getting ready...', 'warning');

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
    noty('Script is <strong>now ready</strong> to use', 'info');

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
    noty('Create archive of <strong>' + chapName + '</strong>', 'warning');

    dlZip
      .generateAsync(
        {
          type: 'blob',
          compression: 'STORE',
        },
        function updateCallback(metadata) {
          noty('Zipping <strong>' + metadata.percent.toFixed(2) + '%</strong>', 'warning');
        },
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
              '"><strong>Click here</strong></a> if not automatically download',
            'success',
          );
          linkSuccess();

          window.removeEventListener('beforeunload', beforeleaving);
          saveAs(blob, zipName);

          document.title = '[⇓] ' + tit;
          endZip();
        },
        function () {
          noty('ERR! Cannot zip file <strong>' + chapName + '</strong>', 'error');
          cancelProgress();

          document.title = '[x] ' + tit;
          endZip();
        },
      );
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
    noty('Downloading <strong>' + dlFinal + '/' + dlTotal + '</strong>', 'warning');
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
        },
      );
    }
  }

  function imageIgnore(url) {
    return ignoreList.some(function (v) {
      return url.indexOf(v) !== -1;
    });
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
        ? $img.data('src') || $img.data('original')
        : $img.attr(configs.imgSrc) || $img.attr('src');
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
      noty('Only <strong>one chapter</strong> can be downloaded at a time', 'error');
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

  /* global __NUXT__ */
  function getKuaikanManhua() {
    getSource(function ($data) {
      $data = $data.filter('script:not([src]):contains("window.__NUXT__")');
      if (!$data.length) {
        notyImages();
        return;
      }

      eval($data.text());

      if (!__NUXT__) {
        notyImages();
        return;
      }

      var images = __NUXT__.data[0].comicInfo.comicImages;
      images = images.map(function (v) {
        return v.url;
      });

      if (!images.length) {
        notyImages();
        return;
      }

      checkImages(images);
    });
  }

  /* global html_data */
  function getNewToki69() {
    function html_encoder(s) {
      var i = 0,
        out = '',
        l = s.length;
      for (; i < l; i += 3) {
        out += String.fromCharCode(parseInt(s.substr(i, 2), 16));
      }
      return out;
    }

    getSource(function ($data) {
      var $images = $data.find('img[data-original^="https://"]:not([style])');
      if (!$images.length) {
        $images = $data.find('script:not([src]):contains("html_data")');
        if (!$images.length) {
          notyImages();
          return;
        }

        $images = $images.text();
        $images = /(var\s+html_data[\s\S]+?)(?=(document\.write|[\s\n]+$))/.exec($images);
        if (!$images) {
          notyImages();
          return;
        }

        eval($images[1]);
        $images = html_encoder(html_data);
        $images = $($images).find('img[data-original^="https://"]:not([style])');
      }

      var images = [];
      $images.each(function (i, v) {
        var $img = $(v);
        images[i] = $img.data('original');
      });

      checkImages(images);
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
    '#baivong_noty_wrap{display:none;background:#fff;position:fixed;z-index:2147483647;right:20px;top:20px;min-width:150px;max-width:100%;padding:15px 25px;border:1px solid #ddd;border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.1),0 1px 10px rgba(0,0,0,.35);cursor:pointer}#baivong_noty_content{color:#444}#baivong_noty_content strong{font-weight:700}#baivong_noty_content.baivong_info strong{color:#2196f3}#baivong_noty_content.baivong_success strong{color:#4caf50}#baivong_noty_content.baivong_warning strong{color:#ffc107}#baivong_noty_content.baivong_error strong{color:#f44336}#baivong_noty_content strong.centered{display:block;text-align:center}#baivong_noty_close{position:absolute;right:0;top:0;font-size:18px;color:#ddd;height:20px;width:20px;line-height:20px;text-align:center}#baivong_noty_wrap:hover #baivong_noty_close{color:#333}',
  );

  if (/(www\.)?kuaikanmanhua\.com/.test(domainName)) {
    configs = {
      link: '.title.fl a[href^="/web/comic/"]',
      name: 'h3.title',
      init: getKuaikanManhua,
    };
  } else if (/newtoki\d*\.(com|net)/.test(domainName)) {
    configs = {
      link: '.item-subject',
      name: function (_this) {
        return (
          $('[itemprop="description"] .view-content:first span').text().trim() +
          ' ' +
          $(_this)
            .contents()
            .filter(function (i, el) {
              return el.nodeType === 3;
            })
            .text()
            .trim()
        );
      },
      init: getNewToki69,
    };
  } else if (domainName === 'manhwa18.net') {
    configs = {
      link: '#tab-chapper .chapter',
      name: '[itemprop="name"]:last',
      contents: '.chapter-content',
      imgSrc: 'data-original',
      filter: true,
    };
  } else if (domainName === 'manytoon.com') {
    configs = {
      link: '.wp-manga-chapter a',
      name: function (_this) {
        return (
          $('.post-title h3')
            .contents()
            .filter(function (i, el) {
              return el.nodeType === 3;
            })
            .text()
            .trim() +
          ' ' +
          $(_this).text().trim()
        );
      },
      contents: '.reading-content',
    };
  } else if (domainName === '18comic.org') {
    configs = {
      link: '.episode:visible a, .dropdown-toggle.reading:visible',
      name: function (_this) {
        var $this = $(_this),
          mangaName = $('.panel-heading [itemprop="name"]:visible').text().trim();
        if ($this.hasClass('reading')) return mangaName;
        return (
          mangaName +
          ' ' +
          $this
            .find('li')
            .contents()
            .filter(function (i, el) {
              return el.nodeType === 3;
            })
            .text()
            .trim()
        );
      },
      contents: '.panel-body',
      imgSrc: 'data-original',
    };
  }

  if (Array.isArray(configs)) {
    var isMobile = /mobi|android|touch|mini/i.test(navigator.userAgent.toLowerCase());
    configs = configs[isMobile ? 1 : 0];
  }
  if (!configs) return;

  configs = $.extend(configsDefault, configs);
  configs.init();
});
