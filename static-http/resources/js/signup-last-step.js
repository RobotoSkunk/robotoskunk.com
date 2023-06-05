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
    const apiForm = new RSApiForm();
    apiForm.showSection(0);
    yield apiForm.show();
    function setErrorMessage(message) {
        d.querySelectorAll('.error').forEach(e => e.textContent = message);
    }
    // #region Password strength
    function passwordMatch() {
        const passwordInput = d.querySelector('#password');
        const passwordRepeatInput = d.querySelector('#password-repeat');
        const match = passwordInput.value === passwordRepeatInput.value;
        setErrorMessage(match ? '' : 'Passwords do not match.');
        return match;
    }
    function checkPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield zxcvbn(password);
            const colors = ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3'];
            d.querySelector('#password-strength').innerHTML = data.scoreText;
            d.querySelector('#password-bar').style.width = `${data.score / 4 * 100}%`;
            d.querySelector('#password-bar').style.backgroundColor = colors[data.score];
            d.querySelector('#handler-alert').className = data.score <= 1 ? 'handler-at danger' : (data.score == 2 ? 'handler-at warning' : 'handler-at');
            d.querySelector('#warning').textContent = data.feedback.warning;
            d.querySelector('#suggestions').innerHTML = '';
            for (const s of data.feedback.suggestions)
                d.querySelector('#suggestions').appendChild(d.createElement('li')).textContent = s;
            d.querySelector('#s2-btn').disabled = data.score <= 2 || !passwordMatch();
        });
    }
    yield checkPassword(d.querySelector('#password').value);
    d.querySelector('#password').addEventListener('input', (ev) => __awaiter(this, void 0, void 0, function* () {
        yield checkPassword(ev.target.value);
    }));
    d.querySelector('#password-repeat').addEventListener('input', (_) => {
        d.querySelector('#s2-btn').disabled = !passwordMatch();
    });
    // #endregion
    d.querySelector('a#toggle-password').addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const input = d.querySelectorAll('input[data-type="password"]');
        for (const i of input) {
            const style = window.getComputedStyle(i);
            if (style.display !== 'none') {
                i.type = i.type === 'password' ? 'text' : 'password';
                d.querySelector('a#toggle-password').innerHTML = `<img width="25" src="/resources/svg/eye-${i.type === 'password' ? 'enable' : 'disable'}.svg" alt="Show password">`;
            }
        }
    });
    const buttons = d.querySelectorAll('button.submit');
    apiForm.form.addEventListener('submit', (ev) => __awaiter(this, void 0, void 0, function* () {
        if (!apiForm.form.checkValidity()) {
            return apiForm.form.reportValidity();
        }
        ev.preventDefault();
        ev.stopPropagation();
        buttons.forEach(s => s.disabled = true);
        buttons.forEach(s => s.innerHTML = '<span class="loader black"></span>');
        const data = new FormData(apiForm.form);
        const date = new Date(data.get('birthdate').toString());
        data.delete('birthdate');
        data.append('birthdate', date.getTime().toString());
        if (data.get('password') === '') {
            yield apiForm.hide();
            apiForm.showSection(1);
        }
        else if (!data.get('h-captcha-response')) {
            yield apiForm.hide();
            apiForm.showSection(2);
        }
        else {
            try {
                const response = yield fetch('/accounts/signup', {
                    'method': 'POST',
                    'body': new URLSearchParams(data)
                });
                yield apiForm.hide();
                if (response.status === 429) {
                    setErrorMessage('You have been rate limited. Please try again later.');
                    apiForm.showSection(0);
                }
                else if (response.status >= 400) {
                    const json = yield response.json();
                    setErrorMessage(json.message);
                    switch (json.code) {
                        case 4:
                            apiForm.showSection(1);
                            break;
                        case 5:
                            apiForm.showSection(2);
                            break;
                        default:
                            apiForm.showSection(0);
                            break;
                    }
                    hcaptcha.reset();
                }
                else
                    apiForm.showSection(3);
            }
            catch (e) {
                console.error(e);
                setErrorMessage('An error occurred while trying to sign up.');
                apiForm.showSection(0);
            }
        }
        yield apiForm.show();
        buttons.forEach(s => s.disabled = false);
        buttons.forEach(s => s.innerHTML = 'Continue');
    }));
}))();
