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
