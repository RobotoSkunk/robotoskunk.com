
(() => {
	var desc = d.getElementById('description').innerText;

	d.getElementById('description').innerHTML = RSUtils.parseMarkdown(RSUtils.unescape(desc));

	d.getElementById('copy').addEventListener('click', async () => {
		const content = d.getElementById('copy-id').innerText;
		await navigator.clipboard.writeText(content);

		const notice = d.getElementById('copy-notice');
		notice.classList.add('show');

		setTimeout(() => {
			notice.classList.remove('show');
		}, 1000);
	});
})();
