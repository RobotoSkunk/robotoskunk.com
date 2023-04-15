// Verify if browser supports all the required features
// If not, redirect to /unsupported/
try {
	const functions = [
		fetch,
		Promise,
		Proxy,
		URL,
		TextEncoder
	];
	
	for (var i in functions) {
		if (typeof functions[i] === 'undefined') {
			throw new Error('Browser is not supported');
		}
	}
} catch (e) {
	window.location.href = '/error/unsupported/';
}
