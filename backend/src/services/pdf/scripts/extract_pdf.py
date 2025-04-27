import sys
import json
import fitz

def extract_pdf(pdf_path, output_path):
    try:
        doc = fitz.open(pdf_path)
        result = {
            "text":"",
            "pageCount":len(doc),
            "metadata":{
                "title": doc.metadata.get("title", ""),
                "author": doc.metadata.get("author", ""),
                "subject": doc.metadata.get("subject",""),
                "keywords": doc.metadata.get("keywords",""),
            },
            "pages":[],
            "sections":[]
        }

        full_text = ""
        for page_num, page, in enumerate(doc):
            text = page.get_text()
            full_text += text 

            blocks = page.get_text("blocks")
            result["pages"].append({
                "pageNum": page_num + 1,
                "text": text,
                "blocks": [
                    {"text": b[4], "x0":b[0],"y0":b[1],"x1":b[2],"y1":b[3]}
                    for b in blocks 
                ]
            })

            result["text"] = full_text 

            section_headers = [
                "Abstract", "Introduction", "Background", "Related work", 
                "Method", "Methodology", "Experiment", "Experiments",
                "Implementation", "Result", "Results", "Discussion",
                "Conclusion", "Conclusions", "References"
            ]


            sections = []
            current_section = {"name":"Header", "content": ""}
            lines = full_text.split('\n')


            for line in lines:
                trimmed = line.strip()
                is_section = False

                for header in section_headers:
                    if trimmed.lower().startswith(header.lower()) and len(trimmed) < 30:
                        if current_section_section["content"].strip():
                            sections.append(current_section)


                        current_section = {"name": trimmed, "content": ""}
                        is_section = True 
                        break 

                if not is_section: 
                    current_section["content"] += line + "\n"

            if current_section["content"].strip():
                sections,append(current_section)

            result["sections"] = sections

            with open(output_path,'w',encoding='utf-8') as f:
                json.dump(result,f,ensure_ascii=False, indent =2)

            return True

        if __name__ == "__main__":
            if len(sys.argv) != 3:
                print("Usage: python extract_pdf.py <pdf_path> <output_path>")
                sys.exit(1)

            pdf_path = sys.argv[1]
            output_path = sys.argv[2]

            success = extract_pdf(pdf_path,output_path)
            sys.exit(0 if success else 1)



