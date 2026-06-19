namespace gServer_0._0._1.Models
{
    public class ServiceResult<T>
    {
        public bool Success { get; set; }     // Chuẩn bool để check nhanh
        public string Message { get; set; }   // Lưu câu thông báo: "Trùng tên layer rồi!"
        public string Fail { get; set; }
        public T Data { get; set; }           // Nơi chứa Id mới hoặc nguyên cái Object mới tạo
    }
}