Ext.define('gClient.view.auth.LoginView', {
    extend: 'Ext.Panel',
    xtype:  'loginview',

    controller: 'loginviewcontroller',

    layout: {
        type:  'vbox',
        align: 'center',
        pack:  'center'
    },

    style: {
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)',
        minHeight:  '100vh'
    },

    items: [{
        xtype:  'panel',
        width:  380,
        shadow: true,
        style:  { borderRadius: '12px', padding: '40px 36px', background: '#fff' },
        layout: { type: 'vbox', align: 'stretch' },
        items: [
            // Logo
            {
                xtype: 'container',
                style: { textAlign: 'center', marginBottom: '28px' },
                html:  '<div style="font-size:48px">🗺️</div>' +
                       '<h1 style="font-size:22px;color:#1e3a5f;margin:8px 0 4px">gServer GIS</h1>' +
                       '<p style="font-size:12px;color:#888">Đăng nhập để tiếp tục</p>'
            },
            // Thông báo lỗi
            {
                xtype:    'label',
                reference: 'errorLabel',
                hidden:   true,
                style: {
                    background: '#fff0f0',
                    border:     '1px solid #ffcdd2',
                    color:      '#c62828',
                    padding:    '10px 14px',
                    borderRadius: '6px',
                    fontSize:   '13px',
                    marginBottom: '16px'
                }
            },
            // Username
            {
                xtype:       'textfield',
                reference:   'txtUsername',
                label:       'Tên đăng nhập',
                placeholder: 'Nhập username...',
                required:    true,
                style:       { marginBottom: '16px' }
            },
            // Password
            {
                xtype:       'textfield',
                reference:   'txtPassword',
                label:       'Mật khẩu',
                inputType:   'password',
                placeholder: 'Nhập mật khẩu...',
                required:    true,
                style:       { marginBottom: '16px' },
                listeners: {
                    specialkey: function (f, e) {
                        if (e.getKey() === e.ENTER)
                            f.up('loginview').getController().onLogin();
                    }
                }
            },
            // Button
            {
                xtype:   'button',
                text:    'Đăng nhập',
                ui:      'action',
                style:   { marginTop: '8px' },
                handler: 'onLogin'
            }
        ]
    }]
});
