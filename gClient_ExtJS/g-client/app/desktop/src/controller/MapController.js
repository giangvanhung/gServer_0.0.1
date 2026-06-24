Ext.define('gClient.controller.MapController', {
    extend: 'Ext.app.Controller',

    control: {
        'panel[cls=map-cls]': {
            painted: 'initOpenLayersMap',
            resize: 'onMapResize'
        },
        'mapPanel': { // Đúng tên xtype của trang map thứ 2
            painted: 'initOpenLayersMap',
            resize: 'onMapResize'
        }
    },

    initOpenLayersMap: function (panel) {
        // 🔥 ĐOẠN CHECK THẦN THÁNH: Nếu panel này đã dựng map rồi -> CHẶN KHÔNG CHO TẠO TIẾP
        if (panel.map) {
            // Ext.log("Bản đồ đã tồn tại cho panel này, chỉ cập nhật kích thước.");
            setTimeout(function() {
                if (panel.map) {
                    panel.map.updateSize(); 
                }
            }, 100);
            return; // Thoát hẳn hàm, không chạy xuống lệnh khởi tạo ở dưới!
        }

        // Ext.log("Khởi tạo bản đồ OpenLayers cho: " + panel.getXTypes());

        // 🎯 Lấy Element Target an toàn tự động (Dù dùng cấu trúc html div hay dom gốc)
        var targetDomId;

        if (panel.cls === 'map-cls') {
            // Đối với HomeView: Ta trỏ thẳng vào Id của div nằm trong chuỗi html
            targetDomId = 'MapExample';
        } else {
            // Đối với trang MapPanel: Ta trỏ trực tiếp vào DOM Element bên trong của Panel đó
            var targetEl = panel.element ? panel.element.dom : panel.getTargetEl().dom;
            targetDomId = targetEl;
        }

        // Khởi tạo đối tượng OpenLayers Map
        panel.map = new ol.Map({
            target: targetDomId, 
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([105.8342, 21.0278]),
                zoom: 13
            })
        });

        // Force cập nhật kích thước một lần sau khi giao diện ổn định
        setTimeout(function() {
            if (panel.map) {
                panel.map.updateSize();
            }
        }, 150);
    },

    onMapResize: function (panel) {
        if (panel.map) {
            panel.map.updateSize();
        }
    }
});