// ==UserScript==
// @name         TruyenCV downloader
// @namespace    http://devs.forumvi.com/
// @version      1.1.0
// @description  Tải truyện từ truyencv.com định dạng html. Sau đó, bạn có thể dùng Mobipocket Creator để tạo ebook prc
// @author       Zzbaivong
// @icon         http://truyencv.com/templates/truyencv/images/logo.png
// @match        http://truyencv.com/*/
// @require      http://code.jquery.com/jquery-2.2.1.min.js
// @require      http://openuserjs.org/src/libs/baivong/FileSaver.min.js
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function ($, window, document, undefined) {

    'use strict';

    window.URL = window.URL || window.webkitURL;

    function downloadFail() {
        console.log('%c' + url, 'color:red;');
        $download.text('Resume...').css('background', 'red');
        disableClick = false;
    }

    function getChapter() {

        var path = location.pathname,
            url = path + 'chuong-' + count,
            fileName = path.slice(1, -1) + '_' + begin + '-' + end + '.html',
            blob;

        if (count > max) {

            txt = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><h1><font color="red">' + $('h1').text() + '</font></h1><h3><font color="blue">' + $('#poster p:eq(3)').text() + '</font></h3><h3><font color="green">' + $('#poster p:eq(4)').text() + '</font></h3><h3>Chương từ ' + begin + ' đến ' + end + '</h3><br><br><br><br><br>' + txt + '<p><br><br><br><br><br>-- Hết --</p><br><br><br><br><br><p>Truyện được tải từ: TruyenCV - http://truyencv.com</p><p>Scipt được viết bởi: Zzbaivong - http://devs.forumvi.com</p></body></html>';

            blob = new Blob([txt], {
                type: 'text/html'
            });

            saveAs(blob, fileName);

            $download.attr({
                href: window.URL.createObjectURL(blob),
                download: fileName
            }).text('Download Finished!').css('background', 'green').off('click');

            $(window).off("beforeunload");

            console.log('%cDownload Finished!', 'color:blue;');

        } else {

            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: function (response) {

                    var $data = $(response.response),
                        title = $data.find('h2.text-muted').html(),
                        $chapter = $data.find('.chapter');

                    if ($chapter.length) {
                        console.log('%c' + url, 'color:green;');
                        $download.text(count + '/' + max);
                        ++count;
                    } else {
                        downloadFail();
                    }

                    $chapter.find('font, p:last').remove();
                    txt += '<h2 class="title">' + title + '</h2>' + $chapter.html();

                    getChapter();

                },
                onerror: function (err) {
                    downloadFail();
                    console.error(err);
                }
            });

        }

    }


    var $download = $('[href="#dsc"]'),
        count = 1,
        max = parseInt($('.listchapter').eq($('.listchapter').length - 2).find('.latestchaper').eq(0).find('a').attr('href').match(/chuong-(\d+)/)[1], 10),
        begin,
        end,
        txt = '',
        enablePrompt = true,
        disableClick = false;

    $download.text('Download').css('background', 'orange').on('click', function (e) {
        e.preventDefault();

        if (disableClick) {
            return;
        }

        if (enablePrompt) {

            begin = prompt("Chọn Chương bắt đầu tải", count);
            end = prompt("Chọn Chương kết thúc tải", max);

            if (begin !== null && /^\d+$/.test(begin)) {
                begin = parseInt(begin, 10);
                if (begin < max) {
                    count = begin;
                }
            } else {
                begin = count;
            }

            if (end !== null && /^\d+$/.test(end)) {
                end = parseInt(end, 10);
                if (end > count) {
                    max = end;
                }
            } else {
                end = max;
            }

            $(window).on("beforeunload", function () {
                return "Truyện đang được tải xuống...";
            });

            enablePrompt = false;
        }

        getChapter();

        disableClick = true;
    });

})(jQuery, window, document);
