-- ============================================================
-- KTV 管理系統 - 資料庫 Schema
-- MySQL 8.0 | utf8mb4 | 中文欄位名稱
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 建立資料庫
CREATE DATABASE IF NOT EXISTS `ktv_management` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ktv_management`;

-- ============================================================
-- 1. users - 使用者（管理員、幹部、公關）
-- ============================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `用戶編號`       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主鍵',
    `帳號`           VARCHAR(50)  NOT NULL UNIQUE COMMENT '登入帳號',
    `密碼`           VARCHAR(255) NOT NULL COMMENT '加密密碼',
    `角色`           ENUM('管理員','幹部','公關','經紀人') NOT NULL DEFAULT '管理員' COMMENT '使用者角色',
    `顯示名稱`       VARCHAR(100) DEFAULT NULL COMMENT '顯示名稱',
    `是否啟用`       TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '1=啟用, 0=停用',
    `最後登入時間`   DATETIME     DEFAULT NULL COMMENT '最後一次登入時間',
    `建立時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    `更新時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    INDEX `idx_角色` (`角色`),
    INDEX `idx_是否啟用` (`是否啟用`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='使用者帳號管理';


-- ============================================================
-- 2. hosts - 公關小姐
-- ============================================================
DROP TABLE IF EXISTS `hosts`;
CREATE TABLE `hosts` (
    `公關編號`       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主鍵',
    `姓名`           VARCHAR(100) NOT NULL COMMENT '公關姓名',
    `暱稱`           VARCHAR(100) DEFAULT NULL COMMENT '藝名／暱稱',
    `級別`           VARCHAR(20)  DEFAULT '初級' COMMENT '級別（初級、中級、高級、頂級等）',
    `外貌級距`       VARCHAR(20)  DEFAULT NULL COMMENT '外貌評分級距（如：A+、A、B+ 等）',
    `綜合級距`       VARCHAR(20)  DEFAULT NULL COMMENT '綜合評分級距',
    `聯絡方式`       VARCHAR(50)  DEFAULT NULL COMMENT '手機或 LINE 等聯絡方式',
    `生日`           DATE         DEFAULT NULL COMMENT '出生日期',
    `身高`           DECIMAL(5,1) DEFAULT NULL COMMENT '身高（公分）',
    `三圍`           VARCHAR(30)  DEFAULT NULL COMMENT '身材三圍',
    `學歷`           VARCHAR(200) DEFAULT NULL COMMENT '學歷背景',
    `籍貫`           VARCHAR(50)  DEFAULT NULL COMMENT '籍貫',
    `入職日期`       DATE         NOT NULL COMMENT '入職日期',
    `離職日期`       DATE         DEFAULT NULL COMMENT '離職日期（NULL=在職）',
    `狀態`           ENUM('在職','休假','離職','停業') NOT NULL DEFAULT '在職' COMMENT '目前狀態',
    `照片`           VARCHAR(500) DEFAULT NULL COMMENT '個人照片路徑',
    `經紀公司編號`   INT UNSIGNED DEFAULT NULL COMMENT '所屬經紀公司',
    `備註`           TEXT         DEFAULT NULL COMMENT '備註',
    `建立時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    `更新時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    INDEX `idx_姓名` (`姓名`),
    INDEX `idx_級別` (`級別`),
    INDEX `idx_狀態` (`狀態`),
    INDEX `idx_入職日期` (`入職日期`),
    CONSTRAINT `fk_hosts_broker` FOREIGN KEY (`經紀公司編號`) REFERENCES `broker_companies`(`經紀公司編號`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公關小姐基本資料';


-- ============================================================
-- 3. cadres - 幹部
-- ============================================================
DROP TABLE IF EXISTS `cadres`;
CREATE TABLE `cadres` (
    `幹部編號`       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主鍵',
    `姓名`           VARCHAR(100) NOT NULL COMMENT '幹部姓名',
    `暱稱`           VARCHAR(100) DEFAULT NULL COMMENT '藝名／暱稱',
    `等級`           VARCHAR(20)  DEFAULT '一般' COMMENT '幹部等級（VIP、A、B、C 等）',
    `聯絡方式`       VARCHAR(50)  DEFAULT NULL COMMENT '手機或 LINE 等聯絡方式',
    `電子信箱`       VARCHAR(100) DEFAULT NULL COMMENT 'Email',
    `地址`           VARCHAR(200) DEFAULT NULL COMMENT '通訊地址',
    `備註`           TEXT         DEFAULT NULL COMMENT '備註',
    `是否啟用`       TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '1=啟用, 0=停用',
    `建立時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    `更新時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    INDEX `idx_姓名` (`姓名`),
    INDEX `idx_等級` (`等級`),
    INDEX `idx_是否啟用` (`是否啟用`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='幹部基本資料';


-- ============================================================
-- 4. bookings - 訂桌記錄
-- ============================================================
DROP TABLE IF EXISTS `bookings`;
CREATE TABLE `bookings` (
    `訂桌編號`       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主鍵',
    `訂桌單號`       VARCHAR(30)  NOT NULL UNIQUE COMMENT '訂桌流水編號',
    `日期`           DATE         NOT NULL COMMENT '訂桌日期',
    `時段`           ENUM('日場','晚場','深夜場','全天') DEFAULT '晚場' COMMENT '訂桌時段',
    `包廂編號`       INT UNSIGNED DEFAULT NULL COMMENT '包廂',
    `公關編號`       INT UNSIGNED DEFAULT NULL COMMENT '公關編號',
    `幹部編號`       INT UNSIGNED NOT NULL COMMENT '幹部編號',
    `客戶編號`       INT UNSIGNED DEFAULT NULL COMMENT '客戶編號（可選）',
    `人數`           INT UNSIGNED DEFAULT NULL COMMENT '人數',
    `業績`           DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '訂桌業績金額',
    `消費明細`       TEXT         DEFAULT NULL COMMENT '消費項目明細',
    `結款方式`       ENUM('現金','轉帳','刷卡','掛帳','混合') NOT NULL DEFAULT '現金' COMMENT '結款方式',
    `付款狀態`       ENUM('未付款','已付款','部分付款','已退款') NOT NULL DEFAULT '未付款' COMMENT '付款狀態',
    `預訂時間`       DATETIME     DEFAULT NULL COMMENT '預訂時間',
    `實際到訪時間`   DATETIME     DEFAULT NULL COMMENT '實際到訪時間',
    `結束時間`       DATETIME     DEFAULT NULL COMMENT '結束時間',
    `特殊需求`       TEXT         DEFAULT NULL COMMENT '特殊需求或備註',
    `操作人員`       INT UNSIGNED DEFAULT NULL COMMENT '建立此筆記錄的使用者',
    `建立時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    `更新時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    INDEX `idx_日期` (`日期`),
    INDEX `idx_幹部編號` (`幹部編號`),
    INDEX `idx_公關編號` (`公關編號`),
    INDEX `idx_包廂編號` (`包廂編號`),
    INDEX `idx_結款方式` (`結款方式`),
    INDEX `idx_付款狀態` (`付款狀態`),
    INDEX `idx_訂桌單號` (`訂桌單號`),
    CONSTRAINT `fk_bookings_cadres` FOREIGN KEY (`幹部編號`) REFERENCES `cadres`(`幹部編號`) ON DELETE RESTRICT,
    CONSTRAINT `fk_bookings_hosts` FOREIGN KEY (`公關編號`) REFERENCES `hosts`(`公關編號`) ON DELETE SET NULL,
    CONSTRAINT `fk_bookings_customer` FOREIGN KEY (`客戶編號`) REFERENCES `customer_contacts`(`客戶編號`) ON DELETE SET NULL,
    CONSTRAINT `fk_bookings_user` FOREIGN KEY (`操作人員`) REFERENCES `users`(`用戶編號`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='訂桌記錄';


-- ============================================================
-- 5. daily_performance - 每日業績
-- ============================================================
DROP TABLE IF EXISTS `daily_performance`;
CREATE TABLE `daily_performance` (
    `業績編號`       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主鍵',
    `公關編號`       INT UNSIGNED NOT NULL COMMENT '公關編號',
    `日期`           DATE         NOT NULL COMMENT '業績日期',
    `檯費營收`       DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '檯費營收金額',
    `經紀費`         DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '經紀公司抽成',
    `營利`           DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '營利金額',
    `實領`           DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '實際領取金額',
    `小費收入`       DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '小費收入',
    `其他收入`       DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '其他收入項目',
    `備註`           TEXT         DEFAULT NULL COMMENT '備註',
    `建立時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    `更新時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    INDEX `idx_公關編號` (`公關編號`),
    INDEX `idx_日期` (`日期`),
    UNIQUE KEY `uk_公關_日期` (`公關編號`, `日期`),
    CONSTRAINT `fk_daily_perf_hosts` FOREIGN KEY (`公關編號`) REFERENCES `hosts`(`公關編號`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公關每日業績紀錄';


-- ============================================================
-- 6. monthly_revenue - 月營業額
-- ============================================================
DROP TABLE IF EXISTS `monthly_revenue`;
CREATE TABLE `monthly_revenue` (
    `年月`           CHAR(7)      NOT NULL COMMENT '年月格式 YYYY-MM',
    `總業績`         DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT '該月總營業額',
    `幹部A業績`      DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '幹部A業績',
    `幹部B業績`      DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '幹部B業績',
    `幹部C業績`      DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '幹部C業績',
    `幹部D業績`      DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '幹部D業績',
    `幹部E業績`      DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '幹部E業績',
    `其他業績`       DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '其他幹部業績',
    `總支出`         DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '該月總支出',
    `淨利`           DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT '該月淨利',
    `備註`           TEXT         DEFAULT NULL COMMENT '備註',
    `建立時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    `更新時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    PRIMARY KEY (`年月`),
    INDEX `idx_年月` (`年月`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每月營業額統計';


-- ============================================================
-- 7. broker_companies - 經紀公司
-- ============================================================
DROP TABLE IF EXISTS `broker_companies`;
CREATE TABLE `broker_companies` (
    `經紀公司編號`   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主鍵',
    `公司名稱`       VARCHAR(200) NOT NULL COMMENT '經紀公司名稱',
    `負責人`         VARCHAR(100) DEFAULT NULL COMMENT '負責人／經紀人姓名',
    `聯絡方式`       VARCHAR(50)  DEFAULT NULL COMMENT '聯絡電話',
    `地址`           VARCHAR(300) DEFAULT NULL COMMENT '公司地址',
    `電子信箱`       VARCHAR(100) DEFAULT NULL COMMENT 'Email',
    `佣金比例`       DECIMAL(5,2) DEFAULT 0.00 COMMENT '抽成百分比（%）',
    `合約開始日`     DATE         DEFAULT NULL COMMENT '合約開始日期',
    `合約結束日`     DATE         DEFAULT NULL COMMENT '合約結束日期',
    `狀態`           ENUM('合作中','暫停','解約') NOT NULL DEFAULT '合作中' COMMENT '合作狀態',
    `備註`           TEXT         DEFAULT NULL COMMENT '備註',
    `建立時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    `更新時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    INDEX `idx_公司名稱` (`公司名稱`),
    INDEX `idx_狀態` (`狀態`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='經紀公司資料';


-- ============================================================
-- 8. eight_gathering - 八大雲集
-- ============================================================
DROP TABLE IF EXISTS `eight_gathering`;
CREATE TABLE `eight_gathering` (
    `店家編號`       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主鍵',
    `店名`           VARCHAR(200) NOT NULL COMMENT '店家名稱',
    `類型`           VARCHAR(100) DEFAULT NULL COMMENT '店家類型（KTV、夜店、酒吧等）',
    `地址`           VARCHAR(300) DEFAULT NULL COMMENT '店家地址',
    `電話`           VARCHAR(30)  DEFAULT NULL COMMENT '店家電話',
    `營業時間`       VARCHAR(100) DEFAULT NULL COMMENT '營業時間（如：20:00-04:00）',
    `負責幹部編號`   INT UNSIGNED DEFAULT NULL COMMENT '負責該店的幹部',
    `合作狀態`       ENUM('合作中','暫停','解約') NOT NULL DEFAULT '合作中' COMMENT '合作狀態',
    `備註`           TEXT         DEFAULT NULL COMMENT '備註',
    `建立時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    `更新時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    INDEX `idx_店名` (`店名`),
    INDEX `idx_類型` (`類型`),
    INDEX `idx_合作狀態` (`合作狀態`),
    CONSTRAINT `fk_eight_gather_cadre` FOREIGN KEY (`負責幹部編號`) REFERENCES `cadres`(`幹部編號`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='八大雲集店家資料';


-- ============================================================
-- 9. attendance - 出勤記錄
-- ============================================================
DROP TABLE IF EXISTS `attendance`;
CREATE TABLE `attendance` (
    `出勤編號`       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主鍵',
    `公關編號`       INT UNSIGNED NOT NULL COMMENT '公關編號',
    `日期`           DATE         NOT NULL COMMENT '出勤日期',
    `上班時段`       ENUM('日場','晚場','深夜場','全天') NOT NULL COMMENT '上班時段',
    `簽到時間`       TIME         DEFAULT NULL COMMENT '實際簽到時間',
    `簽退時間`       TIME         DEFAULT NULL COMMENT '實際簽退時間',
    `工作小時數`     DECIMAL(4,1) DEFAULT NULL COMMENT '實際工作時數',
    `狀態`           ENUM('正常','請假','病假','事假','曠職','遲到','早退') NOT NULL DEFAULT '正常' COMMENT '出勤狀態',
    `請假事由`       TEXT         DEFAULT NULL COMMENT '請假事由',
    `核決人`         INT UNSIGNED DEFAULT NULL COMMENT '核決人員',
    `備註`           TEXT         DEFAULT NULL COMMENT '備註',
    `建立時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    `更新時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    INDEX `idx_公關編號` (`公關編號`),
    INDEX `idx_日期` (`日期`),
    INDEX `idx_狀態` (`狀態`),
    UNIQUE KEY `uk_公關_日期_時段` (`公關編號`, `日期`, `上班時段`),
    CONSTRAINT `fk_attendance_hosts` FOREIGN KEY (`公關編號`) REFERENCES `hosts`(`公關編號`) ON DELETE RESTRICT,
    CONSTRAINT `fk_attendance_approver` FOREIGN KEY (`核決人`) REFERENCES `users`(`用戶編號`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公關出勤記錄';


-- ============================================================
-- 10. evaluations - 級別評估
-- ============================================================
DROP TABLE IF EXISTS `evaluations`;
CREATE TABLE `evaluations` (
    `評估編號`       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主鍵',
    `公關編號`       INT UNSIGNED NOT NULL COMMENT '公關編號',
    `評估項目`       VARCHAR(100) NOT NULL COMMENT '評估項目（外貌、談吐、服務、業績等）',
    `分數`           DECIMAL(4,1) NOT NULL COMMENT '評分（0.0~100.0）',
    `評估日期`       DATE         NOT NULL COMMENT '評估日期',
    `評估人`         INT UNSIGNED DEFAULT NULL COMMENT '評估人員',
    `評語`           TEXT         DEFAULT NULL COMMENT '評語或建議',
    `建立時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    `更新時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    INDEX `idx_公關編號` (`公關編號`),
    INDEX `idx_評估項目` (`評估項目`),
    INDEX `idx_評估日期` (`評估日期`),
    CONSTRAINT `fk_eval_hosts` FOREIGN KEY (`公關編號`) REFERENCES `hosts`(`公關編號`) ON DELETE RESTRICT,
    CONSTRAINT `fk_eval_assessor` FOREIGN KEY (`評估人`) REFERENCES `users`(`用戶編號`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公關級別評估紀錄';


-- ============================================================
-- 11. bonus_list - 幹部訂桌獎金名單
-- ============================================================
DROP TABLE IF EXISTS `bonus_list`;
CREATE TABLE `bonus_list` (
    `獎金編號`       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主鍵',
    `幹部編號`       INT UNSIGNED NOT NULL COMMENT '幹部編號',
    `獎金月份`       CHAR(7)      NOT NULL COMMENT '獎金月份 YYYY-MM',
    `訂桌次數`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '該月訂桌總次數',
    `總業績`         DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT '該月總業績',
    `獎金金額`       DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '獎金金額',
    `獎金條件`       VARCHAR(200) DEFAULT NULL COMMENT '達成的獎金條件說明',
    `發放狀態`       ENUM('未發放','已發放','已扣繳') NOT NULL DEFAULT '未發放' COMMENT '發放狀態',
    `發放日期`       DATE         DEFAULT NULL COMMENT '實際發放日期',
    `備註`           TEXT         DEFAULT NULL COMMENT '備註',
    `建立時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    `更新時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    INDEX `idx_幹部編號` (`幹部編號`),
    INDEX `idx_獎金月份` (`獎金月份`),
    INDEX `idx_發放狀態` (`發放狀態`),
    CONSTRAINT `fk_bonus_cadres` FOREIGN KEY (`幹部編號`) REFERENCES `cadres`(`幹部編號`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='幹部訂桌獎金紀錄';


-- ============================================================
-- 12. customer_contacts - 小姐留客資紀錄
-- ============================================================
DROP TABLE IF EXISTS `customer_contacts`;
CREATE TABLE `customer_contacts` (
    `客戶編號`       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主鍵',
    `客戶姓名`       VARCHAR(100) NOT NULL COMMENT '客戶姓名',
    `暱稱`           VARCHAR(100) DEFAULT NULL COMMENT '暱稱',
    `電話`           VARCHAR(30)  DEFAULT NULL COMMENT '聯絡電話',
    `行動電話`       VARCHAR(30)  DEFAULT NULL COMMENT '手機號碼',
    `LINE_ID`        VARCHAR(100) DEFAULT NULL COMMENT 'LINE ID',
    `生日`           DATE         DEFAULT NULL COMMENT '客戶生日',
    `類別`           ENUM('VIP','重要','一般','潛在','黑名單') DEFAULT '一般' COMMENT '客戶類別',
    `特徵`           TEXT         DEFAULT NULL COMMENT '客戶特徵描述',
    `偏好公關編號`   INT UNSIGNED DEFAULT NULL COMMENT '偏好公關',
    `首次消費日期`   DATE         DEFAULT NULL COMMENT '首次消費日期',
    `總消費金額`     DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT '累計消費金額',
    `備註`           TEXT         DEFAULT NULL COMMENT '備註',
    `建立時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    `更新時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    INDEX `idx_客戶姓名` (`客戶姓名`),
    INDEX `idx_電話` (`電話`),
    INDEX `idx_類別` (`類別`),
    INDEX `idx_偏好公關` (`偏好公關編號`),
    CONSTRAINT `fk_customer_pref_host` FOREIGN KEY (`偏好公關編號`) REFERENCES `hosts`(`公關編號`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客戶客資紀錄';


-- ============================================================
-- 13. vote_records - 幹部不具名投票
-- ============================================================
DROP TABLE IF EXISTS `vote_records`;
CREATE TABLE `vote_records` (
    `投票編號`       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主鍵',
    `投票主題`       VARCHAR(200) NOT NULL COMMENT '投票主題',
    `投票描述`       TEXT         DEFAULT NULL COMMENT '投票說明',
    `投票選項`       JSON         NOT NULL COMMENT '投票選項（JSON陣列）',
    `發起人編號`     INT UNSIGNED DEFAULT NULL COMMENT '發起投票的幹部（可選）',
    `開始時間`       DATETIME     NOT NULL COMMENT '投票開始時間',
    `截止時間`       DATETIME     NOT NULL COMMENT '投票截止時間',
    `投票狀態`       ENUM('進行中','已截止','已公告結果','已取消') NOT NULL DEFAULT '進行中' COMMENT '投票狀態',
    `是否匿名`       TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '是否匿名投票',
    `結果`           JSON         DEFAULT NULL COMMENT '投票結果彙整（JSON）',
    `建立時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    `更新時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    INDEX `idx_投票主題` (`投票主題`),
    INDEX `idx_投票狀態` (`投票狀態`),
    INDEX `idx_截止時間` (`截止時間`),
    CONSTRAINT `fk_vote_initiator` FOREIGN KEY (`發起人編號`) REFERENCES `cadres`(`幹部編號`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='幹部不具名投票紀錄';


-- ============================================================
-- 14. recruitment - 職缺資訊
-- ============================================================
DROP TABLE IF EXISTS `recruitment`;
CREATE TABLE `recruitment` (
    `職缺編號`       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主鍵',
    `職缺標題`       VARCHAR(200) NOT NULL COMMENT '職缺名稱',
    `職位類別`       ENUM('公關','幹部','店務','其他') NOT NULL DEFAULT '公關' COMMENT '職位類別',
    `工作內容`       TEXT         DEFAULT NULL COMMENT '工作內容描述',
    `薪資範圍`       VARCHAR(100) DEFAULT NULL COMMENT '薪資範圍',
    `工作地點`       VARCHAR(300) DEFAULT NULL COMMENT '工作地點',
    `工作時段`       VARCHAR(100) DEFAULT NULL COMMENT '工作時段',
    `應徵條件`       TEXT         DEFAULT NULL COMMENT '應徵條件與要求',
    `聯絡方式`       VARCHAR(100) DEFAULT NULL COMMENT '應徵聯絡方式',
    `釋出日期`       DATE         NOT NULL COMMENT '釋出日期',
    `截止日期`       DATE         DEFAULT NULL COMMENT '應徵截止日',
    `職缺狀態`       ENUM('招募中','已額滿','已關閉') NOT NULL DEFAULT '招募中' COMMENT '職缺狀態',
    `應徵人數`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '應徵人數統計',
    `備註`           TEXT         DEFAULT NULL COMMENT '備註',
    `建立時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    `更新時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    INDEX `idx_職缺狀態` (`職缺狀態`),
    INDEX `idx_職位類別` (`職位類別`),
    INDEX `idx_釋出日期` (`釋出日期`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='職缺資訊';


-- ============================================================
-- 15. recycling - 回收分類
-- ============================================================
DROP TABLE IF EXISTS `recycling`;
CREATE TABLE `recycling` (
    `回收編號`       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主鍵',
    `粗分類`         VARCHAR(100) NOT NULL COMMENT '粗分類（如：客戶、公關、幹部）',
    `分類方式`       VARCHAR(100) NOT NULL COMMENT '分類方式／條件說明',
    `細分類`         VARCHAR(100) DEFAULT NULL COMMENT '細分類別',
    `原則處理`       TEXT         DEFAULT NULL COMMENT '處理原則與流程說明',
    `建立時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    `更新時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    INDEX `idx_粗分類` (`粗分類`),
    INDEX `idx_分類方式` (`分類方式`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='回收資料分類規則';


-- ============================================================
-- 16. voluntary_resignation - 自願離職書
-- ============================================================
DROP TABLE IF EXISTS `voluntary_resignation`;
CREATE TABLE `voluntary_resignation` (
    `離職編號`       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主鍵',
    `公關編號`       INT UNSIGNED NOT NULL COMMENT '公關編號',
    `申請日期`       DATE         NOT NULL COMMENT '離職申請日期',
    `預計離職日`     DATE         NOT NULL COMMENT '預計最後工作日',
    `離職原因`       TEXT         DEFAULT NULL COMMENT '離職原因說明',
    `交接事項`       TEXT         DEFAULT NULL COMMENT '交接事項清單',
    `物品歸還`       TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '物品是否已歸還（0=否, 1=是）',
    `核決人`         INT UNSIGNED DEFAULT NULL COMMENT '核決主管',
    `核決日期`       DATE         DEFAULT NULL COMMENT '核決日期',
    `核決結果`       ENUM('待審核','核准','駁回') NOT NULL DEFAULT '待審核' COMMENT '審核結果',
    `備註`           TEXT         DEFAULT NULL COMMENT '備註',
    `建立時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    `更新時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    INDEX `idx_公關編號` (`公關編號`),
    INDEX `idx_核決結果` (`核決結果`),
    INDEX `idx_申請日期` (`申請日期`),
    CONSTRAINT `fk_resignation_hosts` FOREIGN KEY (`公關編號`) REFERENCES `hosts`(`公關編號`) ON DELETE RESTRICT,
    CONSTRAINT `fk_resignation_approver` FOREIGN KEY (`核決人`) REFERENCES `users`(`用戶編號`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='自願離職申請紀錄';


-- ============================================================
-- 17. staff_profile - 人事資料
-- ============================================================
DROP TABLE IF EXISTS `staff_profile`;
CREATE TABLE `staff_profile` (
    `人事編號`       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主鍵',
    `姓名`           VARCHAR(100) NOT NULL COMMENT '姓名',
    `暱稱`           VARCHAR(100) DEFAULT NULL COMMENT '暱稱',
    `性別`           ENUM('男','女','其他') DEFAULT NULL COMMENT '性別',
    `生日`           DATE         DEFAULT NULL COMMENT '出生日期',
    `身分證字号`     VARCHAR(20)  DEFAULT NULL COMMENT '身分證字號',
    `聯絡方式`       VARCHAR(50)  DEFAULT NULL COMMENT '行動電話',
    `電子信箱`       VARCHAR(100) DEFAULT NULL COMMENT 'Email',
    `地址`           VARCHAR(300) DEFAULT NULL COMMENT '現居地址',
    `緊急聯絡人`     VARCHAR(100) DEFAULT NULL COMMENT '緊急聯絡人姓名',
    `緊急聯絡電話`   VARCHAR(30)  DEFAULT NULL COMMENT '緊急聯絡電話',
    `緊急聯絡關係`   VARCHAR(50)  DEFAULT NULL COMMENT '與緊急聯絡人之關係',
    `緊急聯絡備註`   TEXT         DEFAULT NULL COMMENT '緊急聯絡備註',
    `緊急聯絡人2`    VARCHAR(100) DEFAULT NULL COMMENT '第二緊急聯絡人',
    `緊急聯絡電話2`  VARCHAR(30)  DEFAULT NULL COMMENT '第二緊急聯絡電話',
    `緊急聯絡關係2`  VARCHAR(50)  DEFAULT NULL COMMENT '與第二緊急聯絡人之關係',
    `照片`           VARCHAR(500) DEFAULT NULL COMMENT '個人照片路徑',
    `身分證照片`     VARCHAR(500) DEFAULT NULL COMMENT '身分證正反面照片路徑',
    `銀行帳戶`       VARCHAR(50)  DEFAULT NULL COMMENT '銀行帳戶（領薪用）',
    `銀行名稱`       VARCHAR(100) DEFAULT NULL COMMENT '銀行名稱',
    `入職日期`       DATE         DEFAULT NULL COMMENT '入職日期',
    `離職日期`       DATE         DEFAULT NULL COMMENT '離職日期',
    `員工狀態`       ENUM('在職','休假','離職','停業') NOT NULL DEFAULT '在職' COMMENT '員工狀態',
    `備註`           TEXT         DEFAULT NULL COMMENT '備註',
    `建立時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    `更新時間`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    INDEX `idx_姓名` (`姓名`),
    INDEX `idx_身分證字号` (`身分證字号`),
    INDEX `idx_員工狀態` (`員工狀態`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='員工人事基本資料';


-- ============================================================
-- 重啟外鍵檢查
-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;
