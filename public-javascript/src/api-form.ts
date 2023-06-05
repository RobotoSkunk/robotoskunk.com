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

class RSApiForm
{
	form: HTMLFormElement = null;
	sections: NodeListOf<HTMLDivElement> = null;
	apiForm: HTMLElement = null;

	constructor()
	{
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
	private animate(left: string, opacity: number, duration: number)
	{
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
	private async wait(ms: number)
	{
		return new Promise((resolve) =>
		{
			setTimeout(resolve, ms);
		});
	}

	/**
	 * Hide the form.
	 */
	public async hide()
	{
		this.animate('-100%', 0, 500);
		await this.wait(500);
		this.animate('100%', 0, 0);
	}

	/**
	 * Show the form.
	 */
	public async show()
	{
		this.animate('0%', 1, 500);
		await this.wait(500);
	}

	/**
	 * Show a given section.
	 * @param section The index of the section to show.
	 */
	public showSection(section: number): void
	{

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
	public async autoShowSection(section: number): Promise<void>
	{
		await this.hide();

		this.sections.forEach((s, i) => {
			s.style.display = i === section ? 'flex' : 'none';

			if (i === section) {
				const height = s.scrollHeight + 40;
				this.apiForm.style.height = `${height}px`;
			}
		});

		await this.show();
	}

	/**
	 * Convert the form to a FormData object.
	 * @returns The form data.
	 */
	public getFormData(): FormData
	{
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
