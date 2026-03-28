document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyze-btn');
    const symptomsInput = document.getElementById('symptoms');
    const resultSection = document.getElementById('result-section');
    const btnText = document.querySelector('.btn-text');
    const loader = document.querySelector('.loader');
    const charCount = document.getElementById('char-count');
    const inputError = document.getElementById('input-error');

    // Result elements
    const riskBadge = document.getElementById('risk-badge');
    const summaryText = document.getElementById('summary-text');
    const immediateActionsList = document.getElementById('immediate-actions-list');
    const avoidList = document.getElementById('avoid-list');
    const nextStepsList = document.getElementById('next-steps-list');

    symptomsInput.addEventListener('input', () => {
        const length = symptomsInput.value.length;
        charCount.textContent = `${length} / 1000`;
        
        if (length >= 10 && length <= 1000) {
            inputError.classList.add('hidden');
        }

        if (length > 900) {
            charCount.classList.add('warning');
        } else {
            charCount.classList.remove('warning');
        }
        
        if (length >= 1000) {
            charCount.classList.add('limit');
        } else {
            charCount.classList.remove('limit');
        }
    });

    const triageForm = document.getElementById('triage-form');
    triageForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Suspend native HTTP redirection submission execution boundaries

        const text = symptomsInput.value.trim();
        
        // Strict Front-End Boundaries
        if (!text || text.length < 10) {
            inputError.textContent = 'Please describe the symptoms in more detail (at least 10 characters).';
            inputError.classList.remove('hidden');
            return;
        }
        
        if (text.length > 1000) {
            inputError.textContent = 'Please limit your description to 1000 characters.';
            inputError.classList.remove('hidden');
            return;
        }

        // Set Loading State
        analyzeBtn.disabled = true;
        btnText.textContent = 'Analyzing...';
        loader.classList.remove('hidden');
        resultSection.classList.add('hidden');

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const data = await response.json();
            renderResult(data);
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while analyzing the symptoms. Please try again or call emergency services if urgent.');
        } finally {
            // Reset Button State
            analyzeBtn.disabled = false;
            btnText.textContent = 'Analyze Symptoms';
            loader.classList.add('hidden');
        }
    });

    function renderResult(data) {
        // Risk Badge
        const riskVal = data.risk_level.toLowerCase();
        riskBadge.textContent = riskVal.toUpperCase() + ' RISK';
        riskBadge.className = `badge ${riskVal}`; // apply CSS class "high", "medium", or "low"

        // Summary
        summaryText.textContent = data.summary;

        // Lists
        populateList(immediateActionsList, data.immediate_actions);
        populateList(avoidList, data.avoid);
        populateList(nextStepsList, data.next_steps);

        // Show Results
        resultSection.classList.remove('hidden');
        
        // Scroll to results cleanly, forcing DOM execution thread priority towards screen-reader bounding limits.
        setTimeout(() => {
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            resultSection.focus(); // Drive screen-reader navigation implicitly to output panel directly
        }, 100);
    }

    function populateList(ulElement, items) {
        ulElement.innerHTML = '';
        if (!items || items.length === 0) {
            ulElement.innerHTML = '<li>None identified.</li>';
            return;
        }
        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            ulElement.appendChild(li);
        });
    }
});
