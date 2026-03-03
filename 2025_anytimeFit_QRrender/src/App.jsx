import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FileDown, RefreshCw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import CSVUploader from './components/CSVUploader';
import DataPreview from './components/DataPreview';
import PDFDocument from './components/PDFDocument';

function App() {
    const [csvData, setCsvData] = useState([]);
    const [qrImages, setQrImages] = useState({});
    const [isGenerating, setIsGenerating] = useState(false);

    const generateQRCodes = async (data) => {
        setIsGenerating(true);
        const images = {};

        try {
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const baseUrl = row['QRコード生成用URL'];

                if (!baseUrl) continue;

                // Generate 3 types of QR codes
                const types = ['visit', 'mission', 'fo'];
                images[i] = {};

                for (const type of types) {
                    // Append query param for type
                    // Check if url already has params
                    const separator = baseUrl.includes('?') ? '&' : '?';
                    const url = `${baseUrl}${separator}type=${type}`;

                    try {
                        const dataUrl = await QRCode.toDataURL(url, {
                            width: 400,
                            margin: 2,
                            color: {
                                dark: '#000000',
                                light: '#ffffff',
                            },
                        });
                        images[i][type] = dataUrl;
                    } catch (err) {
                        console.error(`Error generating QR for row ${i} type ${type}:`, err);
                    }
                }
            }
            setQrImages(images);
        } catch (error) {
            console.error('Error in QR generation process:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDataLoaded = (data) => {
        setCsvData(data);
        generateQRCodes(data);
    };

    return (
        <div className="min-h-screen text-slate-100 p-8 pb-20">
            <div className="container mx-auto max-w-5xl">
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12 pt-10"
                >
                    <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30">
                        <Sparkles size={20} />
                    </div>
                    <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                        QR Generator Pro
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Upload your store list CSV to automatically generate Visit, Mission, and FO QR codes in a print-ready PDF.
                    </p>
                </motion.header>

                <main className="space-y-8">
                    <CSVUploader onDataLoaded={handleDataLoaded} />

                    <AnimatePresence>
                        {csvData.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-8"
                            >
                                <DataPreview data={csvData} />

                                <div className="flex justify-center pt-8">
                                    {isGenerating ? (
                                        <div className="flex items-center gap-3 px-8 py-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                            <RefreshCw className="animate-spin text-indigo-400" />
                                            <span className="text-slate-300">Generating QR Codes...</span>
                                        </div>
                                    ) : (
                                        <PDFDownloadLink
                                            document={<PDFDocument data={csvData} qrImages={qrImages} />}
                                            fileName="store_qr_codes.pdf"
                                            className="btn btn-primary text-lg group"
                                        >
                                            {({ blob, url, loading, error }) =>
                                                loading ? (
                                                    <>
                                                        <RefreshCw className="animate-spin" />
                                                        Preparing PDF...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FileDown className="group-hover:scale-110 transition-transform" />
                                                        Download PDF
                                                    </>
                                                )
                                            }
                                        </PDFDownloadLink>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}

export default App;
