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
(() => __awaiter(this, void 0, void 0, function* () {
    /**
     * Prints a warning to the console if Do Not Track is enabled.
     */
    function dnt() {
        console.warn('%cRobotoSkunk: %cDo Not Track is enabled, analytics will not be sent.', 'font-weight: bold;', 'font-weight: normal;');
    }
    if (navigator.doNotTrack) {
        dnt();
        return;
    }
    try {
        const res = yield fetch('/analytics/collect', {
            method: 'POST',
            body: JSON.stringify({
                screen: [
                    window.screen.width,
                    window.screen.height
                ],
                referrer: document.referrer,
                path: location.href,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        try {
            const body = yield res.json();
            if (body.dnt) {
                dnt();
            }
        }
        catch (e) {
            console.error('%cRobotoSkunk: %cError sending analytics.', 'font-weight: bold;', 'font-weight: normal;');
        }
    }
    catch (e) {
        console.error(e);
    }
}))();
