import json
import os
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

def process_data(data, source_dir):
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

def process_file(filepath):
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return None, []

    source_dir = os.path.dirname(filepath)
    return process_data(data, source_dir)
