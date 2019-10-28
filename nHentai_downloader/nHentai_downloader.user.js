// ==UserScript==
// @name            nHentai Downloader
// @name:vi         nHentai Downloader
// @namespace       http://devs.forumvi.com
// @description     Download manga on nHentai.
// @description:vi  Tải truyện tranh tại NhệnTái.
// @version         1.6.9
// @icon            http://i.imgur.com/FAsQ4vZ.png
// @author          Zzbaivong
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           http://nhentai.net/g/*
// @match           https://nhentai.net/g/*
// @require         https://code.jquery.com/jquery-3.4.1.min.js
// @require         https://unpkg.com/jszip@3.2.2/dist/jszip.min.js
// @require         https://unpkg.com/file-saver@2.0.2/dist/FileSaver.min.js
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @connect         self
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-start
// @grant           GM.xmlHttpRequest
// @grant           GM_xmlhttpRequest
// ==/UserScript==

jQuery(function($) {
  'use strict';

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
  var threading = 8;

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
    var $info = $('#info'),
      $h1 = $info.find('h1'),
      $h2 = $info.find('h2'),
      $tags = $('#tags').clone(),
      info = '';

    $tags.find('.tag-container.hidden').remove();
    $tags.find('.count').remove();
    $tags.find('.tags a').replaceWith(function() {
      return this.textContent.trim() + ', ';
    });
    $tags.find('.tags').replaceWith(function() {
      return this.textContent.trim().slice(0, -1);
    });
    $tags.find('.tag-container').replaceWith(function() {
      return this.textContent.trim().replace(/[\n\s\t]{2,}/, ' ');
    });

    if ($h1.length) info += $h1.text().trim() + '\r\n';
    if ($h2.length) info += $h2.text().trim() + '\r\n';
    if ($tags.length)
      info +=
        '\r\n' +
        $tags
          .text()
          .trim()
          .replace(/[\n\s\t]{2,}/g, '\r\n');

    if (debug) console.log(info);
    return info;
  }

  function genZip() {
    zip.file('info.txt', getInfo());

    zip
      .generateAsync({
        type: 'blob',
      })
      .then(
        function(blob) {
          var zipName = tit.split(' » ')[0].replace(/\s/g, '_') + '.' + comicId + '.' + outputExt;

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
        function(reason) {
          $download.html('<i class="fa fa-exclamation"></i> Fail').css('backgroundColor', 'red');

          doc.title = '[x] ' + tit;
          if (debug) console.error(reason, 'ERROR');
          end();
        }
      );
  }

  function dlImg(url, success, error) {
    var filename = url.replace(/.*\//g, '');
    filename = filename.split('.');
    filename = ('0000' + filename[0]).slice(-4) + '.' + filename[1];

    if (debug) console.log(filename, 'progress');
    GM.xmlHttpRequest({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
      onload: function(response) {
        final++;
        success(response, filename);
      },
      onerror: function(err) {
        final++;
        error(err, filename);
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
      var url = images[current];

      if (debug) console.log(url, 'download');
      dlImg(
        url,
        function(response, filename) {
          zip.file(filename, response.response);

          if (debug) console.log(filename, 'success');
          next();
        },
        function(err, filename) {
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

  var zip = new JSZip(),
    prevZip = false,
    current = 0,
    final = 0,
    total = 0,
    images = [],
    hasErr = false,
    $images = $('#thumbnail-container img'),
    $_download = $('#download-torrent, #download'),
    $download,
    doc = document,
    tit = doc.title,
    $win = $(window),
    comicId = location.pathname.match(/\d+/)[0];

  if (!$images.length || !$_download.length) return;

  window.URL = window.URL || window.webkitURL;

  $download = $_download.clone();
  $download.removeAttr('id');
  $download.removeClass('btn-disabled');
  $download.attr('href', '#download');
  $download.find('.top').html('No login required<br>No sign up required<i></i>');
  $download.append(' as ' + outputExt.toUpperCase());

  $download.insertAfter($_download);
  $download.before('\n');

  $download.css('backgroundColor', 'cornflowerblue').one('click', function(e) {
    e.preventDefault();
    if (debug) console.time('nHentai');

    if (threading < 1) threading = 1;
    if (threading > 32) threading = 32;

    $win.on('beforeunload', function() {
      return 'Progress is running...';
    });

    $download.html('<i class="fa fa-cog fa-spin"></i> Waiting...').css('backgroundColor', 'orange');

    $images.each(function(i, v) {
      var src = $(v).data('src');

      if (/^\/\/t\./i.test(src)) src = location.protocol + src;
      src = src.replace('t.n', 'i.n').replace(/\/(\d+)t\./, '/$1.');

      images[i] = src;
    });

    total = images.length;
    addZip();
  });
});
