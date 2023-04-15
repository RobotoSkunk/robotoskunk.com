(async () => {
	const sections = [];

	for (const section of d.querySelectorAll('.section')) {
		sections.push(new RSApiFormSection(section, Number.parseInt(section.getAttribute('data-height'))));
	}

	const form = d.querySelector('form');
	const f = new RSApiForm(form, sections);

	f.showSection(0);
	await f.show();

	async function checkPwrd(password) {
		const data = await zxcvbn(password);
		const colors = ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3'];


		d.querySelector('#password-strength').innerHTML = data.scoreText;
		d.querySelector('#password-bar').style.width = `${data.score / 4 * 100}%`;
		d.querySelector('#password-bar').style.backgroundColor = colors[data.score];
		d.querySelector('#handler-alert').className = data.score <= 1 ? 'handler-at danger' : (data.score == 2 ? 'handler-at warning' : 'handler-at');


		d.querySelector('#warning').textContent = data.feedback.warning;
		d.querySelector('#suggestions').innerHTML = '';

		for (const s of data.feedback.suggestions)
			d.querySelector('#suggestions').appendChild(d.createElement('li')).textContent = s;
	}
	await checkPwrd(d.querySelector('#password').value);


	d.querySelector('#password').addEventListener('input', async (ev) => {
		await checkPwrd(ev.target.value);
	});
})();
