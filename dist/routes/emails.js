"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    res.rs.html.meta.setSubtitle('Emails');
    res.rs.html.meta.description = 'Learn more about how RobotoSkunk handles emails.';
    res.rs.html.head = `<link rel="preload" href="/resources/css/bored-stuff.css?v=${res.rs.env.version}" as="style">
		<link rel="stylesheet" href="/resources/css/bored-stuff.css?v=${res.rs.env.version}">`;
    res.rs.html.body = `<br/><br/>
		<h1>How we handle emails</h1>
		<div class="bored-header">
			<p>I know this is bored, but I'm glad to hear you are interested in it.</p>
		</div>
		<div class="bored-body">
			<div class="bored-container">
				<h2>First of all, a bit of context</h2>
				<p>At first this website had problems with emails because the developer was new in the world of emails, he had been discovering what SMTP is and also learned about the existence of blacklists like UCEPROTECT.
				<p>And as the IP that DigitalOcean offered him is found in these blacklists, a rather elaborate system has had to be developed to continue to be able to use emails even though it\'s listed in blacklists.<br/>

				<h2>Creating emails</h2>
				<p>As the developer is not a millionaire, he had to create emails redirected to Outlook because he wanted to give a professional touch to the subject and in turn wanted to use a sophisticated email service, so using Outlook was a good option.
				At the moment there are only the emails <u>contact@robotoskunk.com</u> and <u>no-reply@robotoskunk.com</u>, which are redirects to Outlook as mentioned above.<br/>

				<h2>Avoiding spamming</h2>
				<p>To avoid using Microsoft\'s services in a malicious way, the sending of emails has been limited with a robot that sends them <b>every 15 seconds one per one</b> to avoid sending tons of emails at the same time.
				<p>By the way, none of this can prevent malicious people from using fake emails to send spam, so be cautious. <b>This website only sends accounts updates and website updates at the moment</b>, if you receive a suspicious email from this website, please report the email as spam and notify RobotoSkunk of what happened.

				<video style="max-width: 100%; margin: 25px auto;" aria-label="Alex Skunk manipulating emails" disableremoteplayback autoplay muted loop>
					<source src="./resources/vid/mail-timeout.mp4" type="video/mp4"></source>
					<source src="./resources/vid/mail-timeout.webm" type="video/webm"></source>
					<img src="./resources/img/mail-timeout.webp" alt="Your browser doesn\'t support the <video> tag." title="Your browser doesn\'t support the <video> tag."/>
				</video>
			</div>
		</div>`;
    yield res.renderDefault('layout.ejs');
}));
module.exports = router;
//# sourceMappingURL=emails.js.map