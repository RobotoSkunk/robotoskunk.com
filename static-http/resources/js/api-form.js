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
	 * @param {HTMLFormElement} form 
	 * @param {RSApiFormSection[]} sections 
	 */
	constructor(form, sections) {
		/**
		 * @type {HTMLFormElement}
		 */
		this.form = form;
		/**
		 * @type {HTMLCollection}
		 */
		this.sections = sections;
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
	showSection(section, height = 0) {
		this.sections.forEach((s, i) => {
			s.element.style.display = i === section ? 'flex' : 'none';

			if (i === section)
				this.apiForm.style.height = `${s.height + height}px`;
		});
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
