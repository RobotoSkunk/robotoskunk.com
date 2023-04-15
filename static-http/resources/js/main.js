
(() => {
	RSNotifications.install();

	var lastY = w.scrollY, headerY = w.scrollY;
	const hparts = d.querySelectorAll('header, header .logo');



	w.addEventListener('scroll', (_) => {
		if (w.scrollY == 0)
			headerY = lastY = 0;
		else {
			const delta = w.scrollY - lastY;

			headerY = RSUtils.clamp(headerY - delta, -55, 0);
		}

		hparts.forEach((e) => e.style.top = `${headerY}px`);
		lastY = w.scrollY;
	});



	d.querySelector('header').addEventListener('focusin', (e) => {
		headerY = 0;
		Velocity(hparts, { 'top': '0px' }, 50);
	});


	
	setTimeout(() => d.querySelector('.nav-bg').style.display = 'block', 100);

	d.querySelectorAll('[data-type="menu-toggle"]').forEach((e) => {
		e.addEventListener('click', (ev) => {
			const action = e.dataset.action;

			d.querySelectorAll('header nav, .nav-bg').forEach((el) => el.classList.toggle('open', action == 'open'));
			d.querySelector('body').style.overflowY = action == 'open' ? 'hidden' : 'auto';

			if (action == 'open') {
				headerY = 0;
				Velocity(hparts, { 'top': '0px' }, 50);
			}
		});
	});
})();
