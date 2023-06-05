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
class RSApiForm {
    constructor() {
        this.form = null;
        this.sections = null;
        this.apiForm = null;
        this.sections = d.querySelectorAll('.section');
        this.form = document.querySelector('form');
        this.apiForm = document.querySelector('#api-form');
    }
    /**
     * Animate the form.
     * @param left The desired left position.
     * @param opacity The desired opacity.
     * @param duration The duration of the animation.
     */
    animate(left, opacity, duration) {
        Velocity(this.form, {
            'left': left,
            'opacity': opacity.toString()
        }, {
            'duration': duration,
            'easing': 'easeInOutQuart'
        });
    }
    /**
     * Wait for a given amount of time.
     * @param ms The amount of time to wait.
     * @returns
     */
    wait(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                setTimeout(resolve, ms);
            });
        });
    }
    /**
     * Hide the form.
     */
    hide() {
        return __awaiter(this, void 0, void 0, function* () {
            this.animate('-100%', 0, 500);
            yield this.wait(500);
            this.animate('100%', 0, 0);
        });
    }
    /**
     * Show the form.
     */
    show() {
        return __awaiter(this, void 0, void 0, function* () {
            this.animate('0%', 1, 500);
            yield this.wait(500);
        });
    }
    /**
     * Show a given section.
     * @param section The index of the section to show.
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
     * Show a given section with an animation.
     * @param section The index of the section to show.
     */
    autoShowSection(section) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.hide();
            this.sections.forEach((s, i) => {
                s.style.display = i === section ? 'flex' : 'none';
                if (i === section) {
                    const height = s.scrollHeight + 40;
                    this.apiForm.style.height = `${height}px`;
                }
            });
            yield this.show();
        });
    }
    /**
     * Convert the form to a FormData object.
     * @returns The form data.
     */
    getFormData() {
        const formData = new FormData(this.form);
        return formData;
    }
}
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
