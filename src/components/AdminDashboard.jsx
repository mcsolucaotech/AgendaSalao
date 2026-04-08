import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Settings, Users, Scissors, Plus, Edit, Trash2,
  X, Check, AlertCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    foto_url: ''
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

    try {
      const { error } = await supabase
        .from('profissionais')
        .insert([{
          nome: professionalForm.nome,
          foto_url: professionalForm.foto_url || null
        }]);

      if (error) throw error;

      setProfessionalForm({ nome: '', foto_url: '' });
      setShowAddProfessional(false);
      loadData();
    } catch (error) {
      console.error('Erro ao adicionar profissional:', error);
    }
  };

  const handleEditProfessional = async () => {
    if (!editingProfessional || !professionalForm.nome) return;

    try {
      const { error } = await supabase
        .from('profissionais')
        .update({
          nome: professionalForm.nome,
          foto_url: professionalForm.foto_url || null
        })
        .eq('id', editingProfessional.id);

      if (error) throw error;

      setEditingProfessional(null);
      setProfessionalForm({ nome: '', foto_url: '' });
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
      foto_url: professional.foto_url || ''
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
                        {professional.foto_url && (
                          <p className="text-xs sm:text-sm text-gray-500 truncate">Foto: {professional.foto_url}</p>
                        )}
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
                    <input
                      type="url"
                      placeholder="URL da Foto (opcional)"
                      value={professionalForm.foto_url}
                      onChange={(e) => setProfessionalForm(prev => ({ ...prev, foto_url: e.target.value }))}
                      className="w-full p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-2xl focus:ring-2 focus:ring-lavender-500 outline-none text-sm sm:text-base"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6">
                    <button
                      onClick={() => {
                        setShowAddProfessional(false);
                        setEditingProfessional(null);
                        setProfessionalForm({ nome: '', foto_url: '' });
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