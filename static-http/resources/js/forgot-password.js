(async () => {
	const sections = [];

	for (const section of d.querySelectorAll('.section')) {
		sections.push(new RSApiFormSection(section, Number.parseInt(section.getAttribute('data-height'))));
	}

	const form = d.querySelector('form');
	const f = new RSApiForm(form, sections);

	f.showSection(0);
	await f.show();

	function setError(msg) {
		d.querySelectorAll('.error').forEach(e => e.textContent = msg);
	}


	const buttons = d.querySelectorAll('button.submit');


	form.addEventListener('submit', async (ev) => {
		if (!form.checkValidity())
			return form.reportValidity();

		ev.preventDefault();
		ev.stopPropagation();

		buttons.forEach(s => s.disabled = true);
		buttons.forEach(s => s.innerHTML = '<span class="loader black"></span>');

		const data = new FormData(form);

		if (!data.get('h-captcha-response')) {
			await f.hide();
			f.showSection(1);
		} else {
			try {
				const response = await fetch('/accounts/forgot-password', {
					'method': 'POST',
					'body': new URLSearchParams(data)
				});

				await f.hide();

				if (response.status === 429) {
					setError('You have been rate limited. Please try again later.');
					f.showSection(0);
				
				} else if (response.status >= 400) {
					const json = await response.json();

					if (json.message) setError(json.message);
					else setError('');

					if (!json.code) f.showSection(0);

					hcaptcha.reset();
				} else {
					f.showSection(2);
				}
			} catch (e) {
				console.error(e);
				setError('An error occurred. Please try again later.');
				f.showSection(0);
			}
		}

		await f.show();

		buttons.forEach(s => s.disabled = false);
		buttons.forEach(s => s.innerHTML = 'Continue');
	});
})();
