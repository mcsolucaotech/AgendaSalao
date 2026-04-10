import React, { Suspense, lazy, useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import CalendarView from './components/CalendarView';
import TimeSlotList from './components/TimeSlotList';
import {
  Users, LogOut, Sparkles,
  AlertCircle, Calendar as CalendarIcon,
  ClipboardList, Loader2, Settings
} from 'lucide-react';
import Login from './components/Login';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import AppLogo from './components/AppLogo';
import ThemeSwitcher from './components/ThemeSwitcher';

const BookingForm = lazy(() => import('./components/BookingForm'));
const ComboForm = lazy(() => import('./components/ComboForm'));
const AppointmentsManager = lazy(() => import('./components/AppointmentsManager'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

// ---------------------------------------------------------------------------
// ErrorBoundary — captura erros inesperados sem quebrar toda a aplicação
// ---------------------------------------------------------------------------
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-900">
          <AlertCircle className="w-16 h-16 mb-4" />
          <h1 className="text-2xl font-black mb-2 font-display">Ops! Ocorreu um erro.</h1>
          <p className="opacity-70 text-sm max-w-md text-center">Algo inesperado aconteceu. Recarregue a página e tente novamente.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 px-8 py-4 bg-red-600 text-white rounded-2xl font-bold"
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// MainApp — núcleo da aplicação, exibido após autenticação
// ---------------------------------------------------------------------------
const MainApp = ({ onLogout }) => {
  const [view, setView] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [professionals, setProfessionals] = useState([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showComboForm, setShowComboForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [editingCombo, setEditingCombo] = useState(null); // array de agendamentos do combo
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchProfessionals = async () => {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAdmin(user.user_metadata?.role === 'admin');
        const nome = user.user_metadata?.nome || user.email?.split('@')[0] || '';
        setUserName(nome.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '));
      }

      const { data, error: err } = await supabase
        .from('profissionais')
        .select('id, nome')
        .order('nome');

      if (err) {
        setError('Não foi possível carregar os profissionais. Verifique a conexão com o banco.');
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setError('Nenhum profissional cadastrado. Execute o script SQL no Supabase para popular o banco.');
        setLoading(false);
        return;
      }

      setProfessionals(data);
      setLoading(false);
    };

    fetchProfessionals();
  }, []);

  const handleEdit = async (appointment) => {
    if (appointment.combo_id) {
      // Busca todos os agendamentos do combo
      const { data } = await supabase
        .from('agendamentos')
        .select('*, profissionais(nome)')
        .eq('combo_id', appointment.combo_id)
        .order('data_hora', { ascending: true });
      setEditingCombo(data || []);
      setShowComboForm(true);
    } else {
      setEditingAppointment(appointment);
      setShowBookingForm(true);
    }
  };

  const handleSave = () => {
    setShowBookingForm(false);
    setEditingAppointment(null);
    setSelectedDate(d => new Date(d));
  };

  const handleComboSave = () => {
    setShowComboForm(false);
    setEditingCombo(null);
    setSelectedDate(d => new Date(d));
  };

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FBFBFF]">
        <Motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
        >
          <Sparkles className="w-12 h-12 text-lavender-600" />
        </Motion.div>
        <div className="mt-6 text-gray-400 font-display font-black uppercase tracking-[0.3em] text-[10px]">
          Carregando Dados...
        </div>
      </div>
    );
  }

  // ---- Error state ----
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FBFBFF] p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-black text-gray-900 font-display mb-2">Erro de Conexão</h2>
        <p className="text-gray-500 max-w-sm mb-8">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-lavender-600 transition-all"
        >
          Tentar Novamente
        </button>
        <button
          onClick={onLogout}
          className="mt-4 text-sm text-gray-400 underline"
        >
          Sair
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFF] p-4 pb-32 max-w-xl mx-auto selection:bg-lavender-200">
      {/* Header */}
      <header className="py-8 mb-4">
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-lavender-400" />
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Premium Management</div>
            </div>
            <h1 className="leading-none">
              <AppLogo className="text-4xl" />
            </h1>
            {userName && (
              <p className="text-xs text-gray-400 font-bold mt-1">
                Olá, <span className="text-lavender-600">{userName}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            {isAdmin && (
              <button
                onClick={() => setShowAdminDashboard(true)}
                className="w-12 h-12 glass flex items-center justify-center text-gray-400 hover:text-lavender-600 rounded-2xl transition-all active:scale-90"
                title="Dashboard Administrativo"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onLogout}
              className="w-12 h-12 glass flex items-center justify-center text-gray-400 hover:text-red-500 rounded-2xl transition-all active:scale-90"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Seletor de profissional — só visível na aba calendário */}
        {view === 'calendar' && (
          <Motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass px-4 py-3 rounded-[2rem] border-lavender-100"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mr-1">
                <Users className="w-3 h-3 inline mr-1 mb-0.5" />
                Filtrar
              </span>

              {/* Todos */}
              <button
                onClick={() => setSelectedProfessionalId(null)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border transition-all text-xs font-bold ${
                  selectedProfessionalId === null
                    ? 'border-lavender-500 bg-lavender-600 text-white shadow-md shadow-lavender-200'
                    : 'border-gray-100 bg-white text-gray-500 hover:border-lavender-200'
                }`}
              >
                <Users className="w-3 h-3 flex-shrink-0" />
                Todos
              </button>

              {professionals.map((p) => {
                const initials = p.nome.split(' ').slice(0, 2).map((part) => part[0]).join('');
                const isSelected = selectedProfessionalId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProfessionalId(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border transition-all text-xs font-bold ${
                      isSelected
                        ? 'border-lavender-500 bg-lavender-600 text-white shadow-md shadow-lavender-200'
                        : 'border-gray-100 bg-white text-gray-500 hover:border-lavender-200'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 ${isSelected ? 'bg-white/20' : 'bg-gray-100'}`}>
                      {initials}
                    </span>
                    {p.nome.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </Motion.div>
        )}
      </header>

      {/* Main content */}
      <main>
        <AnimatePresence mode="wait">
          {view === 'calendar' ? (
            <Motion.div
              key="calendar-view"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="space-y-10"
            >
              <CalendarView
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                professionalId={selectedProfessionalId}
              />
              <TimeSlotList
                selectedDate={selectedDate}
                professionalId={selectedProfessionalId}
                onAddBooking={() => {
                  setEditingAppointment(null);
                  setShowBookingForm(true);
                }}
                onAddCombo={() => setShowComboForm(true)}
                onEdit={handleEdit}
              />
            </Motion.div>
          ) : (
            <Suspense fallback={<div className="py-16 text-center text-gray-400 font-bold text-sm">Carregando agenda...</div>}>
              <Motion.div
                key="manager-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <AppointmentsManager onEdit={handleEdit} />
              </Motion.div>
            </Suspense>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass rounded-[2.5rem] p-2 flex items-center justify-between border-lavender-100 shadow-2xl z-50">
        <button
          onClick={() => setView('calendar')}
          className={`flex-1 flex flex-col items-center py-3 rounded-[2rem] transition-all gap-1 ${view === 'calendar' ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-400 hover:text-lavender-600'}`}
        >
          <CalendarIcon className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Início</span>
        </button>
        <button
          onClick={() => setView('manager')}
          className={`flex-1 flex flex-col items-center py-3 rounded-[2rem] transition-all gap-1 ${view === 'manager' ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-400 hover:text-lavender-600'}`}
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Agenda</span>
        </button>
      </nav>

      {/* Combo Form Modal */}
      <AnimatePresence>
        {showComboForm && (
          <Suspense fallback={<div className="fixed inset-0 z-[100] bg-gray-900/40" />}>
            <ComboForm
              selectedDate={selectedDate}
              initialData={editingCombo}
              onClose={() => { setShowComboForm(false); setEditingCombo(null); }}
              onSave={handleComboSave}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Booking Form Modal */}
      <AnimatePresence>
        {showBookingForm && (
          <Suspense fallback={<div className="fixed inset-0 z-[100] bg-gray-900/40" />}>
            <BookingForm
              selectedDate={selectedDate}
              professionalId={selectedProfessionalId}
              initialData={editingAppointment}
              onClose={() => { setShowBookingForm(false); setEditingAppointment(null); }}
              onSave={handleSave}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Admin Dashboard Modal */}
      <AnimatePresence>
        {showAdminDashboard && (
          <Suspense fallback={<div className="fixed inset-0 z-[100] bg-gray-900/40" />}>
            <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---------------------------------------------------------------------------
// App — gerencia autenticação via Supabase Auth
// ---------------------------------------------------------------------------
const App = () => {
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // onAuthStateChange dispara INITIAL_SESSION automaticamente no setup
    // Isso substitui o getSession() e evita race conditions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setInitializing(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FBFBFF]">
        <Motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
          <Loader2 className="w-10 h-10 text-lavender-400" />
        </Motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {!session ? (
        <Login />
      ) : (
        <MainApp onLogout={handleLogout} />
      )}
    </ErrorBoundary>
  );
};

export default App;
