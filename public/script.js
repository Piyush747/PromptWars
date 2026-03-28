document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyze-btn');
    const symptomsInput = document.getElementById('symptoms');
    const resultSection = document.getElementById('result-section');
    const btnText = document.querySelector('.btn-text');
    const loader = document.querySelector('.loader');

    // Result elements
    const riskBadge = document.getElementById('risk-badge');
    const summaryText = document.getElementById('summary-text');
    const immediateActionsList = document.getElementById('immediate-actions-list');
    const avoidList = document.getElementById('avoid-list');
    const nextStepsList = document.getElementById('next-steps-list');

    analyzeBtn.addEventListener('click', async () => {
        const text = symptomsInput.value.trim();
        if (!text) {
            alert('Please describe your symptoms first.');
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
        
        // Scroll to results smoothly
        setTimeout(() => {
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
