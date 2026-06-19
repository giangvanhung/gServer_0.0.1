CREATE TABLE LAYERS(
	Id INT IDENTITY(1,1) PRIMARY KEY,
	Name NVARCHAR(150) NOT NULL,
	Source VARCHAR(200),
	Description NVARCHAR(200),
	LayerType VARCHAR(10) NOT NULL , -- 'point', 'line', 'polygon'
	IsVisible BIT NOT NULL DEFAULT 1, 
    Opacity FLOAT NOT NULL DEFAULT 1.0 CHECK (Opacity >= 0.0 AND Opacity <= 1.0),
    MinZoom     INT DEFAULT 0,
    MaxZoom     INT DEFAULT 22
);



CREATE TABLE FEATURES
(
	Id INT IDENTITY(1,1) PRIMARY KEY,       
    LayerId INT NOT NULL,             
    Geom GEOMETRY NOT NULL, 
	Properties NVARCHAR(MAX),
	CONSTRAINT FK_Features_Layers FOREIGN KEY (LayerId) REFERENCES LAYERS(Id) ON DELETE CASCADE
);

CREATE SPATIAL INDEX idx_features_geom
ON FEATURES(Geom)
USING GEOMETRY_AUTO_GRID
WITH (BOUNDING_BOX = (100, 8, 110, 24));

CREATE TABLE LAYERSTYLE(
	Id INT IDENTITY(1,1) PRIMARY KEY,       
    LayerId INT NOT NULL,    
	CONSTRAINT FK_LAYERSTYLE_Layers FOREIGN KEY (LayerId) REFERENCES LAYERS(Id) ON DELETE CASCADE,
	FillColor CHAR(10) NOT NULL DEFAULT '#3399CC',
	StrokeColor CHAR(10) NOT NULL DEFAULT '#FFFFFF',
	StrokeWidth FLOAT DEFAULT 1.5,
	IconUrl VARCHAR(200)
);

-- Khai báo biến để lưu Id của Layer sau khi tạo
DECLARE @NewLayerId INT;
BEGIN TRY
	BEGIN TRANSACTION;
	-- BƯỚC 1: Tạo bản ghi cha trong bảng LAYERS
	INSERT INTO LAYERS (Name, Source, Description, LayerType, IsVisible, Opacity, MinZoom, MaxZoom)
	VALUES (
		N'Địa phận hành chính cũ', -- Tên lớp bản đồ
		'gServer_dev_DB.dbo.DiaPhanTinhCu', -- Nguồn dữ liệu gốc
		N'Dữ liệu địa giới hành chính bóc tách từ bảng cũ', 
		'polygon', -- Vì là địa phận (commune/district) nên LayerType là polygon
		1,   -- Hiển thị mặc định
		1.0, -- Độ trong suốt tối đa
		0,   -- MinZoom
		22   -- MaxZoom
	);



	-- Lấy ra Id vừa tự động sinh của Layer
	SET @NewLayerId = SCOPE_IDENTITY();

	-- BƯỚC 2: Tạo cấu hình hiển thị mặc định trong bảng LAYERSTYLE
	INSERT INTO LAYERSTYLE (LayerId, FillColor, StrokeColor, StrokeWidth, IconUrl)
	VALUES (
		@NewLayerId,
		'#3399CC', -- Màu nền xanh lam nhẹ
		'#FFFFFF', -- Đường viền trắng tách biệt các xã
		1.5,
		NULL       -- Dữ liệu vùng không cần IconUrl
	);


	-- BƯỚC 3: Đổ dữ liệu từ bảng cũ vào bảng FEATURES
	-- Toàn bộ thông tin phi không gian (commune, district, province...) sẽ được đóng gói thành JSON
	INSERT INTO FEATURES (LayerId, Geom, Properties)
	SELECT 
		@NewLayerId AS LayerId,
		[Geom_geom] AS Geom, -- Đưa cột hình học phẳng (geometry) sang
		(
			SELECT 
				[Id] AS original_id,
				[commune],
				[communeid],
				[district],
				[districtid],
				[province],
				[provinceid],
				[type],
				[SHAPE_Leng],
				[SHAPE_Area],
				[color_id],
				[level_zoom],
				[code],
				[lng],
				[lat],
				[level],
				[xdaidien],
				[ydaidien]
			FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
		) AS Properties -- Hàm FOR JSON này sẽ tự động biến các cột thành 1 chuỗi JSON dạng {"commune": "...", "district": "..."}
	FROM [gServer_dev_DB].[dbo].[DiaPhanTinhCu]
	WHERE [Geom_geom] IS NOT NULL; -- Chỉ lấy những hàng có dữ liệu không gian hợp lệ

	COMMIT TRANSACTION;
    PRINT 'Đã chuyển đổi dữ liệu thành công!';
END TRY
BEGIN CATCH 
	IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END
    -- In ra thông báo lỗi chi tiết để debug
    PRINT 'Có lỗi xảy ra: ' + ERROR_MESSAGE();
END CATCH