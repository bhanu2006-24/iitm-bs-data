# Genz Data

This repository contains the data and tools for the Genz project, including study resources, blog posts, calendars, and the PYQ practice engine.

## Directory Structure

- **pyq/**: Previous Year Question paper practice tool and scraper.
  - Contains a Python Flask app for scraping and serving exams.
  - Run `cd pyq && python app.py` to start the PYQ engine.
- **wiki/**: Wiki data (courses, resources).
- **blog/**: Blog posts and metadata.
- **calendar/**: Academic calendar data.
- **courses/**: Detailed course information.
- **oppe/**: Online Proctoring Exam mock data.

## Getting Started

### PYQ Application

To use the PYQ Practice and Scraper tools:

1. Navigate to the `pyq` directory:
   ```bash
   cd pyq
   ```
2. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the application:
   ```bash
   python app.py
   ```
4. Open [http://localhost:5000](http://localhost:5000).

### Contributing

- **Data**: JSON files in strict formats.
- **Tools**: Python scripts for automation.
