const navigationDots = document.querySelectorAll('.navigation_dots li');
const welcome = document.querySelector('.container_welcome');
const sections = document.querySelectorAll('.section1, .section2, .section3, .section4, .section5, .section6, .section7, .section8, .section9');
const totalHeight = document.documentElement.scrollHeight;

// Reset the navigation dots on each scroll
function resetNavigationDots() {
    navigationDots.forEach(dot => {
        dot.classList.remove('selected');
    });
}

window.addEventListener('scroll', function(){
    const windowHeight = window.innerHeight;
    const scrollTop = window.scrollY;

    resetNavigationDots();


    // Check if Welcome section is in view
    if (scrollTop < sections[0].offsetTop - windowHeight / 2) {
        navigationDots[0].classList.add('selected');
        /*console.log('Welcome');*/
    } else {
        // Check each section
        sections.forEach((section, index) => {
            const nextSectionTop = (index < sections.length - 1) ? sections[index + 1].offsetTop - windowHeight / 2 : totalHeight;
            if (scrollTop >= section.offsetTop - windowHeight / 2 && scrollTop < nextSectionTop) {
                navigationDots[index + 1].classList.add('selected'); // +1 because the first dot is for the Welcome section
                /*console.log(`Section ${index + 1}`);*/
            }
        });
    }
});

navigationDots.forEach((dot, index) => {
    dot.addEventListener('click', function() {
        let targetTop;
        const buffer = 50; // Distance from the top of the section to the top of the window

        if (index === 0) { // If it's the first dot, scroll to the welcome section
            targetTop = welcome.offsetTop - buffer;
        } else { // For other dots, scroll to the respective section
            targetTop = sections[index - 1].offsetTop - buffer; // -1 because the first dot is for the Welcome section
        }

        // Ensure targetTop is not less than 0
        targetTop = Math.max(0, targetTop);

        window.scrollTo({
            top: targetTop,
            behavior: 'smooth'
        });
    });
});



