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
// @version            3.1.1
// @icon               http://i.imgur.com/FAsQ4vZ.png
// @author             Zzbaivong
// @oujs:author        baivong
// @license            MIT; https://baivong.mit-license.org/license.txt
// @match              http://nhentai.net/g/*
// @match              https://nhentai.net/g/*
// @require            https://code.jquery.com/jquery-3.5.1.min.js
// @require            https://cdn.jsdelivr.net/npm/web-streams-polyfill@2.0.2/dist/ponyfill.min.js
// @require            https://cdn.jsdelivr.net/npm/streamsaver@2.0.3/StreamSaver.min.js
// @require            https://cdn.jsdelivr.net/npm/streamsaver@2.0.4/examples/zip-stream.js
// @require            https://greasyfork.org/scripts/28536-gm-config/code/GM_config.js?version=184529
// @require            https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @connect            self
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

  const configFrame = document.createElement('div'),
    $infoBlock = $('#info-block');

  $infoBlock.append(configFrame);
  $infoBlock.append(
    '<p style="text-align:left;padding:0 10px;color:#ff7600"><i class="fa fa-exclamation-triangle"></i> Enable 3rd-party cookies to allow streaming downloads.</p>'
  );

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
        label: 'Max. conn. number',
        type: 'unsigned int',
        min: 1,
        max: 16,
        default: 4,
      },
      hideTorrentBtn: {
        label: 'Hide the download torrent button',
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
        hideTorrentBtn = GM_config.get('hideTorrentBtn');

        $download.find('span').text(` as ${outputExt.toUpperCase()}`);
        $_download.toggle(!hideTorrentBtn);

        const $saveBtn = $('#nHentaiDlConfig_saveBtn');
        $saveBtn.prop('disabled', true).addClass('saved').text('Saved!');

        setTimeout(() => {
          $saveBtn.prop('disabled', false).removeClass('saved').text('Save');
        }, 1500);
      },
    },
    css:
      '#nHentaiDlConfig{width:100%!important;position:initial!important;padding:10px!important;background:#0d0d0d;border:1px solid #313131!important;border-radius:5px;text-align:left}#nHentaiDlConfig *{font-family:"Noto Sans",sans-serif}#nHentaiDlConfig .config_header{text-align:left;font-size:17px;font-weight:700;margin-bottom:20px;color:#999}#nHentaiDlConfig .reset_holder{float:left;height:30px;line-height:30px}#nHentaiDlConfig .reset{color:#4d4d4d;text-align:left}#nHentaiDlConfig .saveclose_buttons{margin:0;padding:4px;min-width:100px;height:30px;line-height:14px;border-radius:2px;border:1px solid;cursor:pointer}#nHentaiDlConfig .saveclose_buttons.saved{background:#ffeb3b;border:1px solid #ffc107}#nHentaiDlConfig #nHentaiDlConfig_closeBtn{display:none}#nHentaiDlConfig_buttons_holder{margin-top:20px;border-top:1px dashed #4d4d4d;padding-top:11px}#nHentaiDlConfig .config_var::after{clear:both;content:"";display:block}#nHentaiDlConfig .config_var{position:relative}#nHentaiDlConfig .field_label{font-size:14px;height:26px;line-height:26px;margin:0;padding:0 10px 0 0;width:60%;display:block;float:left}#nHentaiDlConfig .config_var>[type=text],#nHentaiDlConfig .config_var>div,#nHentaiDlConfig .config_var>select,#nHentaiDlConfig .config_var>textarea{width:40%;border-radius:0;display:block;height:26px;line-height:26px;padding:0 10px;float:left}#nHentaiDlConfig .config_var>textarea{height:auto;line-height:14px;padding:10px;min-height:5em}#nHentaiDlConfig .config_var>select{background:#4d4d4d;color:#d9d9d9;padding:0}#nHentaiDlConfig .config_var>select:hover{background:#666}#nHentaiDlConfig .config_var>select:focus{outline:0 none}#nHentaiDlConfig .config_var>div>label{display:inline-block;vertical-align:top;margin-right:5px}#nHentaiDlConfig .config_var>#nHentaiDlConfig_field_outputName{width:150px;text-transform:capitalize}#nHentaiDlConfig .config_var>#nHentaiDlConfig_field_threading{width:70px}#nHentaiDlConfig .config_var>div{padding:0}#nHentaiDlConfig_field_outputExt{text-transform:uppercase}#nHentaiDlConfig_field_outputExt [value=cbz]{margin-right:20px!important}',
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
   * Hide Torrent Download button
   * @type {Boolean}
   */
  let hideTorrentBtn = GM_config.get('hideTorrentBtn') || false;

  /**
   * Logging
   * @type {Boolean}
   */
  let debug = false;

  const _console = window.console;
  const _time = window.console.time;
  const _timeEnd = window.console.timeEnd;
  const log = (...arg) => {
    if (!debug) return;
    _console.log(arg);
  };
  window.console = {
    log: () => null,
    clear: () => null,
  };

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

    if (gallery.title.english) info += gallery.title.english + '\r\n';
    if (gallery.title.japanese) info += gallery.title.japanese + '\r\n';
    if (gallery.title.pretty) info += gallery.title.pretty + '\r\n';
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

    log(info);
    return info;
  }

  function end() {
    $win.off('beforeunload').off('unload');
    if (debug) _timeEnd('nHentai');
  }

  function done(filename) {
    doc.title = `[⇓] ${filename}`;
    log('COMPLETE');
    end();
  }

  function genZip(ctrl) {
    ctrl.close();
    $download.html('<i class="fa fa-check"></i> Complete').css('backgroundColor', hasErr ? 'red' : 'green');
  }

  function dlImgError(current, success, error, err, filename) {
    if (images[current].attempt < 1) {
      final++;
      error(err, filename);
      return;
    }

    setTimeout(() => {
      log(filename, `retry ${images[current].attempt}`);
      dlImg(current, success, error);
      images[current].attempt--;
    }, 2000);
  }

  function dlImg(current, success, error) {
    let url = images[current].url,
      filename = url.replace(/.*\//g, '');

    filename = `000${filename}`.slice(-8);
    log(filename, 'progress');

    GM.xmlHttpRequest({
      method: 'GET',
      url: url,
      responseType: 'blob',
      onload: (response) => {
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
        dlImgError(current, success, error, err, filename);
      },
    });
  }

  function next(ctrl) {
    doc.title = `[${final}/${total}] ${filename}`;
    $download.find('strong').text(`${final}/${total}`);
    log(final, current);

    if (final < current) return;
    final < total ? addZip(ctrl) : genZip(ctrl);
  }

  function addZip(ctrl) {
    let max = current + threading;
    if (max > total) max = total;

    for (current; current < max; current++) {
      log(images[current].url, 'download');
      dlImg(
        current,
        (response, filename) => {
          ctrl.enqueue({ name: filename, stream: () => response.response.stream() });

          log(filename, 'success');
          next(ctrl);
        },
        (err, filename) => {
          hasErr = true;

          const errGif = base64toBlob('R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=', 'image/gif');
          ctrl.enqueue({ name: `${filename}_error.gif`, stream: () => errGif.stream() });

          $download.css('backgroundColor', '#FF7F7F');

          log(err, 'error');
          next(ctrl);
        }
      );
    }
    log(current, 'current');
  }

  const gallery = JSON.parse(JSON.stringify(window._gallery));
  log(gallery, 'gallery');
  if (!gallery) return;

  let current = 0,
    final = 0,
    total = gallery.num_pages,
    images = gallery.images.pages,
    hasErr = false,
    $_download = $('#download-torrent, #download'),
    $download,
    $config,
    $configPanel,
    doc = document,
    $win = $(window),
    comicId = gallery.id,
    filename = gallery.title[outputName] || gallery.title['english'],
    zipName = `${filename.replace(/\s+/g, '-').replace(/・/g, '·')}.${comicId}.${outputExt}`,
    readableStream,
    writableStream,
    writer,
    inProgress = false;

  if (!$_download.length) return;
  GM_config.open();
  $configPanel = $('#nHentaiDlConfig');

  $download = $_download.clone();
  $download.removeAttr('id');
  $download.removeClass('btn-disabled');
  $download.attr('href', '#download');
  $download.find('.top').html('No login required<br>No sign up required<i></i>');
  $download.append(`<span> as ${outputExt.toUpperCase()}</span>`);

  $download.insertAfter($_download);
  $download.before('\n');

  $download.css('backgroundColor', 'cornflowerblue').on('click', (e) => {
    e.preventDefault();
    if (inProgress) return;
    inProgress = true;

    if (debug) _time('nHentai');
    log({ outputExt, outputName, threading });

    if (threading < 1) threading = 1;
    if (threading > 16) threading = 16;

    doc.title = `[⇣] ${filename}`;
    $win
      .on('beforeunload', (e) => {
        e.originalEvent.returnValue = 'Progress is running...';
      })
      .on('unload', () => {
        if (writableStream) writableStream.abort();
        if (writer) writer.abort();
      });

    $download
      .html('<i class="fa fa-spinner fa-spin"></i> <strong>Waiting...</strong>')
      .css('backgroundColor', 'orange');

    images = images.map((img, index) => {
      return {
        url: `https://i.nhentai.net/galleries/${gallery.media_id}/${index + 1}.${
          { j: 'jpg', p: 'png', g: 'gif' }[img.t]
        }`,
        attempt: 3,
      };
    });
    log(images, 'images');

    streamSaver.mitm = 'https://lelinhtinh.github.io/stream/mitm.html';
    writableStream = streamSaver.createWriteStream(zipName);

    const info = new Blob([getInfo()]);
    readableStream = new ZIP({
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

    if (window.WritableStream && readableStream.pipeTo) {
      readableStream.pipeTo(writableStream).then(() => {
        done(filename);
      });
    } else {
      const writer = writableStream.getWriter();
      const reader = readableStream.getReader();
      const pump = () => reader.read().then((res) => (res.done ? writer.close() : writer.write(res.value).then(pump)));
      pump().then(() => done(filename));
    }
  });

  $configPanel.toggle();
  $config = $_download.clone();
  $config.removeAttr('id');
  $config.removeClass('btn-disabled');
  $config.attr('href', '#settings');
  $config.css('min-width', '40px');
  $config.html('<i class="fa fa-cog"></i><div class="top">Toggle settings<i></i></div>');

  $config.insertAfter($download);
  $config.on('click', (e) => {
    e.preventDefault();
    $configPanel.toggle('fast');
  });

  if (hideTorrentBtn) $_download.hide();
})(jQuery, unsafeWindow);
