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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(() => __awaiter(this, void 0, void 0, function* () {
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
    form.addEventListener('submit', (ev) => __awaiter(this, void 0, void 0, function* () {
        if (!form.checkValidity()) {
            return form.reportValidity();
        }
        ev.preventDefault();
        const data = new FormData(form);
        const captcha = data.get('h-captcha-response');
        if (!captcha) {
            return RSNotifications.create('Please complete the captcha.', 'warning');
        }
        button.disabled = true;
        button.innerHTML = '<span class="loader black"></span>';
        // file deepcode ignore Ssrf: This code isn't executed on the server side
        const response = yield fetch(RSUtils.sanitizeUrl(window.location.href), {
            method: 'POST',
            body: new URLSearchParams(data)
        });
        if (response.ok) {
            window.location.reload();
        }
        else {
            try {
                const json = yield response.json();
                RSNotifications.create(json.message, 'warning');
            }
            catch (e) {
                console.error(e);
                RSNotifications.create('An error occurred while deleting your account.', 'error');
            }
            button.disabled = false;
            button.innerHTML = 'Confirm';
            hcaptcha.reset();
        }
        ;
    }));
}))();
