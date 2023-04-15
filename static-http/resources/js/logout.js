(async () => {
	const _s = d.querySelector('.section');
	const sections = [
		new RSApiFormSection(_s, Number.parseInt(_s.getAttribute('data-height')))
	];

	const form = d.querySelector('form');
	const f = new RSApiForm(form, sections);
	f.showSection(0);
	await f.show();


	d.querySelectorAll('.submit').forEach(s => {
		s.addEventListener('click', async (ev) => {
			if (ev.target.dataset.type === 'cancel') {
				ev.preventDefault();
				ev.stopPropagation();

				window.location.href = '/';
			}
		});
	});
})();
