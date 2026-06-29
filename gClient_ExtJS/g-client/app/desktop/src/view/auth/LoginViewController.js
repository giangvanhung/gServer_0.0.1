Ext.define('gClient.view.auth.LoginViewController', {
    extend: 'Ext.app.ViewController',
    alias:  'controller.loginviewcontroller',

    onLogin: function () {
        var view     = this.getView(),
            username = this.lookup('txtUsername').getValue(),
            password = this.lookup('txtPassword').getValue(),
            errorLbl = this.lookup('errorLabel');

        if (!username || !password) {
            this.showError('Vui lòng nhập đầy đủ thông tin.');
            return;
        }

        errorLbl.setHidden(true);

        Ext.Ajax.request({
            url:    gClient.app.getApiHost() + '/AuthService.svc/login',
            method: 'POST',
            jsonData: { Username: username, Password: password },
            success: function (resp) {
                var data = Ext.decode(resp.responseText, true);
                if (data && data.Success) {
                    gClient.util.Auth.save({
                        token:    data.Token,
                        username: data.Username,
                        role:     data.Role,
                        fullName: data.FullName
                    });
                    view.destroy();
                    Ext.Viewport.add([{ xtype: 'mainview' }]);
                } else {
                    this.showError((data && data.Message) || 'Đăng nhập thất bại.');
                }
            },
            failure: function () {
                this.showError('Không kết nối được tới server.');
            },
            scope: this
        });
    },

    showError: function (msg) {
        var lbl = this.lookup('errorLabel');
        lbl.setHtml(msg);
        lbl.setHidden(false);
    }
});
