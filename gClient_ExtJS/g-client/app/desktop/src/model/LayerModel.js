Ext.define('gClient.model.LayerModel', {
    extend: 'Ext.data.Model',
	idProperty: 'Id',
	fields: [
		{ name: 'Id', type: 'int' }, 
		{ name: 'Name', type: 'string' },
		{ name: 'Source', type: 'string' },
		{ name: 'Description', type: 'string' },
		{ name: 'LayerType', type: 'string', defaultValue: 'POINT' },
		{ name: 'IsVisible', type: 'boolean', defaultValue: true },
		{ name: 'Opacity', type: 'float', defaultValue: 1.0 },
		{ name: 'MinZoom', type: 'int', defaultValue: 0 },
		{ name: 'MaxZoom', type: 'int', defaultValue: 22 }
	]
});