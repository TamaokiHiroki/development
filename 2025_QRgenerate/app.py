import streamlit as st
import pandas as pd
import os
import zipfile
import tempfile
from datetime import datetime
from utils.pdf_generator import generate_pdf
from utils.gcs_handler import upload_to_gcs, generate_signed_url

st.set_page_config(page_title="QR Code PDF Generator", layout="centered")

st.title("QR Code PDF Generator (GCP)")

# Sidebar for configuration
st.sidebar.header("Configuration")
bucket_name = st.sidebar.text_input("GCS Bucket Name", value=os.environ.get("BUCKET_NAME", ""))

uploaded_file = st.file_uploader("Upload CSV", type=["csv"])

if uploaded_file is not None:
    try:
        df = pd.read_csv(uploaded_file)
        st.write("Preview:")
        st.dataframe(df.head())
        
        required_columns = ["store_name", "purpose", "url"]
        if not all(col in df.columns for col in required_columns):
            st.error(f"CSV must contain the following columns: {', '.join(required_columns)}")
        else:
            if st.button("Generate PDFs"):
                if not bucket_name:
                    st.error("Please provide a GCS Bucket Name in the sidebar or set BUCKET_NAME env var.")
                else:
                    progress_bar = st.progress(0)
                    status_text = st.empty()
                    
                    # Create a temporary directory for the ZIP
                    with tempfile.TemporaryDirectory() as tmpdirname:
                        zip_filename = f"qr_codes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
                        zip_path = os.path.join(tmpdirname, zip_filename)
                        
                        with zipfile.ZipFile(zip_path, 'w') as zipf:
                            total_rows = len(df)
                            for index, row in df.iterrows():
                                try:
                                    pdf_bytes = generate_pdf(row['store_name'], row['purpose'], row['url'])
                                    # Sanitize filename
                                    safe_store_name = "".join([c for c in row['store_name'] if c.isalnum() or c in (' ', '-', '_')]).strip()
                                    safe_purpose = "".join([c for c in row['purpose'] if c.isalnum() or c in (' ', '-', '_')]).strip()
                                    pdf_filename = f"{safe_store_name}_{safe_purpose}.pdf"
                                    
                                    zipf.writestr(pdf_filename, pdf_bytes)
                                except Exception as e:
                                    st.warning(f"Failed to generate PDF for row {index}: {e}")
                                
                                # Update progress
                                progress = (index + 1) / total_rows
                                progress_bar.progress(progress)
                                status_text.text(f"Processing {index + 1}/{total_rows}")
                        
                        st.success("PDF generation complete. Uploading to GCS...")
                        
                        try:
                            # Upload to GCS
                            upload_to_gcs(zip_path, zip_filename, bucket_name)
                            
                            # Generate Signed URL
                            download_url = generate_signed_url(zip_filename, bucket_name)
                            
                            st.success("Upload complete!")
                            st.markdown(f"### [Download ZIP File]({download_url})")
                            st.info("This link will expire in 1 hour.")
                            
                        except Exception as e:
                            st.error(f"Failed to upload to GCS: {e}")

    except Exception as e:
        st.error(f"Error reading CSV: {e}")
