(async () => {
	const data = await fetch('/backend/stats');
	const stats = await data.json();

	const cISO = await fetch('/backend/countries');
	const countriesISO = await cISO.json();


	new svgMap({
		'targetElementID': 'stats-map',
		'data': {
			'data': {
				'visits': {
					'name': 'Visits',
					'format': '{0}',
				},
				'today': {
					'name': 'Today',
					'format': '{0}',
				}
			},
			'applyData': 'visits',
			'values': stats.countries,
		},
		'colorMax': '#93e376',
		'colorMin': '#eaffe3',
		'colorNoData': '#fff',
		'countryNames': countriesISO
	});
})();
