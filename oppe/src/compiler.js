export async function executeCode(code, subject) {
    let lang = 'python';
    let version = '3.10.0';

    const map = {
        'python': ['python', '3.10.0'],
        'pdsa': ['python', '3.10.0'],
        'mlp': ['python', '3.10.0'],
        'big_data': ['python', '3.10.0'],
        'mlops': ['python', '3.10.0'],
        'tds': ['python', '3.10.0'],
        'java': ['java', '15.0.2'],
        'sql': ['sqlite3', '3.36.0'],
        'system_commands': ['bash', '5.0.0'],
        'c_prog': ['c', '10.2.0']
    };

    if (map[subject]) {
        [lang, version] = map[subject];
    }

    try {
        const response = await fetch('https://emkc.org/api/v2/piston/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: lang,
                version: version,
                files: [{ content: code }]
            })
        });
        const result = await response.json();
        return {
            output: result.run ? result.run.output : 'No output',
            isError: result.run ? result.run.code !== 0 : true
        };
    } catch (e) {
        return { output: 'Error connecting to execution engine.', isError: true };
    }
}
