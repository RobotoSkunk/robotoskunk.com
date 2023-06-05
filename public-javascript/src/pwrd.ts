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

	apiForm.showSection(0);
	await apiForm.show();

	async function checkPwrd(password) {
		const data = await zxcvbn(password);
		const colors = ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3'];


		d.querySelector('#password-strength').innerHTML = data.scoreText;
		(d.querySelector('#password-bar') as HTMLElement).style.width = `${data.score / 4 * 100}%`;
		(d.querySelector('#password-bar') as HTMLElement).style.backgroundColor = colors[data.score];
		d.querySelector('#handler-alert').className = data.score <= 1 ? 'handler-at danger' : (data.score == 2 ? 'handler-at warning' : 'handler-at');


		d.querySelector('#warning').textContent = data.feedback.warning;
		d.querySelector('#suggestions').innerHTML = '';

		for (const s of data.feedback.suggestions)
			d.querySelector('#suggestions').appendChild(d.createElement('li')).textContent = s;
	}
	await checkPwrd((d.querySelector('#password') as HTMLInputElement).value);


	d.querySelector('#password').addEventListener('input', async (ev) => {
		await checkPwrd((ev.target as HTMLInputElement).value);
	});
})();
