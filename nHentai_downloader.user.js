// ==UserScript==
// @name        nHentai Downloader
// @namespace   http://devs.forumvi.com
// @description Download manga on nHentai.net
// @include     http://nhentai.net/g/*
// @version     1.1.1
// @author      Zzbaivong
// @require     https://code.jquery.com/jquery-2.2.0.min.js
// @require     https://openuserjs.org/src/libs/baivong/jszip.min.js
// @require     https://openuserjs.org/src/libs/baivong/FileSaver.min.js
// @grant       GM_xmlhttpRequest
// ==/UserScript==

jQuery(function($) {
    "use strict";

    function deferredAddZip(i, filename) {
        var deferred = $.Deferred();

        GM_xmlhttpRequest({
            method: "GET",
            url: images[i],
            responseType: "arraybuffer",
            onload: function(response) {
                zip.file(filename, response.response);
                $download.html('<i class="fa fa-cog fa-spin"></i> ' + (++current) + '/' + total);
                deferred.resolve(response);
            },
            onerror: function(err) {
                console.error(err);
                deferred.reject(err);
            }
        });

        return deferred;
    }

    var zip = new JSZip(),
        prevZip = false,
        deferreds = [],
        current = 0,
        total = 0,
        images = [],
        $download = $("#download"),
        doc = document,
        tit = doc.title;

    window.URL = window.URL || window.webkitURL;

    $download.one("click", function(e) {
        e.preventDefault();

        $download.attr("href", "javascript:;");

        $(window).on("beforeunload", function() {
            return "Progress is running...";
        });

        $download.html('<i class="fa fa-cog fa-spin"></i> Waiting...').css("backgroundColor", "orange");

        $(".lazyload").each(function(i, v) {
            images[i] = "http:" + $(this).attr("data-src").replace("t.n", "i.n").replace(/\/(\d+)t\./, "/$1.");
        });

        total = images.length;

        $.each(images, function(i, v) {
            var filename = v.replace(/.*\//g, "");

            deferreds.push(deferredAddZip(i, filename));
        });

        $.when.apply($, deferreds).done(function() {
            var blob = zip.generate({
                    type: "blob"
                }),
                zipName = tit.split(" » ")[0].replace(/\s/g, "_") + ".zip";

            saveAs(blob, zipName);

            if (prevZip) {
                window.URL.revokeObjectURL(prevZip);
            }
            prevZip = blob;

            $download.html('<i class="fa fa-check"></i> Complete').css("backgroundColor", "green").attr({
                href: window.URL.createObjectURL(prevZip),
                download: zipName
            });

            doc.title = "[⇓] " + tit;

        }).fail(function(err) {
            $download.html('<i class="fa fa-exclamation"></i> Fail').css("backgroundColor", "red");
            console.error(err);
        }).always(function() {
            $(window).off("beforeunload");
        });

    });

});