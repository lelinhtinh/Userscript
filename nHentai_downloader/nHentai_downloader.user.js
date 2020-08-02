// ==UserScript==
// @name            nHentai Downloader
// @name:vi         nHentai Downloader
// @namespace       http://devs.forumvi.com
// @description     Download manga on nHentai.
// @description:vi  Tải truyện tranh tại NhệnTái.
// @version         2.0.0
// @icon            http://i.imgur.com/FAsQ4vZ.png
// @author          Zzbaivong
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           http://nhentai.net/g/*
// @match           https://nhentai.net/g/*
// @require         https://code.jquery.com/jquery-3.5.1.min.js
// @require         https://unpkg.com/jszip@3.1.5/dist/jszip.min.js
// @require         https://greasyfork.org/scripts/28536-gm-config/code/GM_config.js?version=184529
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @require         https://cdn.jsdelivr.net/npm/web-streams-polyfill@2.0.2/dist/ponyfill.min.js
// @require         https://cdn.jsdelivr.net/npm/streamsaver@2.0.3/StreamSaver.min.js
// @noframes
// @connect         self
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-idle
// @grant           GM.xmlHttpRequest
// @grant           GM_xmlhttpRequest
// @grant           unsafeWindow
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM.getValue
// @grant           GM.setValue
// ==/UserScript==

/* global streamSaver */
(($, window) => {
  'use strict';

  const configFrame = document.createElement('div');
  $('#info-block').append(configFrame);

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
        max: 32,
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

        $download.find('span').text(` as ${outputExt.toUpperCase()}`);

        if (GM_config.get('hideTorrentBtn') == true) {
          $_download.hide();
        } else {
          $_download.show();
        }

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
   * @type {Number} [1 -> 32]
   */
  let threading = GM_config.get('threading') || 4;

  /**
   * Logging
   * @type {Boolean}
   */
  let debug = false;

  function end() {
    $win.off('beforeunload');

    if (debug) console.timeEnd('nHentai');
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

    if (debug) console.log(info);
    return info;
  }

  function genZip() {
    const filename = gallery.title[outputName] || gallery.title['english']; // e.g. #321311

    zip.file('info.txt', getInfo());
    zip
      .generateAsync(
        {
          type: 'blob',
          compression: 'STORE',
          streamFiles: true, // Less memory but less compatibility, https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html#streamfiles-option
        },
        (metadata) => {
          $download.html(`<i class="fa fa-file-archive"></i> ${metadata.percent.toFixed(2)} %`);
        }
      )
      .then(
        (blob) => {
          const zipName = `${filename.replace(/\s+/g, '-').replace(/・/g, '·')}.${comicId}.${outputExt}`;

          $download
            .html('<i class="fa fa-check"></i> Complete')
            .css('backgroundColor', hasErr ? 'red' : 'green')
            .attr({
              href: 'javascript:void(0);',
              download: zipName,
            });

          const fileStream = streamSaver.createWriteStream(zipName, {
            size: blob.size,
          });
          const readableStream = blob.stream();

          window.FSwriter = fileStream.getWriter();
          const reader = readableStream.getReader();
          const pump = () =>
            reader
              .read()
              .then((res) => (res.done ? window.FSwriter.close() : window.FSwriter.write(res.value).then(pump)));
          pump(); // Firefox does not support pipeTo() yet.

          doc.title = `[⇓] ${filename}`;
          if (debug) console.log('COMPLETE');
          end();
        },
        (reason) => {
          $download.html('<i class="fa fa-exclamation"></i> Fail').css('backgroundColor', 'red');

          doc.title = `[x] ${filename}`;
          if (debug) console.error(reason, 'ERROR');
          end();
        }
      );
  }

  function dlImg(current, success, error) {
    let url = images[current].url,
      filename = url.replace(/.*\//g, '');

    filename = `000${filename}`.slice(-8);
    if (debug) console.log(filename, 'progress');

    GM.xmlHttpRequest({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
      onload: (response) => {
        final++;
        success(response, filename);
      },
      onerror: (err) => {
        if (images[current].attempt < 1) {
          final++;
          error(err, filename);
          return;
        }

        setTimeout(() => {
          if (debug) console.log(filename, `retry ${images[current].attempt}`);
          dlImg(current, success, error);
          images[current].attempt--;
        }, 2000);
      },
    });
  }

  function next() {
    $download.find('span').text(`${final}/${total}`);
    if (debug) console.log(final, current);

    if (final < current) return;
    final < total ? addZip() : genZip();
  }

  function addZip() {
    let max = current + threading;
    if (max > total) max = total;

    for (current; current < max; current++) {
      if (debug) console.log(images[current].url, 'download');
      dlImg(
        current,
        (response, filename) => {
          zip.file(filename, response.response);

          if (debug) console.log(filename, 'success');
          next();
        },
        (err, filename) => {
          hasErr = true;
          // zip.file(filename + '_error.txt', err.statusText + '\r\n' + err.finalUrl);
          zip.file(`${filename}_${comicId}_error.gif`, 'R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=', {
            base64: true,
          });
          $download.css('backgroundColor', '#FF7F7F');

          if (debug) console.log(filename, 'error');
          next();
        }
      );
    }
    if (debug) console.log(current, 'current');
  }

  const gallery = JSON.parse(JSON.stringify(window._gallery));
  if (debug) console.log(gallery, 'gallery');
  if (!gallery) return;

  let zip = new JSZip(),
    current = 0,
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
    comicId = gallery.id;

  if (!$_download.length) return;
  GM_config.open();
  $configPanel = $('#nHentaiDlConfig');

  window.URL = window.URL || window.webkitURL;

  $download = $_download.clone();
  $download.removeAttr('id');
  $download.removeClass('btn-disabled');
  $download.attr('href', '#download');
  $download.find('.top').html('No login required<br>No sign up required<i></i>');
  $download.append(`<span> as ${outputExt.toUpperCase()}</span>`);

  $download.insertAfter($_download);
  $download.before('\n');

  $download.css('backgroundColor', 'cornflowerblue').one('click', (e) => {
    e.preventDefault();
    if (debug) console.time('nHentai');
    if (debug) console.log({ outputExt, outputName, threading });

    if (threading < 1) threading = 1;
    if (threading > 32) threading = 32;

    $win.on('beforeunload', () => {
      return 'Progress is running...';
    });

    $download.html('<i class="fa fa-spinner fa-spin"></i> <span>Waiting...</span>').css('backgroundColor', 'orange');

    images = images.map((img, index) => {
      return {
        url: `https://i.nhentai.net/galleries/${gallery.media_id}/${index + 1}.${
          { j: 'jpg', p: 'png', g: 'gif' }[img.t]
        }`,
        attempt: 3,
      };
    });
    if (debug) console.log(images, 'images');

    addZip();
  });

  $configPanel.toggle();
  $config = $_download.clone();
  $config.removeAttr('id');
  $config.removeClass('btn-disabled');
  $config.attr('href', 'javascript:void(0);');
  $config.css('min-width', '40px');
  $config.html('<i class="fa fa-cog"></i>');

  $config.insertAfter($download);
  $config.before('\n');
  $config.on('click', () => {
    $configPanel.toggle('fast');
  });

  if (GM_config.get('hideTorrentBtn') == true) $_download.hide();
})(jQuery, unsafeWindow);
