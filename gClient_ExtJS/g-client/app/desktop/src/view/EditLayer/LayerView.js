Ext.define('gClient.view.EditLayer.LayerView', {
    extend: 'Ext.Panel',
    xtype: 'LayerView',
    controller: 'editlayervc',

    layout: { type: 'hbox', align: 'stretch' },

    items: [
        // ── Left: layer management ─────────────────────────────────────────────
        {
            xtype: 'panel',
            flex: 4,
            layout: { type: 'vbox', align: 'stretch' },
            items: [
                {
                    xtype: 'toolbar',
                    scrollable: true,
                    items: [
                        {
                            xtype: 'button',
                            text: 'Thêm Layer',
                            iconCls: 'x-fa fa-plus',
                            ui: 'action',
                            handler: 'onAddLayer'
                        },
                        {
                            xtype: 'button',
                            text: 'Sửa',
                            iconCls: 'x-fa fa-edit',
                            reference: 'editLayerBtn',
                            disabled: true,
                            handler: 'onEditLayer'
                        },
                        {
                            xtype: 'button',
                            text: 'Xóa',
                            iconCls: 'x-fa fa-trash',
                            ui: 'decline',
                            reference: 'deleteLayerBtn',
                            disabled: true,
                            handler: 'onDeleteLayer'
                        },
                        '->',
                        {
                            xtype: 'button',
                            text: 'Feature',
                            iconCls: 'x-fa fa-list',
                            reference: 'manageFeatureBtn',
                            disabled: true,
                            handler: 'onManageFeatures',
                            tooltip: 'Quản lý Feature của layer đã chọn'
                        },
                        {
                            xtype: 'button',
                            iconCls: 'x-fa fa-sync',
                            handler: 'onRefresh',
                            tooltip: 'Tải lại danh sách'
                        }
                    ]
                },
                {
                    xtype: 'grid',
                    reference: 'layerGrid',
                    flex: 1,
                    infinite: false,
                    variableHeights: true,
                    store: {
                        idProperty: 'Id',
                        fields: [
                            { name: 'Id',          type: 'int'    },
                            { name: 'Name',        type: 'string' },
                            { name: 'LayerType',   type: 'string' },
                            { name: 'Description', type: 'string' },
                            { name: 'IsVisible',   type: 'bool'   },
                            { name: 'Opacity',     type: 'float'  }
                        ]
                    },
                    columns: [
                        { text: 'ID',        dataIndex: 'Id',        width: 55, align: 'center' },
                        { text: 'Tên Layer', dataIndex: 'Name',       flex: 1 },
                        { text: 'Loại',      dataIndex: 'LayerType',  width: 100 }
                    ],
                    listeners: {
                        painted: 'onGridPainted',
                        selectionchange: 'onLayerSelectionChange'
                    }
                }
            ]
        },

        // ── Divider ────────────────────────────────────────────────────────────
        { xtype: 'container', width: 2, style: 'background:#e0e0e0;flex-shrink:0' },

        // ── Right: OL map for drawing ──────────────────────────────────────────
        {
            xtype: 'panel',
            flex: 8,
            reference: 'editMapPanel',
            title: 'Bản đồ vẽ đối tượng',
            height: 900,
            layout: 'fit',
            html: '<div id="edit-layer-map" style="position:absolute;top:0;right:0;bottom:0;left:0;"></div>',
            listeners: {
                painted: 'onMapPainted',
                resize:  'onMapResize'
            }
        }
    ]
});
