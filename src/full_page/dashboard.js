

const navItems = document.querySelectorAll('.navItem');
const contentSections = document.querySelectorAll('.content');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const section = item.dataset.section;

        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        contentSections.forEach(i => i.classList.remove('active'));

        document
            .getElementById(`content${section[0].toUpperCase() + section.slice(1)}`)
            ?.classList.add('active');
    });
});