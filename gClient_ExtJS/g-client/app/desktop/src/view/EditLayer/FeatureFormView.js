Ext.define('gClient.desktop.src.view.EditLayer.FeatureFormView', {
    extend: 'Ext.form.Panel',
    xtype: 'gclient-featureformview',
    
    bodyPadding: 10,
    scrollable: true, // Cho phép cuộn nếu danh sách thuộc tính quá dài

    items: [
        {
            xtype: 'hiddenfield', // Ẩn ID đi, chỉ dùng khi lưu/edit
            name: 'Id'
        }
        // Các fields động sẽ được thêm vào đây bằng code (Coi ở mục 2)
    ],

    /**
     * Hàm tự động tạo các ô nhập liệu dựa trên cấu trúc thuộc tính (Properties)
     * @param {Object} propertiesConfig Ví dụ: { "ten_duong": "Text", "do_rong": "Number" }
     */
    setDynamicFields: function(propertiesConfig) {
        var me = this;
        
        // Xóa các ô động cũ nếu có (chỉ giữ lại ô Id ở vị trí số 0)
        while(me.getItems().getCount() > 1) {
            me.remove(me.getItems().getAt(1), true);
        }

        // Duyệt qua Dictionary để tạo trường tương ứng
        Ext.Object.each(propertiesConfig, function(key, value) {
            var fieldXtype = 'textfield'; // Mặc định
            
            // Bạn có thể bắt loại dữ liệu để hiển thị ô nhập cho đúng mã
            if (value === 'Number') fieldXtype = 'numberfield';
            if (value === 'Date') fieldXtype = 'datefield';

            me.add({
                xtype: fieldXtype,
                name: 'prop_' + key, // Đặt tiền tố 'prop_' để phân biệt với Id, GeomWkt
                fieldLabel: key,     // Tên hiển thị (Label) chính là Key của Dictionary
                margin: '0 0 10 0',
                labelWidth: 100,
                value: ''
            });
        });
    }
});