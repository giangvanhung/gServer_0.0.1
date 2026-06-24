Ext.define('gClient.view.EditLayer.LayerViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.LayerViewController', 
    requires: [
        'gClient.desktop.src.view.EditLayer.FeatureFormView' // Đường dẫn đến file chứa FormView của bạn
    ],
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
    },

    // Add Features
    onAddFeature: function(geomWktFromMap, layerFields) {
        var me = this; // Định nghĩa me để dùng bên trong các callback/event handler

        var win = Ext.create('Ext.window.Window', {
            title: 'Thêm Tính Năng',
            height: 400,
            width: 500,
            layout: 'fit', 
            modal: true,
            closable: true,
            
            items: {  
                xtype: 'gclient-featureformview'
            },
            
            buttons: [
                {
                    text: 'Lưu',
                    handler: function() {
                        // me lúc này trỏ chính xác đến ViewController
                        me.saveFeature(win, geomWktFromMap);
                    }
                },
                {
                    text: 'Hủy',
                    handler: function() { win.close(); }
                }
            ]
        });

        var form = win.down('gclient-featureformview');
        
        // Sử dụng cấu hình động được truyền từ bản đồ/grid sang
        // Nếu layerFields rỗng, mặc định hiển thị tạm bộ khung test
        var fieldsConfig = layerFields || { 'Name': 'Text', 'Length': 'Number' };
        form.setDynamicFields(fieldsConfig); 
        
        win.show();
    },

    // 2. MỞ POPUP CẬP NHẬT FEATURE
    onEditFeature: function(featureData) {
        var me = this;

        if (!featureData) {
            Ext.Msg.alert('Thông báo', 'Không có dữ liệu đối tượng để chỉnh sửa!');
            return;
        }

        var win = Ext.create('Ext.window.Window', {
            title: 'Chỉnh sửa Feature',
            height: 400,
            width: 500,
            layout: 'fit',
            modal: true,
            closable: true,
            items: { xtype: 'gclient-featureformview' },
            buttons: [
                {
                    text: 'Cập nhật',
                    handler: function() {
                        me.saveFeature(win, featureData.GeomWkt); 
                    }
                },
                {
                    text: 'Hủy',
                    handler: function() { win.close(); }
                }
            ]
        });

        var form = win.down('gclient-featureformview');
        
        // Tạo các ô nhập liệu dựa trên các thuộc tính động sẵn có của đối tượng
        form.setDynamicFields(featureData.Properties);

        // Đổ dữ liệu Id cũ vào cấu trúc phẳng của Form
        var formData = { Id: featureData.Id };
        
        // Map dữ liệu từ Dictionary vào cấu trúc prop_...
        Ext.Object.each(featureData.Properties, function(key, value) {
            formData['prop_' + key] = value;
        });
        
        form.setValues(formData); 
        win.show();
    },

    // 3. GOM DỮ LIỆU ĐÓNG GÓI VÀ SUBMIT QUA API
    saveFeature: function(win, geomWkt) {
        var formPanel = win.down('gclient-featureformview');
        if (!formPanel) return;

        var rawValues = formPanel.getValues(); 

        // Khởi tạo cấu trúc Object đồng nhất 100% với Class Feature ở Backend C#
        var featurePayload = {
            Id: rawValues.Id || null, 
            GeomWkt: geomWkt || '',
            Properties: {} 
        };

        // Lọc lấy các trường có tiền tố 'prop_' đưa lại vào Dictionary Properties
        Ext.Object.each(rawValues, function(key, value) {
            // Kiểm tra an toàn để chắc chắn thuộc tính là chuỗi trước khi sử dụng startsWith
            if (key && typeof key === 'string' && key.indexOf('prop_') === 0) {
                var originalKey = key.replace('prop_', ''); 
                featurePayload.Properties[originalKey] = value;
            }
        });

        // Ext.log('Dữ liệu chuẩn bị gửi lên C# API:', featurePayload);

        // Đặt hiệu ứng Loading cho Window trong khi chờ API phản hồi
        win.setLoading('Đang lưu dữ liệu...');

        Ext.Ajax.request({
            url: '/api/feature/save', 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            jsonData: featurePayload, 
            success: function(response) {
                win.setLoading(false);
                Ext.toast({ message: 'Đã lưu đối tượng thành công!', timeout: 2000, alignment: 'b' });
                win.close();
                // Nếu cần thiết reload lại grid/layer bản đồ, bạn gọi ở đây:
                // me.reloadLayerData();
            },
            failure: function(response) {
                win.setLoading(false);
                var errorText = response.responseText || 'Lỗi hệ thống hoặc kết nối.';
                Ext.Msg.alert('Lỗi', 'Không thể lưu dữ liệu: ' + errorText);
            }
        });
    },

    // 4. XEM CHI TIẾT FEATURE (CHỈ ĐỌC)
    onViewFeature: function(featureData) {
        // Tái sử dụng form bằng cách mở form Edit nhưng chuyển trạng thái thành ReadOnly
        this.onEditFeature(featureData);
        
        // Tìm cửa sổ vừa mở và tắt tính năng chỉnh sửa
        var activeWin = Ext.ComponentQuery.query('window[title=Chỉnh sửa Feature]')[0];
        if (activeWin) {
            activeWin.setTitle('Chi tiết Đối Tượng (Chỉ đọc)');
            var form = activeWin.down('gclient-featureformview');
            
            // Khóa tất cả các trường nhập liệu
            form.getFields().each(function(field) {
                field.setReadOnly(true);
            });
            
            // Ẩn nút Cập nhật (Nút đầu tiên trong thanh button)
            var saveBtn = activeWin.query('button[text=Cập nhật]')[0];
            if (saveBtn) saveBtn.hide();
        }
    }
});