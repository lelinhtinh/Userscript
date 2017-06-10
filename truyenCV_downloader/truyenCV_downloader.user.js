// ==UserScript==
// @name         TruyenCV downloader
// @namespace    http://devs.forumvi.com/
// @description  Tải truyện từ truyencv.com định dạng html. Sau đó, bạn có thể dùng Mobipocket Creator để tạo ebook prc
// @version      2.0.1
// @icon         http://i.imgur.com/o5cmtkU.png
// @author       Zzbaivong
// @license      MIT
// @match        http://truyencv.com/*/
// @require      https://code.jquery.com/jquery-3.2.0.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.0.2/handlebars.min.js
// @require      https://greasyfork.org/scripts/20307-jszip-v2/code/jszip-v2.js?version=196156
// @require      https://greasyfork.org/scripts/29904-jszip-utils/code/jszip-utils.js?version=196137
// @require      https://greasyfork.org/scripts/18532-filesaver/code/FileSaver.js?version=164030
// @require      https://greasyfork.org/scripts/29905-js-epub-maker/code/js-epub-maker.js?version=196139
// @noframes
// @connect      self
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

/* global EpubMaker */
(function ($, window, document) {
    'use strict';

    /**
     * Hiển thị liên kết xem online cuối chương
     * [>]
     * @type {Boolean} true
     *                 false
     */
    var readOnline = true;


    function cleanHtml(str) {
        str = str.replace(/&nbsp\;/gm, ' ');
        str = str.replace(/<(br|hr|img)([^>]+)?>/gm, '<$1$2 />');
        return '<p>' + str + '</p>';
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

        epubMaker.withSection(new EpubMaker.Section('note', 'note', {
            content: beginEnd + titleError + '<br /><br />' + credits,
            title: 'Ghi chú'
        }, false, true));

        epubMaker.downloadEpub(function (epubZipContent, filename) {
            document.title = '[⇓] ' + ebookTitle;
            $win.off('beforeunload');
            $download.attr({
                href: window.URL.createObjectURL(epubZipContent),
                download: filename
            }).text('Tải xong').off('click');
            $downloadStatus('success');
        });
    }

    function getContent() {
        if (endDownload) return;
        chapId = chapList[count];

        GM_xmlhttpRequest({
            method: 'GET',
            url: pathname + chapId + '/',
            onload: function (response) {
                var $data = $(response.responseText),
                    $chapter = $data.find('#js-truyencv-content'),
                    $notContent = $chapter.find('script, style, a, div, p:last'),
                    $referrer = $chapter.find('[style]').filter(function () {
                        return (this.style.fontSize === '1px' || this.style.fontSize === '0px' || this.style.color === 'white');
                    });

                if (endDownload) return;

                chapTitle = $data.find('#js-truyencv-read-content .title').text().trim();

                if (!$chapter.length) {
                    downloadError('Missing content.');
                } else {
                    $downloadStatus('warning');

                    if ($notContent.length) $notContent.remove();
                    if ($referrer.length) $referrer.remove();

                    var $img = $chapter.find('img');
                    if ($img.length) $img.replaceWith(function () {
                        return '<br /><a href="' + this.src + '">Click để xem ảnh</a><br />';
                    });

                    epubMaker.withSection(new EpubMaker.Section('chapter', chapId, {
                        content: cleanHtml($chapter.html()) + chapRef(referrer + chapId),
                        title: chapTitle
                    }, true, false));

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

    function downloadEbook() {
        var $infoBlock = $('.truyencv-detail-info-block'),
            $ebookType = $infoBlock.find('.categories a');

        ebookTitle = $infoBlock.find('h1').text().trim();
        ebookAuthor = $infoBlock.find('.author').text().trim();
        ebookCover = $infoBlock.find('.img-responsive').attr('src');

        if ($ebookType.length) {
            $ebookType.each(function () {
                ebookType.push($(this).text().trim());
            });
            ebookType = ebookType.join(', ');
            ebookType = '<p><strong>Thể loại:</strong> ' + ebookType + '</p>';
        } else {
            ebookType = '';
        }

        epubMaker = new EpubMaker()
            .withUuid('github.com/baivong/Userscript::truyencv::' + pathname.slice(1, -1))
            .withTemplate('idpf-wasteland')
            .withAuthor(ebookAuthor)
            .withLanguage('vi')
            .withModificationDate(new Date)
            .withCover(ebookCover)
            .withTitle(ebookTitle);

        epubMaker.withSection(new EpubMaker.Section('introduction', 'info', {
            content: '<h1>' + ebookTitle + '</h1><p><strong>Tác giả:</strong> ' + ebookAuthor + '</p>' + ebookType,
            title: 'Giới thiệu'
        }, false, true));

        epubMaker.withSection(new EpubMaker.Section('preamble', 'content', {
            content: cleanHtml($('#truyencv-detail-introduction .brief').html()),
            title: 'Nội dung'
        }, false, true));


        $win.on('beforeunload', function () {
            return 'Truyện đang được tải xuống...';
        });

        $download.one('click', function (e) {
            e.preventDefault();
            saveEbook();
        });

        getContent();
    }


    var pageName = document.title,
        $win = $(window),
        $download = $('<a>', {
            class: 'btn btn-truyencv',
            href: '#download',
            text: 'Tải xuống'
        }),
        $downloadStatus = function (status) {
            $download.removeClass('btn-truyencv btn-primary btn-success btn-info btn-warning btn-danger').addClass('btn-' + status);
        },

        $novelId = $('.basic'),
        chapList = [],
        chapListSize = 0,
        chapId = '',
        chapTitle = '',
        pathname = location.pathname,
        count = 0,
        begin = '',
        end = '',
        endDownload = false,

        ebookTitle = '',
        ebookAuthor = '',
        ebookCover = '',
        ebookType = [],
        beginEnd = '',
        titleError = [],
        referrer = location.origin + pathname,
        credits = '<p>Truyện được tải từ <a href="' + referrer + '">TruyenCV</a></p><p>Userscript được viết bởi: <a href="https://baivong.github.io/">Zzbaivong</a></p>',
        chapRef = function (ref) {
            return readOnline ? '<p><a href="' + ref + '/" target="_blank">[>]</a></p>' : '';
        },

        epubMaker;


    if (!$novelId.length) return;

    $download.appendTo('.info .buttons');
    $download.one('click contextmenu', function (e) {
        e.preventDefault();
        var showChapList = $('.truyencv-detail-block a[href="#truyencv-detail-chap"]');

        document.title = '[...] Vui lòng chờ trong giây lát';

        showChapList = showChapList.attr('onclick');
        showChapList = showChapList.match(/\(([^\(\)]+)\)/)[1];
        showChapList = showChapList.match(/[^',]+/g);

        $.post('/index.php', {
            showChapter: 1,
            media_id: showChapList[0],
            number: showChapList[1],
            page: showChapList[2],
            type: showChapList[3]
        }).done(function (data) {
            chapList = data.match(/(?:href\=")[^"\)]+(?=")/g);
            chapList = chapList.reverse();
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
            if (chapListSize > 0) downloadEbook();
        }).fail(function (jqXHR, textStatus) {
            downloadError(textStatus);
        });
    });

})(jQuery, window, document);
