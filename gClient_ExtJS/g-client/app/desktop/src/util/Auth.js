Ext.define('gClient.util.Auth', {
    singleton: true,

    _KEY:       'gClient_auth',
    _LOGIN_KEY: 'gClient_loginUrl',

    // ── Lưu/đọc/xóa localStorage ────────────────────────────────────────────

    save: function (data) {
        localStorage.setItem(this._KEY, JSON.stringify(data));
        Ext.Ajax.setDefaultHeaders({ 'Authorization': 'Bearer ' + data.token });
    },

    load: function () {
        try { return JSON.parse(localStorage.getItem(this._KEY)); }
        catch (e) { return null; }
    },

    clear: function () {
        localStorage.removeItem(this._KEY);
        Ext.Ajax.setDefaultHeaders({ 'Authorization': '' });
        this._deleteCookie('gserver_auth');
        window.location.href = this.getLoginUrl();
    },

    isLoggedIn: function () {
        var d = this.load();
        return !!(d && d.token);
    },

    getToken:    function () { var d = this.load(); return d ? d.token    : null; },
    getRole:     function () { var d = this.load(); return d ? d.role     : null; },
    getUsername: function () { var d = this.load(); return d ? d.username : null; },
    getFullName: function () { var d = this.load(); return d ? d.fullName : null; },
    isAdmin:     function () { return this.getRole() === 'admin'; },

    // ── Khởi động lại header khi reload ─────────────────────────────────────

    restore: function () {
        var token = this.getToken();
        if (token) {
            Ext.Ajax.setDefaultHeaders({ 'Authorization': 'Bearer ' + token });
            return true;
        }
        return false;
    },

    // ── Đọc cookie do ASP.NET set sau khi login ──────────────────────────────

    initFromCookie: function () {
        var raw = this._getCookie('gserver_auth');
        if (!raw) return false;
        try {
            var json = decodeURIComponent(escape(atob(raw)));
            var data = Ext.decode(json, true);
            if (data && data.token) {
                this.save(data);
                this._deleteCookie('gserver_auth'); // dùng xong xóa, dùng localStorage
                return true;
            }
        } catch (e) {}
        return false;
    },

    // ── loginUrl: ASP.NET truyền qua query string, lưu vào localStorage ─────

    saveLoginUrl: function (url) {
        if (url) localStorage.setItem(this._LOGIN_KEY, url);
    },

    getLoginUrl: function () {
        return localStorage.getItem(this._LOGIN_KEY) || '/Login.aspx';
    },

    // ── Cookie helpers ────────────────────────────────────────────────────────

    _getCookie: function (name) {
        var match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
        return match ? match[1] : null;
    },

    _deleteCookie: function (name) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    }
});
