// ==UserScript==
// @name         TruyenYY downloader
// @namespace    http://devs.forumvi.com/
// @description  Tải truyện từ truyenyy.com định dạng html. Sau đó, bạn có thể dùng Mobipocket Creator để tạo ebook prc
// @version      1.2.0
// @icon         http://i.imgur.com/obHcq8v.png
// @author       Zzbaivong
// @license      MIT
// @match        http://truyenyy.com/truyen/*
// @match        https://truyenyy.com/truyen/*
// @require      https://code.jquery.com/jquery-2.2.4.min.js
// @require      https://greasyfork.org/scripts/18532-filesaver/code/FileSaver.js?version=135609
// @noframes
// @connect      self
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function ($, window, document, undefined) {

    'use strict';

    function downloadFail(url, wait) {

        console.log('%cError: ' + url, 'color:red;');
        $download.html('<i class="icon-repeat icon-white"></i> Resume...').css('background', 'red');
        disableClick = false;

        setTimeout(function () {
            $download.trigger('click');
        }, (wait ? 100000 : 3000));

    }

    function getContent(url) {
        $.get(url).done(function (response) {

            var $data = $(response),
                title = $data.find('h1').text().trim(),
                $chapter = $data.find('#id_noidung_chuong'),
                $notContent = $chapter.find('script, style'),
                $referrer = $chapter.find('[style]').filter(function () {
                    return (this.style.fontSize === '1px' || this.style.color === 'white');
                });

            if ($chapter.length && title !== 'Chương thứ yyy: Ra đảo') {

                console.log('%cComplete: ' + url, 'color:green;');
                $download.html('<i class="icon-refresh icon-white"></i> ' + count + '/' + max).css('background', 'orange');

                if ($notContent.length) $notContent.remove();
                if ($referrer.length) $referrer.remove();
                txt += '<h2 class="title">' + title + '</h2>' + $chapter.html();

                ++count;
                getChapter();

            } else {
                downloadFail(url, true);
            }

        }).fail(function (err) {

            downloadFail(url);
            console.error(err);

        });
    }

    function getChapter() {

        var fileName = path.slice(8, -1) + '_' + begin + '-' + end + '.htm',
            blob;

        if (count > max) {

            txt = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><h1><font color="red">' + $('h1').text() + '</font></h1><h3><font color="blue">' + $('.lww p:eq(0)').text() + '</font></h3><h3><font color="green">' + $('.lww p:eq(1)').text() + '</font></h3><h3><font color="gray">Tổng số chương: ' + (end - begin + 1) + '</font></h3><br><br>' + credits + '<br><br><br>' + txt + '</body></html>';

            blob = new Blob([txt], {
                type: 'text/html'
            });

            $download.attr({
                href: window.URL.createObjectURL(blob),
                download: fileName
            }).html('<i class="icon-ok icon-white"></i> Download Finished!').css('background', 'green').off('click');

            $(window).off('beforeunload');

            console.log('%cDownload Finished!', 'color:blue;');

            saveAs(blob, fileName);

        } else {

            url = path.replace('/truyen/', '/doc-truyen/') + 'chuong-' + count;

            getContent(url);

        }

    }


    var $download = $('[href="#dschuong"]'),
        count = 1,
        max = parseInt($('.ip5').first().find('a').attr('href').match(/\/chuong-(\d+)\/$/)[1], 10),
        begin,
        end,
        txt = '',
        enablePrompt = true,
        disableClick = false,
        path = location.pathname,
        url,
        credits = '<p>Truyện được tải từ: TruyenYY - http://truyenyy.com</p><p>Userscript được viết bởi: Zzbaivong - http://devs.forumvi.com</p>';

    window.URL = window.URL || window.webkitURL;

    $download.html('<i class="icon-download icon-white"></i> Download').css('background', 'orange').on('click', function (e) {

        e.preventDefault();

        if (disableClick) return;

        if (enablePrompt) {

            begin = prompt('Chọn Chương bắt đầu tải', count);
            end = prompt('Chọn Chương kết thúc tải', max);

            if (begin !== null && /^\d+$/.test(begin)) {
                begin = parseInt(begin, 10);
                count = begin;
            } else {
                begin = count;
            }

            if (end !== null && /^\d+$/.test(end)) {
                end = parseInt(end, 10);
                if (end > count) {
                    max = end;
                } else {
                    max = count;
                    end = count;
                }
            } else {
                end = max;
            }

            $(window).on('beforeunload', function () {
                return 'Truyện đang được tải xuống...';
            });

            enablePrompt = false;

        }

        getChapter();

        disableClick = true;

    });

})(jQuery, window, document);
