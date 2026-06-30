# Hướng Dẫn: Sử Dụng Claude Code Để Check Vấn Đề (Debug)

## 📋 Tóm Tắt Nhanh

Khi gặp vấn đề:
1. **Mô tả vấn đề** chi tiết
2. **Mở F12** → xem Console, Network tab
3. **Paste error message** cho Claude Code
4. **Claude sẽ analyze** và suggest fix

---

## 🔧 Quy Trình Debug Chuẩn

### Bước 1: Xác Định Vấn Đề
```
Câu hỏi cần trả lời:
- Lỗi gì? (error message, warning)
- Ở đâu? (URL, file path)
- Khi nào? (refresh page, click button, load page)
- Hiệu ứng gì? (không hiển thị gì, stuck loading, lỗi đỏ)
```

### Bước 2: Gathering Information (Thu Thập Thông Tin)

#### F12 Console Tab
```
Xem lỗi gì:
- Error đỏ? → Lỗi JavaScript
- Warning vàng? → Không cần lo
- Có message gì không? → Copy lại

Ví dụ lỗi:
❌ Uncaught TypeError: Cannot read property 'launch' of undefined
❌ Ext is not defined
❌ Cannot find module 'gPortal.view.MainWindow'
```

#### F12 Network Tab
```
Xem file nào 404:
1. Nhấn F12 → Network
2. Refresh page
3. Sort by Status
4. Tìm mấy cái Status = 404 (đỏ)
5. Copy URL của file 404

Ví dụ:
GET /generatedFiles/desktop.json          → 404 ❌
GET /build/production/gClient/ext.js      → 200 ✓
GET /app/app.js                           → 404 ❌
```

#### F12 Network - Sort by Time
```
Xem file nào load chậm:
1. Sort by Time (Largest)
2. Xem mấy file nào > 1000ms
3. Có thể là bottleneck (điểm nghẽn)

Ví dụ:
ext-modern-all.js    → 5000ms (5 giây) ← Bình thường
app-all.js           → 100ms
desktop.json         → 50ms
```

### Bước 3: Report Cho Claude Code

**Template báo cáo:**

```
🐛 VẤN ĐỀ: [Ghi tên vấn đề]

📍 URL: [Copy URL hiện tại]

⚠️ ERROR MESSAGE:
[Paste toàn bộ lỗi từ F12 Console]

🔗 Network Tab (404 files):
[List các file 404]

📊 Slow Loading Files:
[List các file load > 1 giây]

💾 File/Folder Structure:
[Paste structure của /build/production/gClient/]

📝 Additional Context:
[Bổ sung thông tin khác]
```

**Ví dụ cụ thể:**

```
🐛 VẤN ĐỀ: ExtJS loading stuck, Ext.application undefined

📍 URL: http://localhost:63329/build/production/gClient/index.html?loginUrl=...

⚠️ ERROR MESSAGE:
Ext.application: undefined
Cannot find method 'launch' of undefined

🔗 Network Tab (404 files):
GET /generatedFiles/desktop.json → 404
GET /app/app.js → 404

📊 Slow Loading Files:
ext-modern-all.js → 3500ms
```

---

## 🚀 Claude Code Workflow

### Cách 1: Hỏi Claude Trước (Recommend)

```bash
# Mở Claude Code terminal
claude

# Gõ câu hỏi
Check vấn đề: ExtJS loading stuck, F12 console show:
"Ext.application: undefined"
F12 Network tab có 2 file 404:
- /generatedFiles/desktop.json
- /app/app.js
```

### Cách 2: Paste File Bị Lỗi

```bash
# Nếu biết file nào bị lỗi
Check file: /build/production/gClient/index.html
Lỗi: loading icon stuck, không render component
```

### Cách 3: Check Cả Project Structure

```bash
# Nếu không biết chính xác vấn đề ở đâu
Check folder structure của /build/production/gClient/
Xem có file nào missing không?
```

---

## 📝 Common Issues & Solutions

### Issue 1: "Ext is not defined"
```
Nguyên nhân: ext-modern-all.js chưa load xong
Cách fix:
1. Check Network tab xem ext-modern-all.js có 404 không
2. Kiểm tra path trong index.html (đúng không)
3. Chờ file load xong (4-5 giây bình thường)
```

### Issue 2: "Cannot read property 'xxx' of undefined"
```
Nguyên nhân: Dependency chưa load
Cách fix:
1. Check có file 404 không
2. Check require() hoặc import statement
3. Restart browser, xóa cache
```

### Issue 3: Page stuck ở loading screen
```
Nguyên nhân: app.launch() không được gọi
Cách fix:
1. Check F12 Console có error không
2. Check Network có file pending không
3. Check app/app.js có Ext.application({...}) không
```

### Issue 4: 404 files
```
Nguyên nhân: Build chưa tạo file, hoặc path sai
Cách fix:
1. Check file thực tế có tồn tại không
   → Dùng File Explorer (Windows) hoặc `ls` (Mac/Linux)
2. Rebuild ExtJS
3. Kiểm tra Web.config (path rewrite sai)
```

---

## 🔍 Debug Checklist

Trước khi gọi Claude, kiểm tra:

- [ ] F12 Console có error gì không?
- [ ] F12 Network có file 404 không?
- [ ] File thực tế tồn tại không? (File Explorer)
- [ ] URL path đúng không? (case-sensitive)
- [ ] Loading > 10 giây? → Có file pending không
- [ ] Web.config có sai không?
- [ ] Restart browser xong chưa?
- [ ] Xóa cache xong chưa? (Ctrl+Shift+Del)

---

## 💡 Pro Tips

### Tip 1: Copy Error Stack Trace
```
Khi copy error từ F12:
1. Right-click trên error message
2. Copy message
3. Paste cho Claude (đủ context)

❌ Sai: "Có lỗi gì đó"
✅ Đúng: 
TypeError: Cannot read property 'launch' of undefined
    at gPortal.view.MainWindow.initComponent (app-all.js:1234)
```

### Tip 2: Use Browser DevTools
```
F12 → Sources tab:
1. Set breakpoint ở app.js khởi động
2. Step through code
3. Xem scope, variables
4. Report lại cho Claude
```

### Tip 3: Check Web.config
```
Khi có 404 trên file tĩnh (.js, .css, .json):
1. Check Web.config có staticContent config không
2. Check defaultDocument có đúng không
3. Check <rewrite> có match file tĩnh không
   → Không rewrite các file tĩnh!
```

### Tip 4: Rebuild vs Restart
```
Khi code không update:
- Lần đầu gặp issue → Restart browser (Ctrl+F5)
- Lần thứ 2 → Xóa cache (Ctrl+Shift+Del)
- Lần thứ 3 → Rebuild ExtJS project
- Lần thứ 4 → Restart IIS + Restart browser
```

---

## 📞 Template Message Gửi Claude Code

```
🐛 PROBLEM: [Tên vấn đề]

📍 URL: [Current URL]

⚠️ Error from F12 Console:
[Paste error message]

🔗 404 Files (F12 Network):
- [List các file 404]

📂 Project Structure:
/build/production/gClient/
├── index.html
├── generatedFiles/
│   ├── desktop.json
│   └── ...
├── ext/
└── ...

💾 What I've Tried:
- Refresh page
- Ctrl+F5
- Clear cache
- Rebuild
- Restart IIS

❓ Additional Info:
[Ghi thêm chi tiết]
```

---

## 🎯 Khi Nào Gọi Claude Code?

### ✅ Gọi Claude:
- Gặp lỗi JavaScript không biết fix
- File 404 không biết tại sao
- Loading chậm
- Component không render
- Web.config bị lỗi

### ❌ Không cần gọi:
- Muốn thêm feature mới → Dùng Claude thường
- Giải thích concept → Dùng Claude thường
- Viết code từ đầu → Có thể dùng Claude thường hoặc Code

---

## 📚 Quick Reference

| Vấn Đề | Nguyên Nhân | Cách Fix |
|--------|-----------|---------|
| Ext undefined | ext.js 404 | Check path, rebuild |
| 404 on .json | Build missing file | Rebuild ExtJS |
| Page stuck | app.launch() fail | Check F12 error |
| Chậm load | Huge JS file | Check Network time |
| Component missing | require() fail | Check import path |

---

**Created**: 2026-06-30
**Last Updated**: 2026-06-30
**For**: gPortal ExtJS + ASP.NET development
