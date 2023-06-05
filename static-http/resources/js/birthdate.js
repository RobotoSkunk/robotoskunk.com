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
    function setError(msg) {
        d.querySelectorAll('.error').forEach(e => e.textContent = msg);
    }
    const buttons = d.querySelectorAll('button.submit');
    d.querySelector('#learn-more').addEventListener('click', (ev) => __awaiter(this, void 0, void 0, function* () {
        ev.preventDefault();
        buttons.forEach(s => s.disabled = true);
        buttons.forEach(s => s.innerHTML = '<span class="loader black"></span>');
        yield apiForm.hide();
        apiForm.showSection(1);
        yield apiForm.show();
        buttons.forEach(s => s.disabled = false);
        buttons.forEach(s => s.innerHTML = 'Continue');
    }));
    d.querySelector('#back').addEventListener('click', (ev) => __awaiter(this, void 0, void 0, function* () {
        ev.preventDefault();
        ev.stopPropagation();
        buttons.forEach(s => s.disabled = true);
        buttons.forEach(s => s.innerHTML = '<span class="loader black"></span>');
        yield apiForm.hide();
        apiForm.showSection(0);
        yield apiForm.show();
        buttons.forEach(s => s.disabled = false);
        buttons.forEach(s => s.innerHTML = 'Continue');
    }));
    apiForm.form.addEventListener('submit', (ev) => __awaiter(this, void 0, void 0, function* () {
        if (!apiForm.form.checkValidity())
            return apiForm.form.reportValidity();
        ev.preventDefault();
        ev.stopPropagation();
        buttons.forEach(s => s.disabled = true);
        buttons.forEach(s => s.innerHTML = '<span class="loader black"></span>');
        const data = new FormData(apiForm.form);
        const birthdate = data.get('birthdate');
        const date = new Date(birthdate.toString());
        data.delete('birthdate');
        data.set('birthdate', date.getTime().toString());
        try {
            const response = yield fetch('/accounts/settings/birthdate', {
                'method': 'POST',
                'body': new URLSearchParams(data)
            });
            yield apiForm.hide();
            if (response.status === 429) {
                setError('You have been rate limited. Please try again later.');
                apiForm.showSection(0);
            }
            else if (response.status >= 400) {
                const json = yield response.json();
                if (json.message)
                    setError(json.message);
                else
                    setError('');
                if (!json.code)
                    apiForm.showSection(0);
            }
            else {
                apiForm.showSection(2);
                setTimeout(() => { window.location.href = '/'; }, 1000);
            }
        }
        catch (e) {
            console.error(e);
            setError('An error occurred while trying to update your account. Please try again later.');
            apiForm.showSection(0);
        }
        yield apiForm.show();
        buttons.forEach(s => s.disabled = false);
        buttons.forEach(s => s.innerHTML = 'Continue');
    }));
}))();
