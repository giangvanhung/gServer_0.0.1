<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Register.aspx.cs" Inherits="gServerWeb.RegisterPage" %>
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Đăng ký — gServer GIS</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      background: linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%);
      display: flex; align-items: center; justify-content: center;
      font-family: Arial, sans-serif;
    }
    .card {
      background: #fff; border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25);
      padding: 36px 36px 28px; width: 400px;
    }
    .logo { text-align: center; margin-bottom: 24px; }
    .logo .icon { font-size: 42px; color: #1e3a5f; }
    .logo h1 { font-size: 20px; color: #1e3a5f; margin-top: 6px; }
    .logo p  { font-size: 12px; color: #888; margin-top: 3px; }

    .form-group { margin-bottom: 14px; }
    .form-group label { display: block; font-size: 13px; color: #444; margin-bottom: 5px; font-weight: 600; }
    .form-group input {
      width: 100%; padding: 10px 14px; border: 1px solid #d0d5dd;
      border-radius: 6px; font-size: 14px; outline: none; transition: border-color .2s;
    }
    .form-group input:focus { border-color: #2d6a9f; box-shadow: 0 0 0 3px rgba(45,106,159,.15); }

    .btn-submit {
      width: 100%; padding: 12px; background: #1e3a5f; color: #fff;
      border: none; border-radius: 6px; font-size: 15px; font-weight: bold;
      cursor: pointer; margin-top: 6px; transition: background .2s;
    }
    .btn-submit:hover { background: #2d6a9f; }

    .msg { padding: 10px 14px; border-radius: 6px; font-size: 13px; margin-bottom: 14px; display: none; }
    .msg.show { display: block; }
    .msg.error   { background: #fff0f0; border: 1px solid #ffcdd2; color: #c62828; }
    .msg.success { background: #f0fff4; border: 1px solid #c8e6c9; color: #2e7d32; }

    .login-link { text-align: center; margin-top: 16px; font-size: 13px; color: #666; }
    .login-link a { color: #2d6a9f; text-decoration: none; font-weight: 600; }
    .login-link a:hover { text-decoration: underline; }

    .hint { font-size: 11px; color: #999; margin-top: 3px; }
  </style>
</head>
<body>
  <form runat="server" id="registerForm">
    <div class="card">
      <div class="logo">
        <div class="icon">🗺️</div>
        <h1>gServer GIS</h1>
        <p>Tạo tài khoản mới</p>
      </div>

      <asp:Label ID="ErrorLabel"   runat="server" CssClass="msg error"   />
      <asp:Label ID="SuccessLabel" runat="server" CssClass="msg success"  />

      <div class="form-group">
        <label>Tên đăng nhập <span style="color:red">*</span></label>
        <asp:TextBox ID="txtUsername" runat="server" placeholder="Chỉ chữ, số, dấu gạch dưới..." />
      </div>
      <div class="form-group">
        <label>Họ và tên <span style="color:red">*</span></label>
        <asp:TextBox ID="txtFullName" runat="server" placeholder="Nguyễn Văn A..." />
      </div>
      <div class="form-group">
        <label>Email</label>
        <asp:TextBox ID="txtEmail" runat="server" placeholder="example@email.com" TextMode="Email" />
      </div>
      <div class="form-group">
        <label>Mật khẩu <span style="color:red">*</span></label>
        <asp:TextBox ID="txtPassword" runat="server" TextMode="Password" placeholder="Tối thiểu 6 ký tự" />
      </div>
      <div class="form-group">
        <label>Xác nhận mật khẩu <span style="color:red">*</span></label>
        <asp:TextBox ID="txtConfirm" runat="server" TextMode="Password" placeholder="Nhập lại mật khẩu" />
      </div>

      <asp:Button ID="btnRegister" runat="server" Text="Đăng ký"
          CssClass="btn-submit" OnClick="btnRegister_Click" />

      <div class="login-link">
        Đã có tài khoản? <a href="Login.aspx">Đăng nhập</a>
      </div>
    </div>
  </form>
</body>
</html>
