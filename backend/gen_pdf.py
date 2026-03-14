from fpdf import FPDF
import os

os.makedirs("static", exist_ok=True)

pdf = FPDF()
pdf.add_page()
pdf.set_font("Helvetica", "B", 20)
pdf.cell(0, 15, "Employee Resume", new_x="LMARGIN", new_y="NEXT", align="C")
pdf.ln(5)

pdf.set_font("Helvetica", "B", 14)
pdf.cell(0, 10, "Rahul Kumar", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 11)
pdf.cell(0, 7, "Senior Software Engineer | Engineering Department", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 7, "Email: rahul.kumar@canopy.io | Phone: +91 98765 43210", new_x="LMARGIN", new_y="NEXT")
pdf.ln(5)

pdf.set_font("Helvetica", "B", 12)
pdf.cell(0, 8, "Professional Summary", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 10)
pdf.multi_cell(0, 6, "Experienced software engineer with 5+ years of expertise in full-stack development, cloud computing, and AI/ML technologies. Proven track record of delivering scalable solutions and leading cross-functional teams.")
pdf.ln(3)

pdf.set_font("Helvetica", "B", 12)
pdf.cell(0, 8, "Skills", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 10)
pdf.multi_cell(0, 6, "Python, JavaScript, TypeScript, React, Node.js, FastAPI, PostgreSQL, AWS, Docker, Kubernetes, Machine Learning, TensorFlow, CI/CD, Git, Agile/Scrum")
pdf.ln(3)

pdf.set_font("Helvetica", "B", 12)
pdf.cell(0, 8, "Experience", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "B", 10)
pdf.cell(0, 7, "Canopy Technologies - Senior Software Engineer (2021 - Present)", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 10)
pdf.multi_cell(0, 6, "- Led development of the HR Intelligence platform serving 500+ employees\n- Architected microservices infrastructure reducing deployment time by 60%\n- Mentored 4 junior developers and established coding standards")
pdf.ln(2)
pdf.set_font("Helvetica", "B", 10)
pdf.cell(0, 7, "TechStar Solutions - Software Engineer (2019 - 2021)", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 10)
pdf.multi_cell(0, 6, "- Built RESTful APIs handling 10K+ requests/minute\n- Implemented automated testing pipeline with 95% coverage\n- Collaborated with product team to deliver 3 major feature releases")
pdf.ln(3)

pdf.set_font("Helvetica", "B", 12)
pdf.cell(0, 8, "Education", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 10)
pdf.cell(0, 7, "B.Tech Computer Science - IIT Delhi (2015-2019) | CGPA: 8.7/10", new_x="LMARGIN", new_y="NEXT")
pdf.ln(3)

pdf.set_font("Helvetica", "B", 12)
pdf.cell(0, 8, "Certifications", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 10)
pdf.cell(0, 7, "AWS Solutions Architect | Google Cloud Professional | Certified Kubernetes Admin", new_x="LMARGIN", new_y="NEXT")

pdf.output("static/sample_resume.pdf")
print("Sample resume PDF created!")
