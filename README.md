# ACOfusion 10mm Smart Configurator - Technical Requirement Document (TRD)

## 1. 核心數據源 (Strict Data Sources)

**警告：禁止使用任何非下列來源之產品資訊。**

* **Google Sheet ID:** `1CP0xxEZGIOr7Se-aGzkgrDli774U1FkXNhs7GeYiqx0`
  * **分頁 [Luminaires]:** `S10_Magnetic_lamp` (擷取 Model, Price, Power, SpecsData, Photo)
  * **分頁 [Tracks & Parts]:** `S10_Track&accessory` (擷取軌道與所有接頭、電源配件)
* **圖片資料夾:** `1ZneJLRk2h8Mhg4-pRhplx5rqg_jFNqgS`
  * API 格式: `https://drive.google.com/thumbnail?id=[ID]&sz=w1000`

## 2. 產品配置邏輯 (ACO 10mm System Logic)

系統需模擬專家思維，將型錄中的安裝規範轉換為自動化規則：

### 第一階段：安裝基礎 (Mounting Selection)

* **Surface (明裝) / Pendant (吊裝):** 鎖定 `G-TL-A` 系列軌道。
* **Trimless (批灰/無邊框):** 鎖定 `G-TL-D` 系列軌道。
* **Recessed (嵌入式):** 鎖定 `G-TL-B` 或 `G-TL-C` 系列軌道。

### 第二階段：拓樸佈局 (Topology Logic)

* **直線 (Straight):** 無轉角配件。
* **L-Shape:** 需自動配對 1 組物理轉角與 1 組導電模組。
* **T-Shape / Rectangle:** 需強制啟動 **Polarity Changer (極性轉換器)** 邏輯，防止相序短路（依據 ERCO 規劃準則）。

### 第三階段：電力運算 (Electrical Load Balancing)

* **數據抓取:** 必須讀取 `S10_Magnetic_lamp` 的 **F 欄位 (Power)**。
* **計算公式:** `Total Load = Sum(Lights Power)`.
* **安全餘裕:** `Driver Capacity Required = Total Load + Max_Single_Light_Wattage`.
* **自動配電:** 根據總瓦數自動從 `S10_Track&accessory` 挑選合適的 48V Power Supply (如 100W 或 200W)。

## 3. 自動化 BOM 生成矩陣 (Auto-Generation Matrix)

當使用者完成「場景描述」，系統需自動完成下列零件清單：

1. **Profiles:** `Total Metres / 2` (向上取整) 支 2M 軌道。
2. **Mains Feed:** 自動加入 1 個 `Live End / Power Feed Connector` (-ZJDY)。
3. **Mechanical Connectors:** `軌道數量 - 1 - 轉角數量` = 所需直線拼接件數量。
4. **End Caps:** 固定加入 2 個 `End Plate / Cap` (-SM)。
5. **Mounting Hardware:** * 若為 `Surface`: 自動按長度配比加入 `Fixing Clips` (-MZKK)。
    * 若為 `Pendant`: 自動按長度與轉角點加入 `Suspension Kits`。

## 4. UI/UX 規範 (UK English Only)

* **介面語言:** 嚴格使用英式英文 (e.g., *Metres*, *Luminaires*, *Synchronising* )。
* **響應式佈局:** 電腦端需呈現「左側配置、右側即時 BOM」之雙欄佈局；手機端為單欄引導。
* **資訊透明:** 燈具卡片必須包含規格按鈕 (ⓘ)，點擊顯示 `SpecsData` 中的 Size, CRI, Voltage 等資訊。

## 5. 輸出安全 (Poka-yoke)

* **禁止空單:** 未加入燈具時禁止導出。
* **超載阻斷:** 若總瓦數超過現有可用驅動器上限，需顯示紅色警告並阻止下一步。
* **PDF 規格:** 導出之 PDF 需包含品牌 Logo、產品縮圖、分類小計、以及有效期聲明。
