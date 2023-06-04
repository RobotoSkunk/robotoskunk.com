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
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _RSApiForm_instances, _RSApiForm_animate, _RSApiForm_wait;
class RSApiFormSection {
    /**
     * @param {HTMLElement} element
     * @param {number} height
     */
    constructor(element, height) {
        this.element = element;
        this.height = height;
    }
}
class RSApiForm {
    constructor() {
        _RSApiForm_instances.add(this);
        /**
         * @type {HTMLFormElement}
         */
        this.form = null;
        /**
         * @type {HTMLElement[]}
         */
        this.sections = [];
        /**
         * @type {HTMLElement}
         */
        this.apiForm = null;
        this.sections = d.querySelectorAll('.section');
        this.form = document.querySelector('form');
        this.apiForm = document.querySelector('#api-form');
    }
    hide() {
        return __awaiter(this, void 0, void 0, function* () {
            __classPrivateFieldGet(this, _RSApiForm_instances, "m", _RSApiForm_animate).call(this, '-100%', '0', 500);
            yield __classPrivateFieldGet(this, _RSApiForm_instances, "m", _RSApiForm_wait).call(this, 500);
            __classPrivateFieldGet(this, _RSApiForm_instances, "m", _RSApiForm_animate).call(this, '100%', '0', 0);
        });
    }
    show() {
        return __awaiter(this, void 0, void 0, function* () {
            __classPrivateFieldGet(this, _RSApiForm_instances, "m", _RSApiForm_animate).call(this, '0%', '1', 500);
            yield __classPrivateFieldGet(this, _RSApiForm_instances, "m", _RSApiForm_wait).call(this, 500);
        });
    }
    /**
     * @param {number} section
     * @param {number} height
     */
    showSection(section) {
        this.sections.forEach((s, i) => {
            s.style.display = i === section ? 'flex' : 'none';
            if (i === section) {
                const height = s.scrollHeight + 40;
                this.apiForm.style.height = `${height}px`;
            }
        });
    }
    /**
     * Convert the form to a FormData object.
     * @returns {FormData} The form data.
     */
    getFormData() {
        const formData = new FormData(this.form);
        return formData;
    }
}
_RSApiForm_instances = new WeakSet(), _RSApiForm_animate = function _RSApiForm_animate(left, opacity, duration) {
    Velocity(this.form, {
        'left': left,
        'opacity': opacity
    }, {
        'duration': duration,
        'easing': 'easeInOutQuart'
    });
}, _RSApiForm_wait = function _RSApiForm_wait(duration) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            setTimeout(resolve, duration);
        });
    });
};
/*(() => {
    const bg = document.querySelector('#bg-filter');

    if (bg !== null) {
        bg.animate([
            {
                'backdropFilter': 'blur(0px)'
            }, {
                'backdropFilter': 'blur(10px)'
            }
        ], {
            'duration': 500,
            'easing': 'ease',
            'fill': 'forwards'
        });
    }
})();*/
