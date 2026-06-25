// ─── ViewController ─────────────────────────────────────────────────────────

Ext.define('gClient.view.LayerCRUD.LayerCRUDViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.layercrudvc',

    // Entry point called by LayerController
    loadLayer: function(layerData, apiHost, onAfterChange) {
        var view = this.getView();
        view.editingLayerId = layerData ? layerData.Id : null;
        view.currentApiHost = apiHost;
        view.onAfterChange  = onAfterChange || null;

        view.setTitle(layerData ? ('Sửa Layer: ' + layerData.Name) : 'Thêm Layer mới');

        if (layerData) {
            this.fillForm(layerData);
        } else {
            this.clearForm();
        }

        view.show();
    },

    fillForm: function(data) {
        var me = this;
        var nameField    = me.lookup('nameField');
        var descField    = me.lookup('descField');
        var typeField    = me.lookup('typeField');
        var visibleField = me.lookup('visibleField');
        var opacityField = me.lookup('opacityField');

        if (nameField)    nameField.setValue(data.Name || '');
        if (descField)    descField.setValue(data.Description || '');
        if (typeField)    typeField.setValue(data.LayerType || 'POINT');
        if (visibleField) visibleField.setChecked(data.IsVisible !== false);
        if (opacityField) opacityField.setValue(data.Opacity !== undefined ? data.Opacity : 1);
    },

    clearForm: function() {
        var me   = this,
            view = me.getView();
        view.editingLayerId = null;

        var nameField    = me.lookup('nameField');
        var descField    = me.lookup('descField');
        var typeField    = me.lookup('typeField');
        var visibleField = me.lookup('visibleField');
        var opacityField = me.lookup('opacityField');

        if (nameField)    nameField.setValue('');
        if (descField)    descField.setValue('');
        if (typeField)    typeField.setValue('POINT');
        if (visibleField) visibleField.setChecked(true);
        if (opacityField) opacityField.setValue(1);
    },

    onSaveClick: function() {
        var me   = this,
            view = me.getView();

        var nameField = me.lookup('nameField');
        var name = (nameField ? nameField.getValue() : '') || '';
        name = name.trim();

        if (!name) {
            Ext.Toast({ message: 'Vui lòng nhập tên Layer', timeout: 2500 });
            return;
        }

        var descField    = me.lookup('descField');
        var typeField    = me.lookup('typeField');
        var visibleField = me.lookup('visibleField');
        var opacityField = me.lookup('opacityField');

        var payload = {
            Id:          view.editingLayerId || 0,
            Name:        name,
            Description: descField    ? (descField.getValue()    || '') : '',
            LayerType:   typeField    ? (typeField.getValue()    || 'POINT') : 'POINT',
            IsVisible:   visibleField ? visibleField.getChecked() : true,
            Opacity:     opacityField ? parseFloat(opacityField.getValue() || 1) : 1,
            MinZoom:     0,
            MaxZoom:     22,
            Source:      ''
        };

        var isNew   = !view.editingLayerId,
            apiHost = view.currentApiHost,
            url     = isNew
                ? apiHost + '/LayerService.svc/layers'
                : apiHost + '/LayerService.svc/layers/' + view.editingLayerId,
            method  = isNew ? 'POST' : 'PUT';

        view.setMasked({ xtype: 'loadmask', message: 'Đang lưu...' });

        Ext.Ajax.request({
            url: url,
            method: method,
            jsonData: payload,
            success: function(response) {
                view.setMasked(false);
                var result = Ext.decode(response.responseText);
                if (result && result.Success) {
                    Ext.Toast({
                        message: isNew ? 'Tạo Layer thành công!' : 'Cập nhật Layer thành công!',
                        timeout: 2000
                    });
                    view.hide();
                    if (view.onAfterChange) view.onAfterChange();
                } else {
                    Ext.Toast({ message: result.Message || 'Lỗi không xác định', timeout: 3000 });
                }
            },
            failure: function() {
                view.setMasked(false);
                Ext.Toast({ message: 'Lỗi kết nối khi lưu Layer', timeout: 3000 });
            }
        });
    },

    onCancelClick: function() {
        this.getView().hide();
    }
});

// ─── Panel ──────────────────────────────────────────────────────────────────

Ext.define('gClient.view.LayerCRUD.LayerCRUDPanel', {
    extend: 'Ext.Panel',
    xtype: 'layercrudpanel',
    controller: 'layercrudvc',

    requires: [
        'Ext.field.Text',
        'Ext.field.TextArea',
        'Ext.field.Select',
        'Ext.field.Checkbox',
        'Ext.field.Number'
    ],

    floated: true,
    modal: true,
    centered: true,
    closeAction: 'hide',
    closable: true,
    title: 'Quản lý Layer',

    width: 440,
    scrollable: true,

    editingLayerId: null,
    currentApiHost: '',
    onAfterChange: null,

    layout: { type: 'vbox', align: 'stretch' },
    padding: '16 16 60 16',

    items: [
        {
            xtype: 'textfield',
            reference: 'nameField',
            label: 'Tên Layer',
            placeholder: 'Ví dụ: Bệnh viện, Trường học...',
            required: true,
            margin: '0 0 10 0'
        },
        {
            xtype: 'textareafield',
            reference: 'descField',
            label: 'Mô tả',
            rows: 2,
            placeholder: 'Mô tả ngắn về lớp dữ liệu...',
            margin: '0 0 10 0'
        },
        {
            xtype: 'selectfield',
            reference: 'typeField',
            label: 'Loại hình học',
            value: 'POINT',
            margin: '0 0 10 0',
            options: [
                { text: 'Điểm (POINT)',       value: 'POINT' },
                { text: 'Đường (LINESTRING)', value: 'LINESTRING' },
                { text: 'Vùng (POLYGON)',     value: 'POLYGON' }
            ]
        },
        {
            xtype: 'checkboxfield',
            reference: 'visibleField',
            label: 'Hiển thị mặc định',
            checked: true,
            margin: '0 0 10 0'
        },
        {
            xtype: 'numberfield',
            reference: 'opacityField',
            label: 'Độ mờ (0 – 1)',
            value: 1,
            minValue: 0,
            maxValue: 1,
            stepValue: 0.1,
            margin: '0 0 4 0'
        },
        {
            xtype: 'toolbar',
            docked: 'bottom',
            items: [
                {
                    xtype: 'button',
                    text: 'Lưu',
                    iconCls: 'x-fa fa-save',
                    ui: 'action',
                    handler: 'onSaveClick'
                },
                {
                    xtype: 'button',
                    text: 'Hủy',
                    handler: 'onCancelClick'
                }
            ]
        }
    ]
});
