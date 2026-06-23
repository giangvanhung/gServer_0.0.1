Ext.define('gClient.Application', {
	extend: 'Ext.app.Application',
	name: 'gClient',
	controllers: [
        'MapController',
		'LayerController'
    ],
	requires: ['gClient.*'],
	defaultToken: 'homeview',
	config: {
		// Debug
        apiHost: 'http://localhost:52106',
		// IIS manager local
		// apiHost: 'http://localhost:56720',
    },

	removeSplash: function () {
		Ext.getBody().removeCls('launching')
		var elem = document.getElementById("splash")
		elem.parentNode.removeChild(elem)
	},

	launch: function () {
		this.removeSplash()
		var whichView = 'mainview'
		Ext.Viewport.add([{xtype: whichView}])
	},

	onAppUpdate: function () {
		Ext.Msg.confirm('Application Update', 'This application has an update, reload?',
			function (choice) {
				if (choice === 'yes') {
					window.location.reload();
				}
			}
		);
	}
});
