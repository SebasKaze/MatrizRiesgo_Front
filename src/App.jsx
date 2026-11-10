import { useState } from 'react';
import { AuthProvider } from './context/AuthProvider';
import { RiskProvider } from './context/RiskProvider';
import { useAuth } from './hooks/useAuth';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { Dashboard } from './pages/Dashboard';
import { LoginPage } from './pages/LoginPage';
import { DatabaseStatusPage } from './pages/DatabaseStatusPage';
import { RiesgosVisualizacion } from './pages/RiesgosVisualizacion';
import { MatrizVisualizacion } from './pages/MatrizVisualizacion';
import { Matrices } from './pages/Matrices';
import { CrearUsuario } from './pages/CrearUsuario';

function MainApp() {
  const { isAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('matrices');
  const [selectedMatriz, setSelectedMatriz] = useState(null);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />
      <Navbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'database' ? (
          <DatabaseStatusPage />
        ) : activeTab === 'visualizacion' ? (
          <RiesgosVisualizacion />
        ) : activeTab === 'crearUsuario' ? (
          <CrearUsuario />
        ) : activeTab === 'matrices' ? (
          <Matrices
            onCreateMatriz={() => {
              setSelectedMatriz(null);
              setActiveTab('matrizVisualizacion');
            }}
            onEditMatriz={(matriz) => {
              setSelectedMatriz(matriz);
              setActiveTab('matrizVisualizacion');
            }}
          />
        ) : activeTab === 'matrizVisualizacion' ? (
          <MatrizVisualizacion
            selectedMatriz={selectedMatriz}
            onBack={() => setActiveTab('matrices')}
          />
        ) : (
          <Dashboard
            viewMode={activeTab}
            onNavigate={setActiveTab}
            onEditMatriz={(matriz) => {
              setSelectedMatriz(matriz);
              setActiveTab('matrizVisualizacion');
            }}
            onCreateMatriz={() => {
              setSelectedMatriz(null);
              setActiveTab('matrizVisualizacion');
            }}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <RiskProvider>
        <MainApp />
      </RiskProvider>
    </AuthProvider>
  );
}

export default App;
