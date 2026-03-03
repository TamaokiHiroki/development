import React, { useCallback } from 'react';
import Papa from 'papaparse';
import { Upload, FileUp } from 'lucide-react';
import { motion } from 'framer-motion';

const CSVUploader = ({ onDataLoaded }) => {
  const handleFileUpload = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Basic validation could go here
        console.log('Parsed results:', results);
        if (results.data && results.data.length > 0) {
          onDataLoaded(results.data);
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file');
      }
    });
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      handleFileUpload(file);
    } else {
      alert('Please upload a valid CSV file');
    }
  }, []);

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel p-12 text-center border-2 border-dashed border-slate-700 hover:border-indigo-500 transition-colors cursor-pointer relative group"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <input
        type="file"
        accept=".csv"
        onChange={onFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform duration-300">
          <Upload size={48} />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Upload CSV File</h3>
          <p className="text-slate-400">Drag and drop your CSV file here, or click to browse</p>
        </div>
        <div className="text-xs text-slate-500 mt-4 bg-slate-800/50 px-4 py-2 rounded-lg">
          Required columns: Category, 店舗名, 店舗住所, 文字列, QRコード生成用URL
        </div>
      </div>
    </motion.div>
  );
};

export default CSVUploader;
