import React, { useState, useEffect, useRef } from 'react';
import {
  Moon, Sun, Heart, Activity, Trash2, Plus,
  Download, Upload, FileText, Share2, X, Loader2, Copy, Pencil, AlertTriangle
} from 'lucide-react';

const App = () => {
  const [entries, setEntries] = useState(() => {
    const saved = localStorage.getItem('bp_entries');
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  });

  const [loading, setLoading] = useState(false);

  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  const [puls, setPuls] = useState('');
  const [dateTime, setDateTime] = useState(getCurrentDateTimeLocal());
  const [editId, setEditId] = useState(null);

  const [darkMode, setDarkMode] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [jsonToExport, setJsonToExport] = useState('');
  const [copyStatus, setCopyStatus] = useState('Daten kopieren');

  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('bp_entries', JSON.stringify(entries));
  }, [entries]);

  // Actions
  const handleSave = (e) => {
    e.preventDefault();
    if (!sys || !dia || !puls || !dateTime) return;

    const entryData = {
      sys: parseInt(sys),
      dia: parseInt(dia),
      puls: parseInt(puls),
      date: new Date(dateTime).toISOString()
    };

    if (editId) {
      setEntries(prev => prev.map(item => item.id === editId ? { ...item, ...entryData } : item));
      setEditId(null);
    } else {
      setEntries(prev => [{ id: Date.now().toString(), ...entryData }, ...prev]);
    }

    setSys('');
    setDia('');
    setPuls('');
    setDateTime(getCurrentDateTimeLocal());
  };

  const handleEdit = (entry) => {
    setSys(entry.sys);
    setDia(entry.dia);
    setPuls(entry.puls);

    // Convert UTC/ISO back to local input format
    const d = new Date(entry.date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setDateTime(d.toISOString().slice(0, 16));

    setEditId(entry.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setSys('');
    setDia('');
    setPuls('');
    setDateTime(getCurrentDateTimeLocal());
    setEditId(null);
  };

  const requestDelete = (docId) => {
    setItemToDelete(docId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    if (editId === itemToDelete) handleCancelEdit();

    setEntries(prev => prev.filter(item => item.id !== itemToDelete));
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  // -- EXPORT LOGIC --
  const openExportModal = () => {
    setJsonToExport(JSON.stringify(entries, null, 2));
    setCopyStatus('Text kopieren');
    setShowMenu(false);
    setShowExportModal(true);
  };

  const executeDownload = () => {
    const fileName = `blutdruck_daten_${new Date().toISOString().slice(0, 10)}.json`;
    try {
      const blob = new Blob([jsonToExport], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const linkElement = document.createElement('a');
      linkElement.href = url;
      linkElement.download = fileName;
      document.body.appendChild(linkElement);
      linkElement.click();
      setTimeout(() => {
        document.body.removeChild(linkElement);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (e) {
      // Ignore
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonToExport);
      setCopyStatus('Kopiert! ✓');
      setTimeout(() => setCopyStatus('Text kopieren'), 3000);
    } catch (err) {
      setCopyStatus('Fehler');
    }
  };

  const handleFocus = (event) => {
    event.target.select();
  };

  // -- IMPORT LOGIC --
  const triggerImport = () => {
    fileInputRef.current.click();
    setShowMenu(false);
  };

  const handleJsonImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImporting(true);
      const reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          if (Array.isArray(importedData)) {
            let count = 0;
            const newEntries = importedData
              .filter(item => item.sys && item.dia && item.puls)
              .map(item => {
                count++;
                return {
                  id: item.id || Date.now() + Math.random().toString(),
                  sys: parseInt(item.sys),
                  dia: parseInt(item.dia),
                  puls: parseInt(item.puls),
                  date: item.date || new Date().toISOString()
                };
              });

            setEntries(prev => [...newEntries, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
            alert(`${count} Einträge importiert.`);
          }
        } catch (error) { alert("Import Fehler."); }
        finally { setImporting(false); }
      };
    }
    e.target.value = null;
  };

  const handlePrint = () => {
    setShowMenu(false);
    setTimeout(() => window.print(), 100);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    }).format(new Date(isoString));
  };

  const getStatusColor = (s, d) => {
    if (s > 140 || d > 90) return 'bg-red-400';
    if (s > 120 || d > 80) return 'bg-yellow-400';
    return 'bg-emerald-400';
  };

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-[#424242]' : 'bg-gray-50'}`}>
      <Loader2 className={`animate-spin ${darkMode ? 'text-white' : 'text-gray-800'}`} />
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 font-['Inter'] ${darkMode ? 'bg-[#424242] text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap');
          body { font-family: 'Inter', sans-serif; }
          input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
          input[type="datetime-local"]::-webkit-calendar-picker-indicator {
            filter: ${darkMode ? 'invert(1)' : 'invert(0.5)'};
            cursor: pointer;
          }
          @media print {
            body { background-color: white !important; color: black !important; }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            .print-item { break-inside: avoid; border-bottom: 1px solid #ddd; padding: 10px 0; }
          }
        `}
      </style>

      <input type="file" ref={fileInputRef} onChange={handleJsonImport} accept=".json" style={{ display: 'none' }} />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl ${darkMode ? 'bg-[#333] text-white' : 'bg-white text-gray-800'}`}>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-medium mb-1">Eintrag löschen?</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className={`flex-1 py-3 rounded-xl font-normal transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                Abbrechen
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl font-normal bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl ${darkMode ? 'bg-[#333] text-white' : 'bg-white text-gray-800'}`}>
            <h3 className="text-lg font-normal mb-2">Daten sichern</h3>
            <p className="text-sm opacity-70 mb-4">
              Kopiere den Text unten und speichere ihn in einer Datei (.json), falls der Download nicht startet.
            </p>
            <textarea
              readOnly
              value={jsonToExport}
              onFocus={handleFocus}
              onClick={handleFocus}
              className={`w-full h-32 mb-4 p-3 text-xs font-mono rounded-lg outline-none resize-none cursor-text ${darkMode ? 'bg-black/20 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
            />
            <div className="flex flex-col gap-2">
              <button onClick={copyToClipboard} className={`flex items-center justify-center gap-2 py-3 rounded-xl font-normal transition-transform active:scale-95 ${darkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'}`}>
                <Copy size={18} /> {copyStatus}
              </button>
              <button onClick={executeDownload} className={`flex items-center justify-center gap-2 py-3 rounded-xl font-normal transition-transform active:scale-95 ${darkMode ? 'bg-blue-600/80 text-white' : 'bg-blue-500/80 text-white'}`}>
                <Download size={18} /> Als Datei laden
              </button>
              <button onClick={() => setShowExportModal(false)} className={`mt-2 py-2 text-sm opacity-60 hover:opacity-100`}>
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto p-6 pb-28">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 pt-4 no-print">
          <div className="flex items-center gap-2">
            <Activity className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} strokeWidth={1.5} />
            <h1 className="text-xl font-normal tracking-wide">Blutdruck</h1>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
            {darkMode ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
          </button>
        </header>

        {/* Print Header */}
        <div className="hidden print-only mb-8">
          <h1 className="text-2xl font-bold mb-2">Blutdruck Protokoll</h1>
          <p className="text-sm text-gray-500">Exportiert am {new Date().toLocaleDateString()}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className={`mb-10 p-5 rounded-2xl ${darkMode ? 'bg-white/5' : 'bg-white'} shadow-sm no-print relative`}>

          {/* Datum Input */}
          <div className="mb-6 border-b border-gray-200/20 pb-1">
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className={`w-full text-sm bg-transparent outline-none ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="flex flex-col gap-1">
              <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>SYS</label>
              <input type="number" value={sys} onChange={(e) => setSys(e.target.value)} placeholder="120" className={`w-full text-2xl font-light bg-transparent border-b outline-none text-center pb-1 transition-colors ${darkMode ? 'border-gray-600 focus:border-gray-300' : 'border-gray-200 focus:border-gray-800'}`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>DIA</label>
              <input type="number" value={dia} onChange={(e) => setDia(e.target.value)} placeholder="80" className={`w-full text-2xl font-light bg-transparent border-b outline-none text-center pb-1 transition-colors ${darkMode ? 'border-gray-600 focus:border-gray-300' : 'border-gray-200 focus:border-gray-800'}`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>PULS</label>
              <input type="number" value={puls} onChange={(e) => setPuls(e.target.value)} placeholder="60" className={`w-full text-2xl font-light bg-transparent border-b outline-none text-center pb-1 transition-colors ${darkMode ? 'border-gray-600 focus:border-gray-300' : 'border-gray-200 focus:border-gray-800'}`} />
            </div>
          </div>

          <div className="flex gap-2">
            {editId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className={`px-4 rounded-xl flex items-center justify-center transition-all active:scale-[0.98] ${darkMode ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            )}
            <button type="submit" className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${darkMode ? 'bg-white text-[#424242] hover:bg-gray-200' : 'bg-[#424242] text-white hover:bg-black'}`}>
              {editId ? <Pencil size={18} strokeWidth={1.5} /> : <Plus size={18} strokeWidth={1.5} />}
              <span className="font-normal">{editId ? 'Aktualisieren' : 'Speichern'}</span>
            </button>
          </div>
        </form>

        {/* List */}
        <div className="space-y-3">
          <div className="flex justify-between items-center mb-4 no-print">
            <h2 className={`text-sm font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Verlauf</h2>
            {importing && <Loader2 className={`w-4 h-4 animate-spin ${darkMode ? 'text-white' : 'text-black'}`} />}
          </div>

          {loading ? (<div className="py-10 flex justify-center opacity-50"><Loader2 className="animate-spin" /></div>) : entries.length === 0 ? (
            <div className={`text-center py-10 font-light ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}> Keine Einträge vorhanden </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className={`group relative flex items-center justify-between p-3 sm:p-4 rounded-xl transition-all print-item ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-gray-50'} shadow-sm border border-transparent ${editId === entry.id ? (darkMode ? 'border-blue-500/50 bg-blue-500/5' : 'border-blue-200 bg-blue-50') : 'hover:border-gray-200/50'}`}>
                <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                  <div className={`w-1.5 h-10 rounded-full ${getStatusColor(entry.sys, entry.dia)} opacity-80 no-print flex-shrink-0`}></div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
                      <span className="text-xl font-normal leading-none">{entry.sys}</span>
                      <span className={`text-sm font-light leading-none ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>/</span>
                      <span className="text-xl font-normal leading-none">{entry.dia}</span>
                      <span className={`text-xs ml-0.5 font-light ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>mmHg</span>
                    </div>
                    <div className={`text-xs font-light mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(entry.date)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1">
                      <Heart size={12} className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} no-print`} fill="currentColor" />
                      <span className="text-lg font-light leading-none">{entry.puls}</span>
                    </div>
                    <span className={`text-[10px] font-light ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>BPM</span>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-40 sm:group-hover:opacity-100 transition-opacity no-print">
                    <button onClick={() => handleEdit(entry)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}>
                      <Pencil size={16} strokeWidth={1.5} />
                    </button>
                    <button onClick={() => requestDelete(entry.id)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}>
                      <Trash2 size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="fixed bottom-8 right-8 z-50 no-print w-14 h-14 flex items-center justify-center">
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out z-0 ${showMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button onClick={openExportModal} className={`absolute w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`} style={{ transform: showMenu ? 'translate(0px, -85px)' : 'translate(0,0) scale(0)', transitionDelay: showMenu ? '0ms' : '100ms' }} title="Download JSON">
            <Download size={20} strokeWidth={1.5} />
          </button>
          <button onClick={triggerImport} className={`absolute w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${darkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'}`} style={{ transform: showMenu ? 'translate(-60px, -60px)' : 'translate(0,0) scale(0)', transitionDelay: '50ms' }} title="Import JSON">
            <Upload size={20} strokeWidth={1.5} />
          </button>
          <button onClick={handlePrint} className={`absolute w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${darkMode ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'}`} style={{ transform: showMenu ? 'translate(-85px, 0px)' : 'translate(0,0) scale(0)', transitionDelay: showMenu ? '100ms' : '0ms' }} title="PDF / Drucken">
            <FileText size={20} strokeWidth={1.5} />
          </button>
        </div>
        <button onClick={() => setShowMenu(!showMenu)} className={`relative z-20 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${darkMode ? 'bg-white text-[#424242]' : 'bg-[#424242] text-white'}`}>
          <div className={`transition-transform duration-300 ${showMenu ? 'rotate-90' : 'rotate-0'}`}> {showMenu ? <X size={24} strokeWidth={1.5} /> : <Share2 size={24} strokeWidth={1.5} />} </div>
        </button>
      </div>
    </div>
  );
};

export default App;
