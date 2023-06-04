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
	function dnt() {
		console.warn('%cRobotoSkunk: %cDo Not Track is enabled, analytics will not be sent.', 'font-weight: bold;', 'font-weight: normal;');
	}
	if (navigator.doNotTrack) {
		dnt();
		return;
	}


	try {
		const res = await fetch('/analytics/collect', {
			method: 'POST',
			body: JSON.stringify({
				screen: [
					window.screen.width,
					window.screen.height
				],
				referrer: document.referrer,
				path: location.href,
				timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});

		try {
			const body = await res.json();

			if (body.dnt) dnt();
		} catch (e) {
			console.error('%cRobotoSkunk: %cError sending analytics.', 'font-weight: bold;', 'font-weight: normal;');
		}
	} catch (e) {
		console.error(e);
	}
})();
