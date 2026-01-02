export interface CardTheme {
    id: string;
    name: string;
    class: string;
    previewColor: string; // CSS color for the selection circle
}

export const CARD_THEMES: CardTheme[] = [
    {
        id: 'midnight_navy',
        name: '午夜深藍',
        class: 'bg-gradient-to-br from-slate-700 to-blue-900 shadow-sm shadow-blue-900/20',
        previewColor: '#1e3a8a'
    },
    {
        id: 'burgundy_wine',
        name: '勃根地酒紅',
        class: 'bg-gradient-to-br from-[#4a0404] to-[#721121] shadow-sm shadow-red-900/20',
        previewColor: '#721121'
    },
    {
        id: 'emerald_forest',
        name: '森林墨綠',
        class: 'bg-gradient-to-br from-[#064e3b] to-[#115e59] shadow-sm shadow-emerald-900/20',
        previewColor: '#064e3b'
    },
    {
        id: 'graphite_grey',
        name: '石墨灰',
        class: 'bg-gradient-to-br from-[#1f2937] to-[#374151] shadow-sm shadow-gray-900/20',
        previewColor: '#374151'
    },
    {
        id: 'crimson_red',
        name: '深緋紅',
        class: 'bg-gradient-to-br from-[#7f1d1d] to-[#9a3412] shadow-sm shadow-orange-900/20',
        previewColor: '#7f1d1d'
    },
    {
        id: 'royal_purple',
        name: '皇家紫',
        class: 'bg-gradient-to-br from-[#312e81] to-[#4c1d95] shadow-sm shadow-indigo-900/20',
        previewColor: '#4c1d95'
    },
    {
        id: 'matte_black',
        name: '極致黑',
        class: 'bg-gradient-to-br from-[#18181b] to-[#27272a] shadow-sm shadow-black/20',
        previewColor: '#18181b'
    },
    {
        id: 'slate_blue',
        name: '板岩藍',
        class: 'bg-gradient-to-br from-slate-600 to-slate-800 shadow-sm shadow-slate-900/20',
        previewColor: '#475569'
    }
];

// Fallback logic moved here for reusability if needed, 
// but primary logic will be in component to check card.colorTheme first.
export const getThemeByKeyword = (bank: string, name: string): string => {
    const text = (bank + name).toLowerCase();

    if (text.includes('富邦') || text.includes('fubon')) return 'midnight_navy';
    if (text.includes('聯邦') || text.includes('吉鶴')) return 'burgundy_wine';
    if (text.includes('玉山') || text.includes('熊本')) return 'emerald_forest';
    if (text.includes('國泰') || text.includes('cube')) return 'graphite_grey';
    if (text.includes('街口') || text.includes('jko')) return 'crimson_red';
    if (text.includes('全支付')) return 'royal_purple';

    return 'matte_black';
};
