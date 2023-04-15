
(() => {
	const canvas = d.getElementById('canvas'),
		canvasSize = d.getElementById('canvas-size'),
		customSize = d.querySelectorAll('.custom-size > input'),
		form = d.querySelector('form');

	var price = 0, _price = 0, invoice = '';
	RSPopup.install();


	function setCanvasSize(w, h) {
		w = RSUtils.clamp(w, 100, 10000);
		h = RSUtils.clamp(h, 100, 10000);

		const ratio = w / h, maxSize = 250;
		var nw, nh;

		if (w > h) {
			nw = maxSize;
			nh = nw / ratio;
		} else {
			nh = maxSize;
			nw = nh * ratio;
		}

		canvas.style.width = `${nw}px`;
		canvas.style.height = `${nh}px`;

		canvas.innerText = `${w} x ${h}`;
	}

	const defSize = article.size.defaults[0];
	setCanvasSize(defSize[0], defSize[1]);

	canvasSize.addEventListener('change', (ev) => {
		if (ev.target.value === 'custom') return;
		const size = ev.target.value.split('x');

		const w = parseInt(size[0]), h = parseInt(size[1]);
		setCanvasSize(w, h);

		if (customSize.length === 2) {
			customSize[0].value = w;
			customSize[1].value = h;
		}
	});

	customSize.forEach((e) => {
		e.addEventListener('input', (ev) => {
			const n = parseInt(ev.target.value);
			if (isNaN(n)) ev.target.value = 0;
			else if (n > 10000) ev.target.value = 10000;

			const w = parseInt(customSize[0].value), h = parseInt(customSize[1].value);

			canvasSize.value = article.size.defaults.find((e) => e[0] === w && e[1] === h) ? `${w}x${h}` : 'custom';

			setCanvasSize(w, h);
		});
	});


	function calculatePrice() {
		const data = new FormData(form);

		/**
		 * @type {Array<{text: string, value: number}>}
		 */
		const groups = [{
			text: `<tr><td><b>Commission price</b><td>$${article.price} USD`,
			value: article.price
		}];



		for (const option of article.options) {
			if (!groups[option.group]) groups[option.group] = { text: '', value: 0 };
			const field = data.get(option.id);

			if (!field) return RSNotifications.create('Something went wrong...', 'error');

			switch (option.type) {
				case 'radio':
					const sel = option.options.find((e) => e.id === field);

					if (sel) {
						groups[option.group].text += `<tr><td><b>${option.label}</b>: ${sel.label} <td>$${sel.value} USD`;
						groups[option.group].value += sel.value;
					}
					break;

				case 'number':
					const data = option.data;
					var action = `${parseInt(field) * data.value}`;

					switch (data.action) {
						case 'add':
							action = `+ $${action} USD`;
							groups[option.group].value += parseInt(field) * data.value;
							break;
						case 'multiply':
							action = `x ${action}`;
							groups[option.group].value *= parseInt(field) * data.value;
							break;
					}

					groups[option.group].text += `<tr><td><b>${option.label}</b> <td>${action}`;
					break;
			}
		}


		price = groups.reduce((a, b) => a + b.value, 0);
		price *= 1 - discount;

		var disc = '';

		if (discount)
			disc = `<tr><td><b>Discount</b> <td>-${discount * 100}%`;

		invoice = groups.map((e) => {
			const priceText = `<tr><td> <td>$${e.value.toFixed(2)} USD`;
			return `<table>${e.text}${priceText}</table>`;

		}).join('') + `<table style="width: 95%">${disc}<tr><td><b>Total price</b> <td>$${price.toFixed(2)} USD</table>`;

	}

	form.addEventListener('input', calculatePrice);
	calculatePrice();

	form.addEventListener('submit', (ev) => {
		if (!form.checkValidity())
			return form.reportValidity();

		ev.preventDefault();

		const data = new FormData(form), popup = d.getElementById('popup');
		if (article.size.custom) data.set('canvas', `${customSize[0].value}x${customSize[1].value}`);
		else data.set('canvas', canvasSize.value);


		popup.innerHTML = `<h2>Order summary</h2>
			<span>Canvas: ${data.get('canvas-x')} x ${data.get('canvas-y')} pixels</span>
			${invoice}`;

		const cancel = d.createElement('button');
		cancel.innerText = 'Cancel';
		cancel.classList.add('btn-2', 'black');
		cancel.style.margin = '10px 10px 0 0';
		cancel.addEventListener('click', () => RSPopup.toggle(false));

		const button = d.createElement('button');
		button.innerText = 'Order';
		button.classList.add('btn-2', 'black');
		button.style.marginBottom = '10px';
		button.addEventListener('click', async () => {
			const req = await fetch(location.href, {
				method: 'POST',
				body: new URLSearchParams(data)
			});

			try {
				const res = await req.json();

				RSNotifications.create(res.message, req.ok ? 'success' : 'error');

				if (req.ok) {
					location.href = `/commissions/order/${res.id}`
				}
			} catch (e) {
				RSNotifications.create('Something went wrong...', 'error');
				console.error(e);
			}
		});

		popup.append(cancel, button);
		RSPopup.toggle(true);
	});


	d.querySelectorAll('input[type="number"]').forEach((ev) => {
		ev.addEventListener('input', (ev) => {
			var n = parseInt(ev.target.value);
			const min = parseInt(ev.target.min), max = parseInt(ev.target.max);

			if (isNaN(n)) n = min;
			ev.target.value = RSUtils.clamp(n, min, max);
		});
	});

	setInterval(() => {
		_price = RSUtils.lerp(_price, price, 0.1);
		var txt = `<span><b>Total price</b>: $${_price.toFixed(2)} USD</span>`;

		if (discount) {
			var _original = _price / (1 - discount);

			txt = `<span class="old-price"><b>Total price</b>: $${_original.toFixed(2)} USD</span><br> ${txt} <span class="discount">${discount * 100}% OFF</span>`;
		}

		d.getElementById('price').innerHTML = txt;
	}, 16);
})();
