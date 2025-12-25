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
# Foundation: Maths1, Stats1, CT, English1, Maths2, Stats2, Python, English2
# Diploma: DBMS, PDSA, AppDev1, System Commands, AppDev2, Java, MLF, BDM, MLT, MLP, TDS, Business Analytics

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
    'ba': 'business_analytics', 'business_analytics': 'business_analytics', 'market_research': 'business_analytics' # approximate
}

ALLOWED_SUBJECTS = {
    'maths1', 'stats1', 'ct', 'english1', 'maths2', 'stats2', 'python', 'english2',
    'dbms', 'pdsa', 'appdev1', 'system_commands', 'appdev2', 'java',
    'mlf', 'bdm', 'mlt', 'mlp', 'tds', 'business_analytics'
}

def normalize_subject(folder_name):
    lower_name = folder_name.lower().replace(' ', '_')
    mapped = SUBJECT_MAPPING.get(lower_name)
    if mapped:
        return mapped
    # Attempt to catch variations if not explicitly mapped
    if 'math' in lower_name and '1' in lower_name: return 'maths1'
    if 'math' in lower_name and '2' in lower_name: return 'maths2'
    if 'stat' in lower_name and '1' in lower_name: return 'stats1'
    if 'stat' in lower_name and '2' in lower_name: return 'stats2'
    return None # Return None if not a recognized subject

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
        
        context += f"<div class='context-text'>{p_text}</div>"
        for img in p_images:
            img_url = get_full_image_url(img)
            context += f"<div class='context-image'><img src='{img_url}' /></div>"
    
    # Main question text and images
    q_text = q.get('question_text_1') or ""
    # Sometimes text is in question_texts array
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
                 # Sometimes just filename
                 if not opt['option_image'].startswith('http') and not opt['option_image'].startswith('/'):
                     opt_img = get_full_image_url("/app/option_images/" + opt['option_image'])
                 else:
                     opt_img = get_full_image_url(opt['option_image'])
            
            options.append({
                'id': opt.get('id'),
                'text': opt.get('option_text', ''),
                'image': opt_img,
                'is_correct': opt.get('is_correct') == 1 or opt.get('is_correct') == True
            })

    # Answer for non-MCQ
    answer = {}
    if q.get('question_type') in ['NAT', 'SA', 'Numeric']:
        answer = {
            'value_start': q.get('value_start'),
            'value_end': q.get('value_end'),
            'answer_type': q.get('answer_type') # e.g. "Equal", "Range"
        }

    return {
        'id': q.get('id'),
        'type': q.get('question_type'),
        'context': context,
        'question': q_text,
        'images': q_images,
        'options': options,
        'answer': answer,
        'exam': exam_type,
        'paper': paper_name,
        'year': year
    }

def main():
    abs_output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), OUTPUT_DIR))
    if not os.path.exists(abs_output_dir):
        os.makedirs(abs_output_dir)
        print(f"Created output directory: {abs_output_dir}")

    questions_by_subject = defaultdict(list)

    for source_dir in SOURCE_DIRS:
        # Check if dir exists
        abs_source_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), source_dir))
        if not os.path.exists(abs_source_dir):
            print(f"Directory not found: {abs_source_dir}")
            continue
            
        exam_type = os.path.basename(abs_source_dir) # e.g. quiz1, Quiz_2
        print(f"Processing {exam_type} from {abs_source_dir}")
        
        # Iterate subject folders
        for subject_folder in os.listdir(abs_source_dir):
            subject_path = os.path.join(abs_source_dir, subject_folder)
            if not os.path.isdir(subject_path):
                continue
            
            # Debug print for first few folders
            # print(f"  Checking folder: {subject_folder}")

            norm_subject = normalize_subject(subject_folder)
            
            if not norm_subject or norm_subject not in ALLOWED_SUBJECTS:
                continue
            json_files = glob.glob(os.path.join(subject_path, "*.json"))
            if not json_files:
                 # Try case insensitive match manually if glob fails (standard glob is usually case sensitive on linux/mac? actually mac is case insensitive mostly)
                 pass

            for json_file in json_files:
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        
                    paper_name = data.get('question_paper', {}).get('question_paper_name', os.path.basename(json_file))
                    year = data.get('question_paper', {}).get('year', 2024)
                    
                    # Extract questions
                    questions = []
                    if 'props' in data and 'question_paper' in data['props'] and 'questions' in data['props']['question_paper']:
                        questions = data['props']['question_paper']['questions']
                    elif 'question_paper' in data and 'questions' in data['question_paper']:
                        questions = data['question_paper']['questions']
                    elif 'questions' in data:
                        questions = data['questions']
                    
                    if len(questions) == 0:
                        # Debug why empty
                        # print(f"    No questions found in {json_file}. Keys: {list(data.keys())}")
                        pass
                    
                    for q in questions:
                        cleaned_q = clean_question(q, exam_type, paper_name, year)
                        questions_by_subject[norm_subject].append(cleaned_q)
                        
                except Exception as e:
                    print(f"Error processing {json_file}: {e}")

    # Write to output
    print(f"Total subjects collected: {len(questions_by_subject)}")
    for subject, questions in questions_by_subject.items():
        output_file = os.path.join(abs_output_dir, f"{subject}.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(questions, f, indent=2)
        print(f"Written {len(questions)} questions to {output_file}")
    
    # Generate a master subjects list for the frontend
    subjects_list = list(questions_by_subject.keys())
    subjects_list.sort()
    
    # Create a subjects index file
    with open(os.path.join(abs_output_dir, 'subjects_index.json'), 'w', encoding='utf-8') as f:
        json.dump(subjects_list, f, indent=2)
    print("Written subjects_index.json")

if __name__ == "__main__":
    main()
