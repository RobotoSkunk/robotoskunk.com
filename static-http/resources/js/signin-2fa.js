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
    const sections = [];
    for (const section of d.querySelectorAll('.section')) {
        sections.push(new RSApiFormSection(section, Number.parseInt(section.getAttribute('data-height'))));
    }
    const form = d.querySelector('form');
    const f = new RSApiForm(form, sections);
    const redirectUri = new URLSearchParams(window.location.search).get('redirect_uri') || location.origin;
    f.showSection(0);
    yield f.show();
    function setError(msg) {
        d.querySelectorAll('.error').forEach(e => e.textContent = msg);
    }
    const buttons = d.querySelectorAll('button.submit');
    form.addEventListener('submit', (ev) => __awaiter(this, void 0, void 0, function* () {
        if (!form.checkValidity())
            return form.reportValidity();
        ev.preventDefault();
        ev.stopPropagation();
        buttons.forEach(s => s.disabled = true);
        buttons.forEach(s => s.innerHTML = '<span class="loader black"></span>');
        const data = new FormData(form);
        try {
            const response = yield fetch('/accounts/signin/twofa', {
                'method': 'POST',
                'body': new URLSearchParams(data)
            });
            yield f.hide();
            if (response.status === 429) {
                setError('You have been rate limited. Please try again later.');
                f.showSection(0);
            }
            else if (response.status >= 400) {
                const json = yield response.json();
                if (json.message)
                    setError(json.message);
                else
                    setError('');
                f.showSection(0);
            }
            else {
                f.showSection(1);
                setTimeout(() => {
                    window.location.href = redirectUri === location.origin ? '/' : RSUtils.sanitizeUrl(redirectUri);
                }, 1000);
            }
        }
        catch (e) {
            console.error(e);
            setError('An error occurred while trying to verify two-factor authentication.');
            f.showSection(0);
            hcaptcha.reset();
        }
        yield f.show();
        buttons.forEach(s => s.disabled = false);
        buttons.forEach(s => s.innerHTML = 'Continue');
    }));
}))();
