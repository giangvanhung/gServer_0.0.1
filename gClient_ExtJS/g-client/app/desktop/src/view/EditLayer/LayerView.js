Ext.define('gClient.view.EditLayer.LayerView', {
    extend: 'Ext.grid.Grid',
    xtype: 'LayerView',
    reference: 'layerGrid',
    requires: [
        'Ext.grid.rowedit.Plugin',
        'Ext.MessageBox',
        'Ext.Toast', 
    ],
    
    controller: 'LayerViewController', 
    store: {
        type: 'LayerStore'
    },
    
    selectable: {
        rows: true, // Cho phép chọn dòng để Xóa
        multiple: false
    },

    grouped: true,
    groupFooter: {
        xtype: 'gridsummaryrow'
    },

    plugins: {
        rowedit: {
            autoConfirm: false
        }
    },
    
    // 🌟 BỔ SUNG TOOLBAR CHỨA NÚT THÊM & XÓA
    items: [{
        xtype: 'toolbar',
        docked: 'top',
        items: [
            {
                text: 'Thêm Lớp Mới',
                iconCls: 'x-fa fa-plus',
                ui: 'action',
                handler: 'onAddLayer' // Gọi hàm trong ViewController
            },
            {
                text: 'Xóa Lớp Chọn',
                iconCls: 'x-fa fa-trash',
                ui: 'decline',
                handler: 'onDeleteLayer', // Gọi hàm trong ViewController
                bind: {
                    disabled: '{!layerGrid.selection}' // Tự ẩn/hiện dựa trên việc có dòng nào được chọn không
                }
            },{
                text: 'Thêm Feature',
                iconCls: 'x-fa fa-plus',
                ui: 'action',
                handler: 'onAddFeature',
                bind: {
                    disabled: '{!layerGrid.selection}' // Tự ẩn/hiện dựa trên việc có dòng nào được chọn không
                }
            },{
                text: 'Xem Features',
                iconCls: 'x-fa fa-plus',
                ui: 'action',
                handler: 'onViewFeature',
                bind: {
                    disabled: '{!layerGrid.selection}' // Tự ẩn/hiện dựa trên việc có dòng nào được chọn không
                }
            },
            '->',
            {
                text: 'Tải lại',
                iconCls: 'x-fa fa-sync',
                handler: function(btn) {
                    btn.up('grid').getStore().load();
                }
            }
        ]
    }],
    
    columns: [
        {
            text: 'ID',
            dataIndex: 'Id',
            width: 70
        },
        {
            text: 'Tên Layer',
            dataIndex: 'Name',
            editable: true,
            flex: 1,
            cell: { userCls: 'bold' }
        },
        {
            text: 'Nguồn Dữ Liệu',
            dataIndex: 'Source',
            editable: true,
            width: 180
        },
        {
            text: 'Mô tả',
            dataIndex: 'Description',
            editable: true,
            width: 250
        },
        {
            text: 'Loại Hình Học',
            dataIndex: 'LayerType',
            editable: true,
            width: 120
        },
        {
            text: 'Độ mờ (Opacity)',
            dataIndex: 'Opacity',
            editable: true,
            width: 120
        }
    ],
    
    listeners: {
        edit: 'onEditComplete',
        canceledit: 'onEditCancelled'
    }
});