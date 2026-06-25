Ext.define('gClient.view.EditLayer.EditLayerController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.editlayervc',

    // ─── State ──────────────────────────────────────────────────────────────────
    currentLayerId: null,
    currentLayerName: null,
    currentLayerRecord: null,   // raw data object for edit/delete

    olMap: null,
    vectorSource: null,
    drawSource: null,
    drawInteraction: null,
    drawButtons: null,
    activeDrawType: null,
    drawJustEnded: false,

    featureCRUDPanel: null,
    layerCRUDPanel: null,
    layerStyleCRUDPanel: null,

    // ─── GRID ───────────────────────────────────────────────────────────────────

    onGridPainted: function() {
        this.loadLayers();
    },

    loadLayers: function() {
        var me      = this,
            apiHost = gClient.app.getApiHost(),
            grid    = me.lookup('layerGrid');

        if (!grid) return;

        Ext.Ajax.request({
            url: apiHost + '/LayerService.svc/layers',
            method: 'GET',
            success: function(response) {
                var data   = Ext.decode(response.responseText);
                var layers = (data && data.Data) ? data.Data : [];
                grid.getStore().loadData(layers);
            },
            failure: function() {
                Ext.toast({ message: 'Không tải được danh sách Layer', timeout: 2500 });
            }
        });
    },

    onLayerSelectionChange: function(grid, selected) {
        var me        = this,
            hasSel    = selected && selected.length > 0,
            editBtn   = me.lookup('editLayerBtn'),
            deleteBtn = me.lookup('deleteLayerBtn'),
            styleBtn  = me.lookup('editStyleBtn'),
            featBtn   = me.lookup('manageFeatureBtn');

        if (editBtn)   editBtn.setDisabled(!hasSel);
        if (deleteBtn) deleteBtn.setDisabled(!hasSel);
        if (styleBtn)  styleBtn.setDisabled(!hasSel);
        if (featBtn)   featBtn.setDisabled(!hasSel);

        if (hasSel) {
            var rec = selected[0];
            me.currentLayerId     = rec.get('Id');
            me.currentLayerName   = rec.get('Name');
            me.currentLayerRecord = rec.getData();
            me.activateDrawForLayer(me.currentLayerId, me.currentLayerName);
        } else {
            me.currentLayerId     = null;
            me.currentLayerName   = null;
            me.currentLayerRecord = null;
            me.deactivateDrawButtons();
            me.stopDraw();
        }
    },

    onRefresh: function() {
        this.loadLayers();
    },

    // ─── LAYER CRUD ─────────────────────────────────────────────────────────────

    onAddLayer: function() {
        this.openLayerCRUD(null);
    },

    onEditLayer: function() {
        if (this.currentLayerRecord) {
            this.openLayerCRUD(this.currentLayerRecord);
        }
    },

    onDeleteLayer: function() {
        if (this.currentLayerRecord) {
            this.deleteLayer(this.currentLayerRecord);
        }
    },

    onManageFeatures: function() {
        if (this.currentLayerId) {
            this.openFeatureCRUD(this.currentLayerId, this.currentLayerName);
        }
    },

    onEditStyle: function() {
        if (this.currentLayerRecord) {
            this.openLayerStyleCRUD(this.currentLayerRecord);
        }
    },

    openLayerStyleCRUD: function(layerData) {
        var me = this;

        if (!me.layerStyleCRUDPanel) {
            me.layerStyleCRUDPanel = Ext.create('gClient.view.LayerStyleCRUD.LayerStyleCRUDPanel');
        }

        me.layerStyleCRUDPanel.getController().loadStyle(
            layerData,
            gClient.app.getApiHost(),
            function() {
                // nothing to reload in the layer list — style changes don't affect layer metadata
            }
        );
    },

    openLayerCRUD: function(layerData) {
        var me = this;

        if (!me.layerCRUDPanel) {
            me.layerCRUDPanel = Ext.create('gClient.view.LayerCRUD.LayerCRUDPanel');
        }

        me.layerCRUDPanel.getController().loadLayer(
            layerData || null,
            gClient.app.getApiHost(),
            function() {
                me.currentLayerId     = null;
                me.currentLayerName   = null;
                me.currentLayerRecord = null;
                me.loadLayers();
            }
        );
    },

    deleteLayer: function(layerData) {
        var me      = this,
            apiHost = gClient.app.getApiHost();

        Ext.Msg.confirm(
            'Xác nhận xóa',
            'Xóa layer "<b>' + Ext.String.htmlEncode(layerData.Name) + '</b>"?<br>Tất cả Feature thuộc layer này sẽ bị xóa vĩnh viễn.',
            function(btn) {
                if (btn !== 'yes') return;

                Ext.Ajax.request({
                    url: apiHost + '/LayerService.svc/layers/' + layerData.Id,
                    method: 'DELETE',
                    success: function(response) {
                        var result = Ext.decode(response.responseText);
                        if (result && result.Success) {
                            Ext.toast({ message: 'Đã xóa layer "' + layerData.Name + '"', timeout: 2000 });
                            me.currentLayerId = null;
                            me.currentLayerName = null;
                            me.currentLayerRecord = null;
                            me.deactivateDrawButtons();
                            me.loadLayers();
                        } else {
                            Ext.toast({ message: result.Message || 'Không thể xóa', timeout: 3000 });
                        }
                    },
                    failure: function() {
                        Ext.toast({ message: 'Lỗi kết nối khi xóa Layer', timeout: 3000 });
                    }
                });
            }
        );
    },

    // ─── FEATURE CRUD ───────────────────────────────────────────────────────────

    openFeatureCRUD: function(layerId, layerName) {
        var me      = this,
            apiHost = gClient.app.getApiHost();

        if (!me.featureCRUDPanel) {
            me.featureCRUDPanel = Ext.create('gClient.view.FeatureCRUD.FeatureCRUDPanel');
        }

        me.featureCRUDPanel.getController().loadLayer(
            layerId, layerName, apiHost,
            null,
            function(drawType, cb) { me.startDrawForUpdate(drawType, cb); }  // ← ADD
        );
    },

    // Open FeatureCRUD with WKT pre-filled from a map draw
    openFeatureCRUDWithWkt: function(layerId, layerName, wkt) {
        var me      = this,
            apiHost = gClient.app.getApiHost();

        if (!me.featureCRUDPanel) {
            me.featureCRUDPanel = Ext.create('gClient.view.FeatureCRUD.FeatureCRUDPanel');
        }

        var vc = me.featureCRUDPanel.getController();
        // loadLayer calls clearForm() synchronously, so set WKT after it returns
        vc.loadLayer(layerId, layerName, apiHost,
            null,
            function(drawType, cb) { me.startDrawForUpdate(drawType, cb); }  // ← ADD
        );
        var geomField = vc.lookup('geomField');
        if (geomField) geomField.setValue(wkt);
    },

    // ─── MAP INIT ───────────────────────────────────────────────────────────────

    onMapPainted: function(mapPanel) {
        if (mapPanel.olMap) {
            setTimeout(function() { mapPanel.olMap.updateSize(); }, 100);
            return;
        }

        var me = this;

        var olMap = new ol.Map({
            target: 'edit-layer-map',
            layers: [
                new ol.layer.Tile({ source: new ol.source.OSM() })
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([105.8342, 21.0278]),
                zoom: 13
            })
        });

        mapPanel.olMap = olMap;
        me.olMap = olMap;

        // Layer for persisted features (future use)
        me.vectorSource = new ol.source.Vector();
        olMap.addLayer(new ol.layer.Vector({ source: me.vectorSource }));

        // Layer for draw preview
        me.drawSource = new ol.source.Vector();
        olMap.addLayer(new ol.layer.Vector({
            source: me.drawSource,
            style: new ol.style.Style({
                fill: new ol.style.Fill({ color: 'rgba(0,120,255,0.18)' }),
                stroke: new ol.style.Stroke({ color: '#0078ff', width: 2, lineDash: [6, 3] }),
                image: new ol.style.Circle({
                    radius: 6,
                    fill: new ol.style.Fill({ color: '#0078ff' }),
                    stroke: new ol.style.Stroke({ color: '#fff', width: 2 })
                })
            })
        }));

        me.createDrawToolbar();

        olMap.on('singleclick', function(evt) {
            // Block singleclick while drawing or right after a drawend
            if (me.activeDrawType || me.drawJustEnded) {
                me.drawJustEnded = false;
                return;
            }
        });
    },

    onMapResize: function(mapPanel) {
        if (mapPanel.olMap) mapPanel.olMap.updateSize();
    },

    // ─── DRAW TOOLBAR ───────────────────────────────────────────────────────────

    createDrawToolbar: function() {
        var me = this;

        setTimeout(function() {
            var mapEl = document.getElementById('edit-layer-map');
            if (!mapEl) return;

            var toolbar = document.createElement('div');
            toolbar.style.cssText = [
                'position:absolute', 'top:8px', 'right:8px', 'z-index:100',
                'display:flex', 'align-items:center', 'gap:4px',
                'background:rgba(255,255,255,0.96)',
                'border-radius:6px', 'padding:5px 10px',
                'box-shadow:0 2px 10px rgba(0,0,0,0.2)',
                'font-size:12px', 'font-family:Arial,sans-serif'
            ].join(';');

            // Current layer label
            var lbl = document.createElement('span');
            lbl.style.cssText = 'color:#555;margin-right:4px;white-space:nowrap;';
            lbl.textContent = 'Layer:';
            toolbar.appendChild(lbl);

            var nameSpan = document.createElement('span');
            nameSpan.id = 'edit-draw-layer-name';
            nameSpan.style.cssText = 'color:#1890ff;font-weight:600;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
            nameSpan.textContent = '(chưa chọn)';
            toolbar.appendChild(nameSpan);

            // Separator
            var sep = document.createElement('span');
            sep.style.cssText = 'width:1px;height:18px;background:#e0e0e0;display:inline-block;margin:0 5px;';
            toolbar.appendChild(sep);

            // Button styles
            var BASE     = 'border:1px solid #1890ff;border-radius:4px;padding:3px 10px;font-size:12px;cursor:pointer;background:#fff;color:#1890ff;';
            var ACTIVE   = 'border:1px solid #1890ff;border-radius:4px;padding:3px 10px;font-size:12px;cursor:pointer;background:#1890ff;color:#fff;font-weight:600;';
            var DISABLED = 'border:1px solid #d9d9d9;border-radius:4px;padding:3px 10px;font-size:12px;cursor:not-allowed;background:#f5f5f5;color:#ccc;';

            var types = [
                { label: '◉ Điểm',  type: 'Point',      title: 'Vẽ điểm (POINT)' },
                { label: '╱ Đường', type: 'LineString',  title: 'Vẽ đường (LINESTRING)' },
                { label: '▣ Vùng',  type: 'Polygon',     title: 'Vẽ vùng (POLYGON)' }
            ];

            me.drawButtons = {};

            types.forEach(function(cfg) {
                var btn = document.createElement('button');
                btn.textContent = cfg.label;
                btn.title = cfg.title;
                btn.style.cssText = DISABLED;
                btn.disabled = true;

                btn.onclick = function() {
                    if (!me.currentLayerId) {
                        Ext.toast({ message: 'Chọn một Layer từ danh sách bên trái', timeout: 2500 });
                        return;
                    }
                    // Toggle off if same type clicked again
                    if (me.activeDrawType === cfg.type) {
                        me.stopDraw();
                        return;
                    }
                    me.startDraw(cfg.type);
                };

                toolbar.appendChild(btn);
                me.drawButtons[cfg.type] = { el: btn, base: BASE, active: ACTIVE, disabled: DISABLED };
            });

            // Stop button
            var stopBtn = document.createElement('button');
            stopBtn.textContent = '✖ Dừng';
            stopBtn.title = 'Hủy vẽ (bỏ hình học)';
            stopBtn.style.cssText = 'border:1px solid #ff4d4f;border-radius:4px;padding:3px 10px;font-size:12px;cursor:pointer;background:#fff;color:#ff4d4f;margin-left:2px;';
            stopBtn.onclick = function() { me.stopDraw(); };
            toolbar.appendChild(stopBtn);

            // Finish button — shown only while drawing LineString / Polygon
            var finishBtn = document.createElement('button');
            finishBtn.textContent = '✔ Hoàn thành';
            finishBtn.title = 'Kết thúc vẽ và lưu hình học';
            finishBtn.style.cssText = 'border:1px solid #52c41a;border-radius:4px;padding:3px 10px;font-size:12px;cursor:pointer;background:#52c41a;color:#fff;margin-left:2px;display:none;';
            finishBtn.onclick = function() {
                if (me.drawInteraction) {
                    me.drawInteraction.finishDrawing();
                }
            };
            toolbar.appendChild(finishBtn);
            me.finishBtn = finishBtn;

            mapEl.appendChild(toolbar);
        }, 300);
    },

    // Enable draw buttons and update layer name when a row is selected
    activateDrawForLayer: function(layerId, layerName) {
        var me = this;

        var span = document.getElementById('edit-draw-layer-name');
        if (span) span.textContent = layerName;

        if (me.drawButtons) {
            Object.keys(me.drawButtons).forEach(function(t) {
                var info = me.drawButtons[t];
                info.el.disabled = false;
                info.el.style.cssText = info.base;
            });
        }
    },

    // Disable draw buttons and reset label when no row is selected
    deactivateDrawButtons: function() {
        var me = this;

        var span = document.getElementById('edit-draw-layer-name');
        if (span) span.textContent = '(chưa chọn)';

        if (me.drawButtons) {
            Object.keys(me.drawButtons).forEach(function(t) {
                var info = me.drawButtons[t];
                info.el.disabled = true;
                info.el.style.cssText = info.disabled;
            });
        }
    },

    startDraw: function(type, onDrawEnd) {
        var me = this;

        // Remove previous interaction if any
        if (me.drawInteraction) {
            me.olMap.removeInteraction(me.drawInteraction);
            me.drawInteraction = null;
        }

        var interaction = new ol.interaction.Draw({
            source: me.drawSource,
            type: type
        });

        interaction.on('drawend', function(e) {
            // Convert drawn geometry to WKT text
            var wkt = new ol.format.WKT().writeFeature(e.feature, {
                dataProjection: 'EPSG:4326',
                featureProjection: me.olMap.getView().getProjection()
            });

            // Flag prevents the singleclick handler from firing after a Point draw
            me.drawJustEnded = true;
            setTimeout(function() {
                if (me.drawSource) me.drawSource.clear();
                me.drawJustEnded = false;
            }, 350);

            me.stopDraw();

            if (onDrawEnd) {
                onDrawEnd(wkt);                              // ← update-geometry mode
            } else if (me.currentLayerId) {
                me.openFeatureCRUDWithWkt(me.currentLayerId, me.currentLayerName, wkt);
            }
        });

        me.olMap.addInteraction(interaction);
        me.drawInteraction = interaction;
        me.activeDrawType = type;

        // Highlight the active button
        if (me.drawButtons) {
            Object.keys(me.drawButtons).forEach(function(t) {
                var info = me.drawButtons[t];
                info.el.style.cssText = (t === type) ? info.active : info.base;
                info.el.disabled = false;
            });
        }

        var target = me.olMap.getTargetElement();
        if (target) target.style.cursor = 'crosshair';
        if (me.finishBtn) {
            me.finishBtn.style.display = (type === 'Point') ? 'none' : 'inline-block';
        }
    },

    startDrawForUpdate: function(drawType, onWktReady) {
        if (!this.olMap) {
            Ext.toast({ message: 'Bản đồ chưa sẵn sàng', timeout: 2000 });
            return;
        }
        Ext.toast({ message: 'Vẽ hình học mới trên bản đồ, nhấn đôi để hoàn thành', timeout: 3000 });
        this.startDraw(drawType, onWktReady);
    },

    stopDraw: function() {
        var me = this;

        if (me.drawInteraction) {
            me.olMap.removeInteraction(me.drawInteraction);
            me.drawInteraction = null;
        }
        me.activeDrawType = null;

        // Restore button appearance (enabled base style, not active)
        if (me.drawButtons) {
            Object.keys(me.drawButtons).forEach(function(t) {
                var info = me.drawButtons[t];
                var newStyle = me.currentLayerId ? info.base : info.disabled;
                info.el.disabled = !me.currentLayerId;
                info.el.style.cssText = newStyle;
            });
        }

        if (me.olMap && me.olMap.getTargetElement()) {
            me.olMap.getTargetElement().style.cursor = '';
        }
        if (me.finishBtn) {
            me.finishBtn.style.display = 'none';
        }
    }
});
