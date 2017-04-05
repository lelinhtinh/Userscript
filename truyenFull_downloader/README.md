# TruyenFull downloader

Tải truyện từ **truyenfull.vn** định dạng txt hoặc html. Sau đó, bạn có thể dùng Mobipocket Creator để tạo ebook prc.

## Demo

![TruyenFull downloader](https://raw.githubusercontent.com/baivong/Userscript/master/TruyenFull_downloader/screenshot/TruyenFull.png)

## Hướng dẫn

### Tải truyện

Script hoạt động sẽ tạo ra nút **Tải xuống** tại trang giới thiệu truyện, click vào sẽ tải bộ truyện đó.
Bạn có thể theo dõi quá trình trong **Console** *(F12 > console)*, nếu chương truyện lỗi sẽ hiện link màu đỏ.

Khi quá trình tải hoàn tất, định dạng file tải xuống là **txt**. Nếu bạn muốn sử dụng định dạng **html**, hãy chỉnh tham số `textOnly` trong mã nguồn thành `false`.

#### Chọn chương bắt đầu tải

Click chuột phải trên nút **Tải xuống** và nhập URL của chương cần bắt đầu vào khung nhập liệu, tiến trình sẽ bắt đầu từ chương đó đến cuối danh sách.

#### Tải từng chương riêng biệt

Nhấn vào nút **Danh Sách Chương** và Click chuột phải trên liên kết chương cần tải trong danh mục.

#### Dừng và tải xuống

Khi gặp lỗi trong quá trình tải mà không thể tiếp tục, tiến trình sẽ tự dừng và tải truyện.
Bạn có thể dừng và tải truyện ngay lập tức bằng cách click vào nút **Tải xuống** khi tiến trình đang chạy.

### Đọc truyện

Với định dạng **txt**, bạn có thể đọc trực tiếp bằng các **Ebook Reader** phổ biến trên thiết bị của bạn. Ví dụ:

* Windows: [MobiPocket Reader](http://w7.getpedia.net/data/soft/2015/09/17/mobireadersetup.msi).
* Windows Phone: [Bookviser Reader](http://www.windowsphone.com/s?appid=25bef109-9a3a-44a4-ba58-177cd642d143). Nên tạo tài khoản [Bookviser](http://bookviser.com/) để lưu trữ và đồng bộ tiến trình đọc sách. Đối với file txt, bạn chỉ có thể sửa thông tin sách sau khi upload truyện vào tài khoản.
* Linux: [FBReader](https://fbreader.org/content/fbreader-beta-linux-desktop).
* Android: [AlReader](https://play.google.com/store/apps/details?id=com.neverland.alreader).

Định dạng **html** thường không được hỗ trợ đọc trực tiếp hoặc có nhiều hạn chế, bạn nên chuyển sang dạng **prc** theo hướng dẫn dưới đây.

### Tạo ebook prc

Tải phần mềm [Mobipocket Creator](http://download.cnet.com/Mobipocket-Creator/3000-13455_4-75451639.html). Khi cài đặt, nên chọn phiên bản **Creator Home Edition**.

Sau khi cài đặt hoàn tất, chạy Mobipocket Creator, trong mục **Import From Exiting File**, nhấp vào **HTML document**.

Tại trang **Import from HTML document**:

1. Choose a file: Nhấn **Browse...**, chọn file truyện bạn vừa tải trước đó.
1. Create publication in folder: Đây là vị trí chứa ebook sau khi tạo, nên **để mặc định**.
1. Language: Chọn **Vietnamese**.
1. Encoding: Chọn **UTF-8**.

Nhấn nút **Import**.

Sau khi import thành công, bạn sẽ được chuyển đến trang cấu hình cho Ebook.

Mục **Conver Image** là nơi bạn chèn ảnh bìa cho Ebook. Nhấn nút **Add a Conver image** và chọn ảnh bạn muốn làm bìa rồi nhấn nút **Update**.

Để tạo mục lục cho các chương truyện, chọn mục **Table of contents**, nhấn nút **Add a Table of contents**.

Ở phần **Table of Contents Title**, bạn điền: **Mục lục** vào ô nhập liệu.

Phần **Table of Contents Generation rules**, bạn điền vào 3 ô trên dòng **First level** lần lượt là:

1. Tagname: **h2**
1. Attribute: **class**
1. Value: **title**

Nhấn nút **Update**.

Đến đây bạn đã hoàn thành những việc cần thiết để tạo Ebook, Nhấn menu **Build** ở phía trên, sau đó chọn nút **Build** ở trang hiện ra để tạo Ebook định dạng **prc**. File này sẽ được lưu ở thư mục bạn chọn ở **Create publication in folder**. Trong thư mục này còn chứa một số file cấu hình khác, bạn có thể xóa chúng đi.
