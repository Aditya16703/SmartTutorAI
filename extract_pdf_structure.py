import PyPDF2

def extract_pdf_toc(file_path):
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            # Try to read the first 10 pages to find the Table of Contents
            toc_text = ""
            for i in range(min(15, len(reader.pages))):
                toc_text += f"\n--- Page {i+1} ---\n"
                toc_text += reader.pages[i].extract_text()
            return toc_text
    except Exception as e:
        return str(e)

file_path = r'c:\Users\ac341\edu-assistant-genai-main\185cdbb0-957f-44fd-8def-0f28500e2786_Report_.pdf'
structure = extract_pdf_toc(file_path)

with open('pdf_structure.txt', 'w', encoding='utf-8') as f:
    f.write(structure)

print("Structure extracted to pdf_structure.txt")
