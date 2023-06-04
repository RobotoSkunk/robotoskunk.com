import express from 'express';
import { User } from '../libraries/db';
import { RSCrypto, RSUtils } from 'dotcomcore/dist/RSEngine';
import httpError from 'http-errors';

const router = express.Router();


router.get('/:handler', async (req, res, next) => {
	const tokenData = await res.rs.client.token();
	res.rs.server.aEnabled = false;


	// #region Find user by handler
	const { handler } = req.params;

	if (!handler) {
		next(httpError(400, 'Missing handler'));
		return;
	}

	const user = await User.GetByHandler(handler);

	if (!user) {
		next(httpError(404, 'User not found'));
		return;
	}
	await user.LoadFullData();
	// #endregion

	res.rs.html.meta.setSubtitle(`${user.name} (@${user.handler})`);
	res.rs.html.head = `<link rel="preload" href="/resources/css/user-profile.css?v=${res.rs.env.version}" as="style">
		<link rel="preload" href="/resources/css/common/loader.css?v=${res.rs.env.version}" as="style">

		<link rel="stylesheet" href="/resources/css/user-profile.css?v=${res.rs.env.version}">
		<link rel="stylesheet" href="/resources/css/common/loader.css?v=${res.rs.env.version}">

		<script defer src="/resources/js/user-profile.js?v=${res.rs.env.version}" nonce="${res.rs.server.nonce}"></script>`;

	res.rs.html.bodyClass = 'bg-1';

	if (user.bio) {
		const bio = RSUtils.EscapeHtml(user.bio.replace(/\n/g, ' ').substring(0, 200));

		res.rs.html.meta.description = user.bio.length > 200 ? bio + '...' : bio;
	}
	const scriptId = RSCrypto.RandomBytes(8);


	res.rs.html.body = `<input type="hidden" id="user-handler" value="${user.handler}">
		<br><br>
		<div class="profile-container">
			<div class="panel left">
				<img src="${user.avatar}" class="avatar" alt="${RSUtils.EscapeHtml(user.name)}'s avatar" width="260" height="260"><br>
				<div class="profile-info">
					<div class="txt-ellipsis">
						<span style="font-size: 25px">${RSUtils.EscapeHtml(user.name)}</span><br>
					</div>
					<span style="font-size: 15px; color: #999">@${RSUtils.EscapeHtml(user.handler)}</span><br>
					<div style="margin-top: 15px; font-size: 14px">
						<span>${[...user.roles.badges()].join('')}</span>
					</div>
				</div>
			</div>
			<div class="panel right">
				<div class="container">
					${user.bio ? `<div class="user-text" id="user-bio">Loading...<div style="display: none">${RSUtils.EscapeHtml(user.bio)}</div></div>
					<script nonce="${res.rs.server.nonce}" id="src-${scriptId}">
						document.addEventListener('DOMContentLoaded', () => {
							var bio = document.querySelector('#user-bio > div').textContent;

							document.getElementById('user-bio').innerHTML = RSUtils.parseMarkdown(RSUtils.unescape(bio));
							document.getElementById('src-${scriptId}').remove();
						});
					</script>` : '<em>No bio provided...</em>'}
				</div>
				<div class="container" style="margin-top: 15px">
					<h2>Shoutouts</h2>
					${tokenData ?
					`<form id="shoutout-form" method="POST">
						<input type="hidden" id="_csrf" name="_csrf" value="${await tokenData.token.GenerateCSRF()}">
						<textarea id="comment-input" name="content" rows="3" aria-label="Leave a comment here" placeholder="Leave a shoutout here..." required></textarea>
						<div class="comment buttons">
							<span id="comment-size">0 / 250</span>
							<button id="comment-post" class="btn-2" disabled>Comment</button>
						</div>
					</form>` : ''}
					<div class="page-navigation">
						<button class="btn-3" rs-context="page-switch" action="first">&lt;&lt;&lt;&lt;</button>
						<button class="btn-3" rs-context="page-switch" action="back">&lt;&lt;</button>
						<span id="page-text">1 / 0</span>
						<button class="btn-3" rs-context="page-switch" action="forward">&gt;&gt;</button>
						<button class="btn-3" rs-context="page-switch" action="lastest">&gt;&gt;&gt;&gt;</button>
					</div>
					<div id="comments"></div>
				</div>
			</div>
		</div>`;

	await res.renderDefault('layout.ejs');
});

export = router;
