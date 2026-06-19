Ext.define('gClient.controller.LayerController', {
    extend: 'Ext.app.Controller',

    mapPanelRef: null,
    requires: [
        'Ext.grid.Grid',
        'Ext.grid.column.Check'
    ],
    control: {
        'panel[cls=map-DPHCC-cls]': {
            painted: 'initOpenLayersMap',
            resize: 'onMapResize'
        },
        'panel[cls=layers-DPHCC-cls]': {
            painted: 'getLayers'
        }
    },
    
    // --- PHẦN LOGIC PHÂN NHÁNH ĐIỀU PHỐI REQUEST ---
    debounceTimer: null,
    // Cấu trúc hàng đợi toàn cục mới: { layerId_1: [id1, id2], layerId_2: [id3] }
    globalPendingQueue: {}, 

    initOpenLayersMap: function (panel) {
        this.mapPanelRef = panel;
        if (panel.map) {
            setTimeout(function() { if (panel.map) panel.map.updateSize(); }, 100);
            return;
        }

        var target = Ext.get('map-DPHCC');
        panel.map = new ol.Map({
            target: target.dom.id, 
            layers: [
                new ol.layer.Tile({ source: new ol.source.OSM() })
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([105.8342, 21.0278]),
                zoom: 13
            })
        });
        
        panel.vectorSource = new ol.source.Vector();
        var vectorLayer = new ol.layer.Vector({
            source: panel.vectorSource
        });
        panel.map.addLayer(vectorLayer);
    },

    onMapResize: function (panel) {
        if (panel.map) panel.map.updateSize();
    },

    getLayers: function(panel) {
        var me = this;
        var baseUrl = gClient.app.getApiHost();

        Ext.Ajax.request({
            url: baseUrl + '/LayerService.svc/layers',
            method: 'GET',
            success: function(response) {
                var rawData = Ext.decode(response.responseText).Data;
                panel.removeAll();
                
                // ĐÃ SỬA: Chỉ dùng một vòng lặp duy nhất dựa theo cấu trúc JSON thực tế
                Ext.Array.each(rawData, function(layerItem) {
                    var featureStore = Ext.create('gClient.view.Features.FeatureStore');
                    featureStore.getProxy().setUrl(baseUrl + '/LayerService.svc/layers/' + layerItem.Id + '/features');

                    var layerGrid = Ext.create('Ext.grid.Grid', {
                        title: layerItem.Name,
                        store: featureStore,
                        maxHeight: 400,
                        infinite: false,    
                        variableHeights: true,
                        columns: [
                            { 
                                text: 'Hiển thị', 
                                xtype: 'checkcolumn', 
                                dataIndex: 'checked', 
                                align: 'center',
                                width: 100,
                                headerCheckbox: false,
                                listeners: {
                                    checkchange: function(column, rowIndex, checked, record, e) {
                                        Ext.log("Thay đổi trạng thái record: " + record.getId() + " -> " + checked);
                                        me.handleFeatureToggle(layerItem.Id, record);
                                    }
                                }
                            },
                            { 
                                text: 'Tên Tỉnh/Đối tượng', 
                                dataIndex: 'Properties', 
                                flex: 1,
                                align: 'center',
                                renderer: function(value, record) {
                                    var name = "Feature #" + record.getId(); 
                                    if (Ext.isArray(value)) {
                                        var match = Ext.Array.findBy(value, function(item) {
                                            return item.Key === 'province' || item.Key === 'name';
                                        });
                                        if (match) {
                                            name = match.Value;
                                        }
                                    }
                                    return name;
                                }
                            }
                        ],
                        listeners: {
                            painted: function() {
                                featureStore.load();
                            }
                        }
                    });
                    panel.add(layerGrid);
                });
            }
        });
    },

    handleFeatureToggle: function(layerId, record) {
        var me = this,
            featureId = record.getId(),
            isTicked = record.get('checked'),
            mapPanel = me.mapPanelRef;

        // 1. BỎ TÍCH: Xóa luôn khỏi bản đồ và hàng đợi của Layer tương ứng
        if (!isTicked) {
            var existingFeature = mapPanel.vectorSource.getFeatureById(featureId);
            if (existingFeature) mapPanel.vectorSource.removeFeature(existingFeature);
            
            if (me.globalPendingQueue[layerId]) {
                Ext.Array.remove(me.globalPendingQueue[layerId], featureId);
            }
            return;
        }

        // 2. ĐÃ CÓ GEOM CACHE: Vẽ luôn từ bộ nhớ, không tốn tài nguyên gọi API
        if (record.get('Geom')) {
            me.drawWktOnMap(record.get('Geom'), featureId);
            return;
        }

        // 3. CHƯA CÓ GEOM: Gom vào hàng đợi phân loại chi tiết theo layerId
        if (!me.globalPendingQueue[layerId]) {
            me.globalPendingQueue[layerId] = [];
        }
        
        var layerQueue = me.globalPendingQueue[layerId];
        if (!Ext.Array.contains(layerQueue, featureId)) {
            layerQueue.push(featureId);
            Ext.log("Hàng đợi Layer [" + layerId + "] tích lũy: [" + layerQueue.join(', ') + "]");
        }

        // Reset timer nếu người dùng đang click liên tục (Debounce)
        clearTimeout(me.debounceTimer);

        // Chờ 400ms sau cú click cuối cùng để bắt đầu bóc tách hàng đợi
        me.debounceTimer = setTimeout(function() {
            // Duyệt qua tất cả các Layer có ID đang đợi xử lý hình học
            Ext.Object.each(me.globalPendingQueue, function(currentLayerId, idsToSubmit) {
                var totalPending = idsToSubmit ? idsToSubmit.length : 0;
                if (totalPending === 0) return;

                Ext.log("===> Hết thời gian chờ. Layer [" + currentLayerId + "] có " + totalPending + " ID tích lũy.");

                // Xóa bỏ danh sách hàng đợi của layer hiện tại ngay lập tức để tránh trùng lặp cú click tiếp theo
                me.globalPendingQueue[currentLayerId] = [];

                if (totalPending === 1) {
                    me.sendSingleGeometryRequest(idsToSubmit[0]);
                } 
                else if (totalPending >= 2) {
                    me.sendBatchGeometryRequest(currentLayerId, idsToSubmit);
                }
            });
        }, 400); // 400ms là khoảng thời gian vừa đủ để nhận diện click nhanh liên tục
    },

    // Gọi API GET đơn lẻ cho 1 Feature
    sendSingleGeometryRequest: function(featureId) {
        var me = this,
            baseUrl = gClient.app.getApiHost();

        Ext.log("--- Gọi API đơn lẻ (GET) cho feature: " + featureId);

        Ext.Ajax.request({
            url: baseUrl + '/LayerService.svc/features/' + featureId + '/geometry',
            method: 'GET',
            success: function(response) {
                var featureObj = Ext.decode(response.responseText);
                if (featureObj && featureObj.GeomWkt) {
                    me.drawWktOnMap(featureObj.GeomWkt, featureObj.Id);

                    var storeRecord = me.findRecordInGrids(featureObj.Id);
                    if (storeRecord) {
                        storeRecord.set('Geom', featureObj.GeomWkt);
                    }
                }
            }
        });
    },

    // Gọi API POST lô lớn cho nhiều Features thuộc cùng một Layer
    sendBatchGeometryRequest: function(layerId, idsToSend) {
        var me = this;
        if (!idsToSend || idsToSend.length === 0) return;

        Ext.log("--- BẮT ĐẦU GỌI API BATCH LAYER [" + layerId + "] CHO CÁC ID: " + idsToSend.join(', '));

        var baseUrl = gClient.app.getApiHost();
        
        Ext.Ajax.request({
            url: baseUrl + '/LayerService.svc/layers/' + layerId + '/features-batch',
            method: 'POST',
            jsonData: {
                featureIds: idsToSend
            },
            success: function(response) {
                var featureCollection = Ext.decode(response.responseText);
                
                if (featureCollection && featureCollection.Features) {
                    Ext.Array.each(featureCollection.Features, function(feat) {
                        // 1. Vẽ đồ họa lên bản đồ
                        me.drawWktOnMap(feat.GeomWkt, feat.Id);
                        
                        // 2. Cập nhật ngược lại Geom vào Store của Grid để cache dữ liệu
                        var storeRecord = me.findRecordInGrids(feat.Id);
                        if (storeRecord) {
                            // Sử dụng `{silent: true}` tránh việc kích hoạt lại event render liên tục làm chậm UI
                            storeRecord.set('Geom', feat.GeomWkt, { silent: true }); 
                        }
                    });
                    
                    // Tự động di chuyển khung hình đến vùng hiển thị bao gộp của Batch dữ liệu mới
                    if (featureCollection.BoundingBox) {
                        me.zoomToBoundingBox(featureCollection.BoundingBox);
                    }
                }
            },
            failure: function(response) {
                Ext.log.error("Lỗi khi thực thi API Batch Layer " + layerId + ": ", response.statusText);
            }
        });
    },

    zoomToBoundingBox: function(bbox) {
        var mapPanel = this.mapPanelRef;
        if (!mapPanel || !mapPanel.map) return;

        var extent = [bbox.MinLon, bbox.MinLat, bbox.MaxLon, bbox.MaxLat];
        var olExtent = ol.proj.transformExtent(extent, 'EPSG:4326', mapPanel.map.getView().getProjection());
        mapPanel.map.getView().fit(olExtent, { duration: 800 });
    },

    findRecordInGrids: function(featureId) {
        var foundRecord = null;
        Ext.ComponentQuery.query('grid').forEach(function(grid) {
            var rec = grid.getStore().getById(featureId);
            if (rec) foundRecord = rec;
        });
        return foundRecord;
    },

    drawWktOnMap: function(wktString, featureId, colorHex) {
        var mapPanel = this.mapPanelRef;
        if (!mapPanel || !mapPanel.vectorSource) return;

        var oldFeature = mapPanel.vectorSource.getFeatureById(featureId);
        if (oldFeature) mapPanel.vectorSource.removeFeature(oldFeature);

        var wktFormat = new ol.format.WKT();
        var olFeature = wktFormat.readFeature(wktString, {
            dataProjection: 'EPSG:4326', 
            featureProjection: mapPanel.map.getView().getProjection() 
        });

        olFeature.setId(featureId);

        var mainColor = colorHex || '#1890ff'; 
        var rgbaFill = this.hexToRgba(mainColor, 0.3); 

        var featureStyle = new ol.style.Style({
            fill: new ol.style.Fill({ color: rgbaFill }),
            stroke: new ol.style.Stroke({ color: mainColor, width: 2 }),
            image: new ol.style.Circle({
                radius: 6,
                fill: new ol.style.Fill({ color: mainColor }),
                stroke: new ol.style.Stroke({ color: '#ffffff', width: 1.5 })
            })
        });

        olFeature.setStyle(featureStyle);
        mapPanel.vectorSource.addFeature(olFeature);
    },

    hexToRgba: function(hex, opacity) {
        var c;
        if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
            c= hex.substring(1).split('');
            if(c.length== 3){
                c= [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c= '0x'+c.join('');
            return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+opacity+')';
        }
        return 'rgba(24, 144, 255, ' + opacity + ')';
    }
});