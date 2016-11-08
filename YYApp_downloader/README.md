# YYApp downloader

Tải truyện từ **app.truyenyy.com** định dạng htm. Sau đó, bạn có thể dùng Mobipocket Creator để tạo ebook prc.

## Demo

![YYApp downloader](https://raw.githubusercontent.com/baivong/Userscript/master/YYApp_downloader/screenshot/yyapp.png)

## Hướng dẫn

### Tải truyện

Script hoạt động sẽ tạo ra nút **Tải xuống** tại trang giới thiệu truyện, click vào sẽ tải bộ truyện đó. Bạn cũng có thể theo dõi quá trình trong **Console** (F12 > console), nếu chương truyện lỗi sẽ hiện link màu đỏ.

Khi quá trình tải hoàn tất, định dạng file tải xuống là **ten-truyen.html**.

### Tạo Ebook

Tải phần mềm [Mobipocket Creator](http://www.mobipocket.com/en/downloadsoft/DownloadCreator.asp).

Sau khi cài đặt, chạy Mobipocket Creator, trong mục **Import From Exiting File**, nhấp vào **HTML document**.

Tại trang **Import from HTML document**:

1. Choose a file: Nhấn **Browse...**, chọn file truyện bạn vừa tải trước đó.
2. Create publication in folder: Đây là vị trí chứa ebook sau khi tạo, nên **để mặc định**.
3. Language: Chọn **Vietnamese**.
4. Encoding: Chọn **UTF-8**.

Nhấn nút **Import**.

Để tạo mục lục cho các chương truyện, chọn mục **Table of contents**, nhấn nút **Add a Table of contents**.

Bạn điền vào 3 ô trên dòng **First level** lần lượt là:

1. Tagname: **h2**
2. Attribute: **class**
3. Value: **title**

Nhấn nút **Update**.

Đến đây bạn đã hoàn thành những việc cần thiết để tạo Ebook, Nhấn menu **Build**(F7) ở phía trên, sau đó chọn nút **Build** ở trang hiện ra để tạo Ebook định dạng prc. File này sẽ được lưu ở thư mục bạn chọn ở **Create publication in folder**. Trong thư mục này còn chứa một số file cấu hình khác, bạn có thể xóa chúng đi.

Nếu muốn chỉnh Ebook chi tiết hơn, trước khi build, bạn có thể điều chỉnh 2 mục **Conver Image** và **Metadata**. Nhớ nhấn nút **Update** sau khi điều chỉnh.

## Chú ý

Nếu cần chuyển đổi sang định dạng khác như .epub, .mobi, ... để đọc trên điện thoại, máy đọc sách, ... bạn có thể dùng công cụ trực tuyến như [ToePub](http://toepub.com/vi/), [Zamzar](http://www.zamzar.com/). Hoặc, dùng phần mềm [Calibre](http://calibre-ebook.com/download), [Hamster ebook converter](http://vi.hamstersoft.com/free-ebook-converter/).

### Các script tương tự

* [TruyenCV downloader](https://github.com/baivong/Userscript/tree/master/truyenCV_downloader).
* [TruyenYY downloader](https://github.com/baivong/Userscript/tree/master/truyenYY_downloader).
