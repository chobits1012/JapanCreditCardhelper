# 信用卡回饋管家 (Credit Card Rewards Manager)

這是一個專為台灣信用卡使用者設計的行動版網頁應用程式 (PWA)，幫助用戶快速試算各通路的最優信用卡，並追蹤加碼回饋的進度。

## 主要功能 (Features)

### 1. 快速試算 (Quick Calculator)
- **智能推薦**: 輸入金額與通路，系統自動計算每張卡的回饋金額。
- **即時比價**: 顯示「一般回饋」與「加碼回饋」的詳細結構。
- **儲存交易**: 按下確認鍵，即可將該筆消費存入歷史紀錄，計入累積額度。

### 2. 卡片管理 (My Cards)
- **個人化設定**: 勾選您實際擁有的信用卡，試算時自動過濾未持有的卡片。
- **新增卡片**: 支援手動輸入新辦的信用卡資訊（包含基礎回饋與加碼規則）。

### 3. 回饋進度追蹤 (Progress Tracker)
- **儀表板**: 自動掃描各卡片的「加碼上限」，顯示目前使用進度。
- **警示功能**: 當額度快滿 (>=80%) 或已滿時，進度條變色提醒。
- **歷史紀錄**: 檢視過往儲存的交易，並提供刪除功能以修正額度。

## 技術架構 (Tech Stack)

- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand (with Local Storage persistence)
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 如何執行 (How to Run)

請確保您安裝了 Node.js (v18+)。

1. **安裝依賴**:
   ```bash
   npm install
   ```

2. **啟動開發伺服器**:
   ```bash
   npm run dev
   ```
   
3. **建置生產版本**:
   ```bash
   npm run build
   ```

## 專案結構

- `src/components/domain`: 主要業務邏輯元件 (Calculator, MyCards, Progress)。
- `src/services`: 核心計算邏輯 (calculator.ts)。
- `src/store`: 全域狀態管理 (useStore.ts)。
- `src/data`: 預設信用卡資料 (mockData.ts)。
