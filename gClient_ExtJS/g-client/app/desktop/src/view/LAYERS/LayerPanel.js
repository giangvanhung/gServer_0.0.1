// app/view/LAYERS/LayerPanel.js
Ext.define('gClient.view.LAYERS.LayerPanel', {
    extend: 'Ext.panel.Panel',
    xtype: 'mapLayerDPHCC',
    width: '100%',
    items: [
        {
            xtype: 'container',
            layout: {
                type: 'hbox',
                pack: 'start'
            },
            items: [
                {
                    xtype: 'panel',
                    flex: 2,
                    margin: '0 15 15 0',
                    cls: 'layers-DPHCC-cls',
                    layout: 'vbox',              // ← ADD CÁCH NÀY
                    scrollable: 'y',             // ← THAY TỪNG NÀY
                    // height: 1000,              // ← COMMENT LẠI
                    maxHeight: 1000, 
                    // scrollable: 'vertical',
                    bodyPadding: 15,
                    style: 'border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);border-left: 5px solid #2196F3;',
                    title: 'Layers',
                    items: [],
                    // html: '<h2 style="color: #2196F3; margin: 5px 0;">12 Layer</h2><p style="color: #777; margin:0;">Đang hoạt động trên hệ thống</p>',
                },
                {
                    xtype: 'panel',
                    cls: 'feature-props-DPHCC-cls',
                    flex: 2,
                    hidden: true,
                    closable: true,
                    closeAction: 'hide',
                    scrollable: 'y',
                    maxHeight: 1000,
                    margin: '0 15 15 0',
                    bodyPadding: 10,
                    title: 'Feature Properties',
                    style: 'border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border-left: 5px solid #4CAF50;'
                },
                {
                    title: 'Maps',
                    xtype: 'panel',
                    cls: 'map-DPHCC-cls',
                    flex: 5,
                    width: '100%',
                    height: 1000,
                    margin: '0 15 15 0',
                    layout: 'fit',
                    style: 'border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);',
                    html: '<div id='+'map-DPHCC'+' style="position: absolute; top: 0; right: 0; bottom: 0; left: 0;"></div>'
                }
            ]
        }
    ]
});