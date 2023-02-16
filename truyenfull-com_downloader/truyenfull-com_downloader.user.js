// ==UserScript==
// @name            truyenfull.com downloader
// @name:vi         truyenfull.com downloader
// @namespace       https://lelinhtinh.github.io/
// @description     Tải EPUB truyện từ truyenfull.com.
// @description:vi  Tải EPUB truyện từ truyenfull.com.
// @version         1.0.0
// @icon            https://i.imgur.com/pn1dLFw.png
// @author          Zzbaivong
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           https://truyenfull.com/*
// @require         https://code.jquery.com/jquery-3.6.3.min.js
// @require         https://unpkg.com/jszip@3.1.5/dist/jszip.min.js
// @require         https://unpkg.com/file-saver@2.0.5/dist/FileSaver.min.js
// @require         https://unpkg.com/ejs@2.7.4/ejs.min.js
// @require         https://unpkg.com/jepub@2.1.4/dist/jepub.min.js
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @connect         self
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-idle
// @grant           GM_xmlhttpRequest
// @grant           GM.xmlHttpRequest
// @grant           unsafeWindow
// @inject-into     content
// ==/UserScript==

(function ($, window, document) {
  'use strict';

  /**
   * Nhận cảnh báo khi có chương bị lỗi
   */
  var errorAlert = false;

  /**
   * Thời gian giãn cách giữa 2 lần tải
   * @type {Number}
   */
  var downloadDelay = 0;

  function str2url(a) {
    if (a != '') {
      a = a.toLowerCase();
      a = a.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
      a = a.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
      a = a.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
      a = a.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
      a = a.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
      a = a.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
      a = a.replace(/đ/g, 'd');
      a = a.replace(/!|@|%|\^|\*|\(|\)|\+|=|<|>|\?|\/|,|\.|:|;|'| |"|&|#|\[|\]|“|”|~|$|_/g, '-');
      a = a.replace(/-+-/g, '-');
      a = a.replace(/^-+|-+$/g, '');
      return a;
    }
  }

  function cleanHtml(str) {
    str = str.replace(/\s*Chương\s*\d+\s?:[^<\n]/, '');
    str = str.replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]+/gm, ''); // eslint-disable-line
    return '<div>' + str + '</div>';
  }

  function downloadError(mess, err, server) {
    downloadStatus('danger');
    if (errorAlert) errorAlert = confirm('Lỗi! ' + mess + '\nBạn có muốn tiếp tục nhận cảnh báo?');
    if (err) console.error(mess);

    if (server) {
      if (downloadDelay > 700) {
        if (chapTitle) titleError.push(chapTitle);
        saveEbook();
        return;
      }

      downloadStatus('warning');
      downloadDelay += 100;
      setTimeout(function () {
        getContent();
      }, downloadDelay);
      return;
    }
    if (!chapTitle) return;
    titleError.push(chapTitle);

    return '<p class="no-indent"><a href="' + referrer + chapId + '">' + mess + '</a></p>';
  }

  function beforeleaving(e) {
    e.preventDefault();
    e.returnValue = '';
  }

  function genEbook() {
    jepub
      .generate('blob', function (metadata) {
        $download.html('Đang nén <strong>' + metadata.percent.toFixed(2) + '%</strong>');
      })
      .then(function (epubZipContent) {
        document.title = '[⇓] ' + ebookTitle;
        window.removeEventListener('beforeunload', beforeleaving);

        $download
          .attr({
            href: window.URL.createObjectURL(epubZipContent),
            download: ebookFilename,
          })
          .text('Hoàn thành')
          .off('click');
        if (status !== 'danger') downloadStatus('success');

        saveAs(epubZipContent, ebookFilename);
      })
      .catch(function (err) {
        downloadStatus('danger');
        console.error(err);
      });
  }

  function saveEbook() {
    if (endDownload) return;
    endDownload = true;
    $download.html('Bắt đầu tạo EPUB');

    if (titleError.length) {
      titleError = '<p class="no-indent"><strong>Các chương lỗi: </strong>' + titleError.join(', ') + '</p>';
    } else {
      titleError = '';
    }
    beginEnd = '<p class="no-indent">Nội dung từ <strong>' + begin + '</strong> đến <strong>' + end + '</strong></p>';

    jepub.notes(beginEnd + titleError + '<br /><br />' + credits);

    GM.xmlHttpRequest({
      method: 'GET',
      url: ebookCover,
      responseType: 'arraybuffer',
      onload: function (response) {
        try {
          jepub.cover(response.response);
        } catch (err) {
          console.error(err);
        }
        genEbook();
      },
      onerror: function (err) {
        console.error(err);
        genEbook();
      },
    });
  }

  function getContent() {
    if (endDownload) return;
    chapId = chapList[count];

    $.get('/' + novelAlias + '/' + chapId + '.html')
      .done(function (response) {
        var $data = $(response),
          $chapter = $data.find('.chapter-c'),
          $notContent = $chapter.find('script, style, a'),
          $referrer = $chapter.find('[style]').filter(function () {
            return this.style.fontSize === '1px' || this.style.fontSize === '0px' || this.style.color === 'white';
          }),
          chapContent;

        if (endDownload) return;

        chapTitle = $data.find('.chapter-title').text().trim();
        if (chapTitle === '') chapTitle = 'Chương ' + chapId.match(/\d+/)[0];

        if (!$chapter.length) {
          chapContent = downloadError('Không có nội dung');
        } else {
          var $img = $chapter.find('img');
          if ($img.length)
            $img.replaceWith(function () {
              return '<br /><a href="' + this.src + '">Click để xem ảnh</a><br />';
            });

          if ($notContent.length) $notContent.remove();
          if ($referrer.length) $referrer.remove();

          if ($chapter.text().trim() === '') {
            chapContent = downloadError('Nội dung không có');
          } else {
            if (status !== 'danger') downloadStatus('warning');
            chapContent = cleanHtml($chapter.html());
          }
        }

        jepub.add(chapTitle, chapContent);

        if (count === 0) begin = chapTitle;
        end = chapTitle;

        $download.html('Đang tải <strong>' + count + '/' + chapListSize + '</strong>');

        count++;
        document.title = '[' + count + '] ' + pageName;
        if (count >= chapListSize) {
          saveEbook();
        } else {
          setTimeout(function () {
            getContent();
          }, downloadDelay);
        }
      })
      .fail(function (err) {
        chapTitle = null;
        downloadError('Kết nối không ổn định', err, true);
      });
  }

  var wrapHTML = $('#wrap').html();
  var parseUrl = wrapHTML.match(/storyID=([0-9]+);storyAlias='([\w-]+)';/);
  if (!parseUrl) return;

  GM.addStyle(`
.btn-success{color:green!important}
.btn-info{color:blue!important}
.btn-warning{color:orange!important}
.btn-danger{color:red!important}
  `);

  var pageName = document.title,
    $download = $('<a>', {
      class: 'btn btn-default',
      href: '#download',
      text: 'Tải xuống',
    }),
    status,
    downloadStatus = function (label) {
      status = label;
      $download.removeClass('btn-success btn-info btn-warning btn-danger').addClass('btn-' + status);
    },
    novelAlias = parseUrl[2],
    novelId = parseUrl[1],
    chapList = [],
    chapListSize = 0,
    chapId = '',
    chapTitle = '',
    count = 0,
    begin = '',
    end = '',
    endDownload = false,
    ebookTitle = $('h1 [itemprop="name"]').text().trim(),
    ebookAuthor = $('.info a[itemprop="author"]').text().trim(),
    ebookCover = $('.books img').attr('src'),
    ebookDesc = $('.desc-text').html(),
    ebookType = [],
    beginEnd = '',
    titleError = [],
    referrer = location.origin + location.pathname,
    ebookFilename = novelAlias + '.epub',
    credits =
      '<p>Truyện được tải từ <a href="' +
      referrer +
      '">TruyenFull</a></p><p>Userscript được viết bởi: <a href="https://lelinhtinh.github.io/jEpub/">Zzbaivong</a></p>',
    jepub;

  var $ebookType = $('.info a[itemprop="genre"]');
  if ($ebookType.length)
    $ebookType.each(function () {
      ebookType.push($(this).text().trim());
    });

  jepub = new jEpub();
  jepub
    .init({
      title: ebookTitle,
      author: ebookAuthor,
      publisher: location.host,
      description: ebookDesc,
      tags: ebookType,
    })
    .uuid(referrer);

  $download.insertAfter('.info');
  $download.wrap('<div class="panel-group books"></div>');
  $download.one('click contextmenu', function (e) {
    e.preventDefault();
    document.title = '[...] Vui lòng chờ trong giây lát';

    $.getJSON('/api/chapters/' + novelId)
      .done(function (data) {
        chapList = data.items.map(function (val) {
          var c = val.chapter_name.split(':')[0];
          return str2url(c);
        });

        if (e.type === 'contextmenu') {
          $download.off('click');
          var startFrom = prompt('Nhập ID chương truyện bắt đầu tải:', chapList[0]);
          startFrom = chapList.indexOf(startFrom);
          if (startFrom !== -1) chapList = chapList.slice(startFrom);
        } else {
          $download.off('contextmenu');
        }

        chapListSize = chapList.length;
        if (chapListSize > 0) {
          window.removeEventListener('beforeunload', beforeleaving);

          $download.one('click', function (e) {
            e.preventDefault();
            saveEbook();
          });

          getContent();
        }
      })
      .fail(function (jqXHR, textStatus) {
        downloadError(textStatus);
      });
  });
})(jQuery, unsafeWindow, document);
