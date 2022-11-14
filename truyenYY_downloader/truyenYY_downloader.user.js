// ==UserScript==
// @name            TruyenYY downloader
// @name:vi         TruyenYY downloader
// @namespace       http://devs.forumvi.com/
// @description     Tải truyện từ TruyenYY định dạng EPUB.
// @description:vi  Tải truyện từ TruyenYY định dạng EPUB.
// @version         4.10.7
// @icon            https://i.imgur.com/1HkQv2b.png
// @author          Zzbaivong
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           https://truyenyy.vip/truyen/*/
// @require         https://code.jquery.com/jquery-3.6.0.min.js
// @require         https://unpkg.com/jszip@3.1.5/dist/jszip.min.js
// @require         https://unpkg.com/file-saver@2.0.4/dist/FileSaver.min.js
// @require         https://unpkg.com/ejs@3.1.6/ejs.min.js
// @require         https://unpkg.com/jepub@2.1.4/dist/jepub.min.js
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @connect         vnvl.net
// @connect         codeprime.net
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-end
// @grant           GM_xmlhttpRequest
// @grant           GM.xmlHttpRequest
// @grant           GM_addStyle
// @inject-into     auto
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
    return new Promise(function (resolve, reject) {
      var $recaptcha = $chapter.siblings('script[src^="https://www.google.com/recaptcha/api.js"]'),
        vipScript = $chapter.next('script').text(),
        vipUrl = vipScript.match(/const\s+url\s*=\s*("|')([^\1]+?)(\1)/i)[2],
        vipContent = '';

      var getVipContent = function (token) {
        $.get(vipUrl + '0' + '&ggc=' + token).done(function (data) {
          if (data.ok) {
            vipContent += data.content;
            $.get(vipUrl + '1').done(function (data) {
              if (data.ok) {
                vipContent += data.content;
                $.get(vipUrl + '2').done(function (data) {
                  if (data.ok) {
                    vipContent += data.content;

                    vipContent = vipContent.replace(/<(?!\d)[a-z_\d$]*\s+style=.+?<\/(?!\d)[a-z_\d$]*>/g, '');
                    vipContent = vipContent.replace(/<style>.+?<\/style>/g, '');
                    vipContent = vipContent.replace(/<\/?([^p]|[^/\\>]{2,})\/?>/g, '');
                    resolve(vipContent);
                  } else {
                    reject('Lỗi lấy nội dung chương VIP (2)');
                  }
                });
              } else {
                reject('Lỗi lấy nội dung chương VIP (1)');
              }
            });
          } else {
            if (data.msg) {
              reject(data.msg);
            } else {
              reject('Lỗi lấy nội dung chương VIP');
            }
          }
        });
      };

      if ($recaptcha.length) {
        var recaptchaUrl = $recaptcha.attr('src'),
          recaptchaScript = $recaptcha.next('script').text(),
          widgetId = recaptchaScript.match(/grecaptcha\.execute\(("|')([^\1]+?)?\1/i)[2];

        $.getScript(recaptchaUrl).done(function () {
          /* global grecaptcha */
          grecaptcha.ready(function () {
            grecaptcha
              .execute(widgetId, {
                action: 'validate_captcha',
              })
              .then(function (token) {
                getVipContent(token);
              });
          });
        });
      } else {
        getVipContent('');
      }
    });
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
    $download.text('Bắt đầu tạo EPUB');

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
          $chapter = $data.find('#inner_chap_content_1'),
          $notContent = $chapter.find('iframe, script, style, a'),
          $referrer = $chapter.find('[style]').filter(function () {
            return this.style.fontSize === '1px' || this.style.fontSize === '0px' || this.style.color === 'white';
          }),
          chapContent,
          $next = $data.find('.weui-btn.weui-btn_primary');

        if (endDownload) return;

        chapTitle =  'Chương ' + chapId.match(/\d+/)[0] + ' - ' + $data.find('.chapter .heading-font.mt-2').text().trim();
        if (chapTitle === '') chapTitle = 'Chương ' + chapId.match(/\d+/)[0];

        if (!$chapter.length) {
          if ($data.find('#btn_buy').length) {
            chapContent = downloadError('Chương VIP');
          } else if ($data.find('.chapter a[href="/register/"]').length) {
            chapContent = downloadError('Chương yêu cầu đăng nhập');
          } else if ($data.find('.chapter img[src="https://yystatic.codeprime.net/img/app-qrcode.png"]').length) {
            chapContent = downloadError('Chỉ đọc trên app');
          } else {
            chapContent = downloadError('Không có nội dung');
          }
        } else {
          if ($chapter.find('#vip-content-placeholder').length) {
            downloadVip($chapter)
              .then(function (chapContent) {
                addChap(cleanHtml(chapContent), $next);
              })
              .catch(function (err) {
                addChap(downloadError(err));
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
              chapContent = cleanHtml($chapter.html());
            }
          }
        }

        addChap(chapContent, $next);
      })
      .fail(function (err) {
        chapTitle = null;
        downloadError('Kết nối không ổn định', err);
        saveEbook();
      });

    function addChap(chapContent, $next) {
      jepub.add(chapTitle, chapContent);

      if (count === 0) begin = chapTitle;
      end = chapTitle;

      $download.html('Đang tải <strong>' + count + '/' + chapListSize + '</strong>');

      ++count;
      document.title = '[' + count + '] ' + pageName;

      if (!$next.length) {
        saveEbook();
      } else {
        getContent(downloadId($next.attr('href')));
      }
    }
  }

  var pathname = location.pathname;
  if (/\/(danh-sach-chuong|binh-luan|ung-ho|de-cu(\/add)?|kim-phieu|van-de|fans|nhan-vat)\/?$/i.test(pathname)) return;
  $('#summary_markdown').css('max-height', 1000).find('button, p.font-italic').remove();

  var pageName = document.title,
    $download = $('<a></a>', {
      href: '#download',
      class: 'btn btn-warning weui-btn weui-btn_inline',
      text: 'Tải xuống',
    }),
    downloadStatus = function (status) {
      $download
        .removeClass('btn-primary btn-success btn-info btn-warning btn-danger text-light text-dark')
        .addClass('btn-' + status + ' text-' + (status === 'warning' ? 'dark' : 'light'));
    },
    downloadId = function (url) {
      return url.trim().replace(/^.*\//, '');
    },
    $novelInfo = $('.novel-info, .novel-meta'),
    chapListSize = $('.info .numbers li:first, .novel-meta td:contains("Số chương")+td').text().replace(/[^\d]/g, ''),
    chapId = '',
    chapTitle = '',
    count = 0,
    begin = '',
    end = '',
    endDownload = false,
    ebookTitle = $('h1.name, h1.title').text().trim(),
    ebookAuthor = $('h2.author, .info a[href^="/tac-gia/"]').text().trim(),
    ebookCover = $('.novel-info .cover img, .novel-cover img').data('src'),
    ebookDesc = $('#id_novel_summary, #summary_markdown').html(),
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

  GM_addStyle(
    '.text-light{color:#f8f9fa!important}.text-dark{color:#343a40!important}.btn-primary{color:#fff;background-color:#4497f8;border-color:#4497f8}.btn-primary:hover{color:#fff;background-color:#69acf9;border-color:#69acf9;box-shadow:none}.btn-primary:active{color:#fff;background-color:#418fec;border-color:#418fec}.btn-info{color:#fff;background-color:#17a2b8;border-color:#17a2b8}.btn-info:hover,.btn-info:focus{color:#fff;background-color:#138496;border-color:#117a8b}.btn-info:active{color:#fff;background-color:#117a8b;border-color:#10707f}.btn-success{color:#fff;background-color:#29bf4a;border-color:#29bf4a}.btn-success:hover,.btn-success:focus{color:#fff;background-color:#54cc6e;border-color:#54cc6e;box-shadow:none}.btn-success:active{color:#fff;background-color:#27b546;border-color:#27b546}.btn-danger{color:#fff;background-color:#f5222d;border-color:#f5222d}.btn-danger:hover,.btn-danger:focus{color:#fff;background-color:#f74e57;border-color:#f74e57;box-shadow:none}.btn-danger:active{color:#fff;background-color:#e9202b;border-color:#e9202b}.btn-warning{color:#212529;background-color:#ffc107;border-color:#ffc107}.btn-warning:hover,.btn-warning:focus{color:#212529;background-color:#ffcd39;border-color:#ffcd39;box-shadow:none}.btn-warning:active{color:#212529;background-color:#f2b707;border-color:#f2b707}',
  );

  var $ebookType = $('.tag-list.list-unstyled.mt-2 a, .novel-meta td:contains("Thể loại")+td a');
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

  $download.insertAfter('.info .btn-primary, #root_novel_stars');
  $download.before('\r\n');
  $download.one('click contextmenu', function (e) {
    e.preventDefault();
    document.title = '[...] Vui lòng chờ trong giây lát';

    var firstChap = $('.info .btn:contains("Đọc Từ Đầu"), #root_novel_buttons .weui-btn:contains("Đọc Từ Đầu"), .weui-btn:contains("Đọc Tiếp")');
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
