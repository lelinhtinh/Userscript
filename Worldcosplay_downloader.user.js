// ==UserScript==
// @name         Worldcosplay download
// @namespace    http://devs.forumvi.com/
// @version      1.0.1
// @description  Download photo(s) on worldcosplay.net
// @author       Zzbaivong
// @icon         http://worldcosplay.net/assets/logo-94d9f272d8eaf6faf23afb3513259e3e.png
// @match        http://worldcosplay.net/photo/*
// @match        http://worldcosplay.net/member/*/photos*
// @match        http://worldcosplay.net/member/*/favorites*
// @match        http://worldcosplay.net/tag/*
// @match        http://worldcosplay.net/search/photos?*
// @require      https://code.jquery.com/jquery-2.2.0.min.js
// @require      https://openuserjs.org/src/libs/baivong/FileSaver.min.js
// @require      https://openuserjs.org/src/libs/baivong/waitForKeyElements.min.js
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function($, window, document, undefined) {
    "use strict";

    window.URL = window.URL || window.webkitURL;

    function downloadPhoto(el, url) {
        var photoName = url.replace(/.*\//g, "");
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            responseType: "blob",
            onload: function(response) {
                var blob = response.response;
                saveAs(blob, photoName);
                $(el).attr({
                    href: window.URL.createObjectURL(blob),
                    download: photoName
                }).removeAttr("onclick");
            },
            onerror: function(err) {
                console.error(err);
            }
        });
    }

    if (!location.pathname.indexOf("/photo/")) {

        var $btn = $("<a>", {
            href: "#download",
            "class": "download-this-photo",
            html: '<div class="side_buttons" style="right: 220px;"><div class="like-this-photo button fave fa fa-download"><div class="effect-ripple"></div></div></div>'
        });
        $btn.on("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            downloadPhoto(this, $("#photoContainer").find(".img").attr("src"));
        });
        $btn.insertAfter(".side_buttons");

    } else {

        var addBtn = function() {
            $(".photo_img", "#content").not(".added-download-btn").each(function() {
                var $this = $(this),
                    $btn = $("<a>", {
                        href: "#download",
                        "class": "download-this-photo",
                        html: '<div class="item likes" style="top: 50px;"><span class="like-this-photo"><i class="fa fa-download"></i><span class="effect-ripple"></span></span></div>'
                    });
                $btn.on("click", function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    downloadPhoto(this, $this.attr("data-src").replace("sq300/", ""));
                });
                $btn.insertAfter($this.parent());
                $this.addClass("added-download-btn");
            });
        };
        addBtn();

        waitForKeyElements(".photo_thumb", addBtn);

    }

})(jQuery, window, document);