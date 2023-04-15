// file deepcode ignore DOMXSS: RSUtils.parseMarkdown() already sanitizes the string with RSUtils.sanitize()

(async () => {
	const commentInput = d.getElementById('comment-input');
	const userHandler = d.getElementById('user-handler');
	/**
	 * @type {HTMLDivElement}
	 */
	const comments = d.getElementById('comments');
	var cache = {};
	var csrfToken = '';

	const __tmp = d.getElementById('_csrf');
	if (__tmp) csrfToken = __tmp.value;


	const endpoint = `/backend/shouts/${userHandler.value}`;
	var page = 0;
	var maxPage = 0;
	var lastPage = 0;



	function cinf() {
		const content = commentInput.value.trim();

		d.getElementById('comment-size').innerText = `${content.length} / 250`;
		d.getElementById('comment-post').disabled = content.length === 0 || content.length > 250;
	}
	if (commentInput) {
		commentInput.addEventListener('input', async (ev) => { cinf(); });
		cinf();
	}

	/**
	 * @param {Event} ev 
	 */
	const editEvent = async (ev) => {
		ev.preventDefault();
		ev.stopPropagation();

		// Convert the comment to an input
		/**
		 * @type {HTMLElement}
		 */
		const comment = ev.target.closest('.comment-post');
		const content = comment.querySelector('.user-text');
		/**
		 * @type {{id: string, content: string, edits: {content: string, created_at: {date: number, relative: string}}, toggle: boolean}}
		 */
		const _data = cache[comment.dataset.id];

		if (!_data) return RSNotifications.create('Comment not found.', 'error');


		const form = d.createElement('form');
		form.setAttribute('method', 'POST');
		form.setAttribute('action', `${endpoint}/${_data.id}`);

		const input = d.createElement('textarea');
		input.classList.add('comment-input');
		input.setAttribute('name', 'content');
		input.setAttribute('required', 'true');
		input.setAttribute('maxlength', '1000');
		input.setAttribute('rows', _data.content.replace('\r', '').split('\n').length);
		input.value = _data.content;

		form.append(input);
		comment.replaceChild(form, content);

		// Add the save button
		/**
		 * @type {HTMLElement}
		 */
		const footer = comment.querySelector('.footer');
		const _footer = footer.cloneNode(true);
		footer.innerHTML = '';

		const revert = (text) => {
			content.innerHTML = text;
			comment.replaceChild(content, form);
			footer.replaceWith(_footer);

			// Add the event listeners
			_footer.querySelector('a[href="#edit"]')?.addEventListener('click', editEvent);
			_footer.querySelector('a[href="#delete"]')?.addEventListener('click', deleteEvent);
		};


		const cancel = d.createElement('a');
		cancel.setAttribute('href', 'javascript:void(0)');
		cancel.setAttribute('role', 'button');
		cancel.innerText = 'Cancel';
		cancel.addEventListener('click', async (ev) => {
			ev.preventDefault();
			ev.stopPropagation();

			revert(RSUtils.parseMarkdown(_data.content));
		});

		const save = d.createElement('a');
		save.setAttribute('href', 'javascript:void(0)');
		cancel.setAttribute('role', 'button');
		save.innerText = 'Save';
		save.addEventListener('click', async (ev) => {
			ev.preventDefault();
			ev.stopPropagation();

			const data = new FormData(form);
			data.append('_csrf', csrfToken);
			const cont = data.get('content').trim();

			if (cont === _data.content) return revert(RSUtils.parseMarkdown(_data.content));
			if (cont.length === 0) return RSNotifications.create('Comment cannot be empty.', 'warning');
			if (cont.length > 250) return RSNotifications.create('Comment cannot be longer than 250 characters.', 'warning');
			if (_data.edits.length >= 5) return RSNotifications.create('You cannot edit this comment anymore.', 'warning');


			try {
				const res = await fetch(form.getAttribute('action'), {
					method: 'POST',
					body: new URLSearchParams(data)
				});

				if (res.ok) {
					RSNotifications.create('Comment updated.', 'success');

					await loadComments();
				}
				else RSNotifications.create('Something went wrong while editing your comment.', 'error');
			} catch (e) {
				console.log(e);
				RSNotifications.create('Something went wrong while editing your comment.', 'error');
			}

		});

		footer.append(cancel, save);
	};

	/**
	 * @param {Event} ev 
	 */
	const deleteEvent = async (ev) => {
		ev.preventDefault();
		ev.stopPropagation();

		/**
		 * @type {HTMLElement}
		 */
		const comment = ev.target.closest('.comment-post');
		const _data = cache[comment.dataset.id];
		if (!_data) return RSNotifications.create('Comment not found.', 'error');


		try {
			const res = await fetch(`${endpoint}/${_data.id}`, {
				method: 'DELETE',
				headers: { '_csrf': csrfToken }
			});

			if (res.ok) {
				RSNotifications.create('Comment deleted', 'success');
				await loadComments();
			}
			else RSNotifications.create('Something went wrong while deleting your comment.', 'error');
		} catch (e) {
			RSNotifications.create('Something went wrong while deleting your comment.', 'error');
		}
	};

	/**
	 * @param {Event} ev 
	 */
	const toggleEditHistory = (ev) => {
		ev.preventDefault();
		ev.stopPropagation();

		/**
		 * @type {HTMLElement}
		 */
		const comment = ev.target.closest('.comment-post');
		const editDiv = comment.querySelector('.edit-history');
		/**
		 * @type {{id: string, content: string, edits: {content: string, created_at: {date: number, relative: string}}, toggle: boolean}}
		 */
		const _data = cache[comment.dataset.id];

		editDiv.style.height = _data.toggle ? '0px' : `${editDiv.scrollHeight}px`;
		_data.toggle = !_data.toggle;
	}



	async function loadComments() {
		try {
			cache = {};
			const _last = comments.innerHTML;
			comments.innerHTML = `${_last}<div class="loading"><span class="loader"></span></div>`;

			const res = await fetch(`${endpoint}/${page}`, { 'method': 'GET' });

			if (res.ok) {
				const json = await res.json();
				maxPage = json.max_page;
				comments.innerHTML = '';

				d.getElementById('page-text').innerText = `${page + 1} / ${maxPage}`;


				comments.append(...json.shouts.map(c => {
					const id = `comment-${RSUtils.randomString(8)}`;
					cache[id] = {
						id: c.id,
						content: c.content,
						edits: c.edit_history,
						toggle: false
					};

					const comment = d.createElement('div');
					comment.classList.add('comment-post');
					comment.setAttribute('data-id', id);


					// #region Header
					const datesContainer = d.createElement('div');
					const header = d.createElement('div');
					header.classList.add('header');
					

					if (c.author.handler) {
						const user = d.createElement('a');
						user.classList.add('user');
						user.innerText = c.author.name;
						user.setAttribute('href', `/user/${c.author.handler}`);	
						user.setAttribute('role', 'link');
						header.append(user);
					} else {
						const user = d.createElement('span');
						user.classList.add('user');
						user.innerText = c.author.name;
						header.append(user);
					}


					if (c.edited_at) {
						const edited = d.createElement(c.edit_history.length ? 'a' : 'span');
						edited.classList.add('date');
						edited.setAttribute('title', new Date(c.edited_at.time).toLocaleString());
						edited.setAttribute('focusable', 'true');
						edited.innerText = `(Edited) ${c.edited_at.relative}`;

						if (c.edit_history.length) {
							edited.addEventListener('click', toggleEditHistory);
							edited.setAttribute('role', 'button');
							edited.setAttribute('href', 'javascript:void(0)');
						}

						datesContainer.append(edited);
					}


					const date = d.createElement('span');
					date.classList.add('date');
					date.setAttribute('title', new Date(c.created_at.time).toLocaleString());
					date.setAttribute('focusable', 'true');
					date.innerText = c.created_at.relative;

					datesContainer.append(date);
					header.append(datesContainer);
					// #endregion
					
					const content = d.createElement('div');
					content.classList.add('user-text');
					content.innerHTML = RSUtils.parseMarkdown(c.content);

					comment.append(header, content);


					// #region Footer
					if (c.editable) {
						const footer = d.createElement('div');
						footer.classList.add('footer');

						const edit = d.createElement('a');
						edit.addEventListener('click', editEvent);
						edit.setAttribute('role', 'button');
						edit.setAttribute('href', 'javascript:void(0)');
						edit.innerText = 'Edit';

						const del = d.createElement('a');
						del.addEventListener('click', deleteEvent);
						del.setAttribute('role', 'button');
						del.setAttribute('href', 'javascript:void(0)');
						del.innerText = 'Delete';

						footer.append(del, edit);
						comment.append(footer);
					}
					// #endregion

					if (c.edit_history.length) {
						const _tmp = d.createElement('div');
						_tmp.classList.add('edit-history');

						for (const edit of c.edit_history) {
							const _edit = d.createElement('div');

							const _header = d.createElement('div');
							_header.classList.add('header');

							const _date = d.createElement('span');
							_date.classList.add('date');
							_date.setAttribute('title', new Date(edit.created_at.time).toLocaleString());
							_date.setAttribute('focusable', 'true');
							_date.innerText = edit.created_at.relative;


							const _content = d.createElement('div');
							_content.classList.add('user-text');
							_content.innerHTML = RSUtils.parseMarkdown(edit.content);

							_header.append(_date);
							_edit.append(_header, _content);
							_tmp.append(_edit);
						}


						comment.append(_tmp);
					}

					return comment;
				}));
			} else {
				RSNotifications.create('Something went wrong while loading comments.', 'error');
			}
		} catch (e) {
			console.error(e);
			RSNotifications.create('Something went wrong while loading comments.', 'error');
		}
	}


	d.getElementById('shoutout-form')?.addEventListener('submit', async (ev) => {
		if (!ev.target.checkValidity())
			return ev.target.reportValidity();

		ev.preventDefault();

		const form = new FormData(ev.target);

		try {
			const res = await fetch(endpoint, {
				method: 'PUT',
				body: new URLSearchParams(form)
			});

			if (res.ok) {
				RSNotifications.create('Shoutout posted successfully.', 'success');
				commentInput.value = '';
				page = 0;

				await loadComments();
				cinf();
			} else if (res.status === 429) {
				RSNotifications.create('You can only send 1 comment every 5 minutes. Wait a bit and try again.', 'warning');
			} else {
				RSNotifications.create('Something went wrong while posting the shoutout.', 'error');
			}
		} catch (e) {
			RSNotifications.create('Something went wrong while posting your comment.', 'error');
		}
	});


	d.querySelectorAll('[rs-context="page-switch"]').forEach(el => {

		el.addEventListener('click', async (ev) => {
			ev.stopPropagation();

			switch (ev.target.getAttribute('action')) {
				case 'back': page--; break;
				case 'forward': page++; break;
				case 'first': page = 0; break;
				case 'lastest': page = maxPage - 1; break;
			}
			page = RSUtils.clamp(page, 0, maxPage - 1);

			if (page !== lastPage) {
				await loadComments();
				lastPage = page;
			}
		});

	});


	await loadComments();
})();
