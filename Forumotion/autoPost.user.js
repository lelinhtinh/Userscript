// ==UserScript==
// @name         Forumotion autopost
// @namespace    http://devs.forumvi.com/
// @version      0.1
// @description  Tự động đăng bài từ nguồn tin RSS
// @author       Zzbaivong
// @match        http://free24h.clubme.net/
// @match        http://ctrlv.123.st/
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js
// @resource     loadIcon http://i.imgur.com/m3NXDa6.gif
// @resource     disableIcon http://i.imgur.com/06GXmA1.png
// @resource     errorIcon http://i.imgur.com/ffXpTVP.gif
// @resource     successIcon http://i.imgur.com/R7Y7JtX.gif
// @resource     postIcon http://i.imgur.com/s7hhTCo.png
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceURL
// @grant        GM_addStyle
// ==/UserScript==


// ======== Chỉnh trong ACP ======== //

/*
ACP >> QLTT >> Forum >> Security:
Unauthorize unofficial forms to post messages and private messages on the forum : No

ACP >> General >> Messages and e-mails >> Configuration:
Allow keywords tags : All members
*/

// ======== Thêm vào CSS ======== //

/*
div[align="center"] img {
    display: block;
}
*/

// ======== Không chỉnh sửa code bên dưới ======== //

GM_addStyle("\
#autoPost_wrap {\
position: fixed;\
width: 500px;\
padding: 10px 15px;\
left: -444px;\
top: auto;\
bottom: -11px;\
background: #FFF;\
border-right: 2px solid #444;\
box-shadow: 2px 0 6px rgba(0, 0, 0, 0.4), 2px 0 6px rgba(0, 0, 0, 0.4);\
transition: .2s;\
}\
#autoPost_wrap.active {\
left: 0;\
top: 0;\
bottom: 0;\
}\
#autoPost_head {\
height: 70px;\
line-height: 70px;\
background: url(" + GM_getResourceURL("postIcon") + ") no-repeat right center transparent;\
border-bottom: 1px solid #999;\
cursor: pointer;\
}\
#autoPost_head > h1 {\
font-size: 46px;\
font-weight: 100;\
color: #2196F3;\
text-transform: uppercase;\
}\
#autoPost_container {\
padding: 30px 15px 70px;\
position: absolute;\
top: 70px;\
bottom: 0;\
left: 0;\
width: 100%;\
box-sizing: border-box;\
}\
#autoPost_list {\
height: 100%;\
overflow: auto;\
}\
#autoPost_input {\
display: block;\
width: 100%;\
border: 1px solid #999;\
padding: 10px 7px;\
box-sizing: border-box;\
background: #f4f4f4;\
color: #D09100;\
font-size: 16px;\
}\
#autoPost_list > li {\
padding: 5px 0;\
list-style: none;\
}\
#autoPost_list > li > label:hover {\
color: #2196F3;\
cursor: pointer;\
}\
#autoPost_list img {\
width: 14px;\
height: 14px;\
}\
.autoPost_footer {\
position: absolute;\
bottom: 0;\
left: 0;\
right: 0;\
height: 50px;\
background: #f2f2f2;\
text-align: center;\
}\
.autoPost_button {\
height: 36px;\
margin: 7px;\
padding: 0 30px;\
border: 0;\
color: #fff;\
background: #03B998;\
font-size: 15px;\
font-weight: bold;\
}\
.autoPost_button.autoPost_submit {\
background: #F55E3C;\
}\
.autoPost_button:hover {\
background: #2196F3;\
cursor: pointer;\
}\
.autoPost_button:disabled {\
background: #888;\
cursor: not-allowed;\
color: #ccc;\
}\
#autoPost_form > p {\
margin-bottom: 20px;\
}\
");

function trimCDATA(txt) {
    return txt.replace(/^<\!-?-?\[CDATA\[\s?|\s?\]\]-?-?>$/g, "");
}

function viTime(time) {
    var a = (new Date(time)).toString().split(/\s/);
    return a[2] + "/" + {
        Jan: "01",
        Feb: "02",
        Mar: "03",
        Apr: "04",
        May: "05",
        Jun: "06",
        Jul: "07",
        Aug: "08",
        Sep: "09",
        Oct: "10",
        Nov: "11",
        Dec: "12"
    }[a[1]] + "/" + a[3] + " " + a[4]
}

function autoPost(){
    var current = links[count],
        $currLink = $('.autoPost_item[value="' + links[count] + '"]');
    $currLink.hide().after('<img src="' + GM_getResourceURL('loadIcon') + '" style="vertical-align: middle; margin-top: -3px;">');
    console.log(current, "Tải nội dung");
    GM_xmlhttpRequest({
        method: "GET",
        url: current,
        onload: function(response) {
            var $source = $(response.responseText),
                h1 = $source.find("h1").text(),
                excerpt = $source.find(".news-content-excerpt").text(),
                $content = $source.find(".content-post"),
                $keyword = $source.find(".news-tags").find("a"),
                key = "Từ khóa: ",
                txt = "[b]" + excerpt + "[/b]\n\n";

            $content.find("img").replaceWith(function() {
                return "[img]" + $(this).attr("src") + "[/img]\n";
            });
            $content.find("strong").replaceWith(function() {
                return "[b]" + $.trim($(this).text()) + "[/b]";
            });
            $content.find("em").replaceWith(function() {
                return "[i]" + $.trim($(this).text()) + "[/i]";
            });
            $content.find('div[style="text-align: center;"]').replaceWith(function() {
                return "[center]" + $.trim($(this).text()) + "[/center]";
            });
            $content.find("figure").replaceWith(function() {
                return "[center]" + $.trim($(this).text()) + "[/center]";
            });
            $content.find("table").replaceWith(function() {
                return "[quote]" + $.trim($(this).text()) + "[/quote]";
            });
            $content.find("div, p").replaceWith(function() {
                return $.trim($(this).text()) + "\n\n";
            });
            txt += $.trim($content.text().replace(/\n+/g, "\n\n"));

            $keyword.each(function(i, v){
                var $this = $(this);
                key += "#" + $this.text().replace(/\s/g, "-") + " ";
            });
            txt += "\n\n[hr]\n" + key;

            console.log(h1, "Đăng bài");

            $.post("/post", {
                mode: "newtopic",
                f: forum_id,
                subject: h1,
                message: txt,
                post: "Ok"
            }).done(function (data) {
                var $topic = $(data).find("p.message").find('a[href^="/viewtopic?"]');
                if($topic.length) {
                    $list.find('a[href="' + current + '"]').after(' <a target="_blank" href="' + $topic.attr('href') + '"><em>(Xem bài đăng)</em></a>');

                    $currLink.next().attr("src", GM_getResourceURL("successIcon"));
                    console.log($topic.attr("href"), "Đăng bài thành công");

                    count += 1;
                    if(count < links.length) {
                        setTimeout(function(){
                            autoPost();
                        }, 10000);
                    } else {
                        console.log("Hoàn thành việc đăng bài.");
                    }
                } else {
                    $currLink.next().attr("src", GM_getResourceURL("errorIcon"));
                    console.warn(current, "Lỗi đăng bài");
                }

            }).fail(function () {
                $currLink.next().attr("src", GM_getResourceURL("errorIcon"));
                console.warn(current, "Lỗi kết nối");
            });
        }
    });
}

var $wrap = $("<div>", {
    id: "autoPost_wrap"
}),
    $header = $("<div>", {
        id: "autoPost_head",
        html: '<h1>RSS Auto-post</h1>'
    }),
    $container = $("<div>", {
        id: "autoPost_container"
    }),
    $form = $("<form>", {
        id: "autoPost_form"
    }),
    $input = $("<input>", {
        id: "autoPost_input",
        type: "url",
        placeholder: "Nhập đường dẫn RSS vào đây",
        required: true
    }),
    $select = $("<select>", {
        id: "autoPost_select",
        html: '<option></option>',
        required: true
    }),
    $buttons = $("<div>", {
        id: "autoPost_buttons",
        "class": "autoPost_footer",
        html: '<input type="reset" value="Làm mới" class="autoPost_button autoPost_reset"><input type="submit" value="Xác nhận" class="autoPost_button autoPost_submit">'
    }),
    $list = $("<ul>", {
        id: "autoPost_list",
        css: {
            display: "none"
        }
    }),
    $footer = $("<div>", {
        id: "autoPost_footer",
        "class": "autoPost_footer",
        css: {
            display: "none"
        }
    }),
    $submit = $("<button>", {
        type: "button",
        text: "Bắt đầu đăng",
        "class": "autoPost_button autoPost_submit"
    }),
    $reset = $("<button>", {
        type: "button",
        text: "Quay lại",
        "class": "autoPost_button autoPost_reset"
    });

var links = [],
    forum_id = -1,
    count = 0;

$("body").append($wrap.append($header).append($container.append($form.append('<label for="autoPost_input">Nguồn tin RSS:</label>').append($input).append('<p><small><strong>Ví dụ:</strong> http://tintuc.vn/rss/suc-khoe.rss</small></p>').append('<label for="autoPost_select">Chọn chuyên mục đăng bài: </label>').append($select).append($buttons)).append($list)).append($footer.append($reset).append($submit)));

$form.on("submit", function(e){
    e.preventDefault();
    forum_id = $select.val().match(/\d+/)[0];
    $list.html('<li><img src="' + GM_getResourceURL('loadIcon') + '" style="vertical-align: middle; margin-top: -4px;"> Đang tải dữ liệu...</li>');
    $form.slideUp();
    $list.slideDown();
    GM_xmlhttpRequest({
        method: "GET",
        url: $input.val(),
        onload: function(response) {
            var $xml = $(response.responseText),
                items = "";
            $list.empty();
            $xml.find("item").each(function(){
                var $this = $(this),
                    title = trimCDATA($this.find("title").text()),
                    link = trimCDATA($this.find("guid").html()),
                    desc = trimCDATA($this.find("description").text()),
                    date = viTime($this.find("pubDate").text());
                console.log(desc);
                items += '<li><label><input class="autoPost_item" type="checkbox" checked value="' + link + '"> <span title="' + desc + '">' + title + '</span></label> <a target="_blank" href="' + link + '"><em>(Đọc tin)</em></a></li>';
            });
            $list.html(items);
            $footer.fadeIn();
        }
    });
});

$header.on("click", function(e){
    $wrap.toggleClass("active");
});

var options = "";
$("#qjump").find("option[value^='f']").each(function(){
    options += '<option value="' + this.value + '">' + $(this).text().replace(/^[\s\|-]*/, '') + '</option>'
});
$select.append(options);

$reset.on("click", function(e){
    e.preventDefault();
    $footer.fadeOut();
    $form.slideDown();
    $list.slideUp();
    $submit.prop("disabled", false);
});

$submit.on("click", function(e){
    e.preventDefault();
    $submit.prop("disabled", true);
    $(".autoPost_item:checked").each(function(i, v){
        links[i] = v.value;
    });
    console.log(links);
    $(".autoPost_item:not(:checked)").hide().after('<img src="' + GM_getResourceURL('disableIcon') + '" style="vertical-align: middle; margin-top: -3px;">');
    $(".autoPost_item").prop("disabled", true);
    autoPost();
});
