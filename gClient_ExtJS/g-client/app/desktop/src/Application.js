Ext.define('gClient.Application', {
    extend: 'Ext.app.Application',
    name:   'gClient',

    controllers: ['MapController', 'LayerController'],
    requires:    ['gClient.*'],
    defaultToken: 'homeview',

    config: {
        apiHost: 'http://localhost:52106'
    },

    removeSplash: function () {
        Ext.getBody().removeCls('launching');
        var elem = document.getElementById('splash');
        if (elem) elem.parentNode.removeChild(elem);
    },

    launch: function () {
        this.removeSplash();

        // Lưu loginUrl do ASP.NET truyền qua query string
        var params = Ext.Object.fromQueryString(window.location.search.substring(1));
        if (params.loginUrl) {
            gClient.util.Auth.saveLoginUrl(decodeURIComponent(params.loginUrl));
            // Xóa param khỏi URL cho gọn
            history.replaceState(null, '', window.location.pathname);
        }

        // Thứ tự ưu tiên: cookie ASP.NET → localStorage → chưa login
        var authed = gClient.util.Auth.initFromCookie() || gClient.util.Auth.restore();

        if (!authed) {
            window.location.href = gClient.util.Auth.getLoginUrl();
            return;
        }

        Ext.Viewport.add([{ xtype: 'mainview' }]);
    },

    onAppUpdate: function () {
        Ext.Msg.confirm('Application Update', 'This application has an update, reload?',
            function (choice) {
                if (choice === 'yes') window.location.reload();
            }
        );
    }
});
