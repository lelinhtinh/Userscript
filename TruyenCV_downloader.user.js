// ==UserScript==
// @name         TruyenCV downloader
// @namespace    http://devs.forumvi.com/
// @version      1.0.0
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

    function getChapter() {

        ++count;

        var path = location.pathname,
            url = path + 'chuong-' + count,
            fileName = path.slice(1, -1) + '.html',
            blob;

        if (count > max) {

            txt = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body>' + txt + '<p><br><br><br><br><br>-- Hết --</p><br><br><br><br><br><p>Truyện được tải từ: TruyenCV - http://truyencv.com</p><p>Scipt được viết bởi: Zzbaivong - http://devs.forumvi.com</p></body></html>';

            blob = new Blob([txt], {
                type: 'text/html'
            });

            saveAs(blob, fileName);

            $download.attr({
                href: window.URL.createObjectURL(blob),
                download: fileName
            }).text('Download Finished!').off('click');

            $(window).off("beforeunload");

            console.log('%cDownload Finished!', 'color:blue;');

        } else {

            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: function (response) {

                    var $data = $(response.response),
                        $chapter = $data.find('.chapter');

                    if ($chapter.length) {
                        console.log('%c' + url, 'color:green;');
                        $download.text(count + '/' + max);
                    } else {
                        console.log('%c' + url, 'color:red;');
                    }

                    $chapter.find('font, p:last').remove();
                    txt += '<h2 class="title">' + $data.find('h2.text-muted').html() + '</h2>' + $chapter.html();

                    getChapter();

                },
                onerror: function (err) {
                    console.log('%c' + url, 'color:red;');
                    console.error(err);
                }
            });

        }

    }


    var $download = $('[href="#dsc"]'),
        count = 0,
        max = parseInt($('.listchapter').eq($('.listchapter').length - 2).find('.latestchaper').eq(0).find('a').attr('href').match(/chuong-(\d+)/)[1], 10),
        txt = '';

    $download.text('Download').on('click', function (e) {
        e.preventDefault();

        $(window).on("beforeunload", function () {
            return "Truyện đang được tải xuống...";
        });

        getChapter();
    });

})(jQuery, window, document);
