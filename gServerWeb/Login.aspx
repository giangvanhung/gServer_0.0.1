<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Login.aspx.cs" Inherits="gServerWeb.LoginPage" %>
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Đăng nhập — gServer GIS</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      min-height: 100vh;
      background: linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
    }

    .login-card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25);
      padding: 40px 36px;
      width: 380px;
    }

    .login-logo {
      text-align: center;
      margin-bottom: 28px;
    }
    .login-logo .icon {
      font-size: 48px;
      color: #1e3a5f;
    }
    .login-logo h1 {
      font-size: 22px;
      color: #1e3a5f;
      margin-top: 8px;
    }
    .login-logo p {
      font-size: 12px;
      color: #888;
      margin-top: 4px;
    }

    .form-group {
      margin-bottom: 16px;
    }
    .form-group label {
      display: block;
      font-size: 13px;
      color: #444;
      margin-bottom: 6px;
      font-weight: 600;
    }
    .form-group input {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #d0d5dd;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s;
      outline: none;
    }
    .form-group input:focus { border-color: #2d6a9f; box-shadow: 0 0 0 3px rgba(45,106,159,0.15); }

    .btn-login {
      width: 100%;
      padding: 12px;
      background: #1e3a5f;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 15px;
      font-weight: bold;
      cursor: pointer;
      margin-top: 8px;
      transition: background 0.2s;
    }
    .btn-login:hover { background: #2d6a9f; }

    .error-msg {
      background: #fff0f0;
      border: 1px solid #ffcdd2;
      color: #c62828;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 13px;
      margin-bottom: 16px;
      display: none;
    }
    .error-msg.show { display: block; }
  </style>
</head>
<body>
  <form runat="server" id="loginForm">
    <div class="login-card">

      <div class="login-logo">
        <div class="icon">🗺️</div>
        <h1>gServer GIS</h1>
        <p>Đăng nhập để tiếp tục</p>
      </div>

      <asp:Label ID="ErrorLabel" runat="server" CssClass="error-msg" />

      <div class="form-group">
        <label for="txtUsername">Tên đăng nhập</label>
        <asp:TextBox ID="txtUsername" runat="server" placeholder="Nhập username..." />
      </div>

      <div class="form-group">
        <label for="txtPassword">Mật khẩu</label>
        <asp:TextBox ID="txtPassword" runat="server" TextMode="Password" placeholder="Nhập mật khẩu..." />
      </div>

      <asp:Button ID="btnLogin" runat="server" Text="Đăng nhập"
          CssClass="btn-login" OnClick="btnLogin_Click" />

      <div style="text-align:center;margin-top:16px;font-size:13px;color:#666;">
        Chưa có tài khoản?
        <a href="Register.aspx" style="color:#2d6a9f;font-weight:600;text-decoration:none;">Đăng ký ngay</a>
      </div>
    </div>
  </form>
</body>
</html>
