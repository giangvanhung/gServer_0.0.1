Ext.define('gClient.view.home.HomeViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.homeviewmodel',

    data: {
        // Các biến dữ liệu tĩnh hoặc động sau này dùng để bind vào tiêu đề/nội dung
        systemTitle: 'Hệ thống Quản trị Bản đồ Số gServer',
        lastUpdated: new Date()
    },

    stores: {
        /* Sau này khi kết nối gServer, bạn sẽ khai báo Store động ở đây:
        recentLogsStore: {
            fields: ['time', 'action'],
            proxy: {
                type: 'ajax',
                url: 'http://localhost:52106/LayerService.svc/Logs/Recent',
                reader: {
                    type: 'json'
                }
            },
            autoLoad: true
        }
        */
    }
});