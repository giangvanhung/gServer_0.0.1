Ext.define('gClient.view.main.nav.bottom.BottomView', {
    extend: 'Ext.Toolbar',
    xtype:  'bottomview',
    cls:    'bottomview',
    shadow: false,

    items: [
        {
            xtype:  'component',
            itemId: 'userInfo',
            flex:   1,
            style:  { padding: '4px 8px', fontSize: '12px', color: '#b0b8c5' }
        },
        {
            xtype:   'button',
            iconCls: 'x-fa fa-sign-out-alt',
            text:    'Đăng xuất',
            ui:      'plain',
            style:   { color: '#b0b8c5' },
            handler: 'onBottomViewlogout'
        }
    ],

    // Gọi sau khi component được tạo — Auth đã sẵn sàng lúc này
    initialize: function () {
        this.callParent(arguments);
        var name = gClient.util.Auth.getFullName() || gClient.util.Auth.getUsername() || '';
        this.getComponent('userInfo').setHtml(
            '<i class="x-fa fa-user" style="margin-right:6px"></i>' +
            Ext.String.htmlEncode(name)
        );
    }
});
