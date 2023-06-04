import express from 'express';

const router = express.Router();

router.get('/', async (req, res, next) => {
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

	await res.renderDefault('layout.ejs');
});

export = router;
