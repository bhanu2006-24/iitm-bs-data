import os
import json
import glob
from collections import defaultdict

# Configuration
# Script is in scripts/, so data dirs are one level up
SOURCE_DIRS = [
    '../quiz1',
    '../Quiz_2',
    '../End_Term'
]
OUTPUT_DIR = '../subjects'
BASE_IMAGE_URL = "https://saram.blr1.cdn.digitaloceanspaces.com"

# Subject normalization mapping
SUBJECT_MAPPING = {
    # Foundation
    'maths1': 'maths1', 'math1': 'maths1', 'mathematics1': 'maths1', 'mathematics_for_data_science_1': 'maths1',
    'stats1': 'stats1', 'statistics1': 'stats1', 'statistics_for_data_science_1': 'stats1',
    'ct': 'ct', 'computational_thinking': 'ct',
    'english1': 'english1', 'english_1': 'english1',
    'maths2': 'maths2', 'math2': 'maths2', 'mathematics2': 'maths2', 'mathematics_for_data_science_2': 'maths2',
    'stats2': 'stats2', 'statistics2': 'stats2', 'statistics_for_data_science_2': 'stats2',
    'python': 'python', 'python_programming': 'python', 'intro_to_python': 'python',
    'english2': 'english2', 'english_2': 'english2',
    
    # Diploma
    'dbms': 'dbms', 'database_management_systems': 'dbms',
    'pdsa': 'pdsa', 'programming_data_structures_algorithms': 'pdsa',
    'appdev1': 'appdev1', 'application_development_1': 'appdev1', 'app_dev1': 'appdev1',
    'sc': 'system_commands', 'system_commands': 'system_commands', 'intro_to_linux': 'system_commands',
    'appdev2': 'appdev2', 'application_development_2': 'appdev2', 'app_dev2': 'appdev2',
    'java': 'java', 'java_programming': 'java',
    'mlf': 'mlf', 'machine_learning_foundations': 'mlf',
    'bdm': 'bdm', 'business_data_management': 'bdm',
    'mlt': 'mlt', 'machine_learning_techniques': 'mlt',
    'mlp': 'mlp', 'machine_learning_practice': 'mlp',
    'tds': 'tds', 'tools_in_data_science': 'tds',
    'ba': 'business_analytics', 'business_analytics': 'business_analytics', 'market_research': 'business_analytics',
    'sw_testing': 'sw_testing', 'sw_engg': 'sw_engg',
    'system_commands': 'system_commands',
}

SUBJECT_META = {
    'maths1': {'name': 'Mathematics for Data Science I', 'code': 'MA1001'},
    'stats1': {'name': 'Statistics for Data Science I', 'code': 'ST1001'},
    'ct': {'name': 'Computational Thinking', 'code': 'CS1001'},
    'english1': {'name': 'English I', 'code': 'EN1001'},
    'maths2': {'name': 'Mathematics for Data Science II', 'code': 'MA1002'},
    'stats2': {'name': 'Statistics for Data Science II', 'code': 'ST1002'},
    'python': {'name': 'Programming in Python', 'code': 'CS1002'},
    'english2': {'name': 'English II', 'code': 'EN1002'},
    'dbms': {'name': 'Database Management Systems', 'code': 'CS2001'},
    'pdsa': {'name': 'Programming, Data Structures and Algorithms', 'code': 'CS2002'},
    'appdev1': {'name': 'Application Development I', 'code': 'CS2003'},
    'system_commands': {'name': 'System Commands', 'code': 'CS2004'},
    'appdev2': {'name': 'Application Development II', 'code': 'CS2005'},
    'java': {'name': 'Programming in Java', 'code': 'CS2006'},
    'mlf': {'name': 'Machine Learning Foundations', 'code': 'CS2007'},
    'bdm': {'name': 'Business Data Management', 'code': 'MS2001'},
    'mlt': {'name': 'Machine Learning Techniques', 'code': 'CS2008'},
    'mlp': {'name': 'Machine Learning Practice', 'code': 'CS2009'},
    'tds': {'name': 'Tools in Data Science', 'code': 'CS2010'},
    'business_analytics': {'name': 'Business Analytics', 'code': 'MS2002'},
    'sw_testing': {'name': 'Software Testing', 'code': 'CS3001'}, 
    'sw_engg': {'name': 'Software Engineering', 'code': 'CS3002'}
}

# Add default allow for anything in mapping values
ALLOWED_SUBJECTS = set(SUBJECT_MAPPING.values())

def normalize_subject(folder_name):
    lower_name = folder_name.lower().replace(' ', '_')
    mapped = SUBJECT_MAPPING.get(lower_name)
    if mapped:
        return mapped
    # Heuristics
    if 'math' in lower_name and '1' in lower_name: return 'maths1'
    if 'math' in lower_name and '2' in lower_name: return 'maths2'
    if 'stat' in lower_name and '1' in lower_name: return 'stats1'
    if 'stat' in lower_name and '2' in lower_name: return 'stats2'
    return None

def get_full_image_url(path):
    if not path:
        return None
    if isinstance(path, list):
        path = path[0] 
    if path.startswith('http'):
        return path
    return f"{BASE_IMAGE_URL}{path}" if path.startswith('/') else f"{BASE_IMAGE_URL}/{path}"

def clean_question(q, exam_type, paper_name, year):
    # Handle comprehension/parent questions
    context = ""
    if q.get('parent_question'):
        pq = q['parent_question']
        p_text = pq.get('question_text_1') or ""
        p_images = pq.get('question_image_url') or []
        
        if p_text:
            context += f"<div class='context-text'>{p_text}</div>"
        for img in p_images:
            img_url = get_full_image_url(img)
            context += f"<div class='context-image'><img src='{img_url}' /></div>"
    
    # Main question
    q_text = q.get('question_text_1') or ""
    if not q_text and q.get('question_texts'):
        q_text = " ".join(q['question_texts'])
    
    q_images = []
    if q.get('question_image_url'):
        for img in q['question_image_url']:
            q_images.append(get_full_image_url(img))
    elif q.get('question_image_1'):
         q_images.append(get_full_image_url("/question_images/" + q['question_image_1']))

    # Options
    options = []
    if q.get('options'):
        for opt in q['options']:
            opt_img = None
            if opt.get('option_image_url'):
                opt_img = get_full_image_url(opt['option_image_url'])
            elif opt.get('option_image'):
                 if not opt['option_image'].startswith('http') and not opt['option_image'].startswith('/'):
                     opt_img = get_full_image_url("/app/option_images/" + opt['option_image'])
                 else:
                     opt_img = get_full_image_url(opt['option_image'])
            
            options.append({
                'id': opt.get('id'),
                'text': opt.get('option_text', ''),
                'image': opt_img,
                'is_correct': opt.get('is_correct') == 1 or opt.get('is_correct') is True
            })

    # Answer for non-MCQ
    answer = {}
    if q.get('question_type') in ['NAT', 'SA', 'Numeric']:
        answer = {
            'value_start': q.get('value_start'),
            'value_end': q.get('value_end'),
            'answer_type': q.get('answer_type')
        }
    
    # Marks
    marks = q.get('total_mark')

    return {
        'id': q.get('id'),
        'type': q.get('question_type'),
        'context': context,
        'question': q_text,
        'images': q_images,
        'options': options,
        'answer': answer,
        'marks': marks
    }

def main():
    abs_output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), OUTPUT_DIR))
    if not os.path.exists(abs_output_dir):
        os.makedirs(abs_output_dir)
        print(f"Created output directory: {abs_output_dir}")

    # Structure: subject_key -> { paper_key -> { metadata, questions: [] } }
    data_store = defaultdict(lambda: defaultdict(lambda: {'metadata': {}, 'questions': []}))
    
    for source_dir in SOURCE_DIRS:
        abs_source_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), source_dir))
        if not os.path.exists(abs_source_dir):
            print(f"Directory not found: {abs_source_dir}")
            continue
            
        dir_name_base = os.path.basename(abs_source_dir) # quiz1, Quiz_2
        # Clean exam type string
        exam_type_clean = dir_name_base.replace('_', ' ').replace('  ', ' ').strip().title()
        
        print(f"Processing {exam_type_clean}...")
        
        for subject_folder in os.listdir(abs_source_dir):
            subject_path = os.path.join(abs_source_dir, subject_folder)
            if not os.path.isdir(subject_path):
                continue
            
            norm_subject = normalize_subject(subject_folder)
            if not norm_subject or norm_subject not in ALLOWED_SUBJECTS:
                continue

            json_files = glob.glob(os.path.join(subject_path, "*.json"))
            
            for json_file in json_files:
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    filename = os.path.basename(json_file)
                    unique_id = os.path.splitext(filename)[0] # distinct key for every file

                    raw_paper_name = data.get('question_paper', {}).get('question_paper_name', '')
                    year = data.get('question_paper', {}).get('year', 2024)
                    
                    # Title Logic: Use detailed paper name if available, else filename
                    if raw_paper_name and len(raw_paper_name) > 5:
                        title = raw_paper_name
                    else:
                        title = unique_id.replace('_', ' ')

                    questions = []
                    if 'props' in data and 'question_paper' in data['props'] and 'questions' in data['props']['question_paper']:
                        questions = data['props']['question_paper']['questions']
                    elif 'question_paper' in data and 'questions' in data['question_paper']:
                        questions = data['question_paper']['questions']
                    elif 'questions' in data:
                        questions = data['questions']
                    
                    if not questions:
                        continue

                    # Store paper metadata
                    data_store[norm_subject][unique_id]['metadata'] = {
                        'id': unique_id,
                        'title': title,
                        'exam_type': exam_type_clean,
                        'year': year,
                        'original_name': raw_paper_name
                    }

                    for q in questions:
                        cleaned_q = clean_question(q, exam_type_clean, raw_paper_name, year)
                        data_store[norm_subject][unique_id]['questions'].append(cleaned_q)
                        
                except Exception as e:
                    print(f"Error processing {json_file}: {e}")

    # Write output
    subjects_index = []
    
    for subject, papers_dict in data_store.items():
        subject_info = SUBJECT_META.get(subject, {'name': subject.replace('_',' ').title(), 'code': subject.upper()})
        
        papers_list = []
        for p_key, p_data in papers_dict.items():
            papers_list.append({
                **p_data['metadata'],
                'question_count': len(p_data['questions']),
                'questions': p_data['questions']
            })
            
        # Sort papers: Year DESC, then Title
        papers_list.sort(key=lambda x: (x.get('year', 0), x.get('exam_type', ''), x.get('title', '')), reverse=True)
        
        final_obj = {
            'subject_id': subject,
            'subject_name': subject_info['name'],
            'subject_code': subject_info['code'],
            'papers': papers_list
        }
        
        output_file = os.path.join(abs_output_dir, f"{subject}.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(final_obj, f, indent=2)
            
        subjects_index.append({
            'id': subject,
            'name': subject_info['name'],
            'code': subject_info['code'],
            'paper_count': len(papers_list)
        })
        print(f"Written {subject} with {len(papers_list)} papers")

    # Sort index
    subjects_index.sort(key=lambda x: x['name'])
    
    with open(os.path.join(abs_output_dir, 'subjects_index.json'), 'w', encoding='utf-8') as f:
        json.dump(subjects_index, f, indent=2)
    print("Written subjects_index.json")

if __name__ == "__main__":
    main()
