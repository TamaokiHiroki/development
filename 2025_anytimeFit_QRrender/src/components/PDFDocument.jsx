import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { QRCodeCanvas } from 'qrcode.react';

// Create styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
    },
    card: {
        marginBottom: 20,
        padding: 20,
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        height: '33%', // Roughly 3 items per page if we wanted, but let's do 1 item per page or section
    },
    header: {
        fontSize: 24,
        marginBottom: 10,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    subHeader: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 20,
        textAlign: 'center',
    },
    qrContainer: {
        marginVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qrImage: {
        width: 200,
        height: 200,
    },
    codeText: {
        fontSize: 18,
        marginTop: 10,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
    },
    typeLabel: {
        fontSize: 12,
        padding: 6,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
        marginTop: 10,
        color: '#475569',
    },
    storeInfo: {
        marginTop: 20,
        fontSize: 10,
        color: '#94A3B8',
        textAlign: 'center',
    }
});

// Helper to generate QR Data URL
// Since @react-pdf/renderer needs an image source, we can't use the component directly inside the PDF.
// We'll handle the QR generation logic in the main app or a helper, but for now let's assume we pass data URLs.
// Actually, to make it self-contained, we might need to generate these images before rendering the PDF.
// However, a common pattern is to use a canvas to generate the data URL. 
// Given the constraints, I'll create a component that renders the PDF structure.
// The actual QR code image generation will happen in the App component and passed down, 
// OR we can use a library that generates SVG/PNG strings. 
// `qrcode` (npm) is good for this. Let's assume we receive the data URLs for the QRs.

const PDFDocument = ({ data, qrImages }) => (
    <Document>
        {data.map((store, index) => {
            const storeQRs = qrImages[index] || {};
            const types = [
                { key: 'visit', label: '来店用 (Visit)' },
                { key: 'mission', label: 'ミッション用 (Mission)' },
                { key: 'fo', label: 'FO用 (FO)' }
            ];

            return types.map((type) => (
                <Page key={`${index}-${type.key}`} size="A4" style={styles.page}>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={styles.header}>{store['店舗名']}</Text>
                        <Text style={styles.subHeader}>{store['カテゴリ']}</Text>

                        <View style={styles.qrContainer}>
                            {storeQRs[type.key] ? (
                                <Image src={storeQRs[type.key]} style={styles.qrImage} />
                            ) : (
                                <Text>Loading QR...</Text>
                            )}
                        </View>

                        <Text style={styles.codeText}>{store['文字列']}</Text>

                        <View style={{ marginTop: 20 }}>
                            <Text style={styles.typeLabel}>{type.label}</Text>
                        </View>

                        <Text style={styles.storeInfo}>{store['店舗住所']}</Text>
                    </View>
                </Page>
            ));
        })}
    </Document>
);

export default PDFDocument;
