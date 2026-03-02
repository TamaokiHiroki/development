import pandas as pd
import os
import zipfile
import tempfile
from datetime import datetime
from utils.pdf_generator import generate_pdf

# Mock data
data = {
    "store_name": ["Test Store A", "Test Store B"],
    "purpose": ["Survey", "Registration"],
    "url": ["https://example.com/a", "https://example.com/b"]
}
df = pd.DataFrame(data)

print("Starting local verification...")

# Create a temporary directory for the ZIP
output_dir = "output"
os.makedirs(output_dir, exist_ok=True)
zip_filename = f"qr_codes_test.zip"
zip_path = os.path.join(output_dir, zip_filename)

try:
    with zipfile.ZipFile(zip_path, 'w') as zipf:
        total_rows = len(df)
        for index, row in df.iterrows():
            print(f"Generating PDF for {row['store_name']}...")
            pdf_bytes = generate_pdf(row['store_name'], row['purpose'], row['url'])
            
            safe_store_name = "".join([c for c in row['store_name'] if c.isalnum() or c in (' ', '-', '_')]).strip()
            safe_purpose = "".join([c for c in row['purpose'] if c.isalnum() or c in (' ', '-', '_')]).strip()
            pdf_filename = f"{safe_store_name}_{safe_purpose}.pdf"
            
            zipf.writestr(pdf_filename, pdf_bytes)
    
    print(f"Verification successful! ZIP created at {zip_path}")

except Exception as e:
    print(f"Verification failed: {e}")
