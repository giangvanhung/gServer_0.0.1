Ext.define('gClient.view.EditLayer.LayerViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.LayerViewController', 

    // 1. CREATE
    onAddLayer: function(button) {
        var grid = this.getView(),
            store = grid.getStore(),
            plugin = grid.getPlugin('rowedit'); 

        var newLayer = store.insert(0, {
            Name: 'Lớp bản đồ mới',
            Source: 'Dữ liệu nội bộ',
            LayerType: 'POINT',
            Opacity: 1.0
        })[0];
        
        if (plugin) {
            var column = grid.getColumns()[1]; 
            plugin.startEdit(newLayer, column);
        }
    },

    // 2 & 3. UPDATE / SAVE CREATE
    onEditComplete: function (grid, location) {
        var record = location ? location.record : null,
            store = grid.getStore();
            // Ext.log(store);

        if (!record || !store) return;

        Ext.toast({
            message: 'Đang xử lý đồng bộ cơ sở dữ liệu...',
            timeout: 1500,
            alignment: 'b'
        });

        store.sync({
            success: function(batch) {
                Ext.toast({ message: 'Cập nhật dữ liệu thành công!', timeout: 2000, alignment: 'b' });
                store.load(); 
            },
            failure: function(batch) {
                var error = batch.getOperations()[0].getError();
                Ext.Msg.alert('Thất bại', 'Lỗi đồng bộ: ' + (error || 'Không kết nối được máy chủ.'));
                store.load(); 
            }
        });
    },

    // 4. DELETE
    // 4. DELETE
onDeleteLayer: function() {
    var grid = this.getView(),
        store = grid.getStore(),
        selection = grid.getSelection(); 

    // Kiểm tra an toàn xem có bản ghi nào được chọn không
    if (!selection) {
        Ext.Msg.alert('Thông báo', 'Vui lòng chọn một lớp bản đồ để xóa!');
        return;
    }
    
    // Nếu selection trả về một mảng, lấy phần tử đầu tiên. Nếu là đối tượng Record thì dùng luôn.
    var record = selection.isModel ? selection : (Ext.isArray(selection) ? selection[0] : null);

    if (!record) {
        Ext.Msg.alert('Thông báo', 'Vui lòng chọn một lớp bản đồ để xóa!');
        return;
    }

    Ext.Msg.confirm(
        'Xác nhận xóa', 
        'Bạn có chắc chắn muốn xóa lớp: <b>' + record.get('Name') + '</b>?<br/>Hành động này không thể hoàn tác.', 
        function(buttonId) {
            if (buttonId === 'yes') {
                store.remove(record); // Truyền chính xác bản ghi cần xóa
                
                store.sync({
                    success: function() {
                        Ext.toast({ message: 'Đã xóa lớp bản đồ thành công!', timeout: 2000, alignment: 'b' });
                    },
                    failure: function(batch) {
                        var error = batch.getOperations()[0].getError();
                        Ext.Msg.alert('Lỗi', 'Không thể xóa dữ liệu: ' + (error || 'Lỗi hệ thống'));
                        store.load(); 
                    }
                });
            }
        }
    );
},

    // 5. CANCEL
    onEditCancelled: function (grid, location) {
    var store = grid.getStore(),
        record = location ? location.record : null;

    if (!record || !store) return;

    if (record.phantom) { 
        store.remove(record);
        return;
    }

    if (record.dirty) {
        record.reject(); // Hoàn tác tại chỗ cực mượt, không cần reload store
    }
}
});