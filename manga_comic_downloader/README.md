# Manga Comic Downloader

Tải truyện tranh từ các trang chia sẻ ở Việt Nam.

![manga comic downloader](https://github.com/lelinhtinh/Userscript/raw/master/manga_comic_downloader/screenshot/mangacomic.png)

## Hướng dẫn

### Cơ bản

1. Vào trang đọc truyện tranh, phần danh sách truyện.
1. Right-click lên liên kết chương truyện cần tải *(Hoặc Hold nếu dùng mobile)*.
1. Nhấn tổ hợp phím `Alt+Y` hoặc chọn **Download All Chapters** từ Scripts commands để tải toàn bộ.

### Nâng cao

- **Bỏ qua chương**: Hold phím `Ctrl+Shift` và Click lên liên kết, sau đó khi tải toàn bộ, những chương này sẽ bị bỏ qua.
- **Tải nhiều chương**: Hold phím `Ctrl` và Click lên liên kết, khi thả phím `Ctrl` ra việc tải sẽ bắt đầu, chỉ những chương vừa chọn và theo thứ tự đã Click.
- **Gộp nhiều chương**: Tương tự **Tải nhiều chương**, thay phím `Ctrl` bằng `Shift`. Những chương đã chọn sẽ được gộp vào chung một file khi tải.
- **Gộp toàn bộ**: Nhấn tổ hợp phím `Shift+Alt+Y` hoặc chọn **Download All To One File** từ Scripts commands để tải toàn bộ vào một file duy nhất.

## Lưu ý

- Chỉ có thể tải một chương truyện mỗi lần, bạn cần phải đợi tiến trình hiện tại hoàn thành. Sau đó mới có thể tải chương truyện khác.
- Vì script yêu cầu quyền truy cập nội dung trên mọi trang web *(`@connect *`)* nên **Tampermonkey** sẽ có hiện cảnh báo. Chọn **Always allow all domains** để bỏ qua.

### Danh sách host hỗ trợ

1. <http://truyentranh8.com/>, <http://truyentranh8.net/>, <http://truyentranh8.org/>, <http://truyentranh869.com/>, <http://truyentranh86.com/>
1. <https://mangaxy.com/>
1. <https://truyentranh.net/>
1. <https://hamtruyen.com/>
1. <https://www.a3mnga.com/>
1. <http://truyentranhtuan.com/>
1. <https://truyentranhlh.net/>
1. <https://truyenhay24h.com/>
1. <https://thichtruyentranh.com/>
1. <http://hentailxx.com/>, <http://lxhentai.com>
1. <https://hentaivn.moe/>
1. <https://otakusan.net/Manga>
1. <https://ngonphong.com/>
1. <http://www.nettruyen.com/>, <http://nhattruyen.com/>, <http://nettruyenapp.com/>, <http://nettruyentop.com/>, <http://nettruyenonline.com/>, <http://www.nettruyenpro.com/>, <http://www.nettruyengo.com>
1. <http://www.hamtruyentranh.net/>
1. <https://ttmanga.com/>
1. <http://truyen.vnsharing.site/>
1. <https://blogtruyen.com/>, <https://blogtruyen.vn/>, <https://blogtruyen.top/>
1. <https://truyensieuhay.com/>
1. <http://truyenqq.com/>, <http://truyenqq.net/>, <http://truyenqqtop.com/>, <http://truyenqqpro.com/>
1. <https://hentaicube.net/>, <https://hentaicb.top/>
1. <http://tuthienbao.com/>
1. <https://vietcomic.net/>
1. <https://hamtruyentranh.com/>
1. <https://khotruyentranhz.com/>
1. <https://truyenvn.com/>
1. <https://saytruyen.net/>, <https://saytruyen.com/>, <https://sayhentai.net/>, <https://sayhentai.tv/>
1. <https://cocomic.net/>

#### Mobile

1. <http://m.hentailxx.com/>, <http://m.lxhentai.com>
1. <https://m.blogtruyen.com/>, <https://m.blogtruyen.vn/>, <https://m.blogtruyen.top/>

## Video từng bước cài đặt

Nhấp vào ảnh để xem video hướng dẫn

### PC

[![Hướng dẫn tải truyện tranh bằng PC](https://img.youtube.com/vi/Aw9c5pqRYGk/0.jpg)](https://www.youtube.com/watch?v=Aw9c5pqRYGk)

### Điện thoại Android

[![Hướng dẫn tải truyện tranh bằng điện thoại](https://img.youtube.com/vi/3bdvW3FCpak/0.jpg)](https://www.youtube.com/watch?v=3bdvW3FCpak)

Kể từ bản [cập nhật 27/08/2020](https://blog.mozilla.org/blog/2020/08/25/introducing-a-new-firefox-for-android-experience/), Firefox Mobile đã thay đổi engine khiến hầu hết add-on không còn sử dụng bình thường được nữa.

- Thay vì cài Firefox Mobile như cũ, chọn 1 trong 2 trình duyệt dưới đây:

   1. **Iceraven** - bản fork sử dụng engine cũ của Firefox Mobile:
      - Tìm bản phát hành mới nhất [tại đây](https://github.com/fork-maintainers/iceraven-browser/releases/latest).
      - Tải file APK có chứa tên mã **arm64** và cài đặt.
   1. **Firefox Nightly** - bản thử nghiệm của Firefox Mobile:
      - Cài đặt [Firefox Nightly](https://play.google.com/store/apps/details?id=org.mozilla.fenix) từ Google Play.
      - Vào mục **Về Firefox Nightly**.
      - Nhấn 5 lần vào logo, đến khi xuất hiện **Menu gỡ lỗi đã được kích hoạt** là được.
      - Vào mục **Bộ sưu tập tiện ích tùy chỉnh** vừa xuất hiện, chọn và điền các thông tin sau:
        - Chủ sở hữu bộ sưu tập: `16669371`
        - Tên bộ sưu tập: `lelinhtinh`

- Vào mục **Tiện ích**, tìm và cài `Violentmonkey` hoặc `Tampermonkey` *(chỉ cài 1 trong 2)*.
- Cài script tại [OpenUserJS](https://openuserjs.org/scripts/baivong/manga_comic_downloader), hoặc [SleazyFork](https://sleazyfork.org/scripts/369802-manga-comic-downloader).
