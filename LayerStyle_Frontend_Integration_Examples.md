# LayerStyle Frontend - Integration Examples

This file shows practical code examples for integrating LayerStyle CRUD into your existing application.

---

## 🔧 Example 1: Add Modal Button to Layer Grid

**Scenario:** User clicks "Edit Style" button in layer list

```javascript
// In your existing LayerController.js

editLayerStyle: function(record) {
    var apiHost = gClient.app.getApiHost();
    
    Ext.create('gClient.view.LayerStyleCRUD.LayerStyleCRUDPanel', {
        currentApiHost: apiHost,
        onAfterChange: function() {
            // Refresh layer grid after saving style
            this.refreshLayerList();
        }
    }).loadLayerStyle(
        {
            Id: record.get('Id'),
            Name: record.get('Name')
        },
        record.styleData || null,  // null = create new, otherwise = edit
        apiHost,
        () => this.refreshLayerList()
    ).show();
}
```

**Button in Grid:**
```javascript
{
    xtype: 'actioncolumn',
    width: 80,
    items: [
        {
            iconCls: 'x-fa fa-palette',
            tooltip: 'Sửa Kiểu',
            handler: 'editLayerStyle'
        }
    ]
}
```

---

## 🔧 Example 2: Add Style Editor Tab to Layer Edit View

**Scenario:** Editing a layer with style on same page

```javascript
// EditLayer/EditLayerView.js

Ext.define('gClient.view.EditLayer.EditLayerView', {
    extend: 'Ext.Panel',
    xtype: 'editlayerview',
    controller: 'editlayervc',
    
    layout: 'hbox',
    items: [
        {
            xtype: 'formpanel',
            flex: 1,
            items: [
                {
                    xtype: 'textfield',
                    reference: 'nameField',
                    label: 'Tên Layer',
                    required: true
                },
                {
                    xtype: 'textareafield',
                    reference: 'descField',
                    label: 'Mô tả'
                },
                {
                    xtype: 'selectfield',
                    reference: 'typeField',
                    label: 'Loại',
                    options: [
                        { text: 'Point', value: 'POINT' },
                        { text: 'Line', value: 'LINE' },
                        { text: 'Polygon', value: 'POLYGON' }
                    ]
                }
            ]
        },
        {
            // ← ADD STYLE EDITOR HERE ←
            xtype: 'layerstyleeditpanel',
            reference: 'stylePanel',
            flex: 1
        }
    ]
});
```

```javascript
// EditLayer/EditLayerViewController.js

Ext.define('gClient.view.EditLayer.EditLayerViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.editlayervc',

    onLayerLoaded: function(layerRecord) {
        var stylePanel = this.lookup('stylePanel');
        
        // Load style for this layer
        stylePanel.layerId = layerRecord.get('Id');
        stylePanel.getController().loadStyle(layerRecord.get('Id'));
    },

    onSaveClick: function() {
        // Save layer
        var form = this.lookup('layerForm');
        var formData = form.getValues();
        
        // Save layer...
        this.saveLayer(formData);
        
        // Style will be saved independently via stylePanel
    }
});
```

---

## 🔧 Example 3: Add Style Management Tab to Main Panel

**Scenario:** Tab panel with Layers and Styles tabs

```javascript
// main/MainView.js

Ext.define('gClient.view.main.MainView', {
    extend: 'Ext.tabpanel',
    
    items: [
        {
            title: 'Layers',
            xtype: 'layerpanel',
            iconCls: 'x-fa fa-map'
        },
        {
            title: 'Layer Styles',
            xtype: 'layerstylemanagementview',  // ← ADD THIS
            iconCls: 'x-fa fa-palette'
        },
        {
            title: 'Features',
            xtype: 'featurepanel',
            iconCls: 'x-fa fa-star'
        }
    ]
});
```

---

## 🔧 Example 4: Add Quick Edit Context Menu

**Scenario:** Right-click on layer → "Edit Style"

```javascript
// In your LayerController.js

showLayerContextMenu: function(grid, info, e) {
    e.preventDefault();
    
    Ext.create({
        xtype: 'menu',
        items: [
            {
                text: 'Edit Layer',
                handler: () => this.editLayer(info.record)
            },
            {
                text: 'Edit Style',
                iconCls: 'x-fa fa-palette',
                handler: () => this.editLayerStyle(info.record)
            },
            '-',
            {
                text: 'Delete',
                iconCls: 'x-fa fa-trash',
                handler: () => this.deleteLayer(info.record)
            }
        ]
    }).showAt(e.pageX, e.pageY);
}

editLayerStyle: function(record) {
    var panel = Ext.create('gClient.view.LayerStyleCRUD.LayerStyleCRUDPanel');
    panel.loadLayerStyle(
        { Id: record.get('Id'), Name: record.get('Name') },
        null,
        gClient.app.getApiHost(),
        () => this.refreshLayerList()
    ).show();
}
```

---

## 🔧 Example 5: Batch Style Editor

**Scenario:** Edit multiple layers' styles at once

```javascript
// In your LayerController.js

editSelectedLayerStyles: function(grid) {
    var selected = grid.getSelection();
    
    if (selected.length === 0) {
        Ext.Toast({ message: 'Chọn ít nhất một layer' });
        return;
    }
    
    if (selected.length === 1) {
        // Single selection - use normal editor
        this.editLayerStyle(selected[0]);
    } else {
        // Multiple selection - bulk editor
        this.showBulkStyleEditor(selected);
    }
}

showBulkStyleEditor: function(records) {
    var panel = Ext.create('Ext.Panel', {
        xtype: 'panel',
        title: 'Sửa kiểu hàng loạt (' + records.length + ' layers)',
        floated: true,
        modal: true,
        centered: true,
        width: 400,
        items: [
            {
                xtype: 'layerstyleeditpanel',
                reference: 'bulkStylePanel'
            }
        ],
        buttons: [
            {
                text: 'Áp dụng cho tất cả',
                handler: () => this.applyBulkStyle(records, panel)
            }
        ]
    });
    
    panel.show();
}

applyBulkStyle: function(records, panel) {
    var stylePanel = panel.down('layerstyleeditpanel');
    var form = stylePanel.down('formpanel');
    
    var fillColor = form.down('[reference=fillColorField]').getValue();
    var strokeColor = form.down('[reference=strokeColorField]').getValue();
    var strokeWidth = form.down('[reference=strokeWidthField]').getValue();
    
    // Apply to all selected layers
    records.forEach(record => {
        this.updateLayerStyle(
            record.get('Id'),
            fillColor,
            strokeColor,
            strokeWidth
        );
    });
}
```

---

## 🔧 Example 6: Add to Navigation Menu

**Scenario:** Menu item to access style management

```javascript
// In your NavViewController.js

showStyleManagement: function() {
    var mainPanel = Ext.Viewport.down('mainview');
    
    var styleView = Ext.create('gClient.view.LayerStyleManagement.LayerStyleManagementView');
    
    mainPanel.add(styleView);
    mainPanel.setActiveItem(styleView);
}
```

**Menu item:**
```javascript
{
    text: 'Layer Styles',
    icon: 'resources/images/palette.png',
    handler: 'showStyleManagement'
}
```

---

## 🔧 Example 7: Auto-Generate Styles

**Scenario:** Generate random styles for new layers

```javascript
// In your LayerController.js

createLayerWithStyle: function(layerData) {
    // Create layer first
    this.createLayer(layerData, (layerId) => {
        // Then create random style
        var style = this.generateRandomStyle();
        
        Ext.Ajax.request({
            url: gClient.app.getApiHost() + '/LayerStyle.svc/layer-styles',
            method: 'POST',
            jsonData: {
                LayerId: layerId,
                FillColor: style.fillColor,
                StrokeColor: style.strokeColor,
                StrokeWidth: style.strokeWidth
            },
            success: () => {
                Ext.Toast({ message: 'Layer và kiểu đã được tạo!' });
                this.refreshLayerList();
            }
        });
    });
}

generateRandomStyle: function() {
    var colors = [
        '#3399CC', '#FF6B6B', '#4ECDC4', '#45B7D1',
        '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'
    ];
    
    return {
        fillColor: colors[Math.floor(Math.random() * colors.length)],
        strokeColor: '#FFFFFF',
        strokeWidth: 1.5
    };
}
```

---

## 🔧 Example 8: Style Presets

**Scenario:** Apply predefined styles

```javascript
// In your LayerStyleEditorViewController.js

applyPreset: function(presetName) {
    var presets = {
        'admin-boundaries': {
            fillColor: '#3399CC',
            strokeColor: '#FFFFFF',
            strokeWidth: 1.5
        },
        'roads': {
            fillColor: '#FFD700',
            strokeColor: '#FFA500',
            strokeWidth: 2.0
        },
        'water': {
            fillColor: '#4169E1',
            strokeColor: '#1E90FF',
            strokeWidth: 1.0
        },
        'buildings': {
            fillColor: '#DC143C',
            strokeColor: '#8B0000',
            strokeWidth: 1.5
        }
    };
    
    var preset = presets[presetName];
    if (preset) {
        this.lookup('fillColorField').setValue(preset.fillColor);
        this.lookup('strokeColorField').setValue(preset.strokeColor);
        this.lookup('strokeWidthField').setValue(preset.strokeWidth);
        this.updatePreview();
    }
}
```

**Preset button:**
```javascript
{
    text: 'Presets',
    menu: [
        { text: 'Admin Boundaries', handler: () => this.applyPreset('admin-boundaries') },
        { text: 'Roads', handler: () => this.applyPreset('roads') },
        { text: 'Water', handler: () => this.applyPreset('water') },
        { text: 'Buildings', handler: () => this.applyPreset('buildings') }
    ]
}
```

---

## 🔧 Example 9: Export/Import Styles

**Scenario:** Export styles to JSON, import from file

```javascript
// In your LayerStyleManagementViewController.js

exportStyles: function() {
    var store = this.getView().down('grid').getStore();
    var data = store.getRange();
    
    var json = JSON.stringify(data.map(r => r.data), null, 2);
    
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'layer-styles.json';
    a.click();
}

importStyles: function() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        var file = e.target.files[0];
        var reader = new FileReader();
        
        reader.onload = (event) => {
            var styles = JSON.parse(event.target.result);
            this.bulkCreateStyles(styles);
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

bulkCreateStyles: function(styles) {
    var apiHost = gClient.app.getApiHost();
    
    styles.forEach(style => {
        Ext.Ajax.request({
            url: apiHost + '/LayerStyle.svc/layer-styles',
            method: 'POST',
            jsonData: style,
            success: () => {
                Ext.Toast({ message: 'Kiểu ' + style.LayerId + ' đã được nhập' });
            }
        });
    });
}
```

---

## 🔧 Example 10: Style History / Undo

**Scenario:** Keep track of style changes

```javascript
// In your LayerStyleEditorViewController.js

styleHistory: [],
historyIndex: -1,

saveSnapshot: function() {
    var current = {
        fillColor: this.lookup('fillColorField').getValue(),
        strokeColor: this.lookup('strokeColorField').getValue(),
        strokeWidth: this.lookup('strokeWidthField').getValue(),
        timestamp: new Date()
    };
    
    // Remove any forward history
    this.styleHistory = this.styleHistory.slice(0, this.historyIndex + 1);
    
    // Add new state
    this.styleHistory.push(current);
    this.historyIndex++;
}

undo: function() {
    if (this.historyIndex > 0) {
        this.historyIndex--;
        this.restoreSnapshot(this.styleHistory[this.historyIndex]);
    }
}

redo: function() {
    if (this.historyIndex < this.styleHistory.length - 1) {
        this.historyIndex++;
        this.restoreSnapshot(this.styleHistory[this.historyIndex]);
    }
}

restoreSnapshot: function(snapshot) {
    this.lookup('fillColorField').setValue(snapshot.fillColor);
    this.lookup('strokeColorField').setValue(snapshot.strokeColor);
    this.lookup('strokeWidthField').setValue(snapshot.strokeWidth);
    this.updatePreview();
}
```

---

## 📝 Integration Checklist

- [ ] Copy all frontend files to project
- [ ] Add requires to app.js
- [ ] Choose integration pattern (modal/grid/inline)
- [ ] Implement example code
- [ ] Test CRUD operations
- [ ] Verify API calls in Network tab
- [ ] Add error handling as needed
- [ ] Customize colors/presets if needed
- [ ] Add to navigation menu
- [ ] User testing

---

## 🎯 Best Practice Tips

1. **Always refresh data after save:**
   ```javascript
   onAfterChange: () => this.refreshData()
   ```

2. **Validate layer exists before editing:**
   ```javascript
   if (!record.get('Id')) return;
   ```

3. **Handle API errors gracefully:**
   ```javascript
   failure: (response) => {
       Ext.Msg.alert('Error', 'Failed: ' + response.status);
   }
   ```

4. **Show loading indicator for long operations:**
   ```javascript
   Ext.Viewport.mask('Loading...');
   // ... do work ...
   Ext.Viewport.unmask();
   ```

5. **Use keyboard shortcuts:**
   ```javascript
   keys: [
       { key: 's', ctrl: true, handler: 'onSaveStyle' }
   ]
   ```

---

**Ready to implement!** Choose your pattern and start integrating. 🚀
