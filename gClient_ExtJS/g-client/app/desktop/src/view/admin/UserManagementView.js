Ext.define('gClient.view.admin.UserManagementView', {
    extend: 'Ext.grid.Grid',
    xtype:  'usermanagement',

    controller: 'usermanagementcontroller',

    title:   'Quản lý Người dùng',
    iconCls: 'x-fa fa-users',

    store: {
        fields: ['Id', 'Username', 'FullName', 'Email', 'Role', 'IsActive', 'CreatedAt'],
        data:   []
    },

    tbar: [
        {
            xtype:   'button',
            text:    'Thêm người dùng',
            iconCls: 'x-fa fa-plus',
            ui:      'action',
            handler: 'onAdd'
        },
        { xtype: 'spacer' },
        {
            xtype:     'textfield',
            itemId:    'searchBox',
            clearable: true,
            placeholder: 'Tìm kiếm...',
            width:     200,
            listeners: { change: 'onSearch' }
        }
    ],

    columns: [
        { text: 'ID',       dataIndex: 'Id',       width: 55  },
        { text: 'Username', dataIndex: 'Username',  flex: 1    },
        { text: 'Họ tên',   dataIndex: 'FullName',  flex: 1    },
        { text: 'Email',    dataIndex: 'Email',     flex: 1    },
        {
            text: 'Vai trò', dataIndex: 'Role', width: 85,
            renderer: function (v) {
                return v === 'admin' ? 'Admin' : 'User';
            }
        },
        {
            text: 'Trạng thái', dataIndex: 'IsActive', width: 105,
            renderer: function (v) {
                return v ? 'Hoạt động' : 'Bị khóa';
            }
        },
        { text: 'Ngày tạo', dataIndex: 'CreatedAt', width: 140 },
        {
            text:  'Thao tác',
            width: 140,
            cell: {
                xtype: 'widgetcell',
                widget: {
                    xtype:  'container',
                    layout: { type: 'hbox', align: 'center', pack: 'center' },
                    items: [
                        {
                            xtype:   'button',
                            text:    'Sửa',
                            ui:      'action',
                            margin:  '0 6 0 0',
                            handler: 'onEditRow'
                        },
                        {
                            xtype:   'button',
                            text:    'Xóa',
                            ui:      'decline',
                            handler: 'onDeleteRow'
                        }
                    ]
                }
            }
        }
    ],

    listeners: {
        painted: 'loadUsers'
    }
});
