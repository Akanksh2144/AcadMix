import fitz

# Create a small valid PDF in memory
doc = fitz.open()
page = doc.new_page()
page.insert_text((50, 50), "Hello from PyMuPDF", fontsize=12)
pdf_bytes = doc.write()

# Now try extracting using our exact code
try:
    doc_out = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = []
    for page_out in doc_out:
        text = page_out.get_text()
        if text:
            pages.append(text)
    full_text = "\n".join(pages).strip()
    print("Extracted text:", full_text)
except Exception as e:
    print("Error:", e)
