Name: Yash Yadav  
Registration No:23FE10CDS00304  
Branch: Computer Science (Data Science)  
Project Title: Prompt Engineering Lab — A Meta-NLP Evaluator  
Github username: yashydv7921  

---

# Prompt Engineering Lab — A Meta-NLP Evaluator

Prompt Engineering Lab is a "meta-NLP" web application. Instead of just answering questions, this tool acts as an automated grader and tutor to help humans write better prompts for Large Language Models. You paste any prompt into the UI, and an LLM (via the Google Gemini API) analyzes it across 6 critical linguistic dimensions (Clarity, Specificity, Context, Constraints, Role Setting, and Format). 

The application generates a score, plots the weaknesses on an interactive Chart.js radar graph, and makes a second LLM call to dynamically rewrite your prompt using prompt engineering best practices. Finally, a third API call runs a side-by-side comparison of the original prompt versus the improved prompt, proving how much better the output is. 

### Project layout
```text
NLP Project/
├── index.html                  main UI interface (SPA)
├── css/
│   └── style.css               glassmorphism styling & animations
├── js/
│   ├── app.js                  main logic, event listeners, state management
│   ├── api.js                  Gemini REST API calls & JSON parsing
│   └── chart.js                radar chart visualization logic
├── config/
│   └── config.js               configuration file (reads API key & model)
├── prompts/
│   └── prompts.md              system prompt file containing all 3 LLM instructions
└── README.md
