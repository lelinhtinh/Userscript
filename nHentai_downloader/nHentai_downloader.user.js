// ==UserScript==
// @name               nHentai Downloader
// @name:vi            nHentai Downloader
// @name:zh-CN         nHentai 下载器
// @name:zh-TW         nHentai 下载器
// @namespace          http://devs.forumvi.com
// @description        Download manga on nHentai.
// @description:vi     Tải truyện tranh tại NhệnTái.
// @description:zh-CN  在nHentai上下载漫画。
// @description:zh-TW  在nHentai上下载漫画。
// @version            4.0.0
// @icon               http://i.imgur.com/FAsQ4vZ.png
// @author             Zzbaivong
// @oujs:author        baivong
// @license            MIT; https://baivong.mit-license.org/license.txt
// @match              http://nhentai.net/g/*
// @match              https://nhentai.net/g/*
// @require            https://code.jquery.com/jquery-3.6.0.min.js
// @require            https://cdn.jsdelivr.net/npm/web-streams-polyfill@3.2.1/dist/ponyfill.min.js
// @require            https://cdn.jsdelivr.net/npm/streamsaver@2.0.6/StreamSaver.min.js
// @require            https://cdn.jsdelivr.net/npm/streamsaver@2.0.6/examples/zip-stream.js
// @require            https://greasyfork.org/scripts/28536-gm-config/code/GM_config.js?version=184529
// @require            https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @connect            self
// @connect            proxy.duckduckgo.com
// @supportURL         https://github.com/lelinhtinh/Userscript/issues
// @run-at             document-idle
// @grant              GM.xmlHttpRequest
// @grant              GM_xmlhttpRequest
// @grant              unsafeWindow
// @grant              GM_getValue
// @grant              GM_setValue
// @grant              GM.getValue
// @grant              GM.setValue
// ==/UserScript==

/* global streamSaver, ZIP */
(($, window) => {
  'use strict';

  function patchHistoryApi() {
    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      window.dispatchEvent(new Event('locationchange'));
    };
    const originalReplaceState = history.replaceState;
    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event('locationchange'));
    };
    window.addEventListener('popstate', () => {
      window.dispatchEvent(new Event('locationchange'));
    });
  }
  patchHistoryApi();

  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);

    if (args[0] && typeof args[0] === 'string' && args[0].includes('/api/v2/galleries/')) {
      response
        .clone()
        .json()
        .then((data) => {
          let payload = null;
          if (data) {
            if (data.body) {
              try {
                payload = JSON.parse(data.body);
              } catch (e) {
                console.warn('Unable to parse gallery body JSON from fetch', e);
              }
            } else {
              payload = data;
            }
          }

          if (payload && applyGalleryData(payload)) {
            interceptedGalleryPayload = payload;
            console.log('Gallery data intercepted from fetch', payload);
          }
        })
        .catch((e) => {
          console.log('Gallery fetch clone response not JSON or error', e);
        });
    }

    return response;
  };

  window.addEventListener('locationchange', () => {
    console.log('locationchange', window.location.href);
    setTimeout(injection, 500);
  });

  function injection() {
    console.log('Injecting script', window.writableStream, window.writer, window.abortController);

    // Prefer AbortController for canceling active streaming download
    if (window.abortController && !window.abortController.signal.aborted) {
      window.abortController.abort();
      console.log('AbortController aborted active stream');
    }

    // Mark aborted to stop further enqueue
    isAborted = true;
    streamEnded = true;

    // Keep releaseLock for existing writer, if available
    window.writer?.releaseLock?.();

    // Reset to initial state when aborted
    resetDownload();
  }

  const configFrame = document.createElement('div');
  $('body').append(configFrame);

  GM_config.init({
    id: 'nHentaiDlConfig',
    title: 'Downloader Settings',
    fields: {
      outputExt: {
        options: ['cbz', 'zip'],
        label: 'Export as',
        type: 'radio',
        default: 'cbz',
      },
      outputName: {
        label: 'Filename',
        type: 'select',
        options: ['pretty', 'english', 'japanese'],
        default: 'pretty',
      },
      threading: {
        label: 'Max Threads',
        type: 'unsigned int',
        min: 1,
        max: 16,
        default: 4,
      },
      useProxy: {
        label: 'Use proxy',
        type: 'checkbox',
        default: false,
      },
    },
    frame: configFrame,
    events: {
      save: () => {
        outputExt = GM_config.get('outputExt');
        outputName = GM_config.get('outputName');
        threading = GM_config.get('threading');
        useProxy = GM_config.get('useProxy');

        $download.find('span').text(` as ${outputExt.toUpperCase()}`);

        const $saveBtn = $('#nHentaiDlConfig_saveBtn');
        $saveBtn.prop('disabled', true).addClass('saved').text('Saved!');

        setTimeout(() => {
          $saveBtn.prop('disabled', false).removeClass('saved').text('Save');
          $configPanel.hide();
        }, 1500);
      },
    },
    css: '#nHentaiDlConfig{width:100%!important;max-width:320px!important;position:fixed!important;top:50%!important;left:50%!important;transform:translate(-50%,-50%)!important;z-index:9999!important;max-height:75%!important;overflow:auto!important;background:#4d4d4d!important;border:1px solid #313131!important;border-radius:5px;text-align:left;height:auto!important;padding:10px!important;color:#d9d9d9}#nHentaiDlConfig *{font-family:"Noto Sans",sans-serif}#nHentaiDlConfig .config_header{text-align:left;font-size:17px;font-weight:700;margin-bottom:20px;color:#999}#nHentaiDlConfig .reset_holder{float:left;height:30px;line-height:30px}#nHentaiDlConfig .reset{color:#4d4d4d;text-align:left}#nHentaiDlConfig .saveclose_buttons{margin:0;padding:4px;min-width:100px;height:30px;line-height:14px;border-radius:2px;border:1px solid;cursor:pointer}#nHentaiDlConfig .saveclose_buttons.saved{background:#ffeb3b;border:1px solid #ffc107}#nHentaiDlConfig #nHentaiDlConfig_closeBtn{display:none}#nHentaiDlConfig_buttons_holder{margin-top:20px;border-top:1px dashed #4d4d4d;padding-top:11px}#nHentaiDlConfig .config_var::after{clear:both;content:"";display:block}#nHentaiDlConfig .config_var{line-height:2em;position:relative}#nHentaiDlConfig .field_label{font-size:14px;height:26px;line-height:26px;margin:0;padding:0 10px 0 0;width:40%;display:block;float:left}#nHentaiDlConfig .config_var>[type=text],#nHentaiDlConfig .config_var>div,#nHentaiDlConfig .config_var>select,#nHentaiDlConfig .config_var>textarea{width:60%;border-radius:0;display:block;height:26px;line-height:26px;padding:0 10px;float:left}#nHentaiDlConfig .config_var>textarea{height:auto;line-height:14px;padding:10px;min-height:5em}#nHentaiDlConfig .config_var>select{background:#4d4d4d;color:#d9d9d9;padding:0}#nHentaiDlConfig .config_var>select:hover{background:#666}#nHentaiDlConfig .config_var>select:focus{outline:0 none}#nHentaiDlConfig .config_var>div>label{display:inline-block;vertical-align:top;margin-right:5px}#nHentaiDlConfig .config_var>#nHentaiDlConfig_field_outputName{text-transform:capitalize;border:1px solid;border-radius:4px;width:auto}#nHentaiDlConfig .config_var>#nHentaiDlConfig_field_threading{width:70px;border:1px solid;border-radius:4px}#nHentaiDlConfig .config_var>div{padding:0}#nHentaiDlConfig_field_outputExt{text-transform:uppercase}#nHentaiDlConfig_field_outputExt [value=cbz]{margin-right:20px!important}#nHentaiDlConfig .top{background:#666!important}',
  });

  /**
   * Output extension
   * @type {'cbz'|'zip'}
   *
   * Tips: Convert .zip to .cbz
   * Windows
   * $ ren *.zip *.cbz
   * Linux
   * $ rename 's/\.zip$/\.cbz/' *.zip
   */
  let outputExt = GM_config.get('outputExt') || 'cbz';

  /**
   * File name
   * @type {'pretty'|'english'|'japanese'}
   */
  let outputName = GM_config.get('outputName') || 'pretty';

  /**
   * Multithreading
   * @type {Number} [1 -> 16]
   */
  let threading = GM_config.get('threading') || 4;

  /**
   * Use proxy from DuckDuckGo
   * @type {Boolean}
   */
  let useProxy = GM_config.get('useProxy') || false;

  /**
   * Logging
   * @type {Boolean}
   */
  let debug = false;

  /**
   * Abort controller for stream cancellation
   * @type {AbortController|null}
   */
  let abortController = null;

  /**
   * Cancel button jQuery object
   */
  let $cancel = null;

  /**
   * Whether the download process is currently aborted
   * @type {boolean}
   */
  let isAborted = false;

  /**
   * Whether the readable stream has been ended or canceled
   * @type {boolean}
   */
  let streamEnded = false;

  /**
   * Active GM.xmlHttpRequest objects for aborting in-flight downloads
   * @type {Set<unknown>}
   */
  let activeRequests = new Set();

  // Gallery / download state (can be refreshed with scriptData or intercepted API response)
  let gallery = null;
  let interceptedGalleryPayload = null;
  let current = 0;
  let final = 0;
  let total = 0;
  let images = [];
  let hasErr = false;
  let comicId = null;
  let comicName = '';
  let zipName = '';

  let $_download = null;
  let $download = null;
  let $config = null;
  let $configPanel = null;
  let doc = document;
  let inProgress = false;

  function applyGalleryData(payload) {
    if (!payload || !payload.num_pages || !payload.pages || !Array.isArray(payload.pages)) {
      return false;
    }

    gallery = payload;
    current = 0;
    final = 0;
    total = gallery.num_pages;
    images = gallery.pages || [];
    hasErr = false;
    comicId = gallery.id;
    comicName = gallery.title[outputName] || gallery.title['english'] || '';
    zipName = `${comicName
      .replace(/[\s|+=]+/g, '-')
      .replace(/[:;`'"”“/\\?.,<>[\]{}!@#$%^&*]/g, '')
      .replace(/・/g, '·')}.${comicId}.${outputExt}`;

    if ($download) {
      $download.html('<i class="fa fa-download"></i> Download<span> as ' + outputExt.toUpperCase() + '</span>').css('backgroundColor', 'cornflowerblue');
    }
    if ($cancel) {
      $cancel.hide();
    }

    return true;
  }

  function refreshGalleryData() {
    if (interceptedGalleryPayload && applyGalleryData(interceptedGalleryPayload)) {
      return true;
    }

    const $scriptData = $('[data-url^="/api/v2/galleries/"]');
    if (!$scriptData || !$scriptData.length) {
      console.warn('gallery scriptData not found');
      if ($download) $download.remove();
      if ($cancel) $cancel.remove();
      return false;
    }

    let data;
    try {
      data = JSON.parse($scriptData.text().trim());
    } catch (e) {
      console.warn('invalid JSON in scriptData', e);
      if ($download) $download.remove();
      if ($cancel) $cancel.remove();
      return false;
    }

    if (!data) {
      console.warn('gallery data is empty');
      if ($download) $download.remove();
      if ($cancel) $cancel.remove();
      return false;
    }

    let payload;
    try {
      payload = data.body ? JSON.parse(data.body) : data;
    } catch (e) {
      console.warn('invalid gallery body JSON', e);
      if ($download) $download.remove();
      if ($cancel) $cancel.remove();
      return false;
    }

    if (!payload) {
      console.warn('gallery payload is empty');
      if ($download) $download.remove();
      if ($cancel) $cancel.remove();
      return false;
    }

    return applyGalleryData(payload);
  }

  function resetDownload() {
    console.log('Resetting download state');

    streamEnded = true;

    try {
      for (const req of activeRequests) {
        req?.abort?.();
      }
      activeRequests.clear();

      if (window.writer) {
        window.writer.releaseLock?.();
        window.writer = null;
      }
      if (window.reader) {
        window.reader.cancel?.();
        window.reader = null;
      }
      if (window.writableStream) {
        window.writableStream = null;
      }
      if (window.readableStream) {
        window.readableStream = null;
      }
    } catch (e) {
      console.warn('Error while resetting streams:', e);
    }

    if (abortController && !abortController.signal.aborted) {
      abortController.abort();
    }

    abortController = null;
    window.abortController = null;
    isAborted = false;
    inProgress = false;

    if (!refreshGalleryData()) {
      doc.title = '[✖] Ready';
      return;
    }

    doc.title = '[✖] Ready';
    if ($download) {
      $download.html('<i class="fa fa-download"></i> Download<span> as ' + outputExt.toUpperCase() + '</span>').css('backgroundColor', 'cornflowerblue');
    }
    if ($cancel) {
      $cancel.hide();
    }
  }

  function base64toBlob(base64Data, contentType) {
    contentType = contentType || '';
    const sliceSize = 1024;
    const byteCharacters = atob(base64Data);
    const bytesLength = byteCharacters.length;
    const slicesCount = Math.ceil(bytesLength / sliceSize);
    const byteArrays = new Array(slicesCount);

    for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
      const begin = sliceIndex * sliceSize;
      const end = Math.min(begin + sliceSize, bytesLength);

      const bytes = new Array(end - begin);
      for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
        bytes[i] = byteCharacters[offset].charCodeAt(0);
      }
      byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    return new Blob(byteArrays, { type: contentType });
  }

  function getInfo() {
    let info = '',
      tags = [],
      artists = [],
      groups = [],
      parodies = [],
      characters = [],
      categories = [],
      languages = [];

    if (gallery.title?.english) info += gallery.title.english + '\r\n';
    if (gallery.title?.japanese) info += gallery.title.japanese + '\r\n';
    if (gallery.title?.pretty) info += gallery.title.pretty + '\r\n';
    info += '#' + gallery.id + '\r\n';

    if (gallery.tags) {
      for (const tag of gallery.tags) {
        if (tag.type === 'tag') tags.push(tag.name);
        if (tag.type === 'artist') artists.push(tag.name);
        if (tag.type === 'category') categories.push(tag.name);
        if (tag.type === 'group') groups.push(tag.name);
        if (tag.type === 'parody') parodies.push(tag.name);
        if (tag.type === 'character') characters.push(tag.name);
        if (tag.type === 'language') languages.push(tag.name);
      }
    }
    if (tags.length) info += '\r\n' + 'Tags: ' + tags.join(', ');
    if (categories.length) info += '\r\n' + 'Categories: ' + categories.join(', ');
    if (groups.length) info += '\r\n' + 'Groups: ' + groups.join(', ');
    if (parodies.length) info += '\r\n' + 'Parodies: ' + parodies.join(', ');
    if (characters.length) info += '\r\n' + 'Characters: ' + characters.join(', ');
    if (languages.length) info += '\r\n' + 'Languages: ' + languages.join(', ');

    info += '\r\n\r\n' + 'Pages: ' + total;
    info += '\r\n' + 'Uploaded at: ' + new Date(gallery.upload_date * 1000).toLocaleString() + '\r\n';

    console.log(info);
    return info;
  }

  function beforeleaving(e) {
    e.preventDefault();
    e.returnValue = '';
  }

  function end() {
    window.removeEventListener('beforeunload', beforeleaving);
    if (debug) _timeEnd('nHentai');
  }

  function done(filename) {
    doc.title = `[⇓] ${filename}`;
    console.log('COMPLETE');
    end();
  }

  function genZip(ctrl) {
    streamEnded = true;
    try {
      ctrl.close();
    } catch (e) {
      console.warn('genZip close error', e);
    }
    $download.html('<i class="fa fa-check"></i> Complete').css('backgroundColor', hasErr ? 'red' : 'green');
  }

  function safeEnqueue(ctrl, item) {
    if (isAborted || streamEnded || (abortController && abortController.signal.aborted)) {
      console.log('safeEnqueue skipped', item && item.name);
      return;
    }
    try {
      ctrl.enqueue(item);
    } catch (cErr) {
      // Avoid throwing on closed stream; treat as terminated
      streamEnded = true;
      console.warn('safeEnqueue error (ignored):', cErr);
    }
  }

  function dlImgError(current, success, error, err, filename) {
    if (images[current].attempt < 1) {
      final++;
      error(err, filename);
      return;
    }

    setTimeout(() => {
      console.log(filename, `retry ${images[current].attempt}`);
      dlImg(current, success, error);
      images[current].attempt--;
    }, 2000);
  }

  function dlImg(current, success, error) {
    let url = images[current].url,
      filename = url.replace(/.*\//g, '');

    if (isAborted || streamEnded) {
      return;
    }

    if (useProxy) url = `https://proxy.duckduckgo.com/iu/?u=${url}&f=1`;

    filename = `000${filename}`.slice(-8);
    console.log(filename, 'progress');

    const xhr = GM.xmlHttpRequest({
      method: 'GET',
      url: url,
      responseType: 'blob',
      onload: (response) => {
        activeRequests.delete(xhr);
        if (isAborted || streamEnded) {
          console.log('dlImg onload ignored due abort or stream ended', filename);
          return;
        }

        if (
          response.response.type === 'text/html' ||
          response.response.byteLength < 1000 ||
          (response.statusText !== 'OK' && response.statusText !== '')
        ) {
          dlImgError(current, success, error, response, filename);
          return;
        }

        final++;
        success(response, filename);
      },
      onerror: (err) => {
        activeRequests.delete(xhr);
        if (isAborted || streamEnded) {
          console.log('dlImg onerror ignored due abort or stream ended', filename);
          return;
        }
        dlImgError(current, success, error, err, filename);
      },
    });
  }

  function next(ctrl) {
    if (isAborted) {
      console.log('next() aborted, no further processing');
      return;
    }

    doc.title = `[${final}/${total}] ${comicName}`;
    $download.find('strong').text(`${final}/${total}`);
    console.log(final, current);

    if (final < current) return;
    final < total ? addZip(ctrl) : genZip(ctrl);
  }

  function addZip(ctrl) {
    if (isAborted) {
      console.log('addZip() aborted, skipping enqueue.');
      return;
    }

    let max = current + threading;
    if (max > total) max = total;

    for (current; current < max; current++) {
      console.log(images[current].url, 'download');
      dlImg(
        current,
        (response, filename) => {
          if (isAborted || streamEnded) {
            console.log('dlImg success ignored because aborted or ended', filename);
            return;
          }

          safeEnqueue(ctrl, { name: filename, stream: () => response.response.stream() });

          console.log(filename, 'success');
          next(ctrl);
        },
        (err, filename) => {
          if (isAborted || streamEnded) {
            console.log('dlImg error ignored because aborted or ended', filename);
            return;
          }

          hasErr = true;

          const errGif = base64toBlob('R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=', 'image/gif');
          safeEnqueue(ctrl, { name: `${filename}_error.gif`, stream: () => errGif.stream() });

          $download.css('backgroundColor', '#FF7F7F');

          console.log(err, 'error');
          next(ctrl);
        },
      );
    }
    console.log(current, 'current');
  }

  if (!refreshGalleryData()) return;

  $_download = $('#download-torrent, #download');

  if (!$_download.length) return;
  GM_config.open();
  $configPanel = $('#nHentaiDlConfig');

  $download = $(
    '<button type="button" id="nHentaiDlDownload" class="btn btn-secondary tooltip" style="min-width:120px;margin:0 6px;">' +
      '<i class="fa fa-download"></i> Download<span class="top">No login required<br>No sign up required<i></i></span>' +
      '</button>',
  );
  $download.prop('disabled', false);
  $download.append(`<span> as ${outputExt.toUpperCase()}</span>`);

  $cancel = $(
    '<button type="button" id="nHentaiDlCancel" class="btn btn-secondary" style="min-width:40px;margin:0 6px;background-color:#d9534f;">' +
      '<i class="fa fa-times"></i><div class="top">Cancel<i></i></div>' +
      '</button>',
  );
  $cancel.hide();

  $config = $(
    '<button type="button" id="nHentaiDlConfigToggle" class="btn btn-secondary" style="min-width:40px;margin:0 6px;color:#d9d9d9;">' +
      '<i class="fa fa-cog"></i> Settings' +
      '</button>',
  );

  const $controlPanel = $(
    '<div id="nHentaiDlControlPanel" style="position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:9999;padding:8px 12px;background:rgba(0,0,0,.75);border:1px solid #333;border-radius:7px;box-shadow:0 4px 12px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;gap:6px;">' +
      '</div>',
  );

  $controlPanel.append($download, $cancel, $config);
  $('body').append($controlPanel);

  $cancel.on('click', (e) => {
    e.preventDefault();
    if (!inProgress) return;

    console.log('Cancel clicked');
    isAborted = true;
    if (abortController && !abortController.signal.aborted) {
      abortController.abort();
    }

    $cancel.hide();
    resetDownload();
  });

  $download.css('backgroundColor', 'cornflowerblue').on('click', (e) => {
    e.preventDefault();
    if (inProgress) return;
    inProgress = true;

    if (debug) _time('nHentai');
    console.log({ outputExt, outputName, threading });

    isAborted = false;
    streamEnded = false;

    if (threading < 1) threading = 1;
    if (threading > 16) threading = 16;

    doc.title = `[⇣] ${comicName}`;
    window.addEventListener('beforeunload', beforeleaving);

    $download
      .html('<i class="fa fa-spinner fa-spin"></i> <strong>Waiting...</strong>')
      .css('backgroundColor', 'orange');
    if ($cancel) {
      $cancel.show();
    }

    images = images.map((img, index) => {
      return {
        url: `https://i.nhentai.net/${img.path}`,
        attempt: 3,
      };
    });
    console.log(images, 'images');

    // Setup AbortController so both reading/writing paths can support cancel
    abortController = new AbortController();
    const abortSignal = abortController.signal;
    window.abortController = abortController;

    streamSaver.mitm = 'https://lelinhtinh.github.io/stream/mitm.html';
    window.writableStream = streamSaver.createWriteStream(zipName);

    const info = new Blob([getInfo()]);
    window.readableStream = new ZIP({
      start(ctrl) {
        ctrl.enqueue({
          name: 'info.txt',
          stream: () => info.stream(),
        });
      },
      pull(ctrl) {
        addZip(ctrl);
      },
    });

    const handleAbortError = (err) => {
      if (abortSignal.aborted || isAborted) {
        console.warn('Download aborted by user.');
        streamEnded = true;
        console.error('Download error:', err);
      }
      resetDownload();
    };

    if (window.WritableStream && window.readableStream.pipeTo) {
      window.readableStream
        .pipeTo(window.writableStream, { signal: abortSignal })
        .then(() => {
          done(comicName);
          inProgress = false;
        })
        .catch(handleAbortError);
    } else {
      window.writer = window.writableStream.getWriter();
      window.reader = window.readableStream.getReader({ signal: abortSignal });
      const pump = () =>
        window.reader.read().then((res) => {
          if (res.done) {
            return window.writer.close();
          }
          return window.writer.write(res.value).then(pump);
        });
      pump()
        .then(() => {
          done(comicName);
          inProgress = false;
        })
        .catch(handleAbortError);
    }
  });

  $configPanel.toggle();
  $config.on('click', (e) => {
    e.preventDefault();
    $configPanel.toggle('fast');
  });
})(jQuery, unsafeWindow);
