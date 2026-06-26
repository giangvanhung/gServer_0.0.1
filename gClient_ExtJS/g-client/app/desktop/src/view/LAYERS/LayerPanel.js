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
                pack: 'start',
                align: 'stretch'
            },
            height: 1050,
            items: [
                {
                    xtype: 'panel',
                    flex: 2,
                    margin: '0 15 15 0',
                    cls: 'layers-DPHCC-cls',
                    layout: 'vbox',
                    scrollable: 'y',
                    bodyPadding: 15,
                    style: 'border-radius:4px;box-shadow:0 2px 5px rgba(0,0,0,0.1);border-left:5px solid #2196F3;',
                    title: 'Layers',
                    items: []
                },
                {
                    xtype: 'panel',
                    cls: 'map-DPHCC-cls',
                    flex: 3,
                    margin: '0 15 15 0',
                    layout: 'fit',
                    style: 'border-radius:4px;box-shadow:0 2px 5px rgba(0,0,0,0.1);',
                    title: 'Maps',
                    html: '<div id="map-DPHCC" style="position:absolute;top:0;right:0;bottom:0;left:0;"></div>'
                },
                {
                    xtype: 'panel',
                    cls: 'feature-props-DPHCC-cls',
                    hidden: true,
                    closable: true,
                    closeAction: 'hide',
                    scrollable: 'y',
                    flex: 2,
                    bodyPadding: 10,
                    title: 'Feature Properties',
                    style: 'border-radius:4px;box-shadow:0 2px 5px rgba(0,0,0,0.1);border-left:5px solid #4CAF50;'
                }
            ]
        }
    ]
});
