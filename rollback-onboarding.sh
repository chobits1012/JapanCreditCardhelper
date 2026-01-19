#!/bin/bash
# Onboarding Feature Rollback Script
# 使用方式: bash rollback-onboarding.sh

echo "🔄 開始回滾 Onboarding 功能..."

# 1. 還原備份的檔案
if [ -f "src/App.tsx.backup-onboarding" ]; then
    echo "✓ 還原 App.tsx"
    mv src/App.tsx.backup-onboarding src/App.tsx
else
    echo "⚠️  警告: 找不到 App.tsx 的備份檔案"
fi

if [ -f "src/store/useStore.ts.backup-onboarding" ]; then
    echo "✓ 還原 useStore.ts"
    mv src/store/useStore.ts.backup-onboarding src/store/useStore.ts
else
    echo "⚠️  警告: 找不到 useStore.ts 的備份檔案"
fi

# 2. 刪除新增的組件
if [ -f "src/components/domain/OnboardingFlow.tsx" ]; then
    echo "✓ 刪除 OnboardingFlow.tsx"
    rm src/components/domain/OnboardingFlow.tsx
else
    echo "⚠️  OnboardingFlow.tsx 已不存在"
fi

# 3. 重新編譯確認
echo ""
echo "🔨 重新編譯專案..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 回滾完成！專案已恢復至上一個穩定版本。"
    echo ""
    echo "📝 下一步："
    echo "   1. 清除瀏覽器 LocalStorage (開啟 DevTools > Application > LocalStorage > 清除)"
    echo "   2. 重新載入應用程式測試"
else
    echo ""
    echo "❌ 編譯失敗！請檢查錯誤訊息。"
    exit 1
fi
