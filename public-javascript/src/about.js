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
	const data = [
		{'node': d.getElementById('img-1'), 'distance': 200, 'dir': 'left'},
		{'node': d.getElementById('part-1'), 'distance': 100, 'dir': null},
		{'node': d.getElementById('img-2'), 'distance': 50, 'dir': 'top'}
	];

	RSParallax.parse();
	
	function updateAnimations() {
		data[1].dir = (w.innerWidth <= 1000 ? 'right' : null);
	
		for (var i in data) {
			var x = RSUtils.clamp(w.scrollY - (data[i].node.offsetTop - (w.innerHeight / 3 * 2)), 0, data[i].distance);
	
			if (data[i].dir != null)
				data[i].node.style[data[i].dir] = `${data[i].distance - x}px`;
	
			data[i].node.style.opacity = RSUtils.clamp(x / data[i].distance, 0, 1);
		}
	} updateAnimations();
	
	['resize', 'scroll'].forEach((e) => {
		w.addEventListener(e, updateAnimations);
		w.addEventListener(e, RSParallax.update);
	});
})();
