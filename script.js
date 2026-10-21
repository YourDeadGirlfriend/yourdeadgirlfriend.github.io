const dialog = document.querySelector('#projectDialog');
const title = document.querySelector('#dialogTitle');
const text = document.querySelector('#dialogText');
const link = document.querySelector('#dialogLink');



document.querySelectorAll('[data-project]').forEach(el => {
    el.addEventListener('click', e => {
        const key = el.dataset.project;
        const d = data[key];

        // Не блокируем обычные ссылки.
        if (!d) return;

        e.preventDefault();

        title.textContent = d[0];
        text.textContent = d[1];
        link.href = d[2];
        dialog.showModal();
    });
});

document.querySelector('.close').onclick = () => dialog.close();

dialog.addEventListener('click', e => {
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        dialog.close();
    }
});
