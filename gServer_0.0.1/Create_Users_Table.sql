CREATE TABLE USERS (
    Id       INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50)  NOT NULL UNIQUE,
    Password NVARCHAR(256) NOT NULL,  -- BCrypt hash
    FullName NVARCHAR(100),
    Email    NVARCHAR(100),
    Role     NVARCHAR(20)  NOT NULL DEFAULT 'user',  -- 'admin' | 'user'
    IsActive BIT           NOT NULL DEFAULT 1,
    CreatedAt DATETIME     NOT NULL DEFAULT GETDATE()
);

-- Tài khoản admin mặc định (password: Admin@123)
INSERT INTO USERS (Username, Password, FullName, Role)
VALUES ('admin', '$2a$11$rBnqfOkYmGpgG4Y0y/X9Huy7lJlQ5Y5Q5Y5Q5Y5Q5Y5Q5Y5Q5Y5', N'Administrator', 'admin');


DROP TABLE USERS