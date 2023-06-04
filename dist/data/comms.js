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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.articles = void 0;
const crypto_1 = __importDefault(require("crypto"));
// I was too lazy to create a new PostgreSQL table for this, so I just used this JSON.
// Don't worry, I'll code a proper table for this in the future.
exports.articles = [
    {
        id: 'artwork',
        label: 'Artwork',
        description: 'Cute custom artworks of your characters!',
        img: 'artwork.webp',
        notes: 'Please note that I will not draw NSFW content.',
        price: 7,
        size: {
            custom: true,
            defaults: [
                [2048, 2048],
                [1920, 1080],
                [2560, 1600],
                [4096, 2048],
                [4096, 4096]
            ]
        },
        options: [
            {
                id: crypto_1.default.randomUUID(),
                label: 'Drawing type',
                group: 0,
                type: 'radio',
                options: [
                    {
                        id: crypto_1.default.randomUUID(),
                        label: 'Headshot',
                        value: 0
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Half body',
                        value: 1
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Full body',
                        value: 2
                    }
                ]
            }, {
                id: crypto_1.default.randomUUID(),
                label: 'Lineart',
                group: 0,
                type: 'radio',
                options: [
                    {
                        id: crypto_1.default.randomUUID(),
                        label: 'Classical',
                        value: 0
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Colored',
                        value: 1
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Lineless',
                        value: 2
                    }
                ]
            }, {
                id: crypto_1.default.randomUUID(),
                label: 'Color',
                group: 0,
                type: 'radio',
                options: [
                    {
                        id: crypto_1.default.randomUUID(),
                        label: 'Monochrome',
                        value: 0
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Colorful',
                        value: 1
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Shaded',
                        value: 3
                    }
                ]
            }, {
                id: crypto_1.default.randomUUID(),
                label: 'Background',
                group: 1,
                type: 'radio',
                options: [
                    {
                        id: crypto_1.default.randomUUID(),
                        label: 'Transparent or flat color',
                        value: 0
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Simple gradient',
                        value: 0.2
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Complex gradient',
                        value: 0.5
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Detailed background',
                        value: 1
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Complex background',
                        value: 5
                    }
                ]
            }, {
                id: crypto_1.default.randomUUID(),
                label: 'Number of characters',
                group: 0,
                type: 'number',
                data: {
                    value: 1,
                    range: [1, 5],
                    action: 'multiply'
                }
            }
        ]
    }, {
        id: 'interactive-wallpaper',
        label: 'Interactive wallpaper',
        description: 'Cute custom interactive wallpapers to make your desktop bright!<br><br>'
            + '<b>Minimum system requirement</b><br><pre><code>'
            + 'OS: Windows 7 or above | Linux x64 bits<br>'
            + 'Processor: Intel i3 or equivalent<br>'
            + 'Memory: 1 GB of RAM<br>'
            + 'Graphics: HD Graphics 3000 or above<br>'
            + 'DirectX: Version 10 or above<br>'
            + 'Storage: 25 MB available space'
            + '</code></pre>',
        img: 'interactive-wallpaper.webp',
        notes: 'Install [Lively Wallpaper (free)](https:\/\/rocksdanister.github.io\/lively\/) or'
            + '[Wallpaper Engine (paid)](https:\/\/www.wallpaperengine.io\/) to run your wallpaper.',
        price: 26,
        size: {
            custom: true,
            defaults: [
                [1024, 768],
                [1280, 720],
                [1366, 768],
                [1920, 1080],
                [2560, 1600],
                [3840, 2160]
            ]
        },
        options: [
            {
                id: crypto_1.default.randomUUID(),
                label: 'Wallpaper type',
                group: 1,
                type: 'radio',
                options: [
                    {
                        id: crypto_1.default.randomUUID(),
                        label: 'Animated',
                        value: 0
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Simple character',
                        value: 2
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Complex character',
                        value: 5
                    }
                ]
            }, {
                id: crypto_1.default.randomUUID(),
                label: 'Character type',
                group: 0,
                type: 'radio',
                options: [
                    {
                        id: crypto_1.default.randomUUID(),
                        label: 'Half body',
                        value: 0.5
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Full body',
                        value: 1
                    }
                ]
            }, {
                id: crypto_1.default.randomUUID(),
                label: 'Lineart',
                group: 0,
                type: 'radio',
                options: [
                    {
                        id: crypto_1.default.randomUUID(),
                        label: 'Classical',
                        value: 0
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Colored',
                        value: 0.5
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Lineless',
                        value: 1
                    }
                ]
            }, {
                id: crypto_1.default.randomUUID(),
                label: 'Color',
                group: 0,
                type: 'radio',
                options: [
                    {
                        id: crypto_1.default.randomUUID(),
                        label: 'Monochrome',
                        value: 0
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Colorful',
                        value: 1
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Shaded',
                        value: 3
                    }
                ]
            }, {
                id: crypto_1.default.randomUUID(),
                label: 'Background',
                group: 1,
                type: 'radio',
                options: [
                    {
                        id: crypto_1.default.randomUUID(),
                        label: 'Flat color',
                        value: 0
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Simple gradient',
                        value: 0.2
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Complex gradient',
                        value: 0.5
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Detailed background',
                        value: 1
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Complex background',
                        value: 5
                    }
                ]
            }, {
                id: crypto_1.default.randomUUID(),
                label: 'Animation',
                group: 1,
                type: 'radio',
                options: [
                    {
                        id: crypto_1.default.randomUUID(),
                        label: 'Static',
                        value: 0
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Simple animation',
                        value: 0.5
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Complex animation',
                        value: 8
                    }
                ]
            }
        ]
    }, {
        id: 'digital-stickers',
        label: 'Digital stickers',
        description: 'A digital sticker is a small image that can be used as a sticker on social media,'
            + 'or as a profile picture. They are usually simple and colorful.',
        img: 'stickers.webp',
        price: 6,
        size: {
            custom: false,
            defaults: [
                [512, 512]
            ]
        },
        options: [
            {
                id: crypto_1.default.randomUUID(),
                label: 'Sticker type',
                group: 0,
                type: 'radio',
                options: [
                    {
                        id: crypto_1.default.randomUUID(),
                        label: 'Just a character',
                        value: 0
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'More than one character',
                        value: 2
                    }
                ]
            }, {
                id: crypto_1.default.randomUUID(),
                label: 'Drawing type',
                group: 0,
                type: 'radio',
                options: [
                    {
                        id: crypto_1.default.randomUUID(),
                        label: 'Half body',
                        value: 0
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Full body',
                        value: 1
                    }
                ]
            }, {
                id: crypto_1.default.randomUUID(),
                label: 'Lineart',
                group: 0,
                type: 'radio',
                options: [
                    {
                        id: crypto_1.default.randomUUID(),
                        label: 'Classical',
                        value: 0
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Colored',
                        value: 1
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Lineless',
                        value: 2
                    }
                ]
            }, {
                id: crypto_1.default.randomUUID(),
                label: 'Color',
                group: 0,
                type: 'radio',
                options: [
                    {
                        id: crypto_1.default.randomUUID(),
                        label: 'Monochrome',
                        value: 0
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Colorful',
                        value: 1
                    }, {
                        id: crypto_1.default.randomUUID(),
                        label: 'Shaded',
                        value: 3
                    }
                ]
            }, {
                id: crypto_1.default.randomUUID(),
                label: 'Number of stickers',
                group: 0,
                type: 'number',
                data: {
                    value: 1,
                    range: [1, 10],
                    action: 'multiply'
                }
            }
        ]
    }
];
//# sourceMappingURL=comms.js.map