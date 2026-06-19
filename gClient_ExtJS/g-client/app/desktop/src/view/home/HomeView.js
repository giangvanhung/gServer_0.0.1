Ext.define('gClient.view.home.HomeView', {
    extend: 'Ext.panel.Panel', // Chuyển sang Panel để có tiêu đề và khung chứa tốt hơn
    xtype: 'homeview',
    cls: 'homeview',
    controller: { type: 'homeviewcontroller' },
    viewModel: { type: 'homeviewmodel' },
    
    layout: {
        type: 'vbox',
        align: 'stretch'
    },
    scrollable: true,
    bodyPadding: 20,

    items: [
        // Phần 1: Khối thống kê nhanh (Gồm các ô nhỏ nằm ngang)
        {
            xtype: 'container',
            layout: {
                type: 'hbox',
                pack: 'start'
            },
            defaults: {
                xtype: 'panel',
                flex: 1,
                margin: '0 15 15 0',
                bodyPadding: 15,
                style: 'border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);'
            },
            items: [
                {
                    title: 'Tổng số lớp bản đồ',
                    html: '<h2 style="color: #2196F3; margin: 5px 0;">12 Layer</h2><p style="color: #777; margin:0;">Đang hoạt động trên hệ thống</p>',
                    style: 'border-left: 5px solid #2196F3;'
                },
                {
                    title: 'Dữ liệu không gian',
                    html: '<h2 style="color: #4CAF50; margin: 5px 0;">154,203</h2><p style="color: #777; margin:0;">Đối tượng hình học (Features)</p>',
                    style: 'border-left: 5px solid #4CAF50;'
                },
                {
                    title: 'Trạng thái hệ thống',
                    html: '<h2 style="color: #009688; margin: 5px 0;">Ổn định</h2><p style="color: #777; margin:0;">Kết nối gServer: Mượt mà</p>',
                    style: 'border-left: 5px solid #009688;'
                }
            ]
        },

        // Phần 2: Khu vực Dashboard bên dưới (Chia đôi: Bên trái Bản đồ, Bên phải Nhật ký)
       // Phần 2: Khu vực Dashboard
		{
			xtype: 'container',
			layout: { type: 'hbox', align: 'stretch' },
			flex: 1,
			minHeight: 400,
			items: [
                {
                    title: 'Bản đồ mẫu',
                    xtype: 'panel',
                    cls: 'map-cls',
                    flex: 2,
                    margin: '0 15 15 0',
                    layout: 'fit', // ✅ Thêm layout fit để body tự stretch
                    style: 'border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);',
                    html: '<div id='+'MapExample'+' style="position: absolute; top: 0; right: 0; bottom: 0; left: 0;"></div>'
                    // listeners: {
                    //     afterrender: function(panel) {
                    //         const attribution = new ol.control.Attribution({
                    //             collapsible: false,
                    //         });
                    //         var bodyEl = panel.body || panel.getTargetEl();
                    //         bodyEl.update('<div id="ol-map-inner" style="width:100%;height:100%;"></div>');
                    //         var innerDom = bodyEl.down('#ol-map-inner').dom;

                    //         const map = new ol.Map({
                    //             layers: [
                    //                 new ol.layer.Tile({ source: new ol.source.OSM() })
                    //             ],
                    //             controls: ol.control.defaults.defaults({ attribution: false }).extend([attribution]),
                    //             target: innerDom.id,
                    //             view: new ol.View({
                    //                 constrainResolution: true,
                    //                 center: ol.proj.fromLonLat([16.62662018, 49.2125578]),
                    //                 zoom: 14
                    //             })
                    //         });

                    //         panel.olMap = map; // ✅ Lưu map vào panel để resize dùng được
                    //     },
                    //     resize: function(panel) {
                    //         if (panel.olMap) {
                    //             panel.olMap.updateSize(); // ✅ Giờ mới chạy được
                    //         }
                    //     }
                    // }
                },
				{
					xtype: 'grid',
					title: 'Nhật ký vận hành gần đây',
					flex: 1,
					columns: [
						{ text: 'Thời gian', dataIndex: 'time', width: 130 },
						{ text: 'Hành động', dataIndex: 'action', flex: 1 }
					],
					store: Ext.create('Ext.data.Store', {
						fields: ['time', 'action'],
						data: [
							{ time: '15:30:12', action: 'Admin tạo mới layer [Ranh giới xã]' },
							{ time: '14:22:05', action: 'User ekgis nạp thành công 50 points' },
							{ time: '11:15:40', action: 'Cập nhật cấu hình Opacity layer ID: 5' },
							{ time: '09:01:18', action: 'Hệ thống gServer khởi động thành công' }
						]
					})
				}
			]
		}
    ]
});