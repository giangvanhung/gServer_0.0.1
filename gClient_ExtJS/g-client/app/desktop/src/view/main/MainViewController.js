Ext.define('gClient.view.main.MainViewController', {
	extend: 'Ext.app.ViewController',
	alias: 'controller.mainviewcontroller',

	routes: { 
		':xtype': {action: 'mainRoute'}
	},

	initViewModel: function(vm){
		vm.getStore('menu').on({
			load: 'onMenuDataLoad',
			single: true,
			scope: this
		});
	},

	onMenuDataLoad: function(store){
		this._filterMenuByRole(store);
		this.mainRoute(Ext.util.History.getHash());
	},

	_filterMenuByRole: function(store) {
		var role     = gClient.util.Auth.getRole() || 'user';
		var toRemove = [];
		store.getRootNode().cascadeBy(function(node) {
			if (!node.isRoot()) {
				var roles = node.get('roles');
				if (roles && roles.length > 0 && Ext.Array.indexOf(roles, role) < 0) {
					toRemove.push(node);
				}
			}
		});
		Ext.each(toRemove, function(node) {
			if (node.parentNode) {
				node.parentNode.removeChild(node);
			}
		});
	},

	mainRoute: function (xtype) {
		var navview = this.lookup('navview'),
			menuview = navview.lookup('menuview'),
			centerview = this.lookup('centerview'),
			exists = Ext.ClassManager.getByAlias('widget.' + xtype),
			node, vm;

		if (exists === undefined) {
			console.log(xtype + ' does not exist');
			return;
		}

		node = this.getStore('menu').findNode('xtype', xtype);

		if (node == null) {
			console.log('unmatchedRoute: ' + xtype);
			return;
		}
		if (!centerview.getComponent(xtype)) {
			centerview.add({ xtype: xtype, itemId: xtype, heading: node.get('text') });
		}

		centerview.setActiveItem(xtype);
		menuview.setSelection(node);
		vm = this.getViewModel();
		vm.set('heading', node.get('text'));
	},

	onMenuViewSelectionChange: function (tree, node) {
		if (node == null) { return }

		var vm = this.getViewModel();

		if (node.get('xtype') != undefined) {
			this.redirectTo( node.get('xtype') );
		}
	},

	onTopViewNavToggle: function () {
		var vm = this.getViewModel();

		vm.set('navCollapsed', !vm.get('navCollapsed'));
	},

	onHeaderViewDetailToggle: function (button) {
		var vm = this.getViewModel();

		vm.set('detailCollapsed', !vm.get('detailCollapsed'));

		if(vm.get('detailCollapsed')===true) {
			button.setIconCls('x-fa fa-arrow-left');
		}
		else {
			button.setIconCls('x-fa fa-arrow-right');
		}
	},

	onBottomViewlogout: function () {
		// Auth.clear() tự redirect về loginUrl (Login.aspx của ASP.NET)
		gClient.util.Auth.clear();
	}
});
