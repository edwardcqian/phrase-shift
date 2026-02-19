import { useState } from 'react';
import Layout, { type Tab } from './components/Layout';
import Translate from './pages/Translate';
import Review from './pages/Review';
import Config from './pages/Config';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('translate');

  const renderPage = () => {
    switch (activeTab) {
      case 'translate': return <Translate />;
      case 'review': return <Review />;
      case 'config': return <Config />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderPage()}
    </Layout>
  );
}

export default App;
