import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import { ClassroomProvider } from '@/lib/classroomContext.jsx';

import Home from '@/pages/Home';
import ClassDashboard from '@/pages/ClassDashboard';
import Ranking from '@/pages/Ranking';
import Admin from '@/pages/Admin';
import NewsDetail from '@/pages/NewsDetail';

const AuthenticatedApp = () => {
  return (
    <ClassroomProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/turma" element={<ClassDashboard />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/noticias/:id" element={<NewsDetail />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </ClassroomProvider>
  );
};


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
