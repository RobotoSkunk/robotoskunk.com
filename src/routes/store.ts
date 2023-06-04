import express from 'express';
import { logger } from '../globals';
import { RSUtils, RSRandom } from 'dotcomcore/dist/RSEngine';
import httpError from 'http-errors';

const router = express.Router();


interface IStore {
	url: string;
	images: string[];
	alt: string;
}

const redbubbleData: IStore[] = [
	{
		url: 'https://www.redbubble.com/shop/ap/61638027',
		images: [
			'alex-skunk-1.webp',
			'alex-skunk-2.webp',
			'alex-skunk-3.webp',
			'alex-skunk-4.webp',
			'alex-skunk-5.webp',
			'alex-skunk-6.webp'
		],
		alt: 'Article of Alex Skunk happy sitting on the floor.'
	}, {
		url: 'https://www.redbubble.com/shop/ap/61652219',
		images: [
			'alex-snout-1.webp',
			'alex-snout-2.webp',
			'alex-snout-3.webp'
		],
		alt: 'Article of Alex Skunk\'s snout.'
	}, {
		url: 'https://www.redbubble.com/shop/ap/89726424',
		images: [
			'give-me-money-1.webp',
			'give-me-money-2.webp',
			'give-me-money-3.webp',
			'give-me-money-4.webp'
		],
		alt: 'Article of a weird curve with a gradient and the text "Give me money" under it.'
	}, {
		url: 'https://www.redbubble.com/shop/ap/120215266',
		images: [
			'poutaro-kujo-1.webp',
			'poutaro-kujo-2.webp',
			'poutaro-kujo-3.webp',
			'poutaro-kujo-4.webp'
		],
		alt: 'Article of Jotaro Kujo from JoJo\'s Bizarre Adventure in a pou version.'
	}, {
		url: 'https://www.redbubble.com/shop/ap/120215595',
		images: [
			'furbit-1.webp',
			'furbit-2.webp',
			'furbit-3.webp',
			'furbit-4.webp',
			'furbit-5.webp'
		],
		alt: 'Article of NachoBit\'s icon but furry version.'
	}, {
		url: 'https://www.redbubble.com/shop/ap/68083891',
		images: [
			'can-you-help-me-1.webp',
			'can-you-help-me-2.webp',
			'can-you-help-me-3.webp',
			'can-you-help-me-4.webp'
		],
		alt: 'Article of a meme with two people talking, one of them is saying "Can you help me?" and the other one is saying "XD".'
	}
];

const teespringData: IStore[] = [
	{
		url: 'https://teespring.robotoskunk.com',
		images: [
			'alex-skunk-1.webp',
			'alex-skunk-2.webp',
			'alex-skunk-3.webp',
			'alex-skunk-4.webp'
		],
		alt: 'Article of Alex Skunk happy sitting on the floor.'
	}, {
		url: 'https://teespring.robotoskunk.com',
		images: [
			'alex-snout.webp'
		],
		alt: 'Article of Alex Skunk\'s snout.'
	}, {
		url: 'https://teespring.robotoskunk.com',
		images: [
			'can-you-help-me-1.webp',
			'can-you-help-me-2.webp',
			'can-you-help-me-3.webp',
			'can-you-help-me-4.webp'
		],
		alt: 'Article of a meme with two people talking, one of them is saying "Can you help me?" and the other one is saying "XD".'
	}
];


router.get('/', async (req, res, next) => {
	try {
		res.rs.html.meta.setSubtitle('Store');
		res.rs.html.meta.description = "Welcome to the store. Here you can find and buy shirts and other items that I've designed.";
		res.rs.html.head = `<link rel="preload" href="/resources/css/store.css" as="style">
			<link rel="stylesheet" href="/resources/css/store.css">`;


		const redbubble = RSRandom.Shuffle(redbubbleData).slice(0, 6);
		const teespring = RSRandom.Shuffle(teespringData).slice(0, 6);


		res.rs.html.body = `<br>
			<h1>Official stores</h1>
			<p>Welcome to the store. Here you can find and buy shirts and other items that I've designed.<br>

			<div style="background: url('resources/svg/wave-1.svg') repeat-x; background-size: auto 100%; height: 50px; width: 100vw; position: relative; top: 2px"></div>

			<div style="background-color: #ffffff; width: 100vw; display: inline-block; color: #000000; position: relative; top: 1px">
				<p><a href="https://www.redbubble.com/es/people/RobotoSkunk/shop" target="_blank" rel="noopener noreferrer">
					<img src="resources/svg/branding/redbubble.svg" alt="RobotoSkunk's Redbubble store" title="RobotoSkunk's Redbubble store" width="650" height="131" style="max-width: 90%">
				</a></p>
				<p>Buy shirts, t-shirts, pins, stickers and more at RobotoSkunk's Official Redbubble Store!</p>
				<br>

				<div class="store-row">
					${redbubble.map((item) => {
						return `<a href="${item.url}" target="_blank" rel="noopener noreferrer" class="item">
							<img src="resources/img/redbubble/${RSRandom.Choose(item.images)}" alt="${RSUtils.EscapeHtml(item.alt)}" title="${RSUtils.EscapeHtml(item.alt)}" width="200" height="200">
						</a>`;
					}).join('')}
				</div>
				<br>
				<br>

				<p><a href="https://teespring.robotoskunk.com/" target="_blank" rel="noopener noreferrer">
					<img src="resources/svg/branding/teespring.svg" alt="RobotoSkunk's Teespring store" title="RobotoSkunk's Teespring store" width="650" height="99" style="max-width: 90%">
				</a></p>
				<p>Not interested in Redbubble? You can also buy in the RobotoSkunk's Official Teespring Store!</p>

				<div class="store-row">
					${teespring.map((item) => {
						return `<a href="${item.url}" target="_blank" rel="noopener noreferrer" class="item">
							<img src="resources/img/teespring/${RSRandom.Choose(item.images)}" alt="${RSUtils.EscapeHtml(item.alt)}" title="${RSUtils.EscapeHtml(item.alt)}" width="200" height="200">
						</a>`;
					}).join('')}
				</div>
				<br>
				<br>
			</div>
			<br>`;

		await res.renderDefault('layout.ejs');
	} catch (e) {
		logger.error(e);
		next(httpError(500, 'Internal Server Error'));
	}
});

export = router;
