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
	const apiForm = new RSApiForm();

	const redirectUri = new URLSearchParams(window.location.search).get('redirect_uri') || location.origin;
	const verified = new URLSearchParams(window.location.search).get('verified') || false;

	apiForm.showSection(0);
	await apiForm.show();

	if (verified) {
		RSNotifications.install();
		RSNotifications.create('Congratulations! Your email has been verified.', 'success');
	}

	function setError(msg: string): void {
		d.querySelectorAll('.error').forEach(e => e.textContent = msg);
	}

	d.querySelector('a#toggle-password').addEventListener('click', (ev) => {
		ev.preventDefault();
		ev.stopPropagation();

		const input: HTMLInputElement = d.querySelector('input[name="password"]');
		input.type = input.type === 'password' ? 'text' : 'password';

		d.querySelector('a#toggle-password').innerHTML = `<img width="25" src="/resources/svg/eye-${
															input.type === 'password' ? 'enable' : 'disable'
														}.svg" alt="Show password">`;
	});

	const buttons: NodeListOf<HTMLButtonElement> = d.querySelectorAll('button.submit');


	apiForm.form.addEventListener('submit', async (ev) => {
		if (!apiForm.form.checkValidity())
			return apiForm.form.reportValidity();

		ev.preventDefault();
		ev.stopPropagation();

		buttons.forEach(s => s.disabled = true);
		buttons.forEach(s => s.innerHTML = '<span class="loader black"></span>');

		const data = apiForm.getFormData();


		if (!data.get('h-captcha-response')) {
			await apiForm.hide();
			apiForm.showSection(1);

		} else {
			try {
				const response = await fetch('/accounts/signin', {
					'method': 'POST',
					'body': new URLSearchParams(data as any)
				});
				const json = await response.json();

				await apiForm.hide();


				if (response.status === 429) {
					if (json.message) setError(json.message);
					else setError('');
					apiForm.showSection(0);

				} else if (response.status >= 400) {

					if (json.message) setError(json.message);
					else setError('');
					hcaptcha.reset();

					switch (json.code) {
						case 1:
						case 3: apiForm.showSection(1); break;
						// case 6:
						// case 7:
						// 	apiForm.showSection(2); break;
						default: apiForm.showSection(0); break;
					}
				} else if (json.twofa) {
					window.location.reload();
					return;
				} else {
					apiForm.showSection(2);
					setTimeout(() => {
						window.location.href = redirectUri === location.origin ? '/' : RSUtils.sanitizeUrl(redirectUri);
					}, 1000);
				}
			} catch (e) {
				console.error(e);
				setError('An error occurred while trying to sign up.');
				apiForm.showSection(0);
				hcaptcha.reset();
			}
		}

		await apiForm.show();

		buttons.forEach(s => s.disabled = false);
		buttons.forEach(s => s.innerHTML = 'Continue');
	});
})();
