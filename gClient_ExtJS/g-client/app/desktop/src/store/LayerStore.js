Ext.define('gClient.store.LayerStore', {
    extend: 'Ext.data.Store',
    alias: 'store.LayerStore',
    model: 'gClient.model.LayerModel',
    autoLoad: false,
    pageSize: null,
    requires: [
        'Ext.data.proxy.Rest',
    ],
    constructor: function(cfg) {
        this.callParent([cfg]);

        // Lúc này app đã khởi động xong, gClient.app đã tồn tại
        var baseUrl = gClient.app.getApiHost();
        this.getProxy().setUrl(baseUrl + '/LayerService.svc/Layers');

        // Bây giờ mới load
        this.load();
    },
    proxy: {
        type: 'rest',
        // url: gClient.app.getApiHost() + '/LayerService.svc/Layers',
        url: '',
        appendId: true, 
        
        reader: {
            type: 'json',
            rootProperty: 'Data',
            successProperty: 'Success',
            messageProperty: 'Message'
        },
        writer: {
            type: 'json',
            writeAllFields: true,
            allowSingle: true,
            rootProperty: null,
            transform: function(data, request) {
                var action = request.getOperation().getAction();
                
                // Khi tạo mới (Create), xóa ID để Backend tự sinh tự tăng
                if (action === 'create') {
                    delete data.Id;
                }
                
                // 🌟 XÓA BỎ HOÀN TOÀN trường 'id' viết thường do ExtJS tự sinh
                // Để payload gửi đi gọn gàng và không gây hiểu lầm cho WCF / Web API backend
                if (data.hasOwnProperty('id')) {
                    delete data.id;
                }
                
                return data;
            }
        }
    }
});