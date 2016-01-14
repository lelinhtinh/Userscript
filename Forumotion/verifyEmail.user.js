// ==UserScript==
// @name        Verify Email
// @namespace   http://devs.forumvi.com
// @description [Only Forumotion] ACP >> Users & Groups >> Users >> Search users: Click on Email address
// @include     http://*/admin/index.forum*part=users_groups*sub=users*
// @include     http://*/admin/index.forum*sub=user*part=users_groups*
// @include     https://www.google.com/accounts/recovery/?Email=*
// @include     https://account.live.com/ResetPassword.aspx*
// @include     https://edit.yahoo.com/forgot?stage=fe100
// @author      Zzbaivong
// @version     1.0.0
// @grant       none
// ==/UserScript==

(function() {

    "use strict";

    var win = window,
        doc = document,
        local = location,
        host = local.host;

    win.onload = function() {

        if (host === "www.google.com" && local.search.indexOf("accounterror=") === -1) {

            doc.getElementsByName("preoption")[0].click();
            doc.getElementsByTagName("form")[0].submit();

        } else if (host === "account.live.com") {

            doc.getElementById("whyReset0").click();
            doc.getElementById("resetPwdWhyAction").click();
            setTimeout(function() {
                doc.getElementById("iSigninName").value = win.name;
            }, 200);

        } else if (host === "edit.yahoo.com") {

            doc.getElementById("login").value = win.name;
            doc.getElementById("saveBtn").click();

        } else {

            $("#main-content").find("table").find('a[href^="/profile?mode=email"]').on("click", function(e) {
                e.preventDefault();
                var mail = this.textContent,
                    hostMail = mail.split("@")[1].toLowerCase(),
                    urlMail = "";
                if (hostMail === "gmail.com") {
                    urlMail = "https://www.google.com/accounts/recovery/?Email=" + mail;
                } else if (hostMail === "outlook.com" || hostMail === "hotmail.com" || hostMail === "live.com") {
                    urlMail = "https://account.live.com/ResetPassword.aspx";
                } else if (hostMail === "yahoo.com" || hostMail === "ymail.com" || hostMail === "yahoo.com.vn") {
                    urlMail = "https://edit.yahoo.com/forgot?stage=fe100";
                }
                win.open(urlMail, mail);
            });

        }

    };

})();