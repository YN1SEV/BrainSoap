

const navItemsLeftBar = document.querySelectorAll('.navItem');
const navItemsContent = document.querySelectorAll('.content');

function getSectionFromHash() { return location.hash.replace('#/', '') || 'home'; }
function setHash(section) { location.hash = `#/${section}`;}

function updateDisplay(section) {
    
    const activeNav     = document.querySelector(`[data-section="${section}"]`);
    const activeContent = document.getElementById(`content${section[0].toUpperCase() + section.slice(1)}`);
    // ^ This gets element by id: contentHome, contentRules, contentStats etc.


    // Chooses what displayed (set active)
    navItemsLeftBar.forEach(n => n.classList.remove('active'));
    navItemsContent.forEach(n => n.classList.remove('active'));

    activeNav    ?.classList.add('active');
    activeContent?.classList.add('active');
}

navItemsLeftBar.forEach(item => {item.addEventListener('click', () => {
    const section = item.dataset.section;
    setHash(section);
    updateDisplay(section);
})});

window.addEventListener('hashchange', () => {
    updateDisplay(getSectionFromHash());
});

updateDisplay(getSectionFromHash());
