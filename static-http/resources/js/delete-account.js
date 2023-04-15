
(async () => {
	const _tmp = d.getElementById('h-captcha');
	const hCaptcha = _tmp.dataset.sitekey;
	_tmp.remove();

	RSNotifications.install();
	RSPopup.install();



	const form = d.createElement('form');
	form.setAttribute('method', 'POST');

	form.innerHTML = `<h2>Are you sure?</h2>
		<div class="row-container">
			<a href="javascript:void(0)" class="handler-at" id="toggle-password">
				<img width="25" src="/resources/svg/eye-enable.svg" alt="Show Password">
			</a>
			<input type="password" name="password" placeholder="Password" required>
		</div>
		<div class="h-captcha" data-sitekey="${hCaptcha}"></div>`;


	const button = d.createElement('button');
	button.innerText = 'Confirm';
	form.append(button);

	const popup = d.getElementById('popup');
	popup.append(form);

	d.getElementById('open-panel').addEventListener('click', () => { RSPopup.toggle(true); });


	const passwordInput = form.querySelector('input[type="password"]');
	d.getElementById('toggle-password').addEventListener('click', (ev) => {
		ev.preventDefault();

		passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
		d.getElementById('toggle-password').innerHTML = `<img width="25" src="/resources/svg/eye-${passwordInput.type === 'password' ? 'enable' : 'disable'}.svg" alt="Show password">`;
	});


	form.addEventListener('submit', async (ev) => {
		if (!form.checkValidity()) return form.reportValidity();
		ev.preventDefault();

		const data = new FormData(form);

		const captcha = data.get('h-captcha-response');
		if (!captcha) return RSNotifications.create('Please complete the captcha.', 'warning');

		button.disabled = true;
		button.innerHTML = '<span class="loader black"></span>';

		const response = await fetch(window.location.href, {
			method: 'POST',
			body: new URLSearchParams(data)
		});
	
		if (response.ok) window.location.reload();
		else {
			try {
				const json = await response.json();
				RSNotifications.create(json.message, 'warning');
			} catch (e) {
				console.error(e);
				RSNotifications.create('An error occurred while deleting your account.', 'error');
			}

			button.disabled = false;
			button.innerHTML = 'Confirm';
			hcaptcha.reset();
		};
	});
})();
