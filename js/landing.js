document.addEventListener('DOMContentLoaded', function() {
    const title = "Decode Your Personality|Through|Melodies You Love";
    const container = document.getElementById('text-wrapper');
    let charIndex = 0;

    for (let i = 0; i < title.length; i++) {
        if (title[i] === '|') {
            container.appendChild(document.createElement('br'));
            continue;
        }

        const span = document.createElement('span');
        span.textContent = title[i];

        if (title[i] === ' ') {
            span.innerHTML = '&nbsp;'; // Non-breaking space
        } else {
            span.style = `--i:${charIndex}`;
            if (title[i] === title[i].toUpperCase() && title[i] !== ' ' && title[i] !== '|') {
                span.classList.add('capital-letter');
            }
            charIndex++;
        }
        container.appendChild(span);
    }
});



document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.navigate-button button').addEventListener('click', function() {
        // Replace 'main-page.html' with the actual path to your main page
        window.location.href = 'main-page.html';
    });
});