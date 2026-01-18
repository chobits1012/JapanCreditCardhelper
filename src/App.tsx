import { useState } from 'react';
import { useStore } from './store/useStore';
import Layout from './components/layout/Layout';
import QuickCalculator from './components/domain/QuickCalculator';
import MyCardsPage from './components/domain/MyCardsPage';
import ProgressPage from './components/domain/ProgressPage';
import OnboardingFlow from './components/domain/OnboardingFlow';

function App() {
  const [currentTab, setCurrentTab] = useState<'calculator' | 'cards' | 'progress'>('calculator');
  const hasCompletedOnboarding = useStore(state => state.hasCompletedOnboarding);

  // Show onboarding flow for first-time users
  if (!hasCompletedOnboarding) {
    return <OnboardingFlow />;
  }

  return (
    <Layout currentTab={currentTab} onTabChange={setCurrentTab}>
      {currentTab === 'calculator' && <QuickCalculator />}
      {currentTab === 'cards' && <MyCardsPage />}
      {currentTab === 'progress' && <ProgressPage />}
    </Layout>
  )
}

export default App

