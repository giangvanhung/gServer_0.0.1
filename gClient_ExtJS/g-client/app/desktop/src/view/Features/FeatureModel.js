// FeatureModel.js (Phương án dự phòng)
Ext.define('gClient.view.Features.FeatureModel', {
    extend: 'Ext.data.Model',
    alias: 'model.FeatureModel',

    fields: [
        { name: 'id', type: 'int', mapping: 'Id' }, // Ánh xạ từ "Id" của JSON vào biến "id"
        { name: 'Properties', type: 'auto' },
        { name: 'Geom', type: 'auto', defaultValue: null },
        { name: 'checked', type: 'boolean', defaultValue: false } 
    ]
});