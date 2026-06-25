// ─── ViewController ─────────────────────────────────────────────────────────

Ext.define('gClient.view.FeatureCRUD.FeatureCRUDViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.featurecrudvc',

    // Called by LayerController to switch layer context
    loadLayer: function(layerId, layerName, apiHost, onAfterChange, onRequestRedraw) {
        var view = this.getView();
        view.currentLayerId  = layerId;
        view.currentApiHost  = apiHost;
        view.onAfterChange   = onAfterChange || null;
        view.onRequestRedraw  = onRequestRedraw || null;

        view.setTitle('Quản lý Feature — ' + layerName);
        this.clearForm();
        this.loadFeatures();
        view.show();
    },

    // ─── Feature list ──────────────────────────────────────────────────────────

    loadFeatures: function() {
        var me   = this,
            view = me.getView(),
            grid = me.lookup('featureGrid');

        if (!view.currentLayerId || !grid) return;

        grid.setMasked({ xtype: 'loadmask', message: 'Đang tải...' });

        Ext.Ajax.request({
            url: view.currentApiHost + '/LayerService.svc/layers/' + view.currentLayerId + '/features',
            method: 'GET',
            success: function(response) {
                grid.setMasked(false);
                var data = Ext.decode(response.responseText);
                grid.getStore().loadData(data.Features || []);
            },
            failure: function() {
                grid.setMasked(false);
                Ext.Toast({ message: 'Không tải được danh sách Feature', timeout: 2500 });
            }
        });
    },

    onRefreshClick: function() {
        this.loadFeatures();
    },

    onGridSelectionChange: function(grid, selected) {
        var deleteBtn = this.lookup('deleteBtn');
        if (deleteBtn) deleteBtn.setDisabled(!selected || !selected.length);

        if (selected && selected.length > 0) {
            this.loadFeatureIntoForm(selected[0]);
        }
    },

    onRedrawClick: function(btn) {
        var me       = this,
            view     = me.getView(),
            drawType = btn.drawType;
        // var lc = Ext.app.Application.instance.getController('gClient.controller.LayerController') /* ?? Ext.app.Application.instance.getController('gClient.view.EditLayer.EditLayerController') */;
        // if (!lc) {
        //     Ext.log('Không tìm thấy bản đồ');
        //     Ext.Toast({ message: 'Không tìm thấy bản đồ', timeout: 2000 });
        //     return;
        // }
        if (!view.onRequestRedraw) {
            Ext.Toast({ message: 'Chức năng vẽ chưa được kết nối với bản đồ', timeout: 2500 });
            return;
        }

        view.hide();

        view.onRequestRedraw(drawType, function(wkt) {
            var geomField = me.lookup('geomField');
            if (geomField) geomField.setValue(wkt);
            view.show();
        });
    },

    // ─── Form ──────────────────────────────────────────────────────────────────

    // onAddClick: function() {
    //     this.clearForm();
    // },

    clearForm: function() {
        var me   = this,
            view = me.getView(),
            geomField      = me.lookup('geomField'),
            propsContainer = me.lookup('propsContainer'),
            formPanel      = me.lookup('formPanel'),
            grid           = me.lookup('featureGrid');

        view.editingFeatureId = null;
        if (geomField)      geomField.setValue('');
        if (propsContainer) propsContainer.removeAll();
        if (formPanel)      formPanel.setTitle('Thêm Feature mới');
        if (grid)           grid.deselectAll();
    },

    loadFeatureIntoForm: function(record) {
        var me        = this,
            view      = me.getView(),
            featureId = record.get('Id');

        Ext.Ajax.request({
            url: view.currentApiHost + '/LayerService.svc/features/' + featureId,
            method: 'GET',
            success: function(response) {
                var raw  = Ext.decode(response.responseText);
                var feat = (raw && raw.Data) ? raw.Data : raw;
                if (!feat) return;

                view.editingFeatureId = featureId;

                var formPanel = me.lookup('formPanel');
                if (formPanel) formPanel.setTitle('Sửa Feature #' + featureId);

                var geomField = me.lookup('geomField');
                if (geomField) geomField.setValue(feat.GeomWkt || '');

                var propsContainer = me.lookup('propsContainer');
                if (propsContainer) {
                    propsContainer.removeAll();
                    if (feat.Properties) {
                        if (Array.isArray(feat.Properties)) {
                            // Server returns [{Key, Value}] array
                            feat.Properties.forEach(function(item) {
                                if (item && item.Key !== undefined) {
                                    me.addPropRow(propsContainer, item.Key, item.Value);
                                }
                            });
                        } else if (typeof feat.Properties === 'object') {
                            Object.keys(feat.Properties).forEach(function(key) {
                                me.addPropRow(propsContainer, key, feat.Properties[key]);
                            });
                        }
                    }
                }
            }
        });
    },

    onAddPropRow: function() {
        var propsContainer = this.lookup('propsContainer');
        if (propsContainer) this.addPropRow(propsContainer);
    },

    addPropRow: function(container, key, value) {
        var row = Ext.create('Ext.Container', {
            layout: { type: 'hbox', align: 'middle' },
            margin: '0 0 6 0',
            items: [
                {
                    xtype: 'textfield',
                    flex: 1,
                    placeholder: 'Tên thuộc tính',
                    value: key || '',
                    margin: '0 4 0 0',
                    cls: 'crud-key-field'
                },
                {
                    xtype: 'textfield',
                    flex: 2,
                    placeholder: 'Giá trị',
                    value: (value !== undefined && value !== null) ? String(value) : '',
                    margin: '0 4 0 0',
                    cls: 'crud-val-field'
                },
                {
                    xtype: 'button',
                    iconCls: 'x-fa fa-times',
                    ui: 'decline',
                    handler: function() { container.remove(row, true); }
                }
            ]
        });
        container.add(row);
    },

    onCancelClick: function() {
        this.clearForm();
    },

    // ─── Save ──────────────────────────────────────────────────────────────────

    onSaveClick: function() {
        var me             = this,
            view           = me.getView(),
            geomField      = me.lookup('geomField'),
            propsContainer = me.lookup('propsContainer');
        var geomWkt = geomField ? (geomField.getValue() || '').trim() : '';
        if (!geomWkt) {
            Ext.Toast({ message: 'Vui lòng nhập hình học (WKT)', timeout: 2500 });
            return;
        }
        // Ext.log('propsContainer:', propsContainer.getItems());
        // Ext.log('propsContainer items:', propsContainer ? propsContainer.getItems().length : 'NULL');

        // Collect key-value property rows
        var properties = {};
        if (propsContainer) {
            propsContainer.getItems().each(function(row, index) {
                // var keyFld = row.down('.crud-key-field');
                // var valFld = row.down('.crud-val-field');
                var keyFld = row.getComponent(0);
                var valFld = row.getComponent(1);
                if (keyFld && valFld) {
                    var k = (keyFld.getValue() || '').trim();
                    if (k) properties[k] = valFld.getValue() || '';
                }
            });
        }

        // Ext.log(properties);

        var isNew     = !view.editingFeatureId,
            layerId   = view.currentLayerId,
            apiHost   = view.currentApiHost,
            featureId = view.editingFeatureId;

        var url    = isNew
            ? apiHost + '/LayerService.svc/layers/' + layerId + '/features'
            : apiHost + '/LayerService.svc/features/' + featureId;
        var method = isNew ? 'POST' : 'PUT';

        view.setMasked({ xtype: 'loadmask', message: 'Đang lưu...' });

        Ext.Ajax.request({
            url: url,
            method: method,
            jsonData: {
                Id: featureId ? String(featureId) : '0',
                GeomWkt: geomWkt,
                Properties: JSON.stringify(properties)
            },
            success: function(response) {
                view.setMasked(false);
                var result = Ext.decode(response.responseText);
                if (result && result.Success) {
                    Ext.Toast({
                        message: isNew ? 'Thêm Feature thành công!' : 'Cập nhật thành công!',
                        timeout: 2000
                    });
                    var savedId = isNew ? result.Data : featureId;
                    me.loadFeatures();
                    me.clearForm();
                    if (view.onAfterChange) {
                        view.onAfterChange(
                            isNew ? 'add' : 'update',
                            savedId,
                            { geomWkt: geomWkt, properties: properties },
                            layerId
                        );
                    }
                } else {
                    Ext.Toast({ message: result.Message || 'Lỗi không xác định', timeout: 3000 });
                }
            },
            failure: function() {
                view.setMasked(false);
                Ext.Toast({ message: 'Lỗi kết nối khi lưu Feature', timeout: 3000 });
            }
        });
    },

    // ─── Delete ────────────────────────────────────────────────────────────────

    onDeleteClick: function() {
        var me        = this,
            view      = me.getView(),
            grid      = me.lookup('featureGrid'),
            selection = grid ? grid.getSelection() : null;

        var record = Ext.isArray(selection) ? selection[0] : selection;
        if (!record) return;

        var featureId = record.get('Id');

        Ext.Msg.confirm(
            'Xác nhận xóa',
            'Xóa Feature #' + featureId + '?<br>Hành động này không thể hoàn tác.',
            function(btn) {
                if (btn !== 'yes') return;

                view.setMasked({ xtype: 'loadmask', message: 'Đang xóa...' });

                Ext.Ajax.request({
                    url: view.currentApiHost + '/LayerService.svc/features/' + featureId,
                    method: 'DELETE',
                    success: function(response) {
                        view.setMasked(false);
                        var result = Ext.decode(response.responseText);
                        if (result && result.Success) {
                            Ext.Toast({ message: 'Đã xóa Feature #' + featureId, timeout: 2000 });
                            grid.getStore().remove(record);
                            me.clearForm();
                            if (view.onAfterChange) {
                                view.onAfterChange('delete', featureId, null, view.currentLayerId);
                            }
                        } else {
                            Ext.Toast({ message: result.Message || 'Không thể xóa', timeout: 3000 });
                        }
                    },
                    failure: function() {
                        view.setMasked(false);
                        Ext.Toast({ message: 'Lỗi kết nối khi xóa', timeout: 3000 });
                    }
                });
            }
        );
    }
});

// ─── Panel ──────────────────────────────────────────────────────────────────

Ext.define('gClient.view.FeatureCRUD.FeatureCRUDPanel', {
    extend: 'Ext.Panel',
    xtype: 'featurecrudpanel',
    controller: 'featurecrudvc',

    requires: [
        'Ext.grid.Grid',
        'Ext.field.TextArea',
        'Ext.field.Text'
    ],

    floated: true,
    modal: true,
    centered: true,
    closeAction: 'hide',
    closable: true,
    title: 'Quản lý Feature',

    width: '88%',
    height: '82%',

    // Runtime state — set by loadLayer()
    currentLayerId: null,
    currentApiHost: '',
    editingFeatureId: null,
    onAfterChange: null,

    layout: { type: 'hbox', align: 'stretch' },

    items: [
        // ── Left: feature list ─────────────────────────────────────────────────
        {
            xtype: 'panel',
            flex: 5,
            layout: 'fit',
            items: [
                {
                    xtype: 'toolbar',
                    docked: 'top',
                    items: [
                        // {
                        //     xtype: 'button',
                        //     text: 'Thêm mới',
                        //     iconCls: 'x-fa fa-plus',
                        //     ui: 'action',
                        //     handler: 'onAddClick'
                        // },
                        {
                            xtype: 'button',
                            text: 'Xóa',
                            iconCls: 'x-fa fa-trash',
                            ui: 'decline',
                            reference: 'deleteBtn',
                            disabled: true,
                            handler: 'onDeleteClick'
                        },
                        '->',
                        {
                            xtype: 'button',
                            text: 'Tải lại',
                            iconCls: 'x-fa fa-sync',
                            handler: 'onRefreshClick'
                        }
                    ]
                },
                {
                    xtype: 'grid',
                    reference: 'featureGrid',
                    infinite: false,
                    variableHeights: true,
                    store: {
                        idProperty: 'Id',
                        fields: [
                            { name: 'Id',         type: 'int'  },
                            { name: 'Properties', type: 'auto' }
                        ]
                    },
                    columns: [
                        {
                            text: 'ID',
                            dataIndex: 'Id',
                            width: 65,
                            align: 'center'
                        },
                        {
                            text: 'Thông tin',
                            dataIndex: 'Properties',
                            flex: 1,
                            renderer: function(val, rec) {
                                if (Array.isArray(val) && val.length > 0) {
                                    var first = val[0];
                                    if (first && first.Key !== undefined) {
                                        return Ext.String.htmlEncode(String(first.Value != null ? first.Value : ''));
                                        // return '<span style="color:#888;font-size:11px">' + Ext.String.htmlEncode(String(first.Key)) + ':</span> ' + Ext.String.htmlEncode(String(first.Value != null ? first.Value : ''));
                                    }
                                } else if (val && typeof val === 'object') {
                                    var keys = Object.keys(val);
                                    if (keys.length) {
                                        var k = keys[0];
                                        // return '<span style="color:#888;font-size:11px">' + k + ':</span> ' + val[k];
                                        return val[k];
                                    }
                                }
                                return 'Feature #' + rec.get('Id');
                            }
                        }
                    ],
                    listeners: {
                        selectionchange: 'onGridSelectionChange'
                    }
                }
            ]
        },
        // ── Divider ────────────────────────────────────────────────────────────
        {
            xtype: 'container',
            width: 2,
            style: 'background:#e0e0e0;flex-shrink:0'
        },
        // ── Right: edit form ───────────────────────────────────────────────────
        {
            xtype: 'panel',
            reference: 'formPanel',
            cls: 'edit-feature-form-cls',
            flex: 4,
            scrollable: true,
            title: 'Thêm Feature mới',
            titleAlign: 'left',
            layout: { type: 'vbox', align: 'stretch' },
            padding: 12,
            items: [
                {
                    xtype: 'textareafield',
                    reference: 'geomField',
                    label: 'Hình học (WKT)',
                    rows: 4,
                    placeholder: 'Ví dụ: POINT (105.845 21.028)\nhoặc POLYGON ((...))',
                    margin: '0 0 10 0'
                },
                {
                    xtype: 'container',
                    layout: { type: 'hbox', align: 'middle' },
                    margin: '0 0 10 0',
                    items: [
                        {
                            xtype: 'component',
                            html: '<span style="font-size:11px;color:#888;white-space:nowrap">Vẽ lại:</span>',
                            margin: '0 8 0 0'
                        },
                        {
                            xtype: 'button', text: '◉ Điểm',
                            drawType: 'Point',
                            margin: '0 4 0 0',
                            handler: 'onRedrawClick'
                        },
                        {
                            xtype: 'button', text: '╱ Đường',
                            drawType: 'LineString',
                            margin: '0 4 0 0',
                            handler: 'onRedrawClick'
                        },
                        {
                            xtype: 'button', text: '▣ Vùng',
                            drawType: 'Polygon',
                            handler: 'onRedrawClick'
                        }
                    ]
                },
                {
                    xtype: 'container',
                    margin: '0 0 6 0',
                    html: '<span style="font-size:12px;font-weight:600;color:#444">Thuộc tính (Properties)</span>'
                },
                {
                    xtype: 'container',
                    reference: 'propsContainer',
                    layout: { type: 'vbox', align: 'stretch' },
                    cls: 'propsContainer', 
                },
                {
                    xtype: 'button',
                    text: '+ Thêm thuộc tính',
                    iconCls: 'x-fa fa-plus-circle',
                    margin: '8 0 4 0',
                    handler: 'onAddPropRow'
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
        }
    ]
});
