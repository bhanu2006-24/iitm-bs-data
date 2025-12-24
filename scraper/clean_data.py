import json
import os
import glob
import shutil

CDN_BASE = "https://saram.blr1.cdn.digitaloceanspaces.com"

def clean_image_url(path, source_dir, copy_ops, type='question'):
    """
    Returns the final URL/Path to be used in the JSON.
    Appends (source_path, dest_filename) to copy_ops if local file found.
    """
    if not path:
        return None
    
    # Check Local First
    # User scraper saves to 'images' subdir
    filename = os.path.basename(path)
    local_source = os.path.join(source_dir, "images", filename)
    
    if os.path.exists(local_source):
        # We will copy this to {dest}/images/{filename}
        # URL in json should be "images/{filename}"
        copy_ops.append((local_source, filename))
        return f"images/{filename}"

    # Fallback to CDN
    if path.startswith('http'):
        return path
    path = path.lstrip('/')
    if path.startswith('question_images') or path.startswith('option_images'):
        return f"{CDN_BASE}/{path}"
    if '/' not in path:
        if type == 'question': return f"{CDN_BASE}/question_images/{path}"
        else: return f"{CDN_BASE}/option_images/{path}"
    if path.startswith('app/'):
        return f"{CDN_BASE}/{path.replace('app/', '')}"
    return f"{CDN_BASE}/{path}"

def process_file(filepath):
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return None, []

    source_dir = os.path.dirname(filepath)
    copy_ops = [] # List of (src, dest_filename)

    meta = data.get('metadata', {})
    if not meta:
        return None, []
        
    # Extract Metadata
    clean_meta = {
        "exam": meta.get('exam', {}).get('exam_name'),
        "paper_name": meta.get('question_paper_name'),
        # Ensure subject is defaulted
        "subject": "Unknown",
        "total_marks": meta.get('total_score'),
        "duration": meta.get('duration'),
        "year": meta.get('year')
    }

    # Extract Questions
    questions_raw = data.get('questions', [])
    clean_questions = []

    for q in questions_raw:
        # Determine Subject
        if clean_meta['subject'] == "Unknown" and q.get('course'):
            clean_meta['subject'] = q['course'].get('course_name')

        # Text
        q_text = []
        for i in range(1, 6):
            t = q.get(f'question_text_{i}')
            if t: q_text.append(t)
        if q.get('question_texts') and isinstance(q['question_texts'], list):
             combined = " ".join(q_text)
             for t in q['question_texts']:
                 if t and t not in combined: q_text.append(t)
        friendly_text = " ".join(q_text)

        # Images
        q_images = []
        for i in range(1, 11):
            img = q.get(f'question_image_{i}')
            if img:
                q_images.append(clean_image_url(img, source_dir, copy_ops, 'question'))
        
        # Also check question_image_url list
        if q.get('question_image_url'):
            for img in q.get('question_image_url'):
                q_images.append(clean_image_url(img, source_dir, copy_ops, 'question'))

        # Options
        options_raw = q.get('options', [])
        clean_options = []
        for opt in options_raw:
            clean_options.append({
                "id": opt.get('id'),
                "text": opt.get('option_text'),
                "image": clean_image_url(opt.get('option_image'), source_dir, copy_ops, 'option'),
                "is_correct": bool(opt.get('is_correct')),
            })

        # Logic for Numeric/SA answers
        correct_answer = None
        if q.get('question_type') == 'SA':
            start = q.get('value_start')
            end = q.get('value_end')
            if start and end and start != end:
                correct_answer = f"{start} - {end}"
            elif start:
                correct_answer = str(start)
        
        clean_q = {
            "id": q.get('id'),
            "type": q.get('question_type'),
            "marks": q.get('total_mark'),
            "text": friendly_text,
            "images": q_images,
            "options": clean_options,
            "correct_answer": correct_answer
        }
        clean_questions.append(clean_q)

    return {
        "metadata": clean_meta,
        "questions": clean_questions
    }, copy_ops

def main():
    source_dir = "scraped_data"
    dest_dir = "clean_data"
    
    if not os.path.exists(dest_dir):
        os.makedirs(dest_dir)

    print("Cleaning data...")
    # Walk through all json files
    processed_count = 0
    for root, dirs, files in os.walk(source_dir):
        for file in files:
            if file.endswith(".json"):
                full_path = os.path.join(root, file)
                
                # Process
                clean_json, copy_ops = process_file(full_path)
                if not clean_json:
                    continue
                
                # Save structure: clean_data/{Exam}/{Subject}/{PaperName}.json
                exam = clean_json['metadata']['exam'] or "Other"
                subject = clean_json['metadata']['subject'] or "General"
                paper_name = clean_json['metadata']['paper_name'] or "Untitled"
                
                # Sanitize
                import re
                def sanitize(n): return re.sub(r'[^\w\-_]', '_', str(n))
                
                save_dir = os.path.join(dest_dir, sanitize(exam), sanitize(subject))
                if not os.path.exists(save_dir):
                    os.makedirs(save_dir)
                    
                save_path = os.path.join(save_dir, f"{sanitize(paper_name)}.json")
                
                # Copy Images
                if copy_ops:
                    dest_img_dir = os.path.join(save_dir, "images")
                    if not os.path.exists(dest_img_dir):
                        os.makedirs(dest_img_dir)
                    
                    for src, dest_name in copy_ops:
                        try:
                            shutil.copy2(src, os.path.join(dest_img_dir, dest_name))
                        except Exception as e:
                            print(f"Warning: Failed to copy {dest_name}: {e}")

                with open(save_path, 'w') as f:
                    json.dump(clean_json, f, indent=2)
                
                print(f"Cleaned: {paper_name}")
                if copy_ops:
                    print(f"   -> Copied {len(copy_ops)} local images")
                processed_count += 1
                
    # Generate Static Index for Frontend
    index_path = os.path.join(dest_dir, "papers_index.json")
    papers_list = []
    
    for root, dirs, files in os.walk(dest_dir):
        for file in files:
            if file.endswith(".json") and file != "papers_index.json":
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, start=os.getcwd()) # Relative to project root
                
                try:
                    with open(full_path, 'r') as f:
                        data = json.load(f)
                        meta = data.get('metadata', {})
                        papers_list.append({
                            "path": rel_path,
                            "name": meta.get('paper_name'),
                            "subject": meta.get('subject'),
                            "exam": meta.get('exam'),
                            "year": meta.get('year')
                        })
                except:
                    pass
    
    with open(index_path, 'w') as f:
        json.dump(papers_list, f, indent=2)

    print(f"Done! Cleaned {processed_count} papers. Generated static index at {index_path}")

if __name__ == "__main__":
    main()
