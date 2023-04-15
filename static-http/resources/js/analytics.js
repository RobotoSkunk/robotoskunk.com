
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
