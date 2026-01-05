/**
 * Lead Generator Interface Logic
 * This script handles the UI for triggering the Lead Generation n8n webhook.
 */

document.addEventListener('DOMContentLoaded', () => {
    const showScraperBtn = document.getElementById('show-scraper');
    const scraperSection = document.getElementById('scraper-section');
    const instrumentsSection = document.getElementById('instruments-section');
    const startScrapeBtn = document.getElementById('start-scrape-btn');

    // Form Inputs
    const webhookInput = document.getElementById('n8n-webhook-url');
    const businessTypeInput = document.getElementById('business-type');
    const cityInput = document.getElementById('city');
    const countryInput = document.getElementById('country');
    const maxLeadsInput = document.getElementById('max-leads');

    const scrapeStatus = document.getElementById('scrape-status');
    const progressFill = document.getElementById('scrape-progress');
    const statusMessage = document.getElementById('scrape-status-message');

    // Navigation Switch
    // Navigation Switch handled in script.js now

    // Start Generation Action
    startScrapeBtn.addEventListener('click', async () => {
        const webhookUrl = webhookInput.value.trim();
        const businessType = businessTypeInput?.value.trim() || 'Music Stores';
        const city = cityInput?.value.trim() || 'Casablanca';
        const country = countryInput?.value.trim() || 'Morocco';
        const maxLeads = parseInt(maxLeadsInput?.value || '20');

        if (!webhookUrl) {
            alert('Please enter your n8n webhook URL');
            return;
        }

        // Show status
        scrapeStatus.classList.remove('hidden');
        statusMessage.innerText = `Recherche de ${maxLeads} ${businessType} à ${city}, ${country}...`;
        progressFill.style.width = '30%';

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessType,
                    city,
                    country,
                    maxLeads
                })
            });

            if (response.ok) {
                progressFill.style.width = '100%';
                statusMessage.innerText = 'Succès ! Le processus de génération de leads est lancé.';
                statusMessage.style.color = '#10b981';
            } else {
                throw new Error('Erreur lors du contact avec n8n');
            }
        } catch (error) {
            console.error(error);
            statusMessage.innerText = 'Erreur: Impossible de joindre n8n. Vérifiez l\'URL.';
            statusMessage.style.color = '#ef4444';
            progressFill.style.backgroundColor = '#ef4444';
        }
    });
});
