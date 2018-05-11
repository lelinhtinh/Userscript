// ==UserScript==
// @name         TruyenCV downloader
// @namespace    http://devs.forumvi.com/
// @description  Tải truyện từ truyencv.com định dạng epub
// @version      4.0.0
// @icon         http://i.imgur.com/o5cmtkU.png
// @author       Zzbaivong
// @license      MIT; https://baivong.mit-license.org/license.txt
// @match        http://truyencv.com/*/
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// @require      https://unpkg.com/jepub/dist/jepub.js
// @require      https://cdn.jsdelivr.net/npm/file-saver@1.3.8/FileSaver.min.js
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @noframes
// @connect      self
// @supportURL   https://github.com/lelinhtinh/Userscript/issues
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// ==/UserScript==

(function ($, window, document) {
    'use strict';

    /**
     * Hiển thị liên kết xem online cuối chương
     * [>]
     * @type {Boolean} true
     *                 false
     */
    var readOnline = true;

    /**
     * Cookie tài khoản để tải chương bắt buộc đăng nhập
     * @type {String}
     */
    var accountKey = 'c65319af7693e3ad0dc5d72511fe0307';


    function cleanHtml(str) {
        str = str.replace(/\s*Chương\s*\d+\s?:[^<\n]/, '');
        str = str.replace(/&nbsp;/gm, ' ');
        str = str.replace(/<(br|hr|img)([^>]+)?>/gm, '<$1$2 />');
        str = str.replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]+/gm, ''); // eslint-disable-line
        str = str.replace(/\s[a-zA-Z0-9]{6,8}(="")?\s/gm, function (key, attr) {
            if (attr) return ' ';
            if (!isNaN(key)) return key;
            if (key.split(/[A-Z]/).length > 2) return ' ';
            if (key.split(/\d/).length > 1) return ' ';
            return key;
        });
        str = str.replace(/\([^(]+<button[^/]+<\/button>[^)]*\)\s*/gi, '');
        str = str.split(/(ps:|hoan nghênh quảng đại bạn đọc quang lâm|Huyền ảo khoái trí ân cừu)/i)[0];
        return '<div>' + str + '</div>';
    }

    function downloadError(err) {
        $downloadStatus('danger');
        titleError.push(chapTitle);
        console.error(err);
    }

    function saveEbook() {
        if (endDownload) return;
        endDownload = true;

        if (titleError.length) {
            titleError = '<p><strong>Các chương lỗi: </strong>' + titleError.join(', ') + '</p>';
        } else {
            titleError = '';
        }
        beginEnd = '<p>Nội dung từ <strong>' + begin + '</strong> đến <strong>' + end + '</strong></p>';

        jepub.notes(beginEnd + titleError + '<br /><br />' + credits);

        jepub.generate().then(function (epubZipContent) {
            document.title = '[⇓] ' + ebookTitle;
            $win.off('beforeunload');

            $download.attr({
                href: window.URL.createObjectURL(epubZipContent),
                download: ebookFilename
            }).text('Tải xong').off('click');
            $downloadStatus('success');

            saveAs(epubZipContent, ebookFilename);
        }).catch(function (err) {
            $downloadStatus('danger');
            console.error(err);
        });
    }

    function getContent() {
        if (endDownload) return;
        chapId = chapList[count];

        GM.xmlHttpRequest({
            headers: {
                'Cookie': 'USER=' + accountKey
            },
            method: 'GET',
            url: pathname + chapId + '/',
            onload: function (response) {
                var $data = $(response.responseText),
                    $chapter = $data.find('#js-truyencv-content'),
                    $notContent = $chapter.find('iframe, script, style, a, div, p:has(a[href*="truyencv.com"])'),
                    $referrer = $chapter.find('[style]').filter(function () {
                        return (this.style.fontSize === '1px' || this.style.fontSize === '0px' || this.style.color === 'white');
                    });

                if (endDownload) return;

                chapTitle = $data.find('#js-truyencv-read-content .title').text().trim();

                if (!$chapter.length) {
                    downloadError('Missing content.');
                } else {
                    $downloadStatus('warning');

                    if ($chapter.find('#btnChapterVip').length) {
                        $chapter = '<p>Chương truyện mất phí, không tải được.</p>';
                        downloadError('Require VIP.');
                    } else if ($chapter.filter(function () {
                        return (this.textContent.toLowerCase().indexOf('vui lòng đăng nhập để đọc chương này') !== -1);
                    }).length) {
                        $chapter = '<p>Chương truyện yêu cầu đăng nhập, không tải được.</p>';
                        downloadError('Require Login.');
                    } else {
                        if ($notContent.length) $notContent.remove();
                        if ($referrer.length) $referrer.remove();

                        if ($chapter.text().trim() === '') {
                            $chapter = '<p>Chương truyện không có nội dung.</p>';
                            downloadError('Content is empty.');
                        } else {
                            var $img = $chapter.find('img');
                            if ($img.length) $img.replaceWith(function () {
                                return '<br /><a href="' + this.src + '">Click để xem ảnh</a><br />';
                            });
                            $chapter = cleanHtml($chapter.html());
                        }
                    }

                    jepub.add(chapTitle, $chapter + chapRef(referrer + chapId));

                    if (count === 0) begin = chapTitle;
                    end = chapTitle;

                    $download.html('Đang tải: ' + Math.floor((count / chapListSize) * 100) + '%');

                    count++;
                    document.title = '[' + count + '] ' + pageName;
                    if (count >= chapListSize) {
                        saveEbook();
                    } else {
                        getContent();
                    }
                }
            },
            onerror: function (err) {
                downloadError(err);
                saveEbook();
            }
        });
    }


    var pageName = document.title,
        $win = $(window),
        $download = $('<a>', {
            class: 'btn btn-info',
            href: '#download',
            text: 'Tải xuống'
        }),
        $downloadStatus = function (status) {
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
        // ebookCover = '',
        // ebookDesc = '',
        // ebookType = [],
        beginEnd = '',
        titleError = [],

        host = location.host,
        pathname = location.pathname,
        referrer = location.protocol + '//' + host + pathname,

        ebookFilename = pathname.slice(1, -1) + '.epub',

        credits = '<p>Truyện được tải từ <a href="' + referrer + '">TruyenCV</a></p><p>Userscript được viết bởi: <a href="https://github.com/lelinhtinh/jEpub">Zzbaivong</a></p>',
        chapRef = function (ref) {
            return readOnline ? '<p><a href="' + ref + '/" target="_blank">[>]</a></p>' : '';
        },

        jepub;


    if (!$novelId.length) return;

    var $infoBlock = $('.truyencv-detail-info-block');

    ebookTitle = $infoBlock.find('h1').text().trim();
    ebookAuthor = $infoBlock.find('.author').text().trim();
    // ebookCover = $infoBlock.find('.img-responsive').attr('src');
    // ebookDesc = $('.brief').html(),

    // var $ebookType = $infoBlock.find('.categories a');
    // if ($ebookType.length) {
    //     $ebookType.each(function () {
    //         ebookType.push($(this).text().trim());
    //     });
    //     ebookType = ebookType.join(', ');
    //     ebookType = '<p><strong>Thể loại:</strong> ' + ebookType + '</p>';
    // } else {
    //     ebookType = '';
    // }

    jepub = new jEpub({
        title: ebookTitle,
        author: ebookAuthor,
        publisher: host
    }).uuid(referrer);

    $download.insertAfter('#btnregistRecentReadingStory');
    $download.one('click contextmenu', function (e) {
        e.preventDefault();
        var showChapList = $('.truyencv-detail-block a[href="#truyencv-detail-chap"]');

        document.title = '[...] Vui lòng chờ trong giây lát';

        showChapList = showChapList.attr('onclick');
        showChapList = showChapList.match(/\(([^()]+)\)/)[1];
        showChapList = showChapList.match(/[^',]+/g);

        GM.xmlHttpRequest({
            method: 'POST',
            url: '/index.php',
            data: 'showChapter=1&media_id=' + showChapList[0] + '&number=' + showChapList[1] + '&page=' + showChapList[2] + '&type=' + showChapList[3],
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            onload: function (response) {
                chapList = response.responseText.match(/(?:href=")[^")]+(?=")/g);
                if (response.responseText.indexOf('panel panel-vip') === -1) chapList = chapList.reverse();
                chapList = chapList.map(function (val) {
                    val = val.slice(6, -1);
                    val = val.replace(referrer, '');
                    return val;
                });

                if (e.type === 'contextmenu') {
                    var startFrom = prompt('Nhập ID chương truyện bắt đầu tải:', chapList[0]);
                    startFrom = chapList.indexOf(startFrom);
                    if (startFrom !== -1) chapList = chapList.slice(startFrom);
                }

                chapListSize = chapList.length;
                if (chapListSize > 0) {
                    $win.on('beforeunload', function () {
                        return 'Truyện đang được tải xuống...';
                    });

                    $download.one('click', function (e) {
                        e.preventDefault();
                        saveEbook();
                    });

                    getContent();
                }
            },
            onerror: function (err) {
                downloadError(err.statusText);
            }
        });
    });

})(jQuery, window, document);
