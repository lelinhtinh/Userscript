// ==UserScript==
// @name            TruyenCV downloader
// @name:vi         TruyenCV downloader
// @namespace       http://devs.forumvi.com/
// @description     Tải truyện từ TruyenCV định dạng EPUB.
// @description:vi  Tải truyện từ TruyenCV định dạng EPUB.
// @version         4.6.8
// @icon            http://i.imgur.com/o5cmtkU.png
// @author          Zzbaivong
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           http://truyencv.com/*/
// @match           https://truyencv.com/*/
// @require         https://code.jquery.com/jquery-3.5.1.min.js
// @require         https://unpkg.com/jszip@3.1.5/dist/jszip.min.js
// @require         https://unpkg.com/file-saver@2.0.2/dist/FileSaver.min.js
// @require         https://unpkg.com/ejs@2.7.4/ejs.min.js
// @require         https://unpkg.com/jepub@2.1.4/dist/jepub.min.js
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @connect         self
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-idle
// @grant           GM_xmlhttpRequest
// @grant           GM.xmlHttpRequest
// ==/UserScript==
(function ($, window, document) {
  'use strict';

  /**
   * Nhận cảnh báo khi có chương bị lỗi
   */
  var errorAlert = true;

  /**
   * Những đoạn ghi chú cuối chương của converter
   * Chỉ cần ghi phần bắt đầu, không phân biệt hoa thường
   * Ngăn cách các đoạn bằng dấu |
   */
  var converter = 'ps:|hoan nghênh quảng đại bạn đọc quang lâm|Huyền ảo khoái trí ân cừu';

  converter = new RegExp('(' + converter + ')', 'i');

  function cleanHtml(str) {
    str = str.replace(/\s*Chương\s*\d+\s?:[^<\n]/, '');
    str = str.replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]+/gm, ''); // eslint-disable-line
    str = str.replace(/\s[a-zA-Z0-9]{6,8}(="")?\s/gm, function (key, attr) {
      if (attr) return ' ';
      if (!isNaN(key)) return key;
      if (key.split(/[A-Z]/).length > 2) return ' ';
      if (key.split(/\d/).length > 1) return ' ';
      return key;
    });
    str = str.replace(/\([^(]+<button[^/]+<\/button>[^)]*\)\s*/gi, '');
    str = str.split(converter)[0];
    return '<div>' + str + '</div>';
  }

  function downloadError(mess, err) {
    downloadStatus('danger');
    if (err) console.error(mess);
    if (!chapTitle) return;

    titleError.push(chapTitle);
    if (errorAlert) errorAlert = confirm('Lỗi! ' + mess + '\nBạn có muốn tiếp tục nhận cảnh báo?');

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
        if (!$download.hasClass('btn-danger')) downloadStatus('success');

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

    $.ajax({
      url: pathname + chapId + '/',
      xhrFields: {
        withCredentials: true,
      },
    })
      .done(function (response) {
        var $data = $(response),
          $chapter = $data.find('#js-truyencv-content'),
          $notContent = $chapter.find('iframe, script, style, a, div, p:has(a[href*="truyencv.com"])'),
          $referrer = $chapter.find('[style]').filter(function () {
            return this.style.fontSize === '1px' || this.style.fontSize === '0px' || this.style.color === 'white';
          }),
          chapContent;

        if (endDownload) return;

        chapTitle = $data.find('#js-truyencv-read-content .title').text().trim();
        if (chapTitle === '') chapTitle = 'Chương ' + chapId.match(/\d+/)[0];

        if (!$chapter.length) {
          chapContent = downloadError('Không có nội dung');
        } else {
          if ($chapter.find('#btnChapterVip').length) {
            chapContent = downloadError('Chương VIP');
          } else if (
            $chapter.filter(function () {
              return this.textContent.toLowerCase().indexOf('vui lòng đăng nhập để đọc chương này') !== -1;
            }).length
          ) {
            chapContent = downloadError('Chương yêu cầu đăng nhập');
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
              if (!$download.hasClass('btn-danger')) downloadStatus('warning');
              chapContent = cleanHtml($chapter.html());
            }
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
          getContent();
        }
      })
      .fail(function (err) {
        chapTitle = null;
        downloadError('Kết nối không ổn định', err);
        saveEbook();
      });
  }

  var pageName = document.title,
    $download = $('<a>', {
      class: 'btn btn-info',
      href: '#download',
      text: 'Tải xuống',
    }),
    downloadStatus = function (status) {
      $download.removeClass('btn-primary btn-success btn-info btn-warning btn-danger').addClass('btn-' + status);
    },
    $novelId = $('.basic'),
    chapList = [],
    chapListSize = 0,
    chapId = '',
    chapTitle = '',
    count = 0,
    begin = '',
    end = '',
    endDownload = false,
    ebookTitle = '',
    ebookAuthor = '',
    ebookCover = '',
    ebookDesc = '',
    ebookType = [],
    beginEnd = '',
    titleError = [],
    host = location.host,
    pathname = location.pathname,
    referrer = location.protocol + '//' + host + pathname,
    ebookFilename = pathname.slice(1, -1) + '.epub',
    credits =
      '<p>Truyện được tải từ <a href="' +
      referrer +
      '">TruyenCV</a></p><p>Userscript được viết bởi: <a href="https://lelinhtinh.github.io/jEpub/">Zzbaivong</a></p>',
    jepub;

  if (!$novelId.length) return;

  var $infoBlock = $('.truyencv-detail-info-block');

  ebookTitle = $infoBlock.find('h1').text().trim();
  ebookAuthor = $infoBlock.find('.author').text().trim();
  ebookCover = $infoBlock.find('.img-responsive').attr('src');
  ebookDesc = $('.brief').html();

  var $ebookType = $infoBlock.find('.categories a');
  if ($ebookType.length)
    $ebookType.each(function () {
      ebookType.push($(this).text().trim());
    });

  jepub = new jEpub();
  jepub
    .init({
      title: ebookTitle,
      author: ebookAuthor,
      publisher: host,
      description: ebookDesc,
      tags: ebookType,
    })
    .uuid(referrer);

  $download.insertAfter('#btnregistRecentReadingStory');
  $download.one('click contextmenu', function (e) {
    e.preventDefault();
    var showChapList = $('.truyencv-detail-block a[href="#truyencv-detail-chap"]');

    document.title = '[...] Vui lòng chờ trong giây lát';

    showChapList = showChapList.attr('onclick');
    showChapList = showChapList.match(/\(([^()]+)\)/)[1];
    showChapList = showChapList.match(/[^',]+/g);

    $.ajax({
      type: 'POST',
      url: '/index.php',
      data: {
        showChapter: 1,
        media_id: showChapList[0],
        number: showChapList[1],
        page: showChapList[2],
        type: showChapList[3],
      },
      contentType: 'application/x-www-form-urlencoded',
    })
      .done(function (response) {
        chapList = response.match(/(?:href=")[^")]+(?=")/g);
        if (response.indexOf('panel panel-vip') === -1) chapList = chapList.reverse();
        chapList = chapList.map(function (val) {
          val = val.slice(6, -1);
          val = val.replace(referrer, '');
          return val;
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
      .fail(function (err) {
        $download.text('Lỗi danh mục');
        downloadStatus('danger');
        console.error(err);
      });
  });
})(jQuery, window, document);
