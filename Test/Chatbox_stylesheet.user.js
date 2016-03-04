// ==UserScript==
// @name        Chatbox stylesheet
// @namespace   http://devs.forumvi.com
// @description Add stylesheet to chabox
// @include     http://devs.forumvi.com/chatbox*
// @include     http://devs.forumvi.com/chatbox/*
// @include     http://devs.forumvi.com/post?mode=smilies
// @version     1.0.0
// @grant       none
// ==/UserScript==

var cssId = 'chatboxCss';
if (!document.getElementById(cssId))
{
    var head  = document.getElementsByTagName('head')[0];
    var link  = document.createElement('link');
    link.id   = cssId;
    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = 'http://localhost:8888/style.css';
    head.appendChild(link);
}