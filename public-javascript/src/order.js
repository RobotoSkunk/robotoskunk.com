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


(() => {
	var desc = d.getElementById('description').innerText;

	d.getElementById('description').innerHTML = RSUtils.parseMarkdown(RSUtils.unescape(desc));

	d.getElementById('copy').addEventListener('click', async () => {
		const content = d.getElementById('copy-id').innerText;
		await navigator.clipboard.writeText(content);

		const notice = d.getElementById('copy-notice');
		notice.classList.add('show');

		setTimeout(() => {
			notice.classList.remove('show');
		}, 1000);
	});
})();
