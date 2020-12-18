// ==UserScript==
// @name            TruyenYY downloader
// @name:vi         TruyenYY downloader
// @namespace       http://devs.forumvi.com/
// @description     Tải truyện từ TruyenYY định dạng EPUB.
// @description:vi  Tải truyện từ TruyenYY định dạng EPUB.
// @version         4.8.6
// @icon            https://i.imgur.com/1HkQv2b.png
// @author          Zzbaivong
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           https://truyenyy.com/truyen/*/
// @match           https://truyenyy.vn/truyen/*/
// @require         https://code.jquery.com/jquery-3.5.1.min.js
// @require         https://unpkg.com/jszip@3.1.5/dist/jszip.min.js
// @require         https://unpkg.com/file-saver@2.0.2/dist/FileSaver.min.js
// @require         https://unpkg.com/ejs@2.7.4/ejs.min.js
// @require         https://unpkg.com/jepub@2.1.4/dist/jepub.min.js
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @connect         vnvl.net
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-end
// @grant           GM_xmlhttpRequest
// @grant           GM.xmlHttpRequest
// ==/UserScript==

(function ($, window, document) {
  'use strict';

  /**
   * Nhận cảnh báo khi có chương bị lỗi
   *
   * @type {Boolean}
   */
  var errorAlert = true;

  /**
   * Những đoạn ghi chú nguồn truyện
   * Toàn bộ nội dung ghi chú, có phân biệt hoa thường
   *
   * @type {Array}
   */
  var citeSources = [
    'Text được lấy tại truyenyy[.c]om',
    'truyện được lấy tại t.r.u.y.ệ.n.y-y',
    'Đọc Truyện Online mới nhất ở truyen/y/y/com',
    'Truyện được copy tại TruyệnYY.com',
    'nguồn t r u y ệ n y_y',
    'Bạn đang xem truyện được sao chép tại: t.r.u.y.e.n.y.y chấm c.o.m',
    'Nguồn tại http://truyenyy[.c]om',
    'xem tại tr.u.y.ệ.n.yy',
    'Bạn đang đọc chuyện tại Truyện.YY',
  ];

  /* === DO NOT CHANGE CODE BELOW THIS LINE === */

  function cleanHtml(str) {
    citeSources.forEach(function (source) {
      if (str.indexOf(source) !== -1) {
        str = str.replace(source, '');
        return false;
      }
    });
    str = str.replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]+/gm, ''); // eslint-disable-line
    return str;
  }

  function downloadError(mess, err) {
    downloadStatus('danger');
    if (err) console.error(mess);
    if (!chapTitle) return;

    titleError.push(chapTitle);
    if (errorAlert) errorAlert = confirm('Lỗi! ' + mess + '\nBạn có muốn tiếp tục nhận cảnh báo?');

    return '<p class="no-indent"><a href="' + referrer + chapId + '">' + mess + '</a></p>';
  }

  function downloadVip($chapter) {
    var script = $chapter.find('#vip-content-placeholder').siblings('script').first().text(),
      url = script.match(/var\s+url\s*=\s*("|')([^'"]+?)("|')/i)[2],
      parts = script.match(/(?<=\(url\s*\+\s*("|'))(\d+)(?=("|')\))/gi);

    return new Promise(function (resolve, reject) {
      if (!parts.length) {
        reject('Lỗi truy vấn chương VIP');
        return;
      }

      var vipContent = '';
      (function getVipContent() {
        if (!parts.length) {
          resolve(vipContent);
          return;
        }

        var partUrl = url + parts.shift();
        $.getJSON(partUrl)
          .done(function (data) {
            var content = data.content;
            if (!data.ok || !content) {
              reject('Lỗi lấy nội dung chương VIP');
              return;
            }

            content = content.replace(/<(?!\d)[a-z_\d$]*\s+style=.+?<\/(?!\d)[a-z_\d$]*>/g, '');
            content = content.replace(/<style>.+?<\/style>/g, '');
            content = content.replace(/<\/?([^p]|[^/\\>]{2,})\/?>/g, '');

            vipContent += content;
            getVipContent();
          })
          .fail(function () {
            reject('Lỗi kết nối chương VIP');
          });
      })();
    });
  }

  function beforeleaving(e) {
    e.preventDefault();
    e.returnValue = '';
  }

  function genEbook() {
    jepub
      .generate('blob', function (metadata) {
        $download.html(
          '<i class="iconfont icon-book"></i> Đang nén <strong>' + metadata.percent.toFixed(2) + '%</strong>',
        );
      })
      .then(function (epubZipContent) {
        document.title = '[⇓] ' + ebookTitle;
        window.removeEventListener('beforeunload', beforeleaving);

        $download
          .attr({
            href: window.URL.createObjectURL(epubZipContent),
            download: ebookFilename,
          })
          .html('<i class="iconfont icon-save"></i> Hoàn thành')
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
    $download.html('<i class="iconfont icon-layer"></i> Bắt đầu tạo EPUB');

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

  function getContent(pageId) {
    if (endDownload) return;
    chapId = pageId;

    $.get(pathname + chapId)
      .done(function (response) {
        var $data = $(response),
          $chapter = $data.find('#id_chap_content'),
          $notContent = $chapter.find('iframe, script, style, a'),
          $referrer = $chapter.find('[style]').filter(function () {
            return this.style.fontSize === '1px' || this.style.fontSize === '0px' || this.style.color === 'white';
          }),
          chapContent,
          $next = $data.find('.buttons .btn-primary');

        if (endDownload) return;

        chapTitle = $data.find('h1.chapter-title').text().trim();
        if (chapTitle === '') chapTitle = 'Chương ' + chapId.match(/\d+/)[0];

        if (!$chapter.length) {
          chapContent = downloadError('Không có nội dung');
        } else {
          if ($chapter.find('#btn_buy').length) {
            chapContent = downloadError('Chương VIP');
          } else if ($chapter.find('a[href="/register/"]').length) {
            chapContent = downloadError('Chương yêu cầu đăng nhập');
          } else if ($chapter.find('#vip-content-placeholder').length) {
            downloadVip($chapter)
              .then(function (chapContent) {
                handle(cleanHtml(chapContent), $next);
              })
              .catch(function (err) {
                handle(downloadError(err));
              });
            return;
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
              chapContent = cleanHtml($chapter.find('.inner').html());
            }
          }
        }

        handle(chapContent, $next);
      })
      .fail(function (err) {
        chapTitle = null;
        downloadError('Kết nối không ổn định', err);
        saveEbook();
      });

    function handle(chapContent, $next) {
      jepub.add(chapTitle, chapContent);

      if (count === 0) begin = chapTitle;
      end = chapTitle;

      $download.html('<i class="iconfont icon-more"></i> Đang tải <strong>' + count + '/' + chapListSize + '</strong>');

      ++count;
      document.title = '[' + count + '] ' + pageName;

      if ($next.hasClass('disabled')) {
        saveEbook();
      } else {
        getContent(downloadId($next.attr('href')));
      }
    }
  }

  var pathname = location.pathname;
  if (/\/(danh-sach-chuong|binh-luan|ung-ho|de-cu(\/add)?|kim-phieu|van-de|fans|nhan-vat)\/?$/i.test(pathname)) return;

  var pageName = document.title,
    $download = $('<a></a>', {
      href: '#download',
      class: 'btn btn-warning',
      html: '<i class="iconfont icon-download"></i> Tải xuống',
    }),
    downloadStatus = function (status) {
      $download
        .removeClass('btn-primary btn-success btn-info btn-warning btn-danger text-light text-dark')
        .addClass('btn-' + status + ' text-' + (status === 'warning' ? 'dark' : 'light'));
    },
    downloadId = function (url) {
      return url.trim().replace(/^.*\//, '');
    },
    $novelInfo = $('.novel-info'),
    chapListSize = $('.info .numbers li').eq(1).text().replace(/[^\d]/g, ''),
    chapId = '',
    chapTitle = '',
    count = 0,
    begin = '',
    end = '',
    endDownload = false,
    ebookTitle = $('h1.name').text().trim(),
    ebookAuthor = $('h2.author').text().trim(),
    ebookCover = $('.novel-info .cover img').data('src'),
    ebookDesc = $('#id_novel_summary').html(),
    ebookType = [],
    beginEnd = '',
    titleError = [],
    host = location.host,
    referrer = location.protocol + '//' + host + pathname,
    ebookFilename = pathname.slice(8, -1) + '.epub',
    credits =
      '<p>Truyện được tải từ <a href="' +
      referrer +
      '">TruyenYY</a></p><p>Userscript được viết bởi: <a href="https://lelinhtinh.github.io/jEpub/">Zzbaivong</a></p>',
    jepub;

  if (!$novelInfo.length) return;

  var $ebookType = $('a', '.tag-list.list-unstyled.mt-2');
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

  $download.insertAfter('#react-root_novel-base-buttons');
  $download.before('\r\n');
  $download.one('click contextmenu', function (e) {
    e.preventDefault();
    document.title = '[...] Vui lòng chờ trong giây lát';

    var firstChap = $('.info .btn:contains("Đọc Từ Đầu")');
    firstChap = downloadId(firstChap.attr('href'));
    var startFrom = firstChap;

    if (e.type === 'contextmenu') {
      $download.off('click');
      startFrom = prompt('Nhập ID chương truyện bắt đầu tải:', firstChap) || firstChap;
    } else {
      $download.off('contextmenu');
    }

    window.removeEventListener('beforeunload', beforeleaving);

    $download.one('click', function (e) {
      e.preventDefault();
      saveEbook();
    });

    getContent(startFrom);
  });
})(jQuery, window, document);
