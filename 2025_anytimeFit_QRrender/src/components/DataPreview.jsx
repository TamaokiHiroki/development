import React from 'react';
import { motion } from 'framer-motion';
import { FileText, MapPin, Link as LinkIcon, Tag } from 'lucide-react';

const DataPreview = ({ data }) => {
    if (!data || data.length === 0) return null;

    // Get headers from the first item
    const headers = Object.keys(data[0]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-panel p-6 mt-8 overflow-hidden"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                    <FileText className="text-indigo-400" />
                    Data Preview
                    <span className="text-sm font-normal text-slate-400 ml-2">
                        ({data.length} records found)
                    </span>
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-700/50 text-slate-400 text-sm uppercase tracking-wider">
                            {headers.map((header) => (
                                <th key={header} className="p-4 font-medium whitespace-nowrap">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {data.slice(0, 5).map((row, index) => (
                            <tr
                                key={index}
                                className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                            >
                                {headers.map((header) => (
                                    <td key={`${index}-${header}`} className="p-4 whitespace-nowrap max-w-[200px] truncate">
                                        {row[header]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {data.length > 5 && (
                    <div className="p-4 text-center text-slate-500 text-sm bg-slate-800/20">
                        ...and {data.length - 5} more records
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default DataPreview;
