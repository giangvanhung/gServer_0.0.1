Ext.define('gClient.view.admin.UserManagementViewController', {
    extend: 'Ext.app.ViewController',
    alias:  'controller.usermanagementcontroller',

    // ── Load ─────────────────────────────────────────────────────────────────

    loadUsers: function () {
        var view = this.getView();
        Ext.Ajax.request({
            url:    gClient.app.getApiHost() + '/UserManagementService.svc/users',
            method: 'GET',
            success: function (resp) {
                var result = Ext.decode(resp.responseText, true);
                if (result && result.Success) {
                    view.getStore().loadData(result.Data || []);
                } else {
                    Ext.Msg.alert('Lỗi', (result && result.Message) || 'Tải dữ liệu thất bại.');
                }
            },
            failure: function () {
                Ext.Msg.alert('Lỗi', 'Không thể kết nối server.');
            }
        });
    },

    // ── Search ───────────────────────────────────────────────────────────────

    onSearch: function (field, value) {
        var store = this.getView().getStore();
        store.clearFilter();
        if (value) {
            var v = value.toLowerCase();
            store.filter([{
                filterFn: function (rec) {
                    return (rec.get('Username') || '').toLowerCase().indexOf(v) >= 0 ||
                           (rec.get('FullName')  || '').toLowerCase().indexOf(v) >= 0 ||
                           (rec.get('Email')     || '').toLowerCase().indexOf(v) >= 0;
                }
            }]);
        }
    },

    // ── Add / Edit / Delete ──────────────────────────────────────────────────

    onAdd: function () {
        this._showForm(null);
    },

    // Gọi từ widgetcell button — nhận record qua gridrow
    onEditRow: function (btn) {
        var record = btn.up('gridrow').getRecord();
        this._showForm(record);
    },

    onDeleteRow: function (btn) {
        var me     = this;
        var record = btn.up('gridrow').getRecord();
        Ext.Msg.confirm(
            'Xác nhận xóa',
            'Xóa người dùng <b>' + Ext.String.htmlEncode(record.get('Username')) + '</b>?',
            function (b) {
                if (b !== 'yes') return;
                Ext.Ajax.request({
                    url:    gClient.app.getApiHost() + '/UserManagementService.svc/users/' + record.get('Id'),
                    method: 'DELETE',
                    success: function (resp) {
                        var result = Ext.decode(resp.responseText, true);
                        if (result && result.Success) {
                            me.loadUsers();
                        } else {
                            Ext.Msg.alert('Lỗi', (result && result.Message) || 'Xóa thất bại.');
                        }
                    },
                    failure: function () {
                        Ext.Msg.alert('Lỗi', 'Không thể kết nối server.');
                    }
                });
            }
        );
    },

    // ── Form dialog ──────────────────────────────────────────────────────────

    _showForm: function (record) {
        var me     = this;
        var isEdit = !!record;

        // Dùng Ext.Panel floated + itemId để lookup field dễ hơn
        var panel = Ext.create('Ext.Panel', {
            floated:     true,
            modal:       true,
            centered:    true,
            width:       420,
            title:       isEdit ? 'Sửa người dùng' : 'Thêm người dùng',
            bodyPadding: 16,
            scrollable:  true,
            layout: { type: 'vbox', align: 'stretch' },

            items: [
                {
                    xtype:    'textfield',
                    itemId:   'fUsername',
                    label:    'Username',
                    required: true,
                    value:    isEdit ? record.get('Username') : '',
                    readOnly: isEdit,
                    margin:   '0 0 8 0'
                },
                {
                    xtype:  'textfield',
                    itemId: 'fFullName',
                    label:  'Họ tên',
                    value:  isEdit ? record.get('FullName') : '',
                    margin: '0 0 8 0'
                },
                {
                    xtype:  'textfield',
                    itemId: 'fEmail',
                    label:  'Email',
                    value:  isEdit ? record.get('Email') : '',
                    margin: '0 0 8 0'
                },
                {
                    xtype:       'textfield',
                    itemId:      'fPassword',
                    label:       'Mật khẩu',
                    inputType:   'password',
                    placeholder: isEdit ? '(để trống = không đổi)' : '',
                    margin:      '0 0 8 0'
                },
                {
                    xtype:  'selectfield',
                    itemId: 'fRole',
                    label:  'Vai trò',
                    options: [
                        { text: 'User',  value: 'user'  },
                        { text: 'Admin', value: 'admin' }
                    ],
                    value:  isEdit ? record.get('Role') : 'user',
                    margin: '0 0 8 0'
                },
                {
                    xtype:  'togglefield',
                    itemId: 'fActive',
                    label:  'Hoạt động',
                    value:  isEdit ? record.get('IsActive') : true
                }
            ],

            bbar: [
                {
                    xtype:   'button',
                    text:    'Hủy',
                    handler: function () { panel.destroy(); }
                },
                { xtype: 'spacer' },
                {
                    xtype:   'button',
                    text:    isEdit ? 'Cập nhật' : 'Thêm',
                    ui:      'action',
                    handler: function () {
                        var body = {
                            FullName: panel.down('#fFullName').getValue(),
                            Email:    panel.down('#fEmail').getValue(),
                            Role:     panel.down('#fRole').getValue(),
                            IsActive: panel.down('#fActive').getValue(),
                            Password: panel.down('#fPassword').getValue()
                        };

                        var url, method;
                        if (isEdit) {
                            url    = gClient.app.getApiHost() + '/UserManagementService.svc/users/' + record.get('Id');
                            method = 'PUT';
                        } else {
                            body.Username = panel.down('#fUsername').getValue();
                            url    = gClient.app.getApiHost() + '/UserManagementService.svc/users';
                            method = 'POST';
                        }

                        Ext.Ajax.request({
                            url:      url,
                            method:   method,
                            jsonData: body,
                            success: function (resp) {
                                var result = Ext.decode(resp.responseText, true);
                                if (result && result.Success) {
                                    panel.destroy();
                                    me.loadUsers();
                                } else {
                                    Ext.Msg.alert('Lỗi', (result && result.Message) || 'Thao tác thất bại.');
                                }
                            },
                            failure: function () {
                                Ext.Msg.alert('Lỗi', 'Không thể kết nối server.');
                            }
                        });
                    }
                }
            ]
        });

        panel.show();
    }
});
