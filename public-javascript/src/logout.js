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
