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
	/**
	 * @type {HTMLFormElement}
	 */
	form = null;
	/**
	 * @type {HTMLElement[]}
	 */
	sections = [];
	/**
	 * @type {HTMLElement}
	 */
	apiForm = null;

	constructor() {
		this.sections = d.querySelectorAll('.section');
		this.form = document.querySelector('form');
		this.apiForm = document.querySelector('#api-form');
	}

	/**
	 * @param {string} left 
	 * @param {string} opacity 
	 * @param {number} duration 
	 */
	#animate(left, opacity, duration) {
		Velocity(this.form, {
			'left': left,
			'opacity': opacity
		}, {
			'duration': duration,
			'easing': 'easeInOutQuart'
		});
	}
	async #wait(duration) {
		return new Promise((resolve) => {
			setTimeout(resolve, duration);
		});
	}
	async hide() {
		this.#animate('-100%', '0', 500);
		await this.#wait(500);
		this.#animate('100%', '0', 0);
	}
	async show() {
		this.#animate('0%', '1', 500);
		await this.#wait(500);
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
	getFormData(){
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
