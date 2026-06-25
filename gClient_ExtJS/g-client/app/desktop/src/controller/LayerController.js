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

    debounceTimer: null,
    globalPendingQueue: {},
    layerFeatureIds: {},
    layerToggleState: {},
    layerLoading: {},        // { layerId: true } while a load is in flight
    layerEyeBtns: {},        // { layerId: Ext.Button } — held so we can disable during load
    highlightedFeatureId: null,
    layerStores: {},
    featureCRUDPanel: null,
    layerCRUDPanel: null,
    layerStyleCRUDPanel: null,
    layerStyles: {},          // { layerId: styleObj|null } — null means "no style, use defaults"
    currentDrawLayerId: null,
    currentDrawLayerName: null,
    layerList: [],

    // ─── MAP INIT ───────────────────────────────────────────────────────────────

    initOpenLayersMap: function (panel) {
        this.mapPanelRef = panel;
        if (panel.map) {
            setTimeout(function() { if (panel.map) panel.map.updateSize(); }, 100);
            return;
        }

        var me = this;
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
        panel.map.addLayer(new ol.layer.Vector({ source: panel.vectorSource }));

        // Separate source for draw preview (dashed blue)
        panel.drawSource = new ol.source.Vector();
        panel.map.addLayer(new ol.layer.Vector({
            source: panel.drawSource,
            style: new ol.style.Style({
                fill: new ol.style.Fill({ color: 'rgba(0, 120, 255, 0.18)' }),
                stroke: new ol.style.Stroke({ color: '#0078ff', width: 2, lineDash: [6, 3] }),
                image: new ol.style.Circle({
                    radius: 6,
                    fill: new ol.style.Fill({ color: '#0078ff' }),
                    stroke: new ol.style.Stroke({ color: '#fff', width: 2 })
                })
            })
        }));

        me.createDrawToolbar(panel);

        panel.map.on('singleclick', function(evt) {
            // Skip while drawing or immediately after a drawend (point draw fires singleclick too)
            if (panel.activeDrawType || panel.drawJustEnded) {
                panel.drawJustEnded = false;
                return;
            }

            var clickedOlFeature = panel.map.forEachFeatureAtPixel(
                evt.pixel,
                function(f) { return f; },
                { layerFilter: function(l) { return l.getSource() === panel.vectorSource; } }
            );

            if (clickedOlFeature) {
                var fid = clickedOlFeature.getId();
                var record = me.findRecordInGrids(fid);
                var props = record ? record.get('Properties') : {};
                var extent = clickedOlFeature.getGeometry().getExtent();
                var center = ol.extent.getCenter(extent);

                me.showFeaturePanel('Feature #' + fid, props);
                me.applyHighlightStyle(panel, fid);
                me.highlightGridRow(fid);
            } else {
                var lonlat = ol.proj.toLonLat(
                    evt.coordinate,
                    panel.map.getView().getProjection()
                );
                me.identifyAtCoordinate(panel, lonlat, evt.coordinate);
            }
        });
    },

    onMapResize: function (panel) {
        if (panel.map) panel.map.updateSize();
    },

    // ─── FEATURE PROPERTIES PANEL ───────────────────────────────────────────────

    showFeaturePanel: function(title, properties) {
        var panel = Ext.ComponentQuery.query('panel[cls=feature-props-DPHCC-cls]')[0];
        if (!panel) return;

        var html = '<table style="width:100%;border-collapse:collapse;">';

        if (Ext.isArray(properties) && properties.length > 0) {
            Ext.Array.each(properties, function(item) {
                html += '<tr>'
                      + '<td style="padding:5px 8px;border-bottom:1px solid #eee;font-weight:600;color:#555;white-space:nowrap;">'
                      + Ext.String.htmlEncode(String(item.Key || '')) + '</td>'
                      + '<td style="padding:5px 8px;border-bottom:1px solid #eee;">'
                      + Ext.String.htmlEncode(String(item.Value !== undefined ? item.Value : '')) + '</td>'
                      + '</tr>';
            });
        } else if (properties && typeof properties === 'object') {
            var keys = Object.keys(properties);
            if (keys.length > 0) {
                keys.forEach(function(k) {
                    html += '<tr>'
                          + '<td style="padding:5px 8px;border-bottom:1px solid #eee;font-weight:600;color:#555;white-space:nowrap;">'
                          + Ext.String.htmlEncode(String(k)) + '</td>'
                          + '<td style="padding:5px 8px;border-bottom:1px solid #eee;">'
                          + Ext.String.htmlEncode(String(properties[k] !== null ? properties[k] : '')) + '</td>'
                          + '</tr>';
                });
            } else {
                html += '<tr><td colspan="2" style="padding:12px;color:#999;text-align:center;">Không có thuộc tính</td></tr>';
            }
        } else {
            html += '<tr><td colspan="2" style="padding:12px;color:#999;text-align:center;">Không có thuộc tính</td></tr>';
        }

        html += '</table>';

        if (!panel.isVisible()) {
            panel.show();
            var parent = panel.getParent ? panel.getParent() : null;
            if (parent && parent.updateLayout) parent.updateLayout();
        }
        panel.setTitle(title);
        panel.setHtml(html);
    },

    hideFeaturePanel: function() {
        var panel = Ext.ComponentQuery.query('panel[cls=feature-props-DPHCC-cls]')[0];
        if (panel && panel.isVisible()) {
            panel.hide();
            var parent = panel.getParent ? panel.getParent() : null;
            if (parent && parent.updateLayout) parent.updateLayout();
        }
    },

    // ─── IDENTIFY (click on empty map) ──────────────────────────────────────────

    identifyAtCoordinate: function(mapPanel, lonlat, coordinate) {
        var me = this,
            baseUrl = gClient.app.getApiHost();

        Ext.Ajax.request({
            url: baseUrl + '/LayerService.svc/identify',
            method: 'POST',
            jsonData: { lon: lonlat[0], lat: lonlat[1] },
            success: function(response) {
                var fc = Ext.decode(response.responseText);
                if (fc && fc.Features && fc.Features.length > 0) {
                    var feat = fc.Features[0];
                    var title = 'Identify — Feature #' + feat.Id
                              + (fc.Features.length > 1 ? ' (+' + (fc.Features.length - 1) + ')' : '');

                    me.showFeaturePanel(title, feat.Properties);
                    me.applyHighlightStyle(mapPanel, feat.Id);
                    me.highlightGridRow(feat.Id);
                }
            }
        });
    },

    // ─── LAYER TOGGLE (eye icon — show/hide entire layer) ───────────────────────

    // btn = the Ext.Button for the eye icon (so we can swap iconCls)
    toggleLayerOnMap: function(layerId, btn) {
        var me = this;

        if (me.layerToggleState[layerId]) {
            me.clearLayerFromMap(layerId);
            me.layerToggleState[layerId] = false;
            if (btn) btn.setIconCls('x-fa fa-eye-slash');
        } else {
            me.layerToggleState[layerId] = true;
            if (btn) btn.setIconCls('x-fa fa-eye');
            me.loadAllLayerFeatures(layerId);
        }
    },

    clearLayerFromMap: function(layerId) {
        var me = this,
            mapPanel = me.mapPanelRef,
            ids = me.layerFeatureIds[layerId] || [];

        Ext.Array.each(ids, function(fid) {
            var olFeat = mapPanel.vectorSource.getFeatureById(fid);
            if (olFeat) mapPanel.vectorSource.removeFeature(olFeat);
        });
        me.layerFeatureIds[layerId] = [];
        me._finishLayerLoad(layerId);   // clear loading flag + re-enable button

        me.hideFeaturePanel();
    },

    loadAllLayerFeatures: function(layerId) {
        var me  = this,
            btn = me.layerEyeBtns[layerId];

        me.layerLoading[layerId] = true;
        if (btn) btn.setDisabled(true);

        me.fetchAndCacheLayerStyle(layerId, function(style) {
            me._drawLayerFeatures(layerId, style);
        });
    },

    _finishLayerLoad: function(layerId) {
        var me  = this,
            btn = me.layerEyeBtns[layerId];
        me.layerLoading[layerId] = false;
        if (btn) btn.setDisabled(false);
    },

    fetchAndCacheLayerStyle: function(layerId, callback) {
        var me = this;
        if (me.layerStyles[layerId] !== undefined) {
            callback(me.layerStyles[layerId]);
            return;
        }
        var baseUrl = gClient.app.getApiHost();
        Ext.Ajax.request({
            url: baseUrl + '/LayerStyle.svc/layers/' + layerId + '/style',
            method: 'GET',
            success: function(response) {
                var result = Ext.decode(response.responseText);
                me.layerStyles[layerId] = (result && result.Success && result.Data) ? result.Data : null;
                callback(me.layerStyles[layerId]);
            },
            failure: function() {
                me.layerStyles[layerId] = null;
                callback(null);
            }
        });
    },

    _drawLayerFeatures: function(layerId, style) {
        var me      = this,
            baseUrl = gClient.app.getApiHost(),
            store   = me.layerStores[layerId];

        if (!store) return;

        var featureIds = [];
        store.each(function(rec) { featureIds.push(rec.getId()); });

        if (featureIds.length === 0) {
            store.load({ callback: function() { me._drawLayerFeatures(layerId, style); } });
            return;
        }

        Ext.Ajax.request({
            url: baseUrl + '/LayerService.svc/layers/' + layerId + '/features-batch',
            method: 'POST',
            jsonData: { featureIds: featureIds },
            success: function(response) {
                me._finishLayerLoad(layerId);

                // Layer was toggled off while the request was in-flight — discard result
                if (!me.layerToggleState[layerId]) return;

                var fc = Ext.decode(response.responseText);
                if (fc && fc.Features) {
                    me.layerFeatureIds[layerId] = [];
                    Ext.Array.each(fc.Features, function(feat) {
                        me.drawWktOnMap(feat.GeomWkt, feat.Id, style);
                        me.layerFeatureIds[layerId].push(feat.Id);
                        var rec = store.getById(feat.Id);
                        if (rec) rec.set('Geom', feat.GeomWkt, { silent: true });
                    });
                    if (fc.BoundingBox) me.zoomToBoundingBox(fc.BoundingBox);
                }
            },
            failure: function() {
                me._finishLayerLoad(layerId);
            }
        });
    },

    // ─── ROW CLICK (list → map) ─────────────────────────────────────────────────

    onFeatureRowTap: function(layerId, record) {
        var me = this,
            featureId = record.getId(),
            mapPanel = me.mapPanelRef,
            props = record.get('Properties'),
            title = 'Feature #' + featureId;

        var olFeature = mapPanel.vectorSource.getFeatureById(featureId);

        if (olFeature) {
            var extent = olFeature.getGeometry().getExtent();
            var center = ol.extent.getCenter(extent);
            me.showFeaturePanel(title, props);
            me.applyHighlightStyle(mapPanel, featureId);
            mapPanel.map.getView().fit(extent, { duration: 600, padding: [60, 60, 60, 60], maxZoom: 17 });
        } else {
            me.showFeaturePanel(title, props);
            me.fetchGeomAndZoom(layerId, featureId, record);
        }
    },

    fetchGeomAndZoom: function(layerId, featureId, record) {
        var me = this,
            baseUrl = gClient.app.getApiHost(),
            mapPanel = me.mapPanelRef;

        Ext.Ajax.request({
            url: baseUrl + '/LayerService.svc/features/' + featureId + '/geometry',
            method: 'GET',
            success: function(response) {
                var feat = Ext.decode(response.responseText);
                if (feat && feat.GeomWkt) {
                    record.set('Geom', feat.GeomWkt, { silent: true });

                    if (!me.layerFeatureIds[layerId]) me.layerFeatureIds[layerId] = [];
                    if (!Ext.Array.contains(me.layerFeatureIds[layerId], featureId)) {
                        me.layerFeatureIds[layerId].push(featureId);
                    }

                    var olFeat = me.drawWktOnMap(feat.GeomWkt, featureId, me.layerStyles[layerId]);
                    me.applyHighlightStyle(mapPanel, featureId);

                    if (olFeat && olFeat.getGeometry()) {
                        var extent = olFeat.getGeometry().getExtent();
                        var center = ol.extent.getCenter(extent);
                        me.showFeaturePanel('Feature #' + featureId, record.get('Properties'));
                        mapPanel.map.getView().fit(extent, { duration: 600, padding: [60, 60, 60, 60], maxZoom: 17 });
                    }
                }
            }
        });
    },

    // ─── HIGHLIGHT ──────────────────────────────────────────────────────────────

    applyHighlightStyle: function(mapPanel, featureId) {
        var me = this;

        if (me.highlightedFeatureId && me.highlightedFeatureId !== featureId) {
            var prev = mapPanel.vectorSource.getFeatureById(me.highlightedFeatureId);
            if (prev) prev.setStyle(null);
        }

        var feature = mapPanel.vectorSource.getFeatureById(featureId);
        if (feature) {
            feature.setStyle(new ol.style.Style({
                fill: new ol.style.Fill({ color: 'rgba(255, 140, 0, 0.45)' }),
                stroke: new ol.style.Stroke({ color: '#ff6600', width: 3 }),
                image: new ol.style.Circle({
                    radius: 8,
                    fill: new ol.style.Fill({ color: '#ff6600' }),
                    stroke: new ol.style.Stroke({ color: '#ffffff', width: 2 })
                })
            }));
            me.highlightedFeatureId = featureId;
        }
    },

    clearHighlight: function(mapPanel) {
        var me = this;
        if (me.highlightedFeatureId) {
            var feat = mapPanel.vectorSource.getFeatureById(me.highlightedFeatureId);
            if (feat) feat.setStyle(null);
            me.highlightedFeatureId = null;
        }
    },

    highlightGridRow: function(featureId) {
        Ext.ComponentQuery.query('grid').forEach(function(grid) {
            var rec = grid.getStore().getById(featureId);
            if (rec) {
                grid.select(rec);
                if (typeof grid.scrollToRecord === 'function') {
                    grid.scrollToRecord(rec);
                }
            }
        });
    },

    // ─── GET LAYERS & BUILD LAYER PANEL ─────────────────────────────────────────

    getLayers: function(panel) {
        var me = this;
        var baseUrl = gClient.app.getApiHost();

        Ext.Ajax.request({
            url: baseUrl + '/LayerService.svc/layers',
            method: 'GET',
            success: function(response) {
                var rawData = Ext.decode(response.responseText).Data;
                panel.removeAll();

                // ── "Add Layer" toolbar at top ─────────────────────────────────
                if (!panel.down('toolbar')) {
                    panel.add({
                        xtype: 'toolbar',
                        docked: 'top',
                        items: [
                            {
                                xtype: 'button',
                                text: 'Thêm Layer',
                                handler: function() { me.openLayerCRUD(null); }
                            }
                        ]
                    });
                }

                Ext.Array.each(rawData, function(layerItem, index) {
                    var featureStore = Ext.create('gClient.view.Features.FeatureStore');
                    featureStore.getProxy().setUrl(
                        baseUrl + '/LayerService.svc/layers/' + layerItem.Id + '/features'
                    );
                    me.layerStores[layerItem.Id] = featureStore;

                    // ── Per-layer header toolbar (explicit buttons — reliable in Modern toolkit) ──
                    var eyeBtn = Ext.create('Ext.Button', {
                        iconCls: 'x-fa fa-eye-slash',
                        ui: 'plain',
                        tooltip: 'Hiện / Ẩn tất cả đối tượng trên bản đồ',
                        handler: function(btn) {
                            me.toggleLayerOnMap(layerItem.Id, btn);
                        }
                    });
                    me.layerEyeBtns[layerItem.Id] = eyeBtn;

                    panel.add({
                        xtype: 'toolbar',
                        // style: 'background:#f0f4fa;border-bottom:1px solid #030303;padding:2px 6px;',
                        // width: '100%',
                        // scrollable: true,
                        items: [
                            {
                                xtype: 'panel',
                                flex: 1,
                                bodyPadding: 0,
                                margin: 0,
                                padding: 0,
                                scrollable: 'x',  // ← Scroll ngang
                                html: '<span style="font-weight:600;color:#1d3461;font-size:12px;line-height:28px;white-space:nowrap;display:inline-block;padding-right:10px;">'
                                    + Ext.String.htmlEncode(layerItem.Name) + '</span>'
                            },
                            eyeBtn,
                            {
                                xtype: 'button',
                                iconCls: 'x-fa fa-pencil-alt',
                                ui: 'plain',
                                tooltip: 'Quản lý Feature (Thêm / Sửa / Xóa)',
                                handler: function() { me.openFeatureCRUD(layerItem.Id, layerItem.Name); }
                            },
                            {
                                xtype: 'button',
                                iconCls: 'x-fa fa-palette',
                                ui: 'plain',
                                tooltip: 'Chỉnh Style Layer',
                                handler: function() { me.openLayerStyleCRUD(layerItem); }
                            },
                            {
                                xtype: 'button',
                                iconCls: 'x-fa fa-edit',
                                ui: 'plain',
                                tooltip: 'Sửa thông tin Layer',
                                handler: function() { me.openLayerCRUD(layerItem); }
                            },
                            {
                                xtype: 'button',
                                iconCls: 'x-fa fa-trash',
                                ui: 'plain',
                                tooltip: 'Xóa Layer này',
                                style: 'color:#ff4d4f;',
                                handler: function() { me.onLayerDeleteClick(layerItem); }
                            }
                        ]
                    });

                    var layerGrid = Ext.create('Ext.grid.Grid', {
                        store: featureStore,
                        maxHeight: 370,
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
                                        var clickCoords = null;
                                        if (e && typeof e.getXY === 'function') {
                                            clickCoords = e.getXY();
                                        }
                                        me.handleFeatureToggle(layerItem.Id, record, clickCoords);
                                    }
                                }
                            },
                            {
                                text: 'Tên / Đối tượng',
                                dataIndex: 'Properties',
                                flex: 1,
                                align: 'center',
                                renderer: function(value, record) {
                                    var name = 'Feature #' + record.getId();
                                    if (Ext.isArray(value)) {
                                        var match = Ext.Array.findBy(value, function(item) {
                                            return item.Key === 'province' || item.Key === 'name' || item.Key === 'ten';
                                        });
                                        if (match) name = match.Value;
                                    } else if (value && typeof value === 'object') {
                                        name = value.ten || value.name || value.Name || name;
                                    }
                                    return name;
                                }
                            }
                        ],
                        listeners: {
                            painted: function() { featureStore.load(); },
                            itemtap: function(grid, index, target, record, e) {
                                me.onFeatureRowTap(layerItem.Id, record);
                            }
                        }
                    });

                    panel.add(layerGrid);
                });

                // Populate draw toolbar layer dropdown
                me.updateDrawToolbarLayers(rawData);
            }
        });
    },

    // ─── CHECKBOX TOGGLE (per-feature check) ────────────────────────────────────

    handleFeatureToggle: function(layerId, record, clickCoords) {
        var me = this,
            featureId = record.getId(),
            isTicked = record.get('checked'),
            mapPanel = me.mapPanelRef;

        if (!isTicked) {
            var existingFeature = mapPanel.vectorSource.getFeatureById(featureId);
            if (existingFeature) mapPanel.vectorSource.removeFeature(existingFeature);

            if (me.globalPendingQueue[layerId]) {
                Ext.Array.remove(me.globalPendingQueue[layerId], featureId);
            }
            if (me.layerFeatureIds[layerId]) {
                Ext.Array.remove(me.layerFeatureIds[layerId], featureId);
            }
            return;
        }

        if (record.get('Geom')) {
            var olFeature = me.drawWktOnMap(record.get('Geom'), featureId, me.layerStyles[layerId]);
            if (olFeature && olFeature.getGeometry()) {
                var extent = olFeature.getGeometry().getExtent();
                mapPanel.map.getView().fit(extent, { duration: 800, padding: [50, 50, 50, 50] });
            }
            if (!me.layerFeatureIds[layerId]) me.layerFeatureIds[layerId] = [];
            if (!Ext.Array.contains(me.layerFeatureIds[layerId], featureId)) {
                me.layerFeatureIds[layerId].push(featureId);
            }
            return;
        }

        if (!me.globalPendingQueue[layerId]) me.globalPendingQueue[layerId] = [];
        var layerQueue = me.globalPendingQueue[layerId];

        var isExist = Ext.Array.some(layerQueue, function(item) { return item.id === featureId; });
        if (!isExist) {
            layerQueue.push({ id: featureId, coords: clickCoords || null });
        }

        clearTimeout(me.debounceTimer);
        me.debounceTimer = setTimeout(function() {
            Ext.Object.each(me.globalPendingQueue, function(currentLayerId, idsToSubmit) {
                if (!idsToSubmit || idsToSubmit.length === 0) return;
                me.globalPendingQueue[currentLayerId] = [];

                if (idsToSubmit.length === 1) {
                    me.sendSingleGeometryRequest(currentLayerId, idsToSubmit[0].id, idsToSubmit[0].coords);
                } else {
                    me.sendBatchGeometryRequest(currentLayerId, Ext.Array.pluck(idsToSubmit, 'id'));
                }
            });
        }, 400);
    },

    sendSingleGeometryRequest: function(layerId, featureId, clickCoords) {
        var me = this,
            baseUrl = gClient.app.getApiHost();

        Ext.Ajax.request({
            url: baseUrl + '/LayerService.svc/features/' + featureId + '/geometry',
            method: 'GET',
            success: function(response) {
                var featureObj = Ext.decode(response.responseText);
                if (featureObj && featureObj.GeomWkt) {
                    var olFeature = me.drawWktOnMap(featureObj.GeomWkt, featureObj.Id, me.layerStyles[layerId]);

                    var storeRecord = me.findRecordInGrids(featureObj.Id);
                    if (storeRecord) storeRecord.set('Geom', featureObj.GeomWkt, { silent: true });

                    if (!me.layerFeatureIds[layerId]) me.layerFeatureIds[layerId] = [];
                    if (!Ext.Array.contains(me.layerFeatureIds[layerId], featureObj.Id)) {
                        me.layerFeatureIds[layerId].push(featureObj.Id);
                    }

                    if (olFeature && olFeature.getGeometry()) {
                        var extent = olFeature.getGeometry().getExtent();
                        me.mapPanelRef.map.getView().fit(extent, { duration: 800, padding: [50, 50, 50, 50] });
                    }
                }
            }
        });
    },

    sendBatchGeometryRequest: function(layerId, idsToSend) {
        var me = this;
        if (!idsToSend || idsToSend.length === 0) return;

        var baseUrl = gClient.app.getApiHost();

        Ext.Ajax.request({
            url: baseUrl + '/LayerService.svc/layers/' + layerId + '/features-batch',
            method: 'POST',
            jsonData: { featureIds: idsToSend },
            success: function(response) {
                var featureCollection = Ext.decode(response.responseText);
                if (featureCollection && featureCollection.Features) {
                    if (!me.layerFeatureIds[layerId]) me.layerFeatureIds[layerId] = [];

                    Ext.Array.each(featureCollection.Features, function(feat) {
                        me.drawWktOnMap(feat.GeomWkt, feat.Id, me.layerStyles[layerId]);
                        if (!Ext.Array.contains(me.layerFeatureIds[layerId], feat.Id)) {
                            me.layerFeatureIds[layerId].push(feat.Id);
                        }
                        var storeRecord = me.findRecordInGrids(feat.Id);
                        if (storeRecord) storeRecord.set('Geom', feat.GeomWkt, { silent: true });
                    });

                    if (featureCollection.BoundingBox) me.zoomToBoundingBox(featureCollection.BoundingBox);
                }
            },
            failure: function(response) {
                // Ext.log.error('Lỗi API Batch Layer ' + layerId + ': ' + response.statusText);
            }
        });
    },

    // ─── SHARED UTILITIES ───────────────────────────────────────────────────────

    zoomToBoundingBox: function(bbox) {
        var mapPanel = this.mapPanelRef;
        if (!mapPanel || !mapPanel.map) return;
        var extent = ol.proj.transformExtent(
            [bbox.MinLon, bbox.MinLat, bbox.MaxLon, bbox.MaxLat],
            'EPSG:4326',
            mapPanel.map.getView().getProjection()
        );
        mapPanel.map.getView().fit(extent, { duration: 800 });
    },

    findRecordInGrids: function(featureId) {
        var foundRecord = null;
        Ext.ComponentQuery.query('grid').forEach(function(grid) {
            var rec = grid.getStore().getById(featureId);
            if (rec) foundRecord = rec;
        });
        return foundRecord;
    },

    drawWktOnMap: function(wktString, featureId, style) {
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
        olFeature.setStyle(this.makeOlStyle(style));

        mapPanel.vectorSource.addFeature(olFeature);
        return olFeature;
    },

    // Build an ol.style.Style from a LayerStyle object (or defaults when null)
    makeOlStyle: function(style) {
        var fill    = (style && style.FillColor)   || '#3399CC';
        var stroke  = (style && style.StrokeColor) || '#FFFFFF';
        var width   = (style && style.StrokeWidth) || 1.5;
        var iconUrl = style && style.IconUrl;
        var fillRgba = this.hexToRgba(fill, 0.4);

        var imageStyle = iconUrl
            ? new ol.style.Icon({
                src: iconUrl,
                scale: 1,
                anchor: [0.5, 1],           // bottom-centre of image sits on the point
                anchorXUnits: 'fraction',
                anchorYUnits: 'fraction',
                crossOrigin: 'anonymous'
              })
            : new ol.style.Circle({
                radius: 6,
                fill:   new ol.style.Fill({ color: fill }),
                stroke: new ol.style.Stroke({ color: stroke, width: width })
              });

        return new ol.style.Style({
            fill:   new ol.style.Fill({ color: fillRgba }),
            stroke: new ol.style.Stroke({ color: stroke, width: width }),
            image:  imageStyle
        });
    },

    // ─── FEATURE CRUD PANEL ─────────────────────────────────────────────────────

    openFeatureCRUD: function(layerId, layerName) {
        var me      = this,
            apiHost = gClient.app.getApiHost();

        if (!me.featureCRUDPanel) {
            me.featureCRUDPanel = Ext.create('gClient.view.FeatureCRUD.FeatureCRUDPanel');
        }

        me.featureCRUDPanel.getController().loadLayer(
            layerId,
            layerName,
            apiHost,
            function(action, featureId, data, lId) {
                me.onFeatureCRUDChange(action, featureId, data, lId);
            },
            function(drawType, cb) { me.startDrawForUpdate(drawType, cb); }
        );
    },

    // Open FeatureCRUD pre-filled with a WKT drawn on the map
    openFeatureCRUDWithWkt: function(layerId, layerName, wkt) {
        var me      = this,
            apiHost = gClient.app.getApiHost();

        if (!me.featureCRUDPanel) {
            me.featureCRUDPanel = Ext.create('gClient.view.FeatureCRUD.FeatureCRUDPanel');
        }

        var vc = me.featureCRUDPanel.getController();

        // loadLayer calls clearForm() synchronously, so we set WKT after it returns
        vc.loadLayer(layerId, layerName, apiHost, 
            function(action, featureId, data, lId) {
                me.onFeatureCRUDChange(action, featureId, data, lId);
            },
            function(drawType, cb) { me.startDrawForUpdate(drawType, cb); }
        );

        var geomField = vc.lookup('geomField');
        if (geomField) geomField.setValue(wkt);
    },

    onFeatureCRUDChange: function(action, featureId, data, layerId) {
        var me       = this,
            mapPanel = me.mapPanelRef;

        me.reloadLayerStore(layerId);

        if (action === 'delete') {
            if (mapPanel && mapPanel.vectorSource) {
                var olFeat = mapPanel.vectorSource.getFeatureById(featureId);
                if (olFeat) mapPanel.vectorSource.removeFeature(olFeat);
            }
            if (me.layerFeatureIds[layerId]) {
                Ext.Array.remove(me.layerFeatureIds[layerId], featureId);
            }
            if (me.highlightedFeatureId == featureId) {
                me.hideFeaturePanel();
                me.highlightedFeatureId = null;
            }

        } else if (action === 'update' && data && data.geomWkt && mapPanel && mapPanel.vectorSource) {
            if (mapPanel.vectorSource.getFeatureById(featureId)) {
                me.drawWktOnMap(data.geomWkt, featureId);
            }
            var rec = me.findRecordInGrids(featureId);
            if (rec) rec.set('Geom', data.geomWkt, { silent: true });
        }
    },

    reloadLayerStore: function(layerId) {
        var store = this.layerStores[layerId];
        if (store) store.load();
    },

    // ─── DRAW TOOLBAR ───────────────────────────────────────────────────────────

    createDrawToolbar: function(mapPanel) {
        var me = this;

        // Defer until OL has rendered its DOM
        setTimeout(function() {
            var mapContainer = document.getElementById('map-DPHCC');
            if (!mapContainer) return;

            var toolbar = document.createElement('div');
            toolbar.id = 'draw-toolbar';
            toolbar.style.cssText = [
                'position:absolute',
                'top:8px',
                'right:8px',
                'z-index:100',
                'display:flex',
                'align-items:center',
                'gap:4px',
                'background:rgba(255,255,255,0.96)',
                'border-radius:6px',
                'padding:5px 9px',
                'box-shadow:0 2px 10px rgba(0,0,0,0.18)',
                'font-size:12px',
                'font-family:Arial,sans-serif'
            ].join(';');

            // Label
            var lbl = document.createElement('span');
            lbl.textContent = 'Vẽ:';
            lbl.style.cssText = 'color:#555;font-size:12px;margin-right:3px;';
            toolbar.appendChild(lbl);

            // Layer select
            var select = document.createElement('select');
            select.id = 'draw-layer-select';
            select.style.cssText = 'border:1px solid #d9d9d9;border-radius:4px;padding:3px 6px;font-size:12px;max-width:160px;outline:none;cursor:pointer;';
            select.innerHTML = '<option value="">-- Chọn layer --</option>';
            toolbar.appendChild(select);

            // Separator
            var sep = document.createElement('span');
            sep.style.cssText = 'width:1px;height:18px;background:#e0e0e0;display:inline-block;margin:0 3px;';
            toolbar.appendChild(sep);

            var BASE = 'border:1px solid #1890ff;border-radius:4px;padding:3px 9px;font-size:12px;cursor:pointer;background:#fff;color:#1890ff;';
            var ACTIVE = 'border:1px solid #1890ff;border-radius:4px;padding:3px 9px;font-size:12px;cursor:pointer;background:#1890ff;color:#fff;font-weight:600;';

            var drawTypes = [
                { label: '◉ Điểm',  type: 'Point',       title: 'Vẽ điểm (Point)' },
                { label: '╱ Đường', type: 'LineString',   title: 'Vẽ đường (LineString)' },
                { label: '▣ Vùng',  type: 'Polygon',      title: 'Vẽ vùng (Polygon)' }
            ];

            mapPanel.drawButtons = {};

            drawTypes.forEach(function(cfg) {
                var btn = document.createElement('button');
                btn.textContent = cfg.label;
                btn.title = cfg.title;
                btn.style.cssText = BASE;

                btn.onclick = function() {
                    var sel = document.getElementById('draw-layer-select');
                    if (!sel || !sel.value) {
                        Ext.Toast({ message: 'Vui lòng chọn Layer trước khi vẽ', timeout: 2500 });
                        return;
                    }

                    // Toggle off if same type is active
                    if (mapPanel.activeDrawType === cfg.type) {
                        me.stopDraw(mapPanel);
                        return;
                    }

                    me.currentDrawLayerId   = sel.value;
                    me.currentDrawLayerName = sel.options[sel.selectedIndex].text.replace(/ \(.*\)$/, '');
                    me.startDraw(mapPanel, cfg.type);
                };

                toolbar.appendChild(btn);
                mapPanel.drawButtons[cfg.type] = { el: btn, base: BASE, active: ACTIVE };
            });

            // Stop / cancel button
            var stopBtn = document.createElement('button');
            stopBtn.textContent = '✖';
            stopBtn.title = 'Dừng vẽ';
            stopBtn.style.cssText = 'border:1px solid #ff4d4f;border-radius:4px;padding:3px 9px;font-size:12px;cursor:pointer;background:#fff;color:#ff4d4f;margin-left:2px;';
            stopBtn.onclick = function() { me.stopDraw(mapPanel); };
            toolbar.appendChild(stopBtn);

            var finishBtn = document.createElement('button');
            finishBtn.textContent = '✔ Hoàn thành';
            finishBtn.title = 'Kết thúc vẽ và lưu hình học';
            finishBtn.style.cssText = 'border:1px solid #52c41a;border-radius:4px;padding:3px 10px;font-size:12px;cursor:pointer;background:#52c41a;color:#fff;margin-left:2px;display:none;';
            finishBtn.onclick = function() {
                if (mapPanel.drawInteraction) {
                    mapPanel.drawInteraction.finishDrawing();
                }
            };
            toolbar.appendChild(finishBtn);
            mapPanel.finishBtn = finishBtn;
            mapContainer.appendChild(toolbar);
            mapPanel.drawToolbar = toolbar;

            // If layers are already loaded, populate immediately
            if (me.layerList && me.layerList.length) {
                me.updateDrawToolbarLayers(me.layerList);
            }
        }, 300);
    },

    updateDrawToolbarLayers: function(layers) {
        this.layerList = layers || [];

        var populate = function(retries) {
            var select = document.getElementById('draw-layer-select');
            if (!select) {
                if (retries > 0) setTimeout(function() { populate(retries - 1); }, 250);
                return;
            }
            var current = select.value;
            select.innerHTML = '<option value="">-- Chọn layer --</option>';
            (layers || []).forEach(function(layer) {
                var opt = document.createElement('option');
                opt.value = layer.Id;
                opt.textContent = layer.Name + ' (' + layer.LayerType + ')';
                if (String(layer.Id) === String(current)) opt.selected = true;
                select.appendChild(opt);
            });
        };
        populate(6);
    },

    startDraw: function(mapPanel, type, onDrawEnd) {
        var me = this;

        // Remove any existing draw interaction
        if (mapPanel.drawInteraction) {
            mapPanel.map.removeInteraction(mapPanel.drawInteraction);
            mapPanel.drawInteraction = null;
        }

        var drawInteraction = new ol.interaction.Draw({
            source: mapPanel.drawSource,
            type: type
        });

        drawInteraction.on('drawend', function(e) {
            var wktFormat = new ol.format.WKT();
            var wkt = wktFormat.writeFeature(e.feature, {
                dataProjection: 'EPSG:4326',
                featureProjection: mapPanel.map.getView().getProjection()
            });

            // Prevent singleclick from triggering identify right after a Point draw
            mapPanel.drawJustEnded = true;
            setTimeout(function() {
                if (mapPanel.drawSource) mapPanel.drawSource.clear();
                mapPanel.drawJustEnded = false;
            }, 350);

            me.stopDraw(mapPanel);
            if (onDrawEnd) {
                onDrawEnd(wkt);                   // ← update-geometry mode
                // me.onEditButtonClick();
            } else if (me.currentDrawLayerId) {
                me.openFeatureCRUDWithWkt(me.currentDrawLayerId, me.currentDrawLayerName, wkt);
            }
        });

        mapPanel.map.addInteraction(drawInteraction);
        mapPanel.drawInteraction = drawInteraction;
        mapPanel.activeDrawType = type;

        // Highlight the active button
        if (mapPanel.drawButtons) {
            Object.keys(mapPanel.drawButtons).forEach(function(t) {
                var info = mapPanel.drawButtons[t];
                info.el.style.cssText = (t === type) ? info.active : info.base;
            });
        }

        if (mapPanel.map.getTargetElement()) {
            mapPanel.map.getTargetElement().style.cursor = 'crosshair';
        }
        if (mapPanel.finishBtn) {
            mapPanel.finishBtn.style.display = (type === 'Point') ? 'none' : 'inline-block';
        }
    },

    startDrawForUpdate: function(drawType, onWktReady) {
        var mapPanel = this.mapPanelRef;

        if (!mapPanel) {
            Ext.Toast({ message: 'Bản đồ chưa sẵn sàng', timeout: 2000 });
            return;
        }

        Ext.Toast({ message: 'Vẽ hình học mới trên bản đồ, nhấn đôi để hoàn thành', timeout: 3000 });
        this.startDraw(mapPanel, drawType, onWktReady);
    },

    stopDraw: function(mapPanel) {
        var me = this;
        // if(me.currentDrawLayerId){
        //     me.openFeatureCRUDWithWkt(me.currentDrawLayerId, me.currentDrawLayerName, wkt);
        // }
        if (mapPanel.drawInteraction) {
            mapPanel.map.removeInteraction(mapPanel.drawInteraction);
            mapPanel.drawInteraction = null;
        }
        mapPanel.activeDrawType = null;

        if (mapPanel.drawButtons) {
            Object.keys(mapPanel.drawButtons).forEach(function(t) {
                var info = mapPanel.drawButtons[t];
                info.el.style.cssText = info.base;
            });
        }

        if (mapPanel.map && mapPanel.map.getTargetElement()) {
            mapPanel.map.getTargetElement().style.cursor = '';
        }
        if (mapPanel.finishBtn) {
            mapPanel.finishBtn.style.display = 'none';
        }
    },

    // ─── LAYER CRUD ─────────────────────────────────────────────────────────────

    openLayerCRUD: function(layerData) {
        var me = this;

        if (!me.layerCRUDPanel) {
            me.layerCRUDPanel = Ext.create('gClient.view.LayerCRUD.LayerCRUDPanel');
        }

        me.layerCRUDPanel.getController().loadLayer(
            layerData || null,
            gClient.app.getApiHost(),
            function() { me.refreshLayers(); }
        );
    },

    // ─── LAYERSTYLE CRUD ────────────────────────────────────────────────────────

    openLayerStyleCRUD: function(layerItem) {
        var me = this;

        if (!me.layerStyleCRUDPanel) {
            me.layerStyleCRUDPanel = Ext.create('gClient.view.LayerStyleCRUD.LayerStyleCRUDPanel');
        }

        me.layerStyleCRUDPanel.getController().loadStyle(
            layerItem,
            gClient.app.getApiHost(),
            function(savedStyle) {
                if (savedStyle) me.applyLayerStyle(layerItem.Id, savedStyle);
            }
        );
    },

    applyLayerStyle: function(layerId, style) {
        var me       = this,
            mapPanel = me.mapPanelRef;

        me.layerStyles[layerId] = style;   // update cache

        if (!mapPanel || !mapPanel.vectorSource) return;

        var olStyle = me.makeOlStyle(style);
        var ids     = me.layerFeatureIds[layerId] || [];
        Ext.Array.each(ids, function(fid) {
            if (fid === me.highlightedFeatureId) return;
            var olFeat = mapPanel.vectorSource.getFeatureById(fid);
            if (olFeat) olFeat.setStyle(olStyle);
        });
    },

    onLayerDeleteClick: function(layerItem) {
        var me      = this,
            apiHost = gClient.app.getApiHost();

        Ext.Msg.confirm(
            'Xác nhận xóa',
            'Xóa layer "' + Ext.String.htmlEncode(layerItem.Name) + '"?<br>Tất cả Feature thuộc layer này sẽ bị xóa.',
            function(btn) {
                if (btn !== 'yes') return;

                Ext.Ajax.request({
                    url: apiHost + '/LayerService.svc/layers/' + layerItem.Id,
                    method: 'DELETE',
                    success: function(response) {
                        var result = Ext.decode(response.responseText);
                        if (result && result.Success) {
                            Ext.Toast({ message: 'Đã xóa layer "' + layerItem.Name + '"', timeout: 2000 });
                            // Clean up map state for this layer
                            me.clearLayerFromMap(layerItem.Id);
                            delete me.layerStores[layerItem.Id];
                            delete me.layerFeatureIds[layerItem.Id];
                            delete me.layerToggleState[layerItem.Id];
                            me.refreshLayers();
                        } else {
                            Ext.Toast({ message: result.Message || 'Không thể xóa', timeout: 3000 });
                        }
                    },
                    failure: function() {
                        Ext.Toast({ message: 'Lỗi kết nối', timeout: 3000 });
                    }
                });
            }
        );
    },

    refreshLayers: function() {
        var layersPanel = Ext.ComponentQuery.query('panel[cls=layers-DPHCC-cls]')[0];
        if (layersPanel) this.getLayers(layersPanel);
    },

    // ─── MISC ───────────────────────────────────────────────────────────────────

    hexToRgba: function(hex, opacity) {
        var c;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c = hex.substring(1).split('');
            if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            c = '0x' + c.join('');
            return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + opacity + ')';
        }
        return 'rgba(24, 144, 255, ' + opacity + ')';
    }
});
