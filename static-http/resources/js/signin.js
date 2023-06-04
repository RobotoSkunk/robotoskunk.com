/*
	robotoskunk.com - The whole main website of RobotoSkunk.
	Copyright (C) 2023 Edgar Alexis Lima <contact@robotoskunk.com>

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published
	by the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/


(async () => {
	const sections = [];

	for (const section of d.querySelectorAll('.section')) {
		sections.push(new RSApiFormSection(section, Number.parseInt(section.getAttribute('data-height'))));
	}

	const form = d.querySelector('form');
	const f = new RSApiForm(form, sections);
	
	const redirectUri = new URLSearchParams(window.location.search).get('redirect_uri') || location.origin;
	const verified = new URLSearchParams(window.location.search).get('verified') || false;

	f.showSection(0);
	await f.show();

	if (verified) {
		RSNotifications.install();
		RSNotifications.create('Congratulations! Your email has been verified.', 'success');
	}

	function setError(msg) {
		d.querySelectorAll('.error').forEach(e => e.textContent = msg);
	}

	d.querySelector('a#toggle-password').addEventListener('click', (ev) => {
		ev.preventDefault();
		ev.stopPropagation();

		const input = d.querySelector('input[name="password"]');
		input.type = input.type === 'password' ? 'text' : 'password';

		d.querySelector('a#toggle-password').innerHTML = `<img width="25" src="/resources/svg/eye-${input.type === 'password' ? 'enable' : 'disable'}.svg" alt="Show password">`;
	});

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
				const response = await fetch('/accounts/signin', {
					'method': 'POST',
					'body': new URLSearchParams(data)
				});
				const json = await response.json();

				await f.hide();


				if (response.status === 429) {
					if (json.message) setError(json.message);
					else setError('');
					f.showSection(0);

				} else if (response.status >= 400) {

					if (json.message) setError(json.message);
					else setError('');
					hcaptcha.reset();

					switch (json.code) {
						case 1:
						case 3: f.showSection(1); break;
						// case 6:
						// case 7:
						// 	f.showSection(2); break;
						default: f.showSection(0); break;
					}
				} else if (json.twofa) {
					window.location.reload();
					return;
				} else {
					f.showSection(2);
					setTimeout(() => {
						window.location.href = redirectUri === location.origin ? '/' : RSUtils.sanitizeUrl(redirectUri);
					}, 1000);
				}
			} catch (e) {
				console.error(e);
				setError('An error occurred while trying to sign up.');
				f.showSection(0);
				hcaptcha.reset();
			}
		}

		await f.show();

		buttons.forEach(s => s.disabled = false);
		buttons.forEach(s => s.innerHTML = 'Continue');
	});
})();
