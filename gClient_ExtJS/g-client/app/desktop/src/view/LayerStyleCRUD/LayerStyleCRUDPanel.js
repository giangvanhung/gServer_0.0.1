// ─── ViewController ─────────────────────────────────────────────────────────

Ext.define('gClient.view.LayerStyleCRUD.LayerStyleCRUDViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.layerstylecrudvc',

    // Entry point — loads existing style for a layer (or blank form if none yet)
    // initialStyle: pass cached style object to skip server fetch; undefined = always fetch
    loadStyle: function(layerItem, apiHost, onAfterChange, initialStyle) {
        var me   = this,
            view = me.getView();

        view.currentLayerId  = layerItem.Id;
        view.currentApiHost  = apiHost;
        view.onAfterChange   = onAfterChange || null;
        view.editingStyleId  = null;
        view.setTitle('Style: ' + layerItem.Name);

        if (initialStyle !== undefined) {
            // Use cached style — no server round-trip
            if (initialStyle && initialStyle.Id) view.editingStyleId = initialStyle.Id;
            if (initialStyle) me.fillForm(initialStyle);
            else me.clearForm();
            view.show();
            return;
        }

        Ext.Ajax.request({
            url: apiHost + '/LayerStyle.svc/layers/' + layerItem.Id + '/style',
            method: 'GET',
            success: function(response) {
                var result = Ext.decode(response.responseText);
                if (result && result.Success && result.Data) {
                    view.editingStyleId = result.Data.Id;
                    me.fillForm(result.Data);
                } else {
                    me.clearForm();
                }
            },
            failure: function() {
                me.clearForm();
            }
        });

        view.show();
    },

    fillForm: function(data) {
        var me = this;
        me.lookup('fillColorField').setValue(data.FillColor   || '#3399CC');
        me.lookup('strokeColorField').setValue(data.StrokeColor || '#FFFFFF');
        me.lookup('strokeWidthField').setValue(data.StrokeWidth !== undefined ? data.StrokeWidth : 1.5);
        me.lookup('iconUrlField').setValue(data.IconUrl || '');
        me.updatePreview();
    },

    clearForm: function() {
        var me = this;
        me.lookup('fillColorField').setValue('#3399CC');
        me.lookup('strokeColorField').setValue('#FFFFFF');
        me.lookup('strokeWidthField').setValue(1.5);
        me.lookup('iconUrlField').setValue('');
        me.updatePreview();
    },

    updatePreview: function() {
        var me     = this,
            fill   = me.lookup('fillColorField').getValue()   || '#3399CC',
            stroke = me.lookup('strokeColorField').getValue() || '#FFFFFF',
            width  = me.lookup('strokeWidthField').getValue() || 1.5;

        var preview = me.lookup('previewPanel');
        if (!preview) return;

        preview.setHtml(
            '<div style="display:flex;gap:12px;align-items:center;padding:6px 0;">'
            + '<div style="width:44px;height:44px;border-radius:4px;flex-shrink:0;'
            +   'background:' + Ext.String.htmlEncode(fill) + ';'
            +   'border:' + parseFloat(width) + 'px solid ' + Ext.String.htmlEncode(stroke) + ';">'
            + '</div>'
            + '<div style="font-size:12px;color:#555;line-height:1.6;">'
            +   'Fill: <b>' + Ext.String.htmlEncode(fill) + '</b><br>'
            +   'Stroke: <b>' + Ext.String.htmlEncode(stroke) + '</b> &nbsp;|&nbsp; Width: <b>' + width + '</b>'
            + '</div>'
            + '</div>'
        );
    },

    onSaveClick: function() {
        var me   = this,
            view = me.getView();

        var payload = {
            Id:          view.editingStyleId || 0,
            LayerId:     view.currentLayerId,
            FillColor:   me.lookup('fillColorField').getValue()   || '#3399CC',
            StrokeColor: me.lookup('strokeColorField').getValue() || '#FFFFFF',
            StrokeWidth: parseFloat(me.lookup('strokeWidthField').getValue() || 1.5),
            IconUrl:     me.lookup('iconUrlField').getValue() || null
        };

        var isNew  = !view.editingStyleId,
            url    = isNew
                ? view.currentApiHost + '/LayerStyle.svc/layerstyles'
                : view.currentApiHost + '/LayerStyle.svc/layerstyles/' + view.editingStyleId,
            method = isNew ? 'POST' : 'PUT';

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
                        message: isNew ? 'Tạo Style thành công!' : 'Cập nhật Style thành công!',
                        timeout: 2000
                    });
                    if (result.Data && result.Data.Id) view.editingStyleId = result.Data.Id;
                    view.hide();
                    if (view.onAfterChange) view.onAfterChange(payload);
                } else {
                    Ext.Toast({ message: result.Message || 'Lỗi không xác định', timeout: 3000 });
                }
            },
            failure: function() {
                view.setMasked(false);
                Ext.Toast({ message: 'Lỗi kết nối khi lưu Style', timeout: 3000 });
            }
        });
    },

    onDeleteClick: function() {
        var me   = this,
            view = me.getView();

        if (!view.editingStyleId) {
            Ext.Toast({ message: 'Layer này chưa có Style để xóa', timeout: 2000 });
            return;
        }

        Ext.Msg.confirm('Xác nhận xóa', 'Xóa Style của layer này?', function(btn) {
            if (btn !== 'yes') return;

            Ext.Ajax.request({
                url: view.currentApiHost + '/LayerStyle.svc/layerstyles/' + view.editingStyleId,
                method: 'DELETE',
                success: function(response) {
                    var result = Ext.decode(response.responseText);
                    if (result && result.Success) {
                        Ext.Toast({ message: 'Đã xóa Style', timeout: 2000 });
                        view.editingStyleId = null;
                        me.clearForm();
                        view.hide();
                        if (view.onAfterChange) view.onAfterChange(null);
                    } else {
                        Ext.Toast({ message: result.Message || 'Không thể xóa', timeout: 3000 });
                    }
                },
                failure: function() {
                    Ext.Toast({ message: 'Lỗi kết nối', timeout: 3000 });
                }
            });
        });
    },

    onCancelClick: function() {
        this.getView().hide();
    }
});

// ─── Panel ──────────────────────────────────────────────────────────────────

Ext.define('gClient.view.LayerStyleCRUD.LayerStyleCRUDPanel', {
    extend: 'Ext.Panel',
    xtype: 'layerstylecrudpanel',
    controller: 'layerstylecrudvc',

    requires: [
        'Ext.field.Text',
        'Ext.field.Number'
    ],

    floated: true,
    modal: true,
    centered: true,
    closeAction: 'hide',
    closable: true,
    title: 'Style Layer',

    width: 420,
    scrollable: true,

    currentLayerId:  null,
    currentApiHost:  '',
    editingStyleId:  null,
    onAfterChange:   null,

    layout: { type: 'vbox', align: 'stretch' },
    padding: '16 16 60 16',

    items: [
        {
            xtype: 'textfield',
            reference: 'fillColorField',
            label: 'Fill Color',
            placeholder: '#3399CC',
            margin: '0 0 10 0',
            listeners: {
                change: function() {
                    this.up('panel').getController().updatePreview();
                }
            }
        },
        {
            xtype: 'textfield',
            reference: 'strokeColorField',
            label: 'Stroke Color',
            placeholder: '#FFFFFF',
            margin: '0 0 10 0',
            listeners: {
                change: function() {
                    this.up('panel').getController().updatePreview();
                }
            }
        },
        {
            xtype: 'numberfield',
            reference: 'strokeWidthField',
            label: 'Stroke Width',
            value: 1.5,
            minValue: 0.5,
            maxValue: 10,
            stepValue: 0.5,
            margin: '0 0 10 0',
            listeners: {
                change: function() {
                    this.up('panel').getController().updatePreview();
                }
            }
        },
        {
            xtype: 'textfield',
            reference: 'iconUrlField',
            label: 'Icon URL',
            placeholder: 'https://...',
            margin: '0 0 12 0'
        },
        {
            xtype: 'panel',
            reference: 'previewPanel',
            bodyPadding: 4,
            margin: '0 0 4 0',
            style: 'background:#f5f5f5;border-radius:4px;min-height:56px;'
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
                    text: 'Xóa Style',
                    iconCls: 'x-fa fa-trash',
                    ui: 'decline',
                    handler: 'onDeleteClick'
                },
                { xtype: 'spacer' },
                {
                    xtype: 'button',
                    text: 'Hủy',
                    handler: 'onCancelClick'
                }
            ]
        }
    ]
});
