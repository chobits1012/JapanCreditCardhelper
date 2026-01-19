import { useState } from 'react';
import Layout from './components/layout/Layout';
import QuickCalculator from './components/domain/QuickCalculator';
import MyCardsPage from './components/domain/MyCardsPage';
import ProgressPage from './components/domain/ProgressPage';

function App() {
  const [currentTab, setCurrentTab] = useState<'calculator' | 'cards' | 'progress'>('calculator');

  return (
    <Layout currentTab={currentTab} onTabChange={setCurrentTab}>
      {currentTab === 'calculator' && <QuickCalculator />}
      {currentTab === 'cards' && <MyCardsPage />}
      {currentTab === 'progress' && <ProgressPage />}
    </Layout>
  )
}

export default App
