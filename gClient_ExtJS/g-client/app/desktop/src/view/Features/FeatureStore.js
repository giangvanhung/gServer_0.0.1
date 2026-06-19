Ext.define('gClient.view.Features.FeatureStore', {
    extend: 'Ext.data.Store',
    alias: 'store.FeatureStore',
    model: 'gClient.view.Features.FeatureModel', 
    proxy: {
        type: 'ajax',
        url: '', 
        reader: {
            type: 'json',
            rootProperty: 'Features' // Matches your JSON key exactly
        }
    }
});