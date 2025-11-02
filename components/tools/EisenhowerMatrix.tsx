'use client'

import React, { useState, useRef } from 'react';
import { Clock, Zap, Calendar, Trash2, Plus, Edit2, Save, X, Download, CheckCircle2, Circle, Grid3x3, List, AlertCircle, Upload, FileJson, FileSpreadsheet } from 'lucide-react';
import { type Locale } from '@/lib/i18n/config';

interface EisenhowerMatrixProps {
  lang: Locale;
  dict: any;
}

const EisenhowerMatrix = ({ lang = 'en', dict = {} }: EisenhowerMatrixProps) => {
  const [tasks, setTasks] = useState({
    doFirst: [],
    schedule: [],
    delegate: [],
    eliminate: []
  });
  const [newTask, setNewTask] = useState({
    doFirst: '',
    schedule: '',
    delegate: '',
    eliminate: ''
  });
  const [editingTask, setEditingTask] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [view, setView] = useState('matrix');
  const [showCompleted, setShowCompleted] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef(null);

  const translations = {
    en: {
      title: 'Eisenhower Matrix',
      subtitle: 'Prioritize tasks by urgency and importance',
      doFirst: 'Do First',
      doFirstDesc: 'Urgent & Important',
      doFirstExplain: 'Critical tasks requiring immediate attention',
      schedule: 'Schedule',
      scheduleDesc: 'Not Urgent but Important',
      scheduleExplain: 'Strategic tasks to plan and schedule',
      delegate: 'Delegate',
      delegateDesc: 'Urgent but Not Important',
      delegateExplain: 'Tasks others can handle',
      eliminate: 'Eliminate',
      eliminateDesc: 'Not Urgent & Not Important',
      eliminateExplain: 'Time-wasters to minimize or remove',
      addTask: 'Add task',
      noTasks: 'No tasks yet',
      clickToAdd: 'Click "Add task" to start',
      matrixView: 'Matrix View',
      listView: 'List View',
      showCompleted: 'Show Completed',
      hideCompleted: 'Hide Completed',
      clear: 'Clear All',
      urgent: 'URGENT',
      notUrgent: 'NOT URGENT',
      important: 'IMPORTANT',
      notImportant: 'NOT IMPORTANT',
      completed: 'Completed',
      pending: 'Pending',
      totalTasks: 'Total Tasks',
      completionRate: 'Completion Rate',
      import: 'Import',
      importData: 'Import Data',
      importDesc: 'Upload JSON or CSV file to import tasks',
      selectFile: 'Select File',
      importSuccess: 'Data imported successfully!',
      importError: 'Error importing data. Please check file format.',
      cancel: 'Cancel',
      dragDrop: 'Drag and drop or click to select',
      supportedFormats: 'Supported: JSON, CSV'
    },
    es: {
      title: 'Matriz de Eisenhower',
      subtitle: 'Prioriza las tareas por urgencia e importancia',
      doFirst: 'Haz Primero',
      doFirstDesc: 'Urgente e Importante',
      doFirstExplain: 'Tareas críticas que requieren atención inmediata',
      schedule: 'Programar',
      scheduleDesc: 'No Urgente pero Importante',
      scheduleExplain: 'Tareas estratégicas para planificar y programar',
      delegate: 'Delegar',
      delegateDesc: 'Urgente pero No Importante',
      delegateExplain: 'Tareas que otros pueden realizar',
      eliminate: 'Eliminar',
      eliminateDesc: 'No Urgente y No Importante',
      eliminateExplain: 'Pérdidas de tiempo que se deben minimizar o eliminar',
      addTask: 'Agregar tarea',
      noTasks: 'Aún no hay tareas',
      clickToAdd: 'Haz clic en "Agregar tarea" para comenzar',
      matrixView: 'Vista de Matriz',
      listView: 'Vista de Lista',
      showCompleted: 'Mostrar Completadas',
      hideCompleted: 'Ocultar Completadas',
      clear: 'Borrar Todo',
      urgent: 'URGENTE',
      notUrgent: 'NO URGENTE',
      important: 'IMPORTANTE',
      notImportant: 'NO IMPORTANTE',
      completed: 'Completadas',
      pending: 'Pendientes',
      totalTasks: 'Tareas Totales',
      completionRate: 'Tasa de Finalización',
      import: 'Importar',
      importData: 'Importar Datos',
      importDesc: 'Sube un archivo JSON o CSV para importar tareas',
      selectFile: 'Seleccionar Archivo',
      importSuccess: '¡Datos importados con éxito!',
      importError: 'Error al importar datos. Verifica el formato del archivo.',
      cancel: 'Cancelar',
      dragDrop: 'Arrastra y suelta o haz clic para seleccionar',
      supportedFormats: 'Formatos admitidos: JSON, CSV'
    },
    pt: {
      title: 'Matriz de Eisenhower',
      subtitle: 'Priorize tarefas por urgência e importância',
      doFirst: 'Fazer Primeiro',
      doFirstDesc: 'Urgente e Importante',
      doFirstExplain: 'Tarefas críticas que exigem atenção imediata',
      schedule: 'Agendar',
      scheduleDesc: 'Não Urgente mas Importante',
      scheduleExplain: 'Tarefas estratégicas para planejar e agendar',
      delegate: 'Delegar',
      delegateDesc: 'Urgente mas Não Importante',
      delegateExplain: 'Tarefas que outras pessoas podem realizar',
      eliminate: 'Eliminar',
      eliminateDesc: 'Não Urgente e Não Importante',
      eliminateExplain: 'Perdas de tempo que devem ser minimizadas ou removidas',
      addTask: 'Adicionar tarefa',
      noTasks: 'Nenhuma tarefa ainda',
      clickToAdd: 'Clique em "Adicionar tarefa" para começar',
      matrixView: 'Visualização em Matriz',
      listView: 'Visualização em Lista',
      showCompleted: 'Mostrar Concluídas',
      hideCompleted: 'Ocultar Concluídas',
      clear: 'Limpar Tudo',
      urgent: 'URGENTE',
      notUrgent: 'NÃO URGENTE',
      important: 'IMPORTANTE',
      notImportant: 'NÃO IMPORTANTE',
      completed: 'Concluídas',
      pending: 'Pendentes',
      totalTasks: 'Total de Tarefas',
      completionRate: 'Taxa de Conclusão',
      import: 'Importar',
      importData: 'Importar Dados',
      importDesc: 'Envie um arquivo JSON ou CSV para importar tarefas',
      selectFile: 'Selecionar Arquivo',
      importSuccess: 'Dados importados com sucesso!',
      importError: 'Erro ao importar dados. Verifique o formato do arquivo.',
      cancel: 'Cancelar',
      dragDrop: 'Arraste e solte ou clique para selecionar',
      supportedFormats: 'Formatos suportados: JSON, CSV'
    }
  };

  const t = translations[lang] || translations.en;

  const addTask = (quadrant) => {
    if (newTask[quadrant].trim()) {
      setTasks({
        ...tasks,
        [quadrant]: [...tasks[quadrant], { 
          id: Date.now(), 
          text: newTask[quadrant].trim(), 
          completed: false,
          createdAt: new Date().toISOString()
        }]
      });
      setNewTask({ ...newTask, [quadrant]: '' });
    }
  };

  const removeTask = (quadrant, id) => {
    setTasks({
      ...tasks,
      [quadrant]: tasks[quadrant].filter(task => task.id !== id)
    });
  };

  const toggleComplete = (quadrant, id) => {
    setTasks({
      ...tasks,
      [quadrant]: tasks[quadrant].map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    });
  };

  const startEditing = (quadrant, task) => {
    setEditingTask({ quadrant, id: task.id });
    setEditingText(task.text);
  };

  const saveEdit = () => {
    if (editingTask && editingText.trim()) {
      const { quadrant, id } = editingTask;
      setTasks({
        ...tasks,
        [quadrant]: tasks[quadrant].map(task =>
          task.id === id ? { ...task, text: editingText.trim() } : task
        )
      });
    }
    setEditingTask(null);
    setEditingText('');
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditingText('');
  };

  const exportData = (format) => {
    const allTasks = [];
    Object.entries(tasks).forEach(([quadrant, taskList]) => {
      taskList.forEach(task => {
        allTasks.push({
          quadrant,
          task: task.text,
          completed: task.completed,
          createdAt: task.createdAt
        });
      });
    });

    if (format === 'json') {
      const blob = new Blob([JSON.stringify({ tasks: allTasks, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eisenhower-matrix-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      let csv = 'Quadrant,Task,Completed,Created At\n';
      allTasks.forEach(({ quadrant, task, completed, createdAt }) => {
        csv += `"${quadrant}","${task.replace(/"/g, '""')}","${completed}","${createdAt}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eisenhower-matrix-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all tasks?')) {
      setTasks({
        doFirst: [],
        schedule: [],
        delegate: [],
        eliminate: []
      });
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        importData(content, file.name);
      } catch (error) {
        setImportError(t.importError);
      }
    };
    reader.readAsText(file);
  };

  const importData = (content, filename) => {
    setImportError('');
    try {
      if (filename.endsWith('.json')) {
        const data = JSON.parse(content);
        
        if (data.tasks && Array.isArray(data.tasks)) {
          const imported = {
            doFirst: [],
            schedule: [],
            delegate: [],
            eliminate: []
          };
          
          data.tasks.forEach((item) => {
            const quadrant = item.quadrant;
            if (quadrant && imported[quadrant]) {
              imported[quadrant].push({
                id: Date.now() + Math.random(),
                text: item.task,
                completed: item.completed || false,
                createdAt: item.createdAt || new Date().toISOString()
              });
            }
          });
          
          setTasks(imported);
          setShowImportModal(false);
          alert(t.importSuccess);
        } else {
          setImportError(t.importError);
        }
      } else if (filename.endsWith('.csv')) {
        const lines = content.split('\n').filter(line => line.trim());
        const imported = {
          doFirst: [],
          schedule: [],
          delegate: [],
          eliminate: []
        };
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          
          if (matches && matches.length >= 2) {
            const quadrant = matches[0].replace(/"/g, '');
            const taskText = matches[1].replace(/"/g, '');
            const completed = matches[2]?.replace(/"/g, '') === 'true';
            const createdAt = matches[3]?.replace(/"/g, '') || new Date().toISOString();
            
            if (imported[quadrant]) {
              imported[quadrant].push({
                id: Date.now() + Math.random(),
                text: taskText,
                completed: completed,
                createdAt: createdAt
              });
            }
          }
        }
        
        setTasks(imported);
        setShowImportModal(false);
        alert(t.importSuccess);
      } else {
        setImportError(t.importError);
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportError(t.importError);
    }
  };

  const quadrants = [
    {
      key: 'doFirst',
      title: t.doFirst,
      desc: t.doFirstDesc,
      explain: t.doFirstExplain,
      icon: Zap,
      color: 'from-red-500 to-rose-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      textColor: 'text-red-700',
      badgeColor: 'bg-red-500'
    },
    {
      key: 'schedule',
      title: t.schedule,
      desc: t.scheduleDesc,
      explain: t.scheduleExplain,
      icon: Calendar,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      textColor: 'text-blue-700',
      badgeColor: 'bg-blue-500'
    },
    {
      key: 'delegate',
      title: t.delegate,
      desc: t.delegateDesc,
      explain: t.delegateExplain,
      icon: Clock,
      color: 'from-yellow-500 to-amber-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
      textColor: 'text-yellow-700',
      badgeColor: 'bg-yellow-500'
    },
    {
      key: 'eliminate',
      title: t.eliminate,
      desc: t.eliminateDesc,
      explain: t.eliminateExplain,
      icon: Trash2,
      color: 'from-gray-500 to-slate-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-300',
      textColor: 'text-gray-700',
      badgeColor: 'bg-gray-500'
    }
  ];

  const getFilteredTasks = (taskList) => {
    return showCompleted ? taskList : taskList.filter(task => !task.completed);
  };

  const totalTasks = Object.values(tasks).reduce((sum, arr) => sum + arr.length, 0);
  const completedTasks = Object.values(tasks).reduce((sum, arr) => sum + arr.filter(t => t.completed).length, 0);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 mb-4">
            <Grid3x3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-gray-600 text-lg">
            {t.subtitle}
          </p>
        </div>

        {/* Stats and Controls */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
              <div className="text-sm text-gray-600 mb-1">{t.totalTasks}</div>
              <div className="text-2xl font-bold text-indigo-600">{totalTasks}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <div className="text-sm text-gray-600 mb-1">{t.completed}</div>
              <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
              <div className="text-sm text-gray-600 mb-1">{t.pending}</div>
              <div className="text-2xl font-bold text-orange-600">{totalTasks - completedTasks}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
              <div className="text-sm text-gray-600 mb-1">{t.completionRate}</div>
              <div className="text-2xl font-bold text-blue-600">{completionRate}%</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setView(view === 'matrix' ? 'list' : 'matrix')}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors flex items-center gap-2"
            >
              {view === 'matrix' ? <List className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
              {view === 'matrix' ? t.listView : t.matrixView}
            </button>

            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                showCompleted 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {showCompleted ? t.hideCompleted : t.showCompleted}
            </button>

            {totalTasks > 0 && (
              <>
                <button
                  onClick={() => exportData('json')}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  JSON
                </button>
                <button
                  onClick={() => exportData('csv')}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
              </>
            )}

            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {t.import}
            </button>

            <button
              onClick={clearAll}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2 ml-auto"
            >
              <Trash2 className="w-4 h-4" />
              {t.clear}
            </button>
          </div>
        </div>

        {/* Axis Labels */}
        {view === 'matrix' && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="inline-block px-4 py-2 rounded-full bg-red-100 text-red-700 font-bold text-sm">
                {t.urgent}
              </div>
            </div>
            <div className="text-center">
              <div className="inline-block px-4 py-2 rounded-full bg-gray-100 text-gray-700 font-bold text-sm">
                {t.notUrgent}
              </div>
            </div>
          </div>
        )}

        {/* Matrix Grid */}
        <div className={view === 'matrix' ? 'grid md:grid-cols-2 gap-6 relative' : 'space-y-6'}>
          {view === 'matrix' && (
            <>
              <div className="absolute -left-24 top-1/4 hidden lg:block">
                <div className="-rotate-90 px-4 py-2 rounded-full bg-green-100 text-green-700 font-bold text-sm whitespace-nowrap">
                  {t.important}
                </div>
              </div>
              <div className="absolute -left-24 bottom-1/4 hidden lg:block">
                <div className="-rotate-90 px-4 py-2 rounded-full bg-gray-100 text-gray-700 font-bold text-sm whitespace-nowrap">
                  {t.notImportant}
                </div>
              </div>
            </>
          )}

          {quadrants.map(({ key, title, desc, explain, icon: Icon, color, bgColor, borderColor, textColor, badgeColor }) => {
            const filteredTasks = getFilteredTasks(tasks[key]);
            return (
              <div key={key} className={`bg-white rounded-2xl shadow-xl overflow-hidden border-2 ${borderColor}`}>
                <div className={`bg-gradient-to-r ${color} p-4`}>
                  <div className="flex items-center gap-3">
                    <Icon className="w-6 h-6 text-white" />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{title}</h3>
                      <p className="text-xs text-white/80">{desc}</p>
                    </div>
                    <div className={`${badgeColor} text-white px-3 py-1 rounded-full text-xs font-bold`}>
                      {tasks[key].length}
                    </div>
                  </div>
                  <p className="text-xs text-white/70 mt-2">{explain}</p>
                </div>

                <div className="p-4">
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newTask[key]}
                      onChange={(e) => setNewTask({ ...newTask, [key]: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && addTask(key)}
                      placeholder={`${t.addTask}...`}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                    <button
                      onClick={() => addTask(key)}
                      className={`px-4 py-2 rounded-lg bg-gradient-to-r ${color} text-white hover:shadow-lg transition-all flex items-center gap-2`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {filteredTasks.length === 0 ? (
                      <div className={`${bgColor} rounded-lg p-8 text-center`}>
                        <p className={`${textColor} text-sm font-medium`}>{t.noTasks}</p>
                        <p className="text-xs text-gray-500 mt-1">{t.clickToAdd}</p>
                      </div>
                    ) : (
                      filteredTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`${bgColor} rounded-lg p-3 border ${borderColor} group hover:shadow-md transition-all ${
                            task.completed ? 'opacity-60' : ''
                          }`}
                        >
                          {editingTask?.quadrant === key && editingTask?.id === task.id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                                className="flex-1 px-2 py-1 rounded border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                autoFocus
                              />
                              <button onClick={saveEdit} className="p-1 rounded bg-green-500 text-white hover:bg-green-600">
                                <Save className="w-4 h-4" />
                              </button>
                              <button onClick={cancelEdit} className="p-1 rounded bg-gray-500 text-white hover:bg-gray-600">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <button
                                onClick={() => toggleComplete(key, task.id)}
                                className="mt-0.5 flex-shrink-0"
                              >
                                {task.completed ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                )}
                              </button>
                              <p className={`${textColor} text-sm flex-1 ${task.completed ? 'line-through' : ''}`}>
                                {task.text}
                              </p>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => startEditing(key, task)}
                                  className="p-1 rounded hover:bg-white/50"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => removeTask(key, task.id)}
                                  className="p-1 rounded hover:bg-red-100"
                                >
                                  <Trash2 className="w-3 h-3 text-red-600" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{t.importData}</h3>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportError('');
                  }}
                  className="p-1 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                {t.importDesc}
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-2">
                    <FileJson className="w-8 h-8 text-purple-500" />
                    <FileSpreadsheet className="w-8 h-8 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">{t.dragDrop}</p>
                    <p className="text-xs text-gray-500">{t.supportedFormats}</p>
                  </div>
                </div>
              </div>

              {importError && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{importError}</p>
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportError('');
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {t.selectFile}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EisenhowerMatrix;