import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Settings, Users, Scissors, Plus, Edit, Trash2,
  X, Check, AlertCircle, Loader2, DollarSign, Calendar, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, startOfDay, endOfDay, subDays, isAfter, isBefore, isEqual } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminDashboard = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState(null);
  const [editingProfessional, setEditingProfessional] = useState(null);
  const [showAddService, setShowAddService] = useState(false);
  const [showAddProfessional, setShowAddProfessional] = useState(false);

  // Form states
  const [serviceForm, setServiceForm] = useState({
    descricao: '',
    categoria: '',
    preco: ''
  });
  const [serviceError, setServiceError] = useState('');

  const [professionalForm, setProfessionalForm] = useState({
    nome: '',
    percentual_salao: ''
  });
  
  // Revenue tracking state
  const [revenueData, setRevenueData] = useState([]);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  // Load data
  useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    try {
      const [servicesRes, professionalsRes] = await Promise.all([
        supabase.from('servicos').select('*').order('categoria'),
        supabase.from('profissionais').select('*').order('nome')
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (professionalsRes.error) throw professionalsRes.error;

      setServices(servicesRes.data || []);
      setProfessionals(professionalsRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
    setLoading(false);
  };

    loadData();
  }, []);

  // Revenue calculation
  const calculateRevenue = async () => {
    setRevenueLoading(true);
    try {
      let query = supabase
        .from('agendamentos')
        .select(`
          id,
          data_hora,
          cliente_nome,
          servico,
          valor_cobrado,
          profissional_id,
          profissionais ( nome )
        `)
        .gte('data_hora', startOfDay(parseISO(dateRange.start)).toISOString())
        .lte('data_hora', endOfDay(parseISO(dateRange.end)).toISOString())
        .order('data_hora', { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;

      const filtered = selectedProfessional 
        ? data.filter(item => item.profissional_id === selectedProfessional)
        : data;

      setRevenueData(filtered);
    } catch (error) {
      console.error('Erro ao calcular faturamento:', error);
    }
    setRevenueLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'revenue') {
      calculateRevenue();
    }
  }, [activeTab, selectedProfessional, dateRange]);

  // Service CRUD
  const handleAddService = async () => {
    setServiceError('');
    
    if (!serviceForm.descricao || !serviceForm.categoria || !serviceForm.preco) {
      setServiceError('Preencha todos os campos');
      return;
    }

    const precoValue = parseFloat(serviceForm.preco);
    if (isNaN(precoValue) || precoValue <= 0) {
      setServiceError('Preço inválido');
      return;
    }

    try {
      const { error } = await supabase
        .from('servicos')
        .insert([{
          descricao: serviceForm.descricao,
          categoria: serviceForm.categoria,
          preco: precoValue
        }]);

      if (error) {
        console.error('Erro ao adicionar serviço:', error);
        setServiceError(error.message);
        return;
      }

      setServiceForm({ descricao: '', categoria: '', preco: '' });
      setShowAddService(false);
      loadData();
    } catch (error) {
      console.error('Erro ao adicionar serviço:', error);
      setServiceError('Erro ao adicionar serviço');
    }
  };

  const handleEditService = async () => {
    setServiceError('');
    
    if (!editingService || !serviceForm.descricao || !serviceForm.categoria || !serviceForm.preco) {
      setServiceError('Preencha todos os campos');
      return;
    }

    const precoValue = parseFloat(serviceForm.preco);
    if (isNaN(precoValue) || precoValue <= 0) {
      setServiceError('Preço inválido');
      return;
    }

    try {
      const { error } = await supabase
        .from('servicos')
        .update({
          descricao: serviceForm.descricao,
          categoria: serviceForm.categoria,
          preco: precoValue
        })
        .eq('id', editingService.id);

      if (error) {
        console.error('Erro ao editar serviço:', error);
        setServiceError(error.message);
        return;
      }

      setEditingService(null);
      setServiceForm({ descricao: '', categoria: '', preco: '' });
      setShowAddService(false);
      loadData();
    } catch (error) {
      console.error('Erro ao editar serviço:', error);
      setServiceError('Erro ao editar serviço');
    }
  };

  const handleDeleteService = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

    try {
      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
    }
  };

  // Professional CRUD
  const handleAddProfessional = async () => {
    if (!professionalForm.nome) return;

    const percentual = professionalForm.percentual_salao !== '' ? parseFloat(professionalForm.percentual_salao) : null;

    try {
      const { error } = await supabase
        .from('profissionais')
        .insert([{
          nome: professionalForm.nome,
          percentual_salao: percentual
        }]);

      if (error) throw error;

      setProfessionalForm({ nome: '', percentual_salao: '' });
      setShowAddProfessional(false);
      loadData();
    } catch (error) {
      console.error('Erro ao adicionar profissional:', error);
    }
  };

  const handleEditProfessional = async () => {
    if (!editingProfessional || !professionalForm.nome) return;

    const percentual = professionalForm.percentual_salao !== '' ? parseFloat(professionalForm.percentual_salao) : null;

    try {
      const { error } = await supabase
        .from('profissionais')
        .update({
          nome: professionalForm.nome,
          percentual_salao: percentual
        })
        .eq('id', editingProfessional.id);

      if (error) throw error;

      setEditingProfessional(null);
      setProfessionalForm({ nome: '', percentual_salao: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao editar profissional:', error);
    }
  };

  const handleDeleteProfessional = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este profissional?')) return;

    try {
      const { error } = await supabase
        .from('profissionais')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Erro ao excluir profissional:', error);
    }
  };

  const startEditService = (service) => {
    setServiceError('');
    setEditingService(service);
    setServiceForm({
      descricao: service.descricao,
      categoria: service.categoria,
      preco: service.preco.toString()
    });
  };

  const startEditProfessional = (professional) => {
    setEditingProfessional(professional);
    setProfessionalForm({
      nome: professional.nome,
      percentual_salao: professional.percentual_salao != null ? professional.percentual_salao.toString() : ''
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8">
          <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin text-lavender-600" />
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[3rem] w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-4xl max-h-[90vh] md:max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-lavender-600 flex-shrink-0" />
              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 font-display">Dashboard Administrativo</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto">
            <button
              onClick={() => setActiveTab('services')}
              className={`flex-1 py-3 sm:py-4 px-2 sm:px-6 text-center font-bold transition-colors min-w-0 ${
                activeTab === 'services' ? 'text-lavender-600 border-b-2 border-lavender-600' : 'text-gray-400'
              }`}
            >
              <Scissors className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 flex-shrink-0" />
              <span className="text-[9px] sm:text-[10px] md:text-xs hidden sm:block">Serviços</span>
            </button>
            <button
              onClick={() => setActiveTab('professionals')}
              className={`flex-1 py-3 sm:py-4 px-2 sm:px-6 text-center font-bold transition-colors min-w-0 ${
                activeTab === 'professionals' ? 'text-lavender-600 border-b-2 border-lavender-600' : 'text-gray-400'
              }`}
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 flex-shrink-0" />
              <span className="text-[9px] sm:text-[10px] md:text-xs hidden sm:block">Profissionais</span>
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              className={`flex-1 py-3 sm:py-4 px-2 sm:px-6 text-center font-bold transition-colors min-w-0 ${
                activeTab === 'revenue' ? 'text-lavender-600 border-b-2 border-lavender-600' : 'text-gray-400'
              }`}
            >
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 flex-shrink-0" />
              <span className="text-[9px] sm:text-[10px] md:text-xs hidden sm:block">Faturamento</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 max-h-[60vh] md:max-h-[65vh] overflow-y-auto">
            {activeTab === 'services' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 font-display">Gerenciar Serviços</h3>
                  <button
                    onClick={() => { setServiceError(''); setShowAddService(true); }}
                    className="flex items-center justify-center gap-2 bg-lavender-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-2xl font-bold hover:bg-lavender-700 transition-colors w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Adicionar</span>
                  </button>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {services.map((service) => (
                    <div key={service.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-2xl gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{service.descricao}</p>
                        <p className="text-xs sm:text-sm text-gray-500">{service.categoria} • R$ {service.preco.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => startEditService(service)}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center transition-colors flex-shrink-0"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'professionals' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 font-display">Gerenciar Profissionais</h3>
                  <button
                    onClick={() => setShowAddProfessional(true)}
                    className="flex items-center justify-center gap-2 bg-lavender-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-2xl font-bold hover:bg-lavender-700 transition-colors w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Adicionar</span>
                  </button>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {professionals.map((professional) => (
                    <div key={professional.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-2xl gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{professional.nome}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {professional.percentual_salao != null && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-lavender-700 bg-lavender-100 px-2 py-0.5 rounded-full">
                              Salão: {professional.percentual_salao}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => startEditProfessional(professional)}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center transition-colors flex-shrink-0"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProfessional(professional.id)}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revenue Tab */}
            {activeTab === 'revenue' && (
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-lg sm:text-xl font-black text-gray-900 font-display">Faturamento por Profissional</h3>
                
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-[9px] sm:text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Data Inicial</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-2xl focus:ring-2 focus:ring-lavender-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] sm:text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Data Final</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-2xl focus:ring-2 focus:ring-lavender-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] sm:text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Profissional</label>
                    <select
                      value={selectedProfessional || ''}
                      onChange={(e) => setSelectedProfessional(e.target.value || null)}
                      className="w-full p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-2xl focus:ring-2 focus:ring-lavender-500 outline-none text-sm bg-white"
                    >
                      <option value="">Todas</option>
                      {professionals.map((p) => (
                        <option key={p.id} value={p.id}>{p.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-gradient-to-br from-lavender-500 to-lavender-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-80">Total Faturado</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black">
                      {revenueLoading ? '...' : `R$ ${revenueData.reduce((sum, a) => sum + (Number(a.valor_cobrado) || 0), 0).toFixed(2).replace('.', ',')}`}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-lavender-600" />
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400">Total de Agendamentos</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-gray-900">
                      {revenueLoading ? '...' : revenueData.length}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400">Média por Agendamento</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-gray-900">
                      {revenueLoading ? '...' : `R$ ${revenueData.length > 0 ? (revenueData.reduce((sum, a) => sum + (Number(a.valor_cobrado) || 0), 0) / revenueData.length).toFixed(2).replace('.', ',') : '0,00'}`}
                    </p>
                  </div>
                </div>

                {/* Revenue by Professional */}
                <div className="space-y-3">
                  <h4 className="text-sm sm:text-base font-bold text-gray-900">Faturamento por Profissional</h4>
                  {revenueLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-lavender-600" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {professionals
                        .map(p => ({
                          ...p,
                          total: revenueData
                            .filter(a => a.profissional_id === p.id)
                            .reduce((sum, a) => sum + (Number(a.valor_cobrado) || 0), 0),
                          count: revenueData.filter(a => a.profissional_id === p.id).length
                        }))
                        .filter(p => selectedProfessional ? p.id === selectedProfessional : p.count > 0)
                        .sort((a, b) => b.total - a.total)
                        .map(p => {
                          const percentual = p.percentual_salao != null ? p.percentual_salao : 0;
                          const desconto = p.total * (percentual / 100);
                          const aPagar = p.total - desconto;
                          return (
                            <div key={p.id} className="p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-2xl space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-lavender-100 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-lavender-600" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900 text-sm">{p.nome}</p>
                                    <p className="text-xs text-gray-500">{p.count} agendamento{p.count !== 1 ? 's' : ''}</p>
                                  </div>
                                </div>
                                <p className="font-black text-lavender-600 text-sm sm:text-base">
                                  R$ {p.total.toFixed(2).replace('.', ',')}
                                </p>
                              </div>
                              {percentual > 0 && (
                                <div className="ml-13 pl-1 border-l-2 border-lavender-200 ml-[52px] space-y-1 text-xs">
                                  <div className="flex justify-between text-gray-500">
                                    <span>Percentual do salão ({percentual}%)</span>
                                    <span className="text-red-500 font-bold">- R$ {desconto.toFixed(2).replace('.', ',')}</span>
                                  </div>
                                  <div className="flex justify-between font-black text-green-700">
                                    <span>Total a pagar ao profissional</span>
                                    <span>R$ {aPagar.toFixed(2).replace('.', ',')}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      {revenueData.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <p className="text-sm">Nenhum agendamento no período selecionado</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Appointments List */}
                <div className="space-y-3">
                  <h4 className="text-sm sm:text-base font-bold text-gray-900">Detalhes dos Agendamentos</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {revenueData.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg sm:rounded-xl">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 text-sm truncate">{appointment.cliente_nome}</p>
                          <p className="text-xs text-gray-500">{appointment.servico} • {appointment.profissionais?.nome || '—'}</p>
                          <p className="text-[10px] text-gray-400">
                            {appointment.data_hora ? format(parseISO(appointment.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'}
                          </p>
                        </div>
                        <p className="font-black text-lavender-600 text-sm flex-shrink-0 ml-2">
                          R$ {Number(appointment.valor_cobrado || 0).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Add/Edit Service Modal */}
          <AnimatePresence>
            {(showAddService || editingService) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-lg sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md mx-4"
                >
                  <h3 className="text-lg sm:text-xl font-black mb-4 sm:mb-6 font-display">{editingService ? 'Editar Serviço' : 'Adicionar Serviço'}</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <input
                      type="text"
                      placeholder="Descrição"
                      value={serviceForm.descricao}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, descricao: e.target.value }))}
                      className="w-full p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-2xl focus:ring-2 focus:ring-lavender-500 outline-none text-sm sm:text-base"
                    />
                    <input
                      type="text"
                      placeholder="Categoria"
                      value={serviceForm.categoria}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, categoria: e.target.value }))}
                      className="w-full p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-2xl focus:ring-2 focus:ring-lavender-500 outline-none text-sm sm:text-base"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Preço"
                      value={serviceForm.preco}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, preco: e.target.value }))}
                      className="w-full p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-2xl focus:ring-2 focus:ring-lavender-500 outline-none text-sm sm:text-base"
                    />
                    {serviceError && (
                      <p className="text-red-500 text-sm">{serviceError}</p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6">
                    <button
                      onClick={() => {
                        setServiceError('');
                        setShowAddService(false);
                        setEditingService(null);
                        setServiceForm({ descricao: '', categoria: '', preco: '' });
                      }}
                      className="flex-1 py-3 sm:py-4 bg-gray-100 text-gray-600 rounded-lg sm:rounded-2xl font-bold hover:bg-gray-200 transition-colors text-sm sm:text-base"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={editingService ? handleEditService : handleAddService}
                      className="flex-1 py-3 sm:py-4 bg-lavender-600 text-white rounded-lg sm:rounded-2xl font-bold hover:bg-lavender-700 transition-colors text-sm sm:text-base"
                    >
                      {editingService ? 'Salvar' : 'Adicionar'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add/Edit Professional Modal */}
          <AnimatePresence>
            {(showAddProfessional || editingProfessional) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-lg sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md mx-4"
                >
                  <h3 className="text-lg sm:text-xl font-black mb-4 sm:mb-6 font-display">{editingProfessional ? 'Editar Profissional' : 'Adicionar Profissional'}</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <input
                      type="text"
                      placeholder="Nome"
                      value={professionalForm.nome}
                      onChange={(e) => setProfessionalForm(prev => ({ ...prev, nome: e.target.value }))}
                      className="w-full p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-2xl focus:ring-2 focus:ring-lavender-500 outline-none text-sm sm:text-base"
                    />
                    <div>
                      <label className="block text-[9px] sm:text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Percentual do Salão (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="Ex: 25"
                        value={professionalForm.percentual_salao}
                        onChange={(e) => setProfessionalForm(prev => ({ ...prev, percentual_salao: e.target.value }))}
                        className="w-full p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-2xl focus:ring-2 focus:ring-lavender-500 outline-none text-sm sm:text-base"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Percentual descontado do total arrecadado pelo profissional</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6">
                    <button
                      onClick={() => {
                        setShowAddProfessional(false);
                        setEditingProfessional(null);
                        setProfessionalForm({ nome: '', percentual_salao: '' });
                      }}
                      className="flex-1 py-3 sm:py-4 bg-gray-100 text-gray-600 rounded-lg sm:rounded-2xl font-bold hover:bg-gray-200 transition-colors text-sm sm:text-base"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={editingProfessional ? handleEditProfessional : handleAddProfessional}
                      className="flex-1 py-3 sm:py-4 bg-lavender-600 text-white rounded-lg sm:rounded-2xl font-bold hover:bg-lavender-700 transition-colors text-sm sm:text-base"
                    >
                      {editingProfessional ? 'Salvar' : 'Adicionar'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdminDashboard;