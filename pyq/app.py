from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import scraper
import cleaner
import time
import glob

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app) # Enable CORS for development flexibility

@app.route('/')
def root():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/scrape', methods=['POST'])
def scrape():
    url = request.json.get('url')
    if not url: return jsonify({'error': 'No URL provided'}), 400
    
    print(f"Scraping {url}...")
    
    # 1. Scrape
    # output_dir inside 'scraped_data' to keep root clean
    scr = scraper.QuizScraper(output_dir="scraped_data") 
    raw_data = scr.scrape_paper(url, save_to_disk=True)
    
    if not raw_data:
        return jsonify({'error': 'Scraping failed or no data found'}), 500
        
    local_path = raw_data.get('local_file_path')
    # images are relative to this folder
    local_dir_for_images = os.path.dirname(local_path) 
    
    print(f"cleaning data from {local_path}")
    
    # 2. Clean
    clean_json, _ = cleaner.process_data(raw_data, local_dir_for_images)
    
    # Fix image paths for the preview:
    # clean_json has paths like 'images/foo.png'.
    # This refers to 'scraped_data/temp_XXX/images/foo.png'.
    # We need to tell the frontend where these images are.
    # Actually, cleaner.py returns relative paths that assume the starting point.
    # If we serve 'scraped_data' under '/scraped_data', we need to prepend the folder name.
    
    relative_dir = os.path.relpath(local_dir_for_images, os.getcwd())
    # e.g. scraped_data/temp_123456
    
    # Update image paths in clean_json to be server-relative URL
    # We simply prefix the relative_dir to the local image paths
    # cleaner.py returns 'images/filename.png' or cdn url.
    
    def fix_img_path(obj):
        if isinstance(obj, dict):
            for k, v in obj.items():
                if k == 'images' and isinstance(v, list):
                    obj[k] = [fix_single_path(i) for i in v]
                elif k == 'image' and isinstance(v, str):
                    obj[k] = fix_single_path(v)
                elif isinstance(v, (dict, list)):
                    fix_img_path(v)
        elif isinstance(obj, list):
            for item in obj:
                fix_img_path(item)
                
    def fix_single_path(p):
        if not p: return p
        if p.startswith('http'): return p
        # It's a local path 'images/foo.png'
        # We need to construct '/scraped_data/temp_XXX/images/foo.png'
        return f"/{relative_dir}/{p}"
        
    fix_img_path(clean_json)

    return jsonify({'data': clean_json})

def convert_to_practice_format(clean_data):
    meta = clean_data['metadata']
    exam_uuid = f"custom-{int(time.time())}"
    
    # Sanitize title
    title = meta.get('paper_name', 'Custom Exam')
    
    new_exam = {
        "id": exam_uuid,
        "title": title,
        "subject": meta.get('subject', 'Unknown'),
        "year": str(meta.get('year', 2024)),
        "duration": meta.get('duration', 60),
        "marks": meta.get('total_marks', 0),
        "questions": []
    }

    for idx, q in enumerate(clean_data['questions']):
        # Embed images in text
        text = q['text']
        if q.get('images'):
            for img_url in q['images']:
                text += f"\n\n![Image]({img_url})"
        
        # Options
        options_text = []
        correct_indices = []
        
        for i, opt in enumerate(q['options']):
            opt_txt = opt['text'] or ""
            if opt.get('image'):
                opt_txt += f" ![Image]({opt['image']})"
            options_text.append(opt_txt)
            if opt['is_correct']:
                correct_indices.append(i)
        
        new_q = {
            "id": f"{exam_uuid}-q{idx+1}",
            "subject": meta.get('subject'),
            "type": q['type'],
            "marks": q['marks'],
            "year": str(meta.get('year')),
            "level": "Foundation",
            "text": text,
            "options": options_text,
        }
        
        if q['type'] in ['MCQ', 'Boolean']:
            if correct_indices:
                new_q['correctIndex'] = correct_indices[0]
        elif q['type'] == 'MSQ':
             # Practice parser might need array for MSQ?
             # Based on practice.js: isOptionSelected compares with array.
             # But 'correctIndex' standard implies one.
             # If MSQ is used, we might need to adjust practice.js or send an array here?
             # ct.json example didn't have MSQ.
             # Let's hope practice.js handles `correctIndex` as array if needed or we add `correctIndices`
             new_q['correctIndex'] = correct_indices # Store list
        elif q['type'] == 'NAT':
            new_q['correctValue'] = q['correct_answer']
        
        new_exam['questions'].append(new_q)
        
    return new_exam

@app.route('/api/save', methods=['POST'])
def save():
    clean_data = request.json.get('data')
    if not clean_data: return jsonify({'error': 'No data'}), 400
    
    try:
        practice_exam = convert_to_practice_format(clean_data)
        subject_name = practice_exam['subject']
        
        # Find Subject File
        target_file = None
        target_data = None
        
        subjects_dir = "subjects"
        if not os.path.exists(subjects_dir): os.makedirs(subjects_dir)
        
        # 1. Search existing
        for file in glob.glob(os.path.join(subjects_dir, "*.json")):
            try:
                with open(file, 'r') as f:
                    d = json.load(f)
                    if d.get('meta', {}).get('name') == subject_name:
                        target_file = file
                        target_data = d
                        break
            except: pass
            
        # 2. If not found, create new?
        if not target_file:
            # Create slug
            slug = "".join([c for c in subject_name if c.isalnum()]).lower()
            target_file = os.path.join(subjects_dir, f"{slug}.json")
            target_data = {
                "meta": {
                    "id": slug,
                    "name": subject_name,
                    "code": slug.upper(), # Placeholder
                    "level": "Unknown",
                    "color": "text-gray-400"
                },
                "exams": []
            }
            
        # 3. Append
        # Check if exam with this id already exists? We generated a unique time-based ID so mostly safe.
        target_data['exams'].append(practice_exam)
        
        with open(target_file, 'w') as f:
            json.dump(target_data, f, indent=2)
            
        return jsonify({'success': True, 'file': target_file, 'examId': practice_exam['id']})
        
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Flask Server...")
    print("Open http://localhost:5000/scrape.html")
    app.run(debug=True, port=5000)
