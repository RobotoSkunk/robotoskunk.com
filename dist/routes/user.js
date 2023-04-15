"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const db_1 = require("../libs/db");
const RSEngine_1 = require("../libs/RSEngine");
const http_errors_1 = __importDefault(require("http-errors"));
const router = express_1.default.Router();
router.get('/:handler', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenData = yield res.rs.client.token();
    res.rs.server.aEnabled = false;
    // #region Find user by handler
    const { handler } = req.params;
    if (!handler) {
        next((0, http_errors_1.default)(400, 'Missing handler'));
        return;
    }
    const user = yield db_1.User.GetByHandler(handler);
    if (!user) {
        next((0, http_errors_1.default)(404, 'User not found'));
        return;
    }
    yield user.LoadFullData();
    // #endregion
    res.rs.html.meta.setSubtitle(`${user.name} (@${user.handler})`);
    res.rs.html.head = `<link rel="preload" href="/resources/css/user-profile.css?v=${res.rs.conf.version}" as="style">
		<link rel="preload" href="/resources/css/common/loader.css?v=${res.rs.conf.version}" as="style">

		<link rel="stylesheet" href="/resources/css/user-profile.css?v=${res.rs.conf.version}">
		<link rel="stylesheet" href="/resources/css/common/loader.css?v=${res.rs.conf.version}">

		<script defer src="/resources/js/user-profile.js?v=${res.rs.conf.version}" nonce="${res.rs.server.nonce}"></script>`;
    res.rs.html.bodyClass = 'bg-1';
    if (user.bio) {
        const bio = RSEngine_1.RSMisc.EscapeHtml(user.bio.replace(/\n/g, ' ').substring(0, 200));
        res.rs.html.meta.description = user.bio.length > 200 ? bio + '...' : bio;
    }
    const scriptId = RSEngine_1.RSCrypto.RandomBytes(8);
    res.rs.html.body = `<input type="hidden" id="user-handler" value="${user.handler}">
		<br><br>
		<div class="profile-container">
			<div class="panel left">
				<img src="${user.avatar}" class="avatar" alt="${RSEngine_1.RSMisc.EscapeHtml(user.name)}'s avatar" width="260" height="260"><br>
				<div class="profile-info">
					<div class="txt-ellipsis">
						<span style="font-size: 25px">${RSEngine_1.RSMisc.EscapeHtml(user.name)}</span><br>
					</div>
					<span style="font-size: 15px; color: #999">@${RSEngine_1.RSMisc.EscapeHtml(user.handler)}</span><br>
					<div style="margin-top: 15px; font-size: 14px">
						<span>${[...user.roles.badges()].join('')}</span>
					</div>
				</div>
			</div>
			<div class="panel right">
				<div class="container">
					${user.bio ? `<div class="user-text" id="user-bio">Loading...<div style="display: none">${RSEngine_1.RSMisc.EscapeHtml(user.bio)}</div></div>
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
						<input type="hidden" id="_csrf" name="_csrf" value="${yield tokenData.token.GenerateCSRF()}">
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
    yield res.renderDefault('layout.ejs');
}));
module.exports = router;
//# sourceMappingURL=user.js.map