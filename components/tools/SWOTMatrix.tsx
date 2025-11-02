'use client'

import React, { useState, useRef } from 'react';
import { 
  Target, TrendingUp, TrendingDown, Shield, 
  AlertCircle, AlertTriangle, Download, Plus, Trash2, Edit2, Save, X, BarChart3, Grid3x3, 
  FileText, Upload, FileSpreadsheet, FileJson 
} from 'lucide-react';
import { type Locale } from '@/lib/i18n/config';


const SWOTMatrix = ({ lang = 'en', dict = {} }) => {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [swotData, setSWOTData] = useState({
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: []
  });
  const [newItem, setNewItem] = useState({
    strengths: '',
    weaknesses: '',
    opportunities: '',
    threats: ''
  });
  const [editingItem, setEditingItem] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [view, setView] = useState('matrix');
  const [showStrategy, setShowStrategy] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef(null);

  const translations = {
    en: {
      title: 'SWOT Matrix Analysis',
      subtitle: 'Strategic planning tool for business analysis',
      projectName: 'Project Name',
      projectNamePlaceholder: 'e.g., New Product Launch',
      description: 'Description',
      descriptionPlaceholder: 'Brief description of the project or analysis context...',
      strengths: 'Strengths',
      weaknesses: 'Weaknesses',
      opportunities: 'Opportunities',
      threats: 'Threats',
      strengthsDesc: 'Internal positive attributes',
      weaknessesDesc: 'Internal areas for improvement',
      opportunitiesDesc: 'External positive factors',
      threatsDesc: 'External challenges',
      addItem: 'Add item',
      noItems: 'No items added yet',
      clickToAdd: 'Click "Add item" to start',
      matrixView: 'Matrix View',
      listView: 'List View',
      strategies: 'Strategies',
      exportJson: 'Export JSON',
      exportCsv: 'Export CSV',
      exportPdf: 'Export Report',
      clear: 'Clear All',
      soStrategies: 'SO Strategies',
      soDesc: 'Use Strengths to leverage Opportunities',
      woStrategies: 'WO Strategies',
      woDesc: 'Overcome Weaknesses by pursuing Opportunities',
      stStrategies: 'ST Strategies',
      stDesc: 'Use Strengths to avoid Threats',
      wtStrategies: 'WT Strategies',
      wtDesc: 'Minimize Weaknesses and avoid Threats',
      generateStrategies: 'Generate Strategic Recommendations',
      hideStrategies: 'Hide Strategies',
      itemsCount: 'items',
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
    pt: {
      title: 'Análise Matriz SWOT',
      subtitle: 'Ferramenta de planejamento estratégico para análise de negócios',
      projectName: 'Nome do Projeto',
      projectNamePlaceholder: 'ex: Lançamento de Novo Produto',
      description: 'Descrição',
      descriptionPlaceholder: 'Breve descrição do projeto ou contexto da análise...',
      strengths: 'Forças',
      weaknesses: 'Fraquezas',
      opportunities: 'Oportunidades',
      threats: 'Ameaças',
      strengthsDesc: 'Atributos internos positivos',
      weaknessesDesc: 'Áreas internas para melhoria',
      opportunitiesDesc: 'Fatores externos positivos',
      threatsDesc: 'Desafios externos',
      addItem: 'Adicionar item',
      noItems: 'Nenhum item adicionado',
      clickToAdd: 'Clique em "Adicionar item" para começar',
      matrixView: 'Visão Matriz',
      listView: 'Visão Lista',
      strategies: 'Estratégias',
      exportJson: 'Exportar JSON',
      exportCsv: 'Exportar CSV',
      exportPdf: 'Exportar Relatório',
      clear: 'Limpar Tudo',
      soStrategies: 'Estratégias FO',
      soDesc: 'Use Forças para aproveitar Oportunidades',
      woStrategies: 'Estratégias fO',
      woDesc: 'Supere Fraquezas perseguindo Oportunidades',
      stStrategies: 'Estratégias FA',
      stDesc: 'Use Forças para evitar Ameaças',
      wtStrategies: 'Estratégias fA',
      wtDesc: 'Minimize Fraquezas e evite Ameaças',
      generateStrategies: 'Gerar Recomendações Estratégicas',
      hideStrategies: 'Ocultar Estratégias',
      itemsCount: 'itens',
      import: "Importar",
      importData: "Importar Dados",
      importDesc: "Envie um arquivo JSON ou CSV para importar tarefas",
      selectFile: "Selecionar Arquivo",
      importSuccess: "Dados importados com sucesso!",
      importError: "Erro ao importar dados. Verifique o formato do arquivo.",
      cancel: "Cancelar",
      dragDrop: "Arraste e solte ou clique para selecionar",
      supportedFormats: "Formatos suportados: JSON, CSV"
    },
    es: {
      title: 'Análisis Matriz FODA',
      subtitle: 'Herramienta de planificación estratégica para análisis de negocios',
      projectName: 'Nombre del Proyecto',
      projectNamePlaceholder: 'ej: Lanzamiento de Nuevo Producto',
      description: 'Descripción',
      descriptionPlaceholder: 'Breve descripción del proyecto o contexto del análisis...',
      strengths: 'Fortalezas',
      weaknesses: 'Debilidades',
      opportunities: 'Oportunidades',
      threats: 'Amenazas',
      strengthsDesc: 'Atributos internos positivos',
      weaknessesDesc: 'Áreas internas de mejora',
      opportunitiesDesc: 'Factores externos positivos',
      threatsDesc: 'Desafíos externos',
      addItem: 'Agregar ítem',
      noItems: 'No hay ítems agregados',
      clickToAdd: 'Haga clic en "Agregar ítem" para comenzar',
      matrixView: 'Vista Matriz',
      listView: 'Vista Lista',
      strategies: 'Estrategias',
      exportJson: 'Exportar JSON',
      exportCsv: 'Exportar CSV',
      exportPdf: 'Exportar Informe',
      clear: 'Limpiar Todo',
      soStrategies: 'Estrategias FO',
      soDesc: 'Usar Fortalezas para aprovechar Oportunidades',
      woStrategies: 'Estrategias DO',
      woDesc: 'Superar Debilidades persiguiendo Oportunidades',
      stStrategies: 'Estrategias FA',
      stDesc: 'Usar Fortalezas para evitar Amenazas',
      wtStrategies: 'Estrategias DA',
      wtDesc: 'Minimizar Debilidades y evitar Amenazas',
      generateStrategies: 'Generar Recomendaciones Estratégicas',
      hideStrategies: 'Ocultar Estrategias',
      itemsCount: 'ítems',
      import: "Importar",
      importData: "Importar Datos",
      importDesc: "Sube un archivo JSON o CSV para importar tareas",
      selectFile: "Seleccionar Archivo",
      importSuccess: "¡Datos importados con éxito!",
      importError: "Error al importar los datos. Por favor, verifica el formato del archivo.",
      cancel: "Cancelar",
      dragDrop: "Arrastra y suelta o haz clic para seleccionar",
      supportedFormats: "Formatos admitidos: JSON, CSV"
    }
  };

  const t = translations[lang] || translations.en;

  const addItemToQuadrant = (quadrant) => {
    if (newItem[quadrant].trim()) {
      setSWOTData({
        ...swotData,
        [quadrant]: [...swotData[quadrant], newItem[quadrant].trim()]
      });
      setNewItem({ ...newItem, [quadrant]: '' });
    }
  };

  const removeItem = (quadrant, index) => {
    setSWOTData({
      ...swotData,
      [quadrant]: swotData[quadrant].filter((_, i) => i !== index)
    });
  };

  const startEditing = (quadrant, index, text) => {
    setEditingItem({ quadrant, index });
    setEditingText(text);
  };

  const saveEdit = () => {
    if (editingItem && editingText.trim()) {
      const { quadrant, index } = editingItem;
      const newData = [...swotData[quadrant]];
      newData[index] = editingText.trim();
      setSWOTData({
        ...swotData,
        [quadrant]: newData
      });
    }
    setEditingItem(null);
    setEditingText('');
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditingText('');
  };

  const generateStrategies = () => {
    const strategies = {
      SO: [],
      WO: [],
      ST: [],
      WT: []
    };

    // SO: Strengths + Opportunities
    if (swotData.strengths.length > 0 && swotData.opportunities.length > 0) {
      strategies.SO.push(`Leverage "${swotData.strengths[0]}" to capitalize on "${swotData.opportunities[0]}"`);
    }

    // WO: Weaknesses + Opportunities
    if (swotData.weaknesses.length > 0 && swotData.opportunities.length > 0) {
      strategies.WO.push(`Improve "${swotData.weaknesses[0]}" to take advantage of "${swotData.opportunities[0]}"`);
    }

    // ST: Strengths + Threats
    if (swotData.strengths.length > 0 && swotData.threats.length > 0) {
      strategies.ST.push(`Use "${swotData.strengths[0]}" to mitigate "${swotData.threats[0]}"`);
    }

    // WT: Weaknesses + Threats
    if (swotData.weaknesses.length > 0 && swotData.threats.length > 0) {
      strategies.WT.push(`Address "${swotData.weaknesses[0]}" to avoid exposure to "${swotData.threats[0]}"`);
    }

    return strategies;
  };

  const exportData = (format) => {
    const data = {
      projectName,
      description,
      timestamp: new Date().toISOString(),
      swot: swotData,
      strategies: generateStrategies()
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `swot-analysis-${projectName.replace(/\s+/g, '-') || 'untitled'}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      let csv = 'Quadrant,Item\n';
      Object.entries(swotData).forEach(([quadrant, items]) => {
        items.forEach(item => {
          csv += `"${quadrant}","${item.replace(/"/g, '""')}"\n`;
        });
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `swot-analysis-${projectName.replace(/\s+/g, '-') || 'untitled'}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'report') {
      const strategies = generateStrategies();
      let report = `SWOT ANALYSIS REPORT\n`;
      report += `========================\n\n`;
      report += `Project: ${projectName}\n`;
      report += `Description: ${description}\n`;
      report += `Date: ${new Date().toLocaleDateString()}\n\n`;
      
      Object.entries(swotData).forEach(([quadrant, items]) => {
        report += `\n${quadrant.toUpperCase()}\n`;
        report += `${'-'.repeat(quadrant.length)}\n`;
        items.forEach((item, i) => {
          report += `${i + 1}. ${item}\n`;
        });
      });

      report += `\n\nSTRATEGIC RECOMMENDATIONS\n`;
      report += `=========================\n\n`;
      Object.entries(strategies).forEach(([type, strats]) => {
        if (strats.length > 0) {
          report += `${type} Strategy:\n`;
          strats.forEach(s => report += `- ${s}\n`);
          report += `\n`;
        }
      });

      const blob = new Blob([report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `swot-report-${projectName.replace(/\s+/g, '-') || 'untitled'}-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
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

  // const importData = (content, filename) => {
  //   setImportError('');
  //   try {
  //     if (filename.endsWith('.json')) {
  //       const data = JSON.parse(content);
        
  //       if (data.tasks && Array.isArray(data.tasks)) {
  //         const imported = {
  //           doFirst: [],
  //           schedule: [],
  //           delegate: [],
  //           eliminate: []
  //         };
          
  //         data.tasks.forEach((item) => {
  //           const quadrant = item.quadrant;
  //           if (quadrant && imported[quadrant]) {
  //             imported[quadrant].push({
  //               id: Date.now() + Math.random(),
  //               text: item.task,
  //               completed: item.completed || false,
  //               createdAt: item.createdAt || new Date().toISOString()
  //             });
  //           }
  //         });
          
  //         // setTasks(imported);
  //         setSWOTData(imported);

  //         setShowImportModal(false);
  //         alert(t.importSuccess);
  //       } else {
  //         setImportError(t.importError);
  //       }
  //     } else if (filename.endsWith('.csv')) {
  //       const lines = content.split('\n').filter(line => line.trim());
  //       const imported = {
  //         doFirst: [],
  //         schedule: [],
  //         delegate: [],
  //         eliminate: []
  //       };
        
  //       for (let i = 1; i < lines.length; i++) {
  //         const line = lines[i];
  //         const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          
  //         if (matches && matches.length >= 2) {
  //           const quadrant = matches[0].replace(/"/g, '');
  //           const taskText = matches[1].replace(/"/g, '');
  //           const completed = matches[2]?.replace(/"/g, '') === 'true';
  //           const createdAt = matches[3]?.replace(/"/g, '') || new Date().toISOString();
            
  //           if (imported[quadrant]) {
  //             imported[quadrant].push({
  //               id: Date.now() + Math.random(),
  //               text: taskText,
  //               completed: completed,
  //               createdAt: createdAt
  //             });
  //           }
  //         }
  //       }
        
  //       // setTasks(imported);
  //       setSWOTData(imported);

  //       setShowImportModal(false);
  //       alert(t.importSuccess);
  //     } else {
  //       setImportError(t.importError);
  //     }
  //   } catch (error) {
  //     console.error('Import error:', error);
  //     setImportError(t.importError);
  //   }
  // };

  const importData = (content, filename) => {
    setImportError('');
    try {
      if (filename.endsWith('.json')) {
        const data = JSON.parse(content);

        // Expecting SWOT structure
        if (data.swot && typeof data.swot === 'object') {
          setSWOTData({
            strengths: data.swot.strengths || [],
            weaknesses: data.swot.weaknesses || [],
            opportunities: data.swot.opportunities || [],
            threats: data.swot.threats || []
          });
          setShowImportModal(false);
          alert(t.importSuccess);
        } else {
          setImportError(t.importError);
        }
      } else if (filename.endsWith('.csv')) {
        const lines = content.split('\n').filter(line => line.trim());
        const imported = {
          strengths: [],
          weaknesses: [],
          opportunities: [],
          threats: []
        };

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          if (matches && matches.length >= 2) {
            const quadrant = matches[0].replace(/"/g, '');
            const item = matches[1].replace(/"/g, '');
            if (imported[quadrant]) {
              imported[quadrant].push(item);
            }
          }
        }

        setSWOTData(imported);
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

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all data?')) {
      setProjectName('');
      setDescription('');
      setSWOTData({
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: []
      });
      setShowStrategy(false);
    }
  };

  const quadrants = [
    { 
      key: 'strengths', 
      title: t.strengths, 
      desc: t.strengthsDesc,
      icon: TrendingUp, 
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-300 dark:border-green-700',
      textColor: 'text-green-700 dark:text-green-300'
    },
    { 
      key: 'weaknesses', 
      title: t.weaknesses, 
      desc: t.weaknessesDesc,
      icon: TrendingDown, 
      color: 'from-red-500 to-rose-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-300 dark:border-red-700',
      textColor: 'text-red-700 dark:text-red-300'
    },
    { 
      key: 'opportunities', 
      title: t.opportunities, 
      desc: t.opportunitiesDesc,
      icon: Target, 
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-300 dark:border-blue-700',
      textColor: 'text-blue-700 dark:text-blue-300'
    },
    { 
      key: 'threats', 
      title: t.threats, 
      desc: t.threatsDesc,
      icon: AlertTriangle, 
      color: 'from-orange-500 to-amber-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-300 dark:border-orange-700',
      textColor: 'text-orange-700 dark:text-orange-300'
    }
  ];

  const totalItems = Object.values(swotData).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-900 dark:to-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mb-4">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t.subtitle}
          </p>
        </div>

        {/* Project Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold mb-2">{t.projectName}</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder={t.projectNamePlaceholder}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">{t.description}</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.descriptionPlaceholder}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setView(view === 'matrix' ? 'list' : 'matrix')}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              {view === 'matrix' ? <FileText className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
              {view === 'matrix' ? t.listView : t.matrixView}
            </button>

            <button
              onClick={() => setShowStrategy(!showStrategy)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                showStrategy 
                  ? 'bg-purple-600 text-white hover:bg-purple-700' 
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
              }`}
            >
              <Shield className="w-4 h-4" />
              {showStrategy ? t.hideStrategies : t.strategies}
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {t.import}
            </button>

            {totalItems > 0 && (
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
                <button
                  onClick={() => exportData('report')}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {t.exportPdf}
                </button>
              </>
            )}

            <button
              onClick={clearAll}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2 ml-auto"
            >
              <Trash2 className="w-4 h-4" />
              {t.clear}
            </button>
          </div>

          {totalItems > 0 && (
            <div className="mt-4 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-center">
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                Total: {totalItems} {t.itemsCount}
              </span>
            </div>
          )}
        </div>

        {/* SWOT Matrix */}
        <div className={view === 'matrix' ? 'grid md:grid-cols-2 gap-6 mb-6' : 'space-y-6 mb-6'}>
          {quadrants.map(({ key, title, desc, icon: Icon, color, bgColor, borderColor, textColor }) => (
            <div key={key} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border-2 ${borderColor}`}>
              <div className={`bg-gradient-to-r ${color} p-4`}>
                <div className="flex items-center gap-3">
                  <Icon className="w-6 h-6 text-white" />
                  <div>
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <p className="text-xs text-white/80">{desc}</p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {/* Add Item Input */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newItem[key]}
                    onChange={(e) => setNewItem({ ...newItem, [key]: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && addItemToQuadrant(key)}
                    placeholder={`${t.addItem}...`}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                  <button
                    onClick={() => addItemToQuadrant(key)}
                    className={`px-4 py-2 rounded-lg bg-gradient-to-r ${color} text-white hover:shadow-lg transition-all flex items-center gap-2`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Items List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {swotData[key].length === 0 ? (
                    <div className={`${bgColor} rounded-lg p-8 text-center`}>
                      <p className={`${textColor} text-sm font-medium`}>{t.noItems}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t.clickToAdd}</p>
                    </div>
                  ) : (
                    swotData[key].map((item, index) => (
                      <div
                        key={index}
                        className={`${bgColor} rounded-lg p-3 border ${borderColor} group hover:shadow-md transition-all`}
                      >
                        {editingItem?.quadrant === key && editingItem?.index === index ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                              className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                              autoFocus
                            />
                            <button
                              onClick={saveEdit}
                              className="p-1 rounded bg-green-500 text-white hover:bg-green-600"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 rounded bg-gray-500 text-white hover:bg-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            <p className={`${textColor} text-sm flex-1`}>{item}</p>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEditing(key, index, item)}
                                className="p-1 rounded hover:bg-white/50 dark:hover:bg-gray-700"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => removeItem(key, index)}
                                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
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
          ))}
        </div>

        {/* Strategic Recommendations */}
        {showStrategy && totalItems > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold">{t.generateStrategies}</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                { type: 'SO', title: t.soStrategies, desc: t.soDesc, color: 'from-green-500 to-blue-500' },
                { type: 'WO', title: t.woStrategies, desc: t.woDesc, color: 'from-red-500 to-blue-500' },
                { type: 'ST', title: t.stStrategies, desc: t.stDesc, color: 'from-green-500 to-orange-500' },
                { type: 'WT', title: t.wtStrategies, desc: t.wtDesc, color: 'from-red-500 to-orange-500' }
              ].map(({ type, title, desc, color }) => {
                const strategies = generateStrategies()[type];
                return (
                  <div key={type} className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                    <div className={`inline-block bg-gradient-to-r ${color} text-white px-3 py-1 rounded-full text-xs font-bold mb-2`}>
                      {type}
                    </div>
                    <h3 className="font-bold mb-1">{title}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{desc}</p>
                    <div className="space-y-2">
                      {strategies.length > 0 ? (
                        strategies.map((strategy, i) => (
                          <div key={i} className="bg-white dark:bg-gray-900 rounded-lg p-2 text-sm border border-gray-200 dark:border-gray-700">
                            {strategy}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Add items to generate strategies</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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

export default SWOTMatrix;