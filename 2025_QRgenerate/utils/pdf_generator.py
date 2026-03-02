import io
import qrcode
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

# Register Japanese font
# Try to register Noto Sans CJK or IPAexGothic. 
# In the Dockerfile we installed fonts-noto-cjk and fonts-ipafont-gothic.
# Common paths:
# /usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc
# /usr/share/fonts/opentype/ipafont-gothic/ipag.ttf
try:
    pdfmetrics.registerFont(TTFont('Japanese', '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf'))
except:
    try:
        pdfmetrics.registerFont(TTFont('Japanese', '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'))
    except:
        # Fallback for local testing if fonts are not found (e.g. Mac)
        pass

def generate_pdf(store_name, purpose, url):
    """
    Generates a PDF for a single store.
    Returns the PDF content as bytes.
    """
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # 1. Generate QR Code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert PIL image to ReportLab ImageReader
    # We need to save it to a buffer first or convert directly
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format='PNG')
    qr_buffer.seek(0)
    qr_image_reader = ImageReader(qr_buffer)

    # 2. Draw QR Code
    # Size: 50mm x 50mm
    # Position: Top 100mm (from top edge). 
    # ReportLab coordinates start from bottom-left.
    # Top 100mm means y = height - 100mm - 50mm (since image draws from bottom-left of the rect)
    # Wait, "Position: ページ上端から 100mm の位置に配置" usually means the top of the element is at 100mm.
    # So y = height - 100mm - 50mm.
    qr_size = 50 * mm
    qr_y = height - 100 * mm - qr_size
    qr_x = (width - qr_size) / 2
    c.drawImage(qr_image_reader, qr_x, qr_y, width=qr_size, height=qr_size)

    # 3. Draw Text
    # Font settings
    try:
        c.setFont('Japanese', 24)
    except:
        c.setFont('Helvetica-Bold', 24) # Fallback

    # Store Name
    # Position: QR Code bottom + 10mm. 
    # "QRコードの下 10mm" -> 10mm below the bottom of QR code.
    # So y = qr_y - 10mm - text_height (approx).
    # Text drawing is usually baseline.
    # Let's approximate baseline.
    text_y_start = qr_y - 10 * mm
    
    # Center align text
    c.drawCentredString(width / 2, text_y_start - 24, store_name) # 24pt approx height

    # Purpose
    try:
        c.setFont('Japanese', 18)
    except:
        c.setFont('Helvetica', 18) # Fallback
    
    purpose_y_start = text_y_start - 24 - 10 * mm # 10mm below store name
    c.drawCentredString(width / 2, purpose_y_start - 18, purpose)

    c.showPage()
    c.save()
    
    buffer.seek(0)
    return buffer.getvalue()
