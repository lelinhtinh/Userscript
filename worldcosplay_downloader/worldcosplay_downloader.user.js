// ==UserScript==
// @name         Worldcosplay download
// @namespace    http://devs.forumvi.com/
// @description  Download photo(s) on worldcosplay.net
// @version      3.0.0
// @icon         http://i.imgur.com/gJLjIzb.png
// @author       Zzbaivong
// @oujs:author  baivong
// @license      MIT; https://baivong.mit-license.org/license.txt
// @match        https://worldcosplay.net/*/photos*
// @match        https://worldcosplay.net/*/favorites*
// @match        https://worldcosplay.net/photo/*
// @match        https://worldcosplay.net/tag/*
// @match        https://worldcosplay.net/search/photos?*
// @match        https://worldcosplay.net/collections/*
// @match        https://worldcosplay.net/character/*
// @match        https://worldcosplay.net/title/*
// @match        https://worldcosplay.net/photos
// @match        https://worldcosplay.net/popular
// @match        https://worldcosplay.net/ranking/good*
// @match        https://worldcosplay.net/*/photo/*
// @match        https://worldcosplay.net/*/tag/*
// @match        https://worldcosplay.net/*/search/photos?*
// @match        https://worldcosplay.net/*/collections/*
// @match        https://worldcosplay.net/*/character/*
// @match        https://worldcosplay.net/*/title/*
// @match        https://worldcosplay.net/*/photos
// @match        https://worldcosplay.net/*/popular
// @match        https://worldcosplay.net/*/ranking/good*
// @require      https://code.jquery.com/jquery-3.3.1.slim.min.js
// @require      https://unpkg.com/file-saver@1.3.8/FileSaver.min.js
// @require      https://greasyfork.org/scripts/6250-waitforkeyelements/code/waitForKeyElements.js?version=23756
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @connect      self
// @supportURL   https://github.com/lelinhtinh/Userscript/issues
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// ==/UserScript==

/* global waitForKeyElements */
(function ($, window) {
    'use strict';

    window.URL = window.URL || window.webkitURL;

    function downloadPhoto(el, url) {
        var photoName = url.replace(/.*\//g, ''),
            $icon = $(el).find('i');

        $icon.addClass('fa-spinner fa-spin');

        GM.xmlHttpRequest({
            method: 'GET',
            url: url,
            responseType: 'blob',
            onload: function (response) {
                var blob = response.response;

                $(el).attr({
                    href: window.URL.createObjectURL(blob),
                    download: photoName
                }).off('click');
                $icon.removeClass('fa-spinner fa-spin').addClass('fa-download');

                saveAs(blob, photoName);
            },
            onerror: function (err) {
                $icon.removeClass('fa-spinner fa-spin').addClass('fa-times');
                console.error(err);
            }
        });
    }

    function getImage3000(url) {
        var hasMax = url.match(/\/max-(\d+)\//);
        if (hasMax) return url.replace(/-[\dx]+\./, '-' + hasMax[1] + '.');

        return url.replace(/-[\dx]+\./, '-3000.');
    }

    if (/^(\/[a-z-]+)?\/photo\/\d+$/.test(location.pathname)) {

        var $btn = $('<a>', {
            href: '#download',
            'class': 'download-this-photo',
            html: '<div class="side_buttons" style="right: 250px;"><div class="like-this-photo button fave fa fa-download"><div class="effect-ripple"></div></div></div>'
        });
        $btn.on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            downloadPhoto(this, getImage3000($('#photoContainer').find('.img').attr('src')));
        });
        $btn.insertAfter('.side_buttons');

    } else {

        var addBtn = function () {
            $('.preview').not('.added-download-btn').each(function () {
                var $this = $(this),
                    $btn = $('<a>', {
                        href: '#download',
                        'class': 'download-this-photo',
                        html: '<div class="item likes" style="top: 50px;"><span class="like-this-photo"><i class="fa fa-download"></i><span class="effect-ripple"></span></span></div>'
                    });
                $btn.on('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    downloadPhoto(this, getImage3000($this.find('.photo_img').css('backgroundImage').slice(5, -2)));
                });
                $this.find('.options').append($btn);
                $this.addClass('added-download-btn');
            });
        };
        addBtn();

        waitForKeyElements('.preview', addBtn);

    }

})(jQuery, window);
