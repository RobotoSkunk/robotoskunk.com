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


(async () =>
{
	const apiForm = new RSApiForm();


	apiForm.showSection(0);
	await apiForm.show();

	function setErrorMessage(message: string): void
	{
		d.querySelectorAll('.error').forEach(e => e.textContent = message);
	}


	const buttons = d.querySelectorAll('button.submit') as NodeListOf<HTMLButtonElement>;


	apiForm.form.addEventListener('submit', async (ev) =>
	{
		if (!apiForm.form.checkValidity()) {
			return apiForm.form.reportValidity();
		}

		ev.preventDefault();
		ev.stopPropagation();


		buttons.forEach(s => s.disabled = true);
		buttons.forEach(s => s.innerHTML = '<span class="loader black"></span>');

		const data = new FormData(apiForm.form);


		if (!data.get('h-captcha-response')) {
			await apiForm.hide();
			apiForm.showSection(1);

		} else {
			try {
				const response = await fetch('/signup/email', {
					'method': 'POST',
					'body': new URLSearchParams(data as any)
				});
				
				await apiForm.hide();

				if (response.status === 429) {
					setErrorMessage('You have been rate limited. Please try again later.');
					apiForm.showSection(0);
				
				} else if (response.status >= 400) {
					const json = await response.json();
					setErrorMessage(json.message);
					apiForm.showSection(0);

					hcaptcha.reset();
				} else apiForm.showSection(2);
			} catch(e) {
				console.error(e);
				setErrorMessage('An error occurred while trying to sign up.');
				apiForm.showSection(0);
			}
		}

		await apiForm.show();

		buttons.forEach(s => s.disabled = false);
		buttons.forEach(s => s.innerHTML = 'Continue');
	});
})();
