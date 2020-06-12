// ==UserScript==
// @name            nHentai Downloader
// @name:vi         nHentai Downloader
// @namespace       http://devs.forumvi.com
// @description     Download manga on nHentai.
// @description:vi  Tải truyện tranh tại NhệnTái.
// @version         1.7.0
// @icon            http://i.imgur.com/FAsQ4vZ.png
// @author          Zzbaivong
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           http://nhentai.net/g/*
// @match           https://nhentai.net/g/*
// @require         https://code.jquery.com/jquery-3.5.1.min.js
// @require         https://unpkg.com/jszip@3.4.0/dist/jszip.min.js
// @require         https://unpkg.com/file-saver@2.0.2/dist/FileSaver.min.js
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @connect         self
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-idle
// @grant           GM.xmlHttpRequest
// @grant           GM_xmlhttpRequest
// @grant           unsafeWindow
// ==/UserScript==

(function ($, window) {
  'use strict';

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
  var outputExt = 'cbz'; // or 'zip'

  /**
   * File name
   * @type {'pretty'|'english'|'japanese'}
   */
  var outputName = 'pretty';

  /**
   * Multithreading
   * @type {Number} [1 -> 32]
   */
  var threading = 4;

  /* === DO NOT CHANGE === */

  /**
   * Logging
   * @type {Boolean}
   */
  var debug = false;

  function end() {
    $win.off('beforeunload');

    if (debug) console.timeEnd('nHentai');
  }

  function getInfo() {
    var info = '',
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
    zip.file('info.txt', getInfo());

    zip
      .generateAsync(
        {
          type: 'blob',
          compression: 'STORE',
        },
        function updateCallback(metadata) {
          $download.html('<i class="fa fa-file-archive"></i> ' + metadata.percent.toFixed(2) + ' %');
        }
      )
      .then(
        function (blob) {
          var zipName = tit.replace(/\s+/g, '-') + '.' + comicId + '.' + outputExt;

          if (prevZip) window.URL.revokeObjectURL(prevZip);
          prevZip = blob;

          $download
            .html('<i class="fa fa-check"></i> Complete')
            .css('backgroundColor', hasErr ? 'red' : 'green')
            .attr({
              href: window.URL.createObjectURL(prevZip),
              download: zipName,
            });

          saveAs(blob, zipName);

          doc.title = '[⇓] ' + tit;
          if (debug) console.log('COMPLETE');
          end();
        },
        function (reason) {
          $download.html('<i class="fa fa-exclamation"></i> Fail').css('backgroundColor', 'red');

          doc.title = '[x] ' + tit;
          if (debug) console.error(reason, 'ERROR');
          end();
        }
      );
  }

  function dlImg(current, success, error) {
    var url = images[current].url,
      filename = url.replace(/.*\//g, '');

    filename = ('0000' + filename).slice(-8);
    if (debug) console.log(filename, 'progress');

    GM.xmlHttpRequest({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
      onload: function (response) {
        final++;
        success(response, filename);
      },
      onerror: function (err) {
        if (images[current].attempt <= 0) {
          final++;
          error(err, filename);
          return;
        }

        setTimeout(function () {
          if (debug) console.log(filename, 'retry ' + images[current].attempt);
          dlImg(current, success, error);
          images[current].attempt--;
        }, 2000);
      },
    });
  }

  function next() {
    $download.html('<i class="fa fa-cog fa-spin"></i> ' + final + '/' + total);
    if (debug) console.log(final, current);

    if (final < current) return;
    final < total ? addZip() : genZip();
  }

  function addZip() {
    var max = current + threading;
    if (max > total) max = total;

    for (current; current < max; current++) {
      if (debug) console.log(images[current].url, 'download');
      dlImg(
        current,
        function (response, filename) {
          zip.file(filename, response.response);

          if (debug) console.log(filename, 'success');
          next();
        },
        function (err, filename) {
          hasErr = true;
          zip.file(filename + '_error.txt', err.statusText + '\r\n' + err.finalUrl);
          $download.css('backgroundColor', '#FF7F7F');

          if (debug) console.log(filename, 'error');
          next();
        }
      );
    }
    if (debug) console.log(current, 'current');
  }

  var gallery = window._gallery;
  if (!gallery) return;

  var zip = new JSZip(),
    prevZip = false,
    current = 0,
    final = 0,
    total = gallery.num_pages,
    images = gallery.images.pages,
    hasErr = false,
    $_download = $('#download-torrent, #download'),
    $download,
    doc = document,
    tit = gallery.title[outputName],
    $win = $(window),
    comicId = gallery.id;

  if (!$_download.length) return;

  window.URL = window.URL || window.webkitURL;

  $download = $_download.clone();
  $download.removeAttr('id');
  $download.removeClass('btn-disabled');
  $download.attr('href', '#download');
  $download.find('.top').html('No login required<br>No sign up required<i></i>');
  $download.append(' as ' + outputExt.toUpperCase());

  $download.insertAfter($_download);
  $download.before('\n');

  $download.css('backgroundColor', 'cornflowerblue').one('click', function (e) {
    e.preventDefault();
    if (debug) console.time('nHentai');

    if (threading < 1) threading = 1;
    if (threading > 32) threading = 32;

    $win.on('beforeunload', function () {
      return 'Progress is running...';
    });

    $download.html('<i class="fa fa-cog fa-spin"></i> Waiting...').css('backgroundColor', 'orange');

    images = images.map(function (img, index) {
      return {
        url:
          'https://i.nhentai.net/galleries/' +
          gallery.media_id +
          '/' +
          (index + 1) +
          '.' +
          { j: 'jpg', p: 'png', g: 'gif' }[img.t],
        attempt: 3,
      };
    });
    if (debug) console.log(images, 'images');

    addZip();
  });
})(jQuery, unsafeWindow);
