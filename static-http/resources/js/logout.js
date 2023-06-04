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
    const _s = d.querySelector('.section');
    const sections = [
        new RSApiFormSection(_s, Number.parseInt(_s.getAttribute('data-height')))
    ];
    const form = d.querySelector('form');
    const f = new RSApiForm(form, sections);
    f.showSection(0);
    yield f.show();
    d.querySelectorAll('.submit').forEach(s => {
        s.addEventListener('click', (ev) => __awaiter(this, void 0, void 0, function* () {
            if (ev.target.dataset.type === 'cancel') {
                ev.preventDefault();
                ev.stopPropagation();
                window.location.href = '/';
            }
        }));
    });
}))();
