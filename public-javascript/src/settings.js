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
	const endpoint = '/accounts/settings';
	const panels = d.querySelectorAll('.main-panel > .panel');
	const buttons = d.querySelectorAll('.side-panel > button');
	var currentPanel = 0, csrfToken = '', msg = '', qr = '', password = '';

	const badgePrimary = '<span class="badge success"><div class="dot"></div>Primary</span>',
		  badgeSecondary = '<span class="badge generic"><div class="dot"></div>Secondary</span>',
		  badgeContact = '<span class="badge warning"><div class="dot"></div>Contact</span>',
		  badgeUnverified = '<span class="badge alert"><div class="dot"></div>Unverified</span>',

		  loadingSpinner = '<div class="loading-container"><div class="loading"><span class="loader"></span></div></div>';



	const showPanel = (index) => {
		for (const button of buttons) button.classList.remove('active');
		buttons[index].classList.add('active');
		
		for (const panel of panels) panel.classList.remove('show');
		panels[index].classList.add('show');
	};

	for (let i = 0; i < buttons.length; i++) {
		buttons[i].addEventListener('click', showPanel.bind(null, i));
	}

	showPanel(currentPanel);
	RSPopup.install();

	const __tmp = d.getElementById('_csrf');
	if (__tmp) { csrfToken = __tmp.value; __tmp.remove(); }


	// #region Profile stuff
	d.getElementById('username').addEventListener('input', (e) => {
		var value = e.target.value;
		if (value.length > 60) value = value.substring(0, 60);

		e.target.value = value;
	});

	const handlerTooltip = d.getElementById('handler-tooltip');
	d.getElementById('handler').addEventListener('input', (e) => {
		var value = e.target.value;
		if (value.length > 16) value = value.substring(0, 16);

		for (const c of value) {
			if (!RSUtils.regex.handler.test(c)) value = value.replace(c, '');
		}


		handlerTooltip.textContent = `@${value}`;
		e.target.value = value;
	});

	d.getElementById('bio').addEventListener('input', (e) => {
		var value = e.target.value;
		if (value.length > 256) value = value.substring(0, 256);

		e.target.value = value;
	});
	// #endregion


	/**
	 * @type {HTMLDivElement}
	 */
	const securitySection = d.getElementById('security-section');
	async function loadSecuritySection() {
		try {
			var validPassword = false;
			securitySection.innerHTML = loadingSpinner;

			// #region Check password
			/**
			 * @type {Response}
			 */
			var res;

			if (password.length > 0) {
				res = await fetch(`${endpoint}/security`, {
					'method': 'POST',
					'body': new URLSearchParams({ 'password': password, '_csrf': csrfToken })
				});

				if (res.status === 200) validPassword = true;
				else {
					try {
						const data = await res.json();
						msg = data.message;
					} catch(_) {}
				}
			}

			securitySection.innerHTML = '';

			if (!validPassword) {
				const _form = d.createElement('form');
				_form.setAttribute('method', 'POST');

				_form.innerHTML = `<p>
					<span>For security reasons, you must enter your password to see this section.</span><br>
					<input type="password" name="password" placeholder="Password" required><br>
					<input type="checkbox" id="show-password" class="small"><label for="show-password" class="small"> Show password</label>

					<p><button class="btn-2">Confirm</button>`;

				_form.querySelector('#show-password').addEventListener('change', (e) => {
					_form.querySelector('input[name="password"]').type = e.target.checked ? 'text' : 'password';
				});

				_form.addEventListener('submit', async (ev) => {
					if (!_form.checkValidity())
						return _form.reportValidity();
	
					ev.preventDefault();
					ev.stopPropagation();

					const data = new FormData(_form);

					password = data.get('password');
					await loadSecuritySection();
				});

				securitySection.append(_form);

				if (password.length > 0) RSNotifications.create(msg, 'error');
				return;
			}
			// #endregion

			// #region Content
			/**
			 * @type {{
			 *   authorization: string,
			 *   emails: [{id: number, email: string, createdAt: number, type: number, verified: boolean}],
			 *   audit_log: [{action: string, relevance: string, createdAt: number}],
			 *   _2fa: boolean,
			 *   _2fa_recovery_codes: number
			 * }}
			 */
			const data = await res.json();
			const authToken = data.authorization;


			// #region Email stuff
			/**
			 * @type {HTMLDivElement}
			 */
			const _emails = d.createElement('div');
			_emails.classList.add('email-list');


			const _emailsTitle = d.createElement('h3');
			_emailsTitle.textContent = 'Emails';

			const _emailsExplanation = d.createElement('p');
			_emailsExplanation.classList.add('small');
			_emailsExplanation.innerHTML = `You can add up to 5 emails to your account. In order to protect your account, we use a different email system:
				<ul class="small">
					<li><b>Primary</b>: Used for sign in, notifications, and password recovery.
					<li><b>Secondary</b>: Used to be sent to third parties instead of your primary email.
					<li><b>Contact</b>: Displayed in your profile.
				</ul>`;

			securitySection.append(_emailsTitle, _emailsExplanation);

			for (const email of data.emails) {
				const _div = d.createElement('div');

				// #region Header
				const _head = d.createElement('div');
				_head.classList.add('row');

				const _email = d.createElement('span');
				_email.innerText = email.email;

				switch (email.type) {
					case 0: _email.innerHTML += ' ' + badgePrimary; break;
					case 1: _email.innerHTML += ' ' + badgeContact; break;
					case 2: _email.innerHTML += ' ' + badgeSecondary; break;
				}

				if (!email.verified) _email.innerHTML += badgeUnverified;

				_head.append(_email);
				// #endregion

				// #region Footer
				const _footer = d.createElement('div');
				_footer.classList.add('row', 'footer');


				const _createdAt = d.createElement('span');
				_createdAt.classList.add('date');
				_createdAt.innerText = new Date(email.createdAt).toLocaleString();

				const _actions = d.createElement('div');
				_actions.classList.add('actions');

				if (!email.verified) {
					const _verify = d.createElement('a');
					_verify.addEventListener('click', async (ev) => {
						ev.preventDefault();
						ev.stopPropagation();

						if (email.verified) return;

						try {
							const res = await fetch(`${endpoint}/email/send-verification`, {
								'method': 'POST',
								'body': new URLSearchParams({ '_csrf': csrfToken, 'email': email.id }),
								'headers': { 'Authorization': authToken }
							});

							const data = await res.json();
							RSNotifications.create(data.message, res.status === 200 ? 'success' : 'error');
						} catch (e) {
							console.error(e);
							RSNotifications.create('Something went wrong, please reload the page.', 'error');
						}
					});
					_verify.setAttribute('role', 'button');
					_verify.innerText = 'Verify';
					_verify.href = 'javascript:void(0)';

					_actions.append(_verify);
				}

				if (email.type !== 0) {
					const _delete = d.createElement('a');
					_delete.setAttribute('role', 'button');
					_delete.innerText = 'Delete';
					_delete.href = 'javascript:void(0)';

					_delete.addEventListener('click', async (ev) => {
						ev.preventDefault();
						ev.stopPropagation();

						if (email.type === 0) return;

						try {
							const res = await fetch(`${endpoint}/email/delete`, {
								'method': 'POST',
								'body': new URLSearchParams({ '_csrf': csrfToken, 'email': email.id }),
								'headers': { 'Authorization': authToken }
							});

							const data = await res.json();
							if (res.status === 200) _div.remove();
							RSNotifications.create(data.message, res.status === 200 ? 'success' : 'error');
						} catch (e) {
							console.error(e);
							RSNotifications.create('Something went wrong, please reload the page.', 'error');
						}
					});

					_actions.append(_delete);
				}


				_footer.append(_createdAt, _actions);
				// #endregion


				_div.append(_head, _footer);
				_emails.append(_div);
			}
			securitySection.append(_emails);


			if (data.emails.length < 5) {
				/**
				 * @type {HTMLInputElement}
				 */
				const input = d.createElement('input');
				input.setAttribute('type', 'email');
				input.setAttribute('name', 'email');
				input.setAttribute('placeholder', 'Email address');
				input.setAttribute('required', '');

				/**
				 * @type {HTMLButtonElement}
				 */
				const button = d.createElement('button');
				button.classList.add('btn-2');
				button.innerText = 'Add email';

				const form = d.createElement('form');
				form.setAttribute('method', 'POST');
				form.append(input, ' ', button);

				var onSubmit = false;
				form.addEventListener('submit', async (ev) => {
					if (!form.checkValidity())
						return form.reportValidity();

					ev.preventDefault();
					ev.stopPropagation();

					const data = new FormData(form);
					data.append('_csrf', csrfToken);

					try {
						if (onSubmit) return;
						onSubmit = true;

						const res = await fetch(`${endpoint}/email`, {
							method: 'PUT',
							body: new URLSearchParams(data),
							headers: { 'Authorization': authToken }
						});

						const _data = await res.json();
						onSubmit = false;

						RSNotifications.create(_data.message, res.status === 200 ? 'success' : 'error');
						if (res.status === 200) await loadSecuritySection();
					} catch(e) {
						console.error(e);
						RSNotifications.create('Something went wrong... Reload the page and try again.', 'error');
					}
				});

				securitySection.append(form);
			}

			if (data.emails.length > 1) {
				const form = d.createElement('form');
				form.setAttribute('method', 'POST');
				form.classList.add('email-types');
				form.style.marginTop = '10px';

				// #region Select primary email
				const select = d.createElement('select');
				select.setAttribute('name', 'primary');
				select.setAttribute('required', '');

				for (const email of data.emails) {
					if (!email.verified) continue;

					const option = d.createElement('option');
					option.value = email.id;
					option.innerText = email.email;
					option.selected = email.type === 0;

					select.append(option);
				}

				const label1 = d.createElement('label');
				label1.innerText = 'Primary email';
				label1.classList.add('small');

				const _tmpDiv_1 = d.createElement('div');
				_tmpDiv_1.style.display = 'inline-block';
				_tmpDiv_1.append(label1, d.createElement('br'), select);

				form.append(_tmpDiv_1);
				// #endregion

				// #region Select contact email
				const select2 = d.createElement('select');
				select2.setAttribute('name', 'contact');
				select2.setAttribute('required', '');

				const _option = d.createElement('option');
				_option.value = 'none';
				_option.innerText = 'None';
				select2.append(_option);


				var hasSelected = false;
				for (const email of data.emails) {
					if (!email.verified) continue;

					const option = d.createElement('option');
					option.value = email.id;
					option.innerText = email.email;
					option.selected = email.type === 1;

					if (option.selected) hasSelected = true;
					select2.append(option);
				}

				_option.selected = !hasSelected;

				const label2 = d.createElement('label');
				label2.innerText = 'Contact email';
				label2.classList.add('small');

				const _tmpDiv_2 = d.createElement('div');
				_tmpDiv_2.style.display = 'inline-block';
				_tmpDiv_2.append(label2, d.createElement('br'), select2);

				form.append(_tmpDiv_2);
				// #endregion

				const button = d.createElement('button');
				button.classList.add('btn-2');
				button.innerText = 'Save';

				form.append(button);

				var onSubmit = false;
				form.addEventListener('submit', async (ev) => {
					if (!form.checkValidity())
						return form.reportValidity();

					ev.preventDefault();
					ev.stopPropagation();

					const data = new FormData(form);
					data.append('password', password);
					data.append('_csrf', csrfToken);


					try {
						if (onSubmit) return;
						onSubmit = true;

						const res = await fetch(`${endpoint}/email/set`, {
							method: 'POST',
							body: new URLSearchParams(data),
							headers: { 'Authorization': authToken }
						});

						const _data = await res.json();
						onSubmit = false;

						RSNotifications.create(_data.message, res.status === 200 ? 'success' : 'error');
						if (res.status === 200) await loadSecuritySection();
					} catch(e) {
						console.error(e);
						RSNotifications.create('Something went wrong... Reload the page and try again.', 'error');
					}
				});


				securitySection.append(form);
			}


			// #endregion

			securitySection.append(d.createElement('hr'));

			// #region 2FA
			const _2faSection = d.createElement('div');
			_2faSection.style.marginTop = '10px';

			_2faSection.innerHTML = `<h3>Two-factor authentication</h3>
				<p class="small">Two-factor authentication adds an extra layer of security to your account by requiring a code in addition to your password to sign in.</p>`;
			
			if (!data._2fa) {
				const button = d.createElement('button');
				button.classList.add('btn-2');
				button.innerText = 'Enable 2FA';


				button.addEventListener('click', async () => {
					try {
						if (qr === '') {
							const res = await fetch(`${endpoint}/security/2fa/enable`, {
								method: 'POST',
								body: new URLSearchParams({
									_csrf: csrfToken
								}),
								headers: { 'Authorization': authToken }
							});

							if (res.ok) {
								const _data = await res.json();
								qr = _data.qr;
							}
						}

						if (qr !== '') {
							RSPopup.toggle(true);
							RSPopup.setSize(440, 580);
	
							const popup = d.getElementById('popup');
							popup.innerHTML = `<h3>Two-factor authentication</h3>
								<p>Scan the QR code below with your authenticator app.</p>`;

							const img = d.createElement('img');
							img.src = qr;
							img.setAttribute('alt', '2FA QR code');
							img.setAttribute('width', '256');
							img.setAttribute('height', '256');
							img.style.border = '3px solid #000';
							img.style.borderRadius = '15px';

							const input = d.createElement('input');
							input.classList.add('white');
							input.setAttribute('type', 'text');
							input.setAttribute('placeholder', 'Enter the code from your authenticator app');
							input.setAttribute('required', '');
							input.style.marginTop = '15px';
							input.style.width = '100%';

							const cancel = d.createElement('a');
							cancel.classList.add('btn-2', 'black');
							cancel.setAttribute('role', 'button');
							cancel.href = 'javascript:void(0)';
							cancel.innerText = 'Cancel';
							cancel.style.marginTop = '10px';
							cancel.style.marginRight = '10px';
							cancel.addEventListener('click', (ev) => { ev.preventDefault(); RSPopup.toggle(false); });

							const button = d.createElement('button');
							button.classList.add('btn-2', 'black');
							button.innerText = 'Verify';
							button.style.marginTop = '10px';

							const form = d.createElement('form');
							form.setAttribute('method', 'POST');
							form.append(img, input, cancel, button);

							form.addEventListener('submit', async (ev) => {
								ev.preventDefault();
								ev.stopPropagation();

								if (!form.checkValidity())
									return form.reportValidity();

								button.disabled = true;

								try {
									const res = await fetch(`${endpoint}/security/2fa/enable`, {
										method: 'POST',
										body: new URLSearchParams({
											_csrf: csrfToken, code: input.value
										}),
										headers: { 'Authorization': authToken }
									});

									/**
									 * @type {{message: string, codes: string[]}}
									 */
									const _data = await res.json();
									RSNotifications.create(_data.message, res.status === 200 ? 'success' : 'error');

									if (res.status === 200) {
										await loadSecuritySection();

										popup.innerHTML = `<h3>Two-factor authentication</h3>
											<p>Congratulations! You have successfully enabled two-factor authentication.
											<p>Here are your backup codes. You can use these to sign in if you lose access to your authenticator app.
											<p><b>Keep these codes safe! You will not be able to see them again, ever.</b>

											<p class="small">
												${_data.codes.map((code) => {
													return `<code style="background: #000; color: #fff; margin: 5px;">${code}</code>`;
												}).join('<br><br>')}
											</p>`;

										const button = d.createElement('button');
										button.classList.add('btn-2', 'black');
										button.innerText = 'Continue';
										button.style.marginTop = '10px';
										button.addEventListener('click', (ev) => { ev.preventDefault(); RSPopup.toggle(false); });

										popup.append(button);
									} else button.disabled = false;
								} catch(e) {
									console.error(e);
									RSNotifications.create('Something went wrong... Reload the page and try again.', 'error');
								}
							});

							popup.append(form);
						} else {
							RSNotifications.create('Something went wrong... Reload the page and try again.', 'error');
						}
					} catch (e) {
						console.error(e);
						RSNotifications.create('Something went wrong... Reload the page and try again.', 'error');
					}
				});

				_2faSection.append(button);
			} else {
				const button = d.createElement('button');
				button.classList.add('btn-2');
				button.innerText = 'Disable 2FA';

				button.addEventListener('click', async () => {
					RSPopup.toggle(true);
					RSPopup.setSize(400, 200);

					const popup = d.getElementById('popup');

					popup.innerHTML = `<h3>Disable two-factor authentication</h3>
						<p>Are you sure you want to disable two-factor authentication?</p>`;

					const cancel = d.createElement('a');
					cancel.classList.add('btn-2', 'black');
					cancel.setAttribute('role', 'button');
					cancel.href = 'javascript:void(0)';
					cancel.innerText = 'Cancel';
					cancel.style.marginTop = '10px';
					cancel.style.marginRight = '10px';
					cancel.addEventListener('click', (ev) => { ev.preventDefault(); RSPopup.toggle(false); });

					const button = d.createElement('button');
					button.classList.add('btn-2', 'black');
					button.innerText = 'Disable';
					button.style.marginTop = '10px';

					button.addEventListener('click', async () => {
						try {
							const res = await fetch(`${endpoint}/security/2fa/disable`, {
								method: 'POST',
								body: new URLSearchParams({
									_csrf: csrfToken
								}),
								headers: { 'Authorization': authToken }
							});

							const _data = await res.json();
							RSNotifications.create(_data.message, res.status === 200 ? 'success' : 'error');

							if (res.status === 200) {
								await loadSecuritySection();
								RSPopup.toggle(false);
								qr = '';
							}
						} catch (e) {
							console.error(e);
							RSNotifications.create('Something went wrong... Reload the page and try again.', 'error');
						}
					});

					popup.append(cancel, button);
				});

				const _2faCodes = d.createElement('p');
				_2faCodes.classList.add('small');
				_2faCodes.innerText = `You have ${data._2fa_recovery_codes} backup codes remaining.`;

				_2faSection.append(button, _2faCodes);
			}

			securitySection.append(_2faSection);
			// #endregion

			securitySection.append(d.createElement('hr'));

			// #region Change password
			const _h3 = d.createElement('h3');
			_h3.innerText = 'Change password';

			const _p = d.createElement('p');
			_p.classList.add('small');
			_p.innerText = 'Changing your password will log you out of all your devices. You can re-use your current password instead of changing it to refresh your password hash.';

			const _a = d.createElement('a');
			_a.classList.add('btn-2');
			_a.href = '/accounts/change-password';
			_a.innerText = 'Change password';

			securitySection.append(_h3, _p, _a);
			// #endregion


			// #endregion
		} catch (e) {
			console.error(e);
			securitySection.innerHTML = '<p>An error occurred while loading this section.';
			return;
		}
	}


	d.querySelectorAll('[data-type="session-revoke"]').forEach((el) => {
		el.addEventListener('click', async (ev) => {
			ev.preventDefault();
			ev.stopPropagation();

			try {
				const res = await fetch(`${endpoint}/session/delete`, {
					'method': 'POST',
					'body': new URLSearchParams({ '_csrf': csrfToken, 'session': el.dataset.id })
				});

				const data = await res.json();
				if (res.status === 200) el.closest('div[class="session"]').remove();
				RSNotifications.create(data.message, res.status === 200 ? 'success' : 'error');
			} catch (e) {
				console.error(e);
				RSNotifications.create('Something went wrong, please reload the page.', 'error');
			}
		});
	});


	d.querySelectorAll('form').forEach(form => {
		form.addEventListener('submit', async (ev) => {
			if (!form.checkValidity())
				return form.reportValidity();

			ev.preventDefault();
			ev.stopPropagation();

			const data = new FormData(form);
			data.append('_csrf', csrfToken);

			
			try {
				switch (form.dataset.type) {
					case 'profile':
						const res = await fetch(`${endpoint}/profile`, {
							method: 'POST',
							body: new URLSearchParams(data)
						});
		
						if (res.status !== 200) {
							const json = await res.json();
							RSNotifications.create(json.message, 'error');
							return;
						}
		
						RSNotifications.create('Settings saved successfully!', 'success');
						break;
				}


			} catch (e) {
				console.error(e);
				RSNotifications.create('Something went wrong...', 'error');
			}
		});
	});
	

	await loadSecuritySection();
})();
