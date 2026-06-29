<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Setup.aspx.cs" Inherits="gServerWeb.SetupPage" %>
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Setup</title>
  <style>
    body { font-family: Arial; max-width: 500px; margin: 60px auto; }
    .btn { padding: 10px 24px; background: #1e3a5f; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
    .result { margin-top: 16px; padding: 12px; border-radius: 4px; font-size: 13px; }
    .ok  { background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; }
    .err { background: #ffebee; color: #c62828; border: 1px solid #ef9a9a; }
  </style>
</head>
<body>
  <form runat="server">
    <h2>Tạo tài khoản Admin</h2>
    <p style="color:#666;margin:12px 0">Username: <b>admin</b> / Password: <b>Admin@123</b></p>
    <asp:Button ID="btnCreate" runat="server" Text="Tạo Admin" CssClass="btn" OnClick="btnCreate_Click" />
    <asp:Label  ID="ResultLabel" runat="server" />
  </form>
</body>
</html>
