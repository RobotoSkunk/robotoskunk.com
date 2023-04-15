const w = window, d = document;

class RSUtils {
	static regex = {
		handler: /^[a-zA-Z0-9_-]+$/,
		uri: /https:[\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/=]*)/gi,
		uriUnsecure: /http:[\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/=]*)/gi
	}

	/**
	 * Mantains a number in a range.
	 * @param {number} x The number to clamp.
	 * @param {number} min The minimum of the range.
	 * @param {number} max The maximum of the range.
	 * @returns {number} The clamped number.
	 */
	static clamp(x, min, max) {
		return (x > max ? max : (x < min ? min : x));
	}
	/**
	 * Mantains a number in a range of [0, 1].
	 * @param {number} x The number to clamp.
	 * @returns {number} The clamped number.
	 */
	static clamp01(x) {
		return (x > 1 ? 1 : (x < 0 ? 0 : x));
	}

	/**
	 * Interpolates between two numbers.
	 * @param {number} a The first number.
	 * @param {number} b The second number.
	 * @param {number} t The interpolation factor.
	 * @returns {number} The interpolated number.
	 */
	static lerp(a, b, t) {
		return a + (b - a) * t;
	}

	/**
	 * Returns a secure random string.
	 * @param {number} length The length of the string.
	 * @returns {string} The random string.
	 */
	static randomString(length) {
		const rnd = new Uint8Array(length);

		if (!crypto.getRandomValues) {
			for (var i = 0; i < length; i++) {
				rnd[i] = Math.floor(Math.random() * 256);
			}
		} else crypto.getRandomValues(rnd);

		// Convert to a-zA-Z0-9
		return Array.from(rnd, (x) => String.fromCharCode(x % 62 + 48 + (x % 62 > 9 ? 7 : 0) + (x % 62 > 35 ? 6 : 0))).join('');
	}

	/**
	 * Sanitizes a string to be used as a href destination.
	 * @param {string} str The string to sanitize.
	 * @returns {string} The sanitized string.
	 */
	static sanitizeUrl(str) {
		str = decodeURIComponent(str);

		const __blacklist = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:', 'mailto:', 'tel:'];
		if (__blacklist.some(p => str.toLowerCase().startsWith(p))) str = 'https://youtu.be/hiRacdl02w4?t=46';

		if (str.startsWith('//')) str = 'https:' + str;
		str = str.replace(/^(http:)/, 'https:');
		if (!str.startsWith('https://')) str = 'https://' + str;

		return str.replace(/[^-a-zA-Z0-9+&@#/%?=~_|!:,.;\(\)]/g, '');
	}

	/**
	 * Sanitizes a string to avoid XSS attacks.
	 * @param {string} str The string to sanitize.
	 * @returns {string} The sanitized string.
	 */
	static sanitize(str) {
		const __tmp = document.createElement('div');
		__tmp.style.display = 'none';
		__tmp.textContent = str;
		
		const __sanitized = __tmp.innerHTML;
		__tmp.remove();

		return __sanitized;
	}

	/**
	 * Unescapes HTML entities.
	 * @param {string} str The string to unescape.
	 * @returns {string} The unescaped string.
	 */
	static unescape(str) {
		return str.replace(/(&quot;|&#34;)/gm, '"').replace(/(&lt;|&#60;)/gm, '<').replace(/(&gt;|&#62;)/gm, '>').replace(/&#39;/gm, "'").replace(/(&amp;|&#38;)/gm, '&');
	}

	/**
	 * Parses a string to a custom markdown format.
	 * @param {string} str The string to parse.
	 * @returns {string} The parsed string.
	 */
	static parseMarkdown(str) {
		const links = {};

		str = RSUtils.sanitize(str
			.replace(RSUtils.regex.uri, (match) => {
				const id = `[link-${RSUtils.randomString(6)}]`;
				links[id] = RSUtils.sanitizeUrl(match);

				return id;
			})
		);
		const specials = /([*~`_@])/gm;
		const getLink = (href, text) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
		const escapeSpecials = (str) => str.replace(specials, '\\$1');


		str = str
				.replace(/\\(.)/g, (_, char) => !/\S/.test(char) ? `\\${char}` : (specials.test(char) ? `&#${char.charCodeAt(0)};` : char))
				.replace(/(```)(.*?)\1/gm, (_, __, code) => `<pre><code>${escapeSpecials(code)}</code></pre>`)
				.replace(/(`)(.*?)\1/g, (_, __, code) => `<code>${escapeSpecials(code)}</code>`)
				.replace(/(\*\*)(.*?)\1/g, '<b>$2</b>')
				.replace(/(__)(.*?)\1/g, '<span style="text-decoration: underline;">$2</span>')
				.replace(/(\*|_)(.*?)\1/g, '<i>$2</i>')
				.replace(/(~)(.*?)\1/g, '<s>$2</s>')
				.replace(/@([a-zA-Z0-9_-]+)/gm, (_, name) => `<a href="/user/${name}" target="_blank">@${name}</a>`)
				.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, (_, text, link) => {
					if (links[link]) {
						const res = getLink(links[link], text);
						delete links[link];

						return res;
					}

					return `[${text}](${link})`;
				})
				.replace(/\[link-.*?\]/g, (match) => {
					if (links[match]) {
						const res = getLink(links[match], links[match]);
						delete links[match];

						return res;
					}

					return match;
				});


		return str;
	}
}

class RSParallax {
	static data = [];

	static parse() {
		d.querySelectorAll('img-parallax').forEach((e) => {
			const content = e.innerHTML,
				src = e.getAttribute('src'),
				delay = e.getAttribute('delay'),
				style = e.getAttribute('style'),
				defStyle = `background-image: url('${src}'); background-size: cover; background-repeat: no-repeat;`;

			var newE = d.createElement('div');
			newE.innerHTML = content;
			newE.setAttribute('style', style ? style + defStyle : defStyle);

			e.replaceWith(newE);

			RSParallax.data.push({
				'node': newE,
				'delay': delay
			});
		});
	}

	static update() {
		RSParallax.data.forEach((e) => {
			const visible = w.scrollY < e.node.offsetTop + e.node.offsetHeight && w.scrollY + w.innerHeight > e.node.offsetTop;

			if (visible)
				e.node.style['background-position'] = `center ${(w.scrollY - e.node.offsetTop) / e.delay}px`;
		});
	}
}

class RSNotifications {
	static notfId = 0;

	/**
	 * Creates a notification.
	 * @param {string} message The message to display.
	 * @param {('success'|'error'|'info'|'warning')} type The type of the notification.
	 * @param {number} [timeout] The timeout in milliseconds.
	 */
	static create(message, type, timeout = 5000) {
		const notf = d.createElement('div'),
			notfId = RSNotifications.notfId++;
		
		notf.classList.add('notification');
		notf.classList.add(type);
		notf.setAttribute('id', `notf-${notfId}`);
		notf.textContent = message;
		notf.style.right = '-100%';

		d.querySelector('#notifications').appendChild(notf);

		function remove() {
			notf.style.right = '-100%';
			setTimeout(() => {
				notf.remove();
			}, 500);
		}

		setTimeout(() => {
			notf.style.right = '0';

			const timeoutId = setTimeout(remove, timeout);
			notf.addEventListener('click', () => { clearTimeout(timeoutId); remove(); });
		}, 100);

		switch (type) {
			case 'success': console.log(`[Notification]: ${message}`); break;
			case 'error': console.error(`[Notification]: ${message}`); break;
			case 'info': console.info(`[Notification]: ${message}`); break;
			case 'warning': console.warn(`[Notification]: ${message}`); break;
		}
	}

	static install() {
		d.body.appendChild(d.createElement('div')).id = 'notifications';

		const stylesheet = d.head.appendChild(d.createElement('link'));
		stylesheet.rel = 'stylesheet';
		stylesheet.href = '/resources/css/common/notifications.css';
	}
}

class RSPopup {
	static install() {
		const stylesheet = d.head.appendChild(d.createElement('link'));
		stylesheet.rel = 'stylesheet';
		stylesheet.href = '/resources/css/common/popup.css';

		const popup = d.createElement('div');
		popup.classList.add('popup');
		popup.innerHTML = '<div class="popup-background" style="display: none"></div><div class="popup-content" id="popup"></div>';
		d.body.appendChild(popup);

		popup.addEventListener('click', (e) => {
			if (e.target.classList.contains('popup-background'))
				RSPopup.toggle(false);
		});

		// Fix minor visual bug
		setTimeout(() => {
			const bg = d.querySelector('.popup-background');
			bg.style.display = 'block';
		}, 1000);
	}

	static toggle(show) {
		const popup = d.querySelector('.popup');
		popup.classList.toggle('open', show);
	}

	static setSize(width, height) {
		const popup = d.querySelector('.popup-content');
		popup.style.width = width;
		popup.style.height = height;
	}
}

FormData.prototype.toJSON = function() {
	return Object.fromEntries(this);
};

const alexTalk = (message) => console.log(`%cAlex Skunk: %c${message}`, "color: #c3e629; font-size: 15px;", "color: #dddddd; font-size: 15px; font-weight: bold;");

(() => {
	// Alex Skunk: Dipping into JavaScript code just to see which phrases appear is cheating.
	const phrases = [
		'Hey, what are you doing here?',
		'It seems suspicious to see you here.',
		'Why are you here?',
		'Wow, you are here, who would say?',
		"I'll have to spray you if you don't get out of here, and nobody wants that.",
		"Roses are red, violets are blue, I don't know what you're doing here, please don't break anything.",
		'¡Mamá, se metió otro pejelagarto!',
		'Very curious to see you here.',
		"Well, you're here... want a coffee?",
		'Go ahead and use the element inspector, don comedia.',
		'This comment will never appear in the console!',
		'Mrrr mrrrrr? Mrrrrrr! I mean... why are you here?',
		"Well, you're here, what a surprise.",
		"If you're going to be here, DON'T STEAL MY COOKIES!",
		"I'm everywhere, just like you.",
		"*raises his tail* DON'T MOVE AND TELL ME WHY ARE YOU HERE!",
		"Roboto won't like to see you around here."
	];
	var phi = 0;
	do {
		phi = ~~(Math.random() * phrases.length);
	} while (phi == 10);

	alexTalk(phrases[phi]);
})();

function fart() {
	const phrases = [
		"You're gross.",
		"Stop it.",
		"Please, stop.",
		"Stop farting."
	];

	alexTalk(phrases[~~(Math.random() * phrases.length)]);
}

function boop() {
	const phrases = [
		'hehe...',
		'>wo',
		'boop',
		'<3',
		'>w<'
	];

	alexTalk(phrases[~~(Math.random() * phrases.length)]);
}

