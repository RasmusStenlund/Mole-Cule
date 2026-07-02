import * as home from "./pages/home.js"
import * as analyze from "./pages/analyze.js"
import * as convert from "./pages/convert.js"
import * as balance from "./pages/balance.js"
import * as empirical from "./pages/empirical.js"
import * as limiting from "./pages/limiting.js"

const routes = {
    '#/': home,
    '#/analyze': analyze,
    '#/convert': convert,
    '#/balance': balance,
    '#/empirical': empirical,
    '#/limiting': limiting,
}

function router() {
    const current_hash = window.location.hash || '#/';

    const link_list = document.querySelectorAll(".links a");
    for (const link of link_list) {
        if (link.getAttribute("href") === current_hash) {
            link.classList.add("selected")
        } else {
            link.classList.remove("selected");
        }
    }

    const content_function = routes[current_hash];
    const app_container = document.getElementById('app');
    
    if (content_function) {
        app_container.innerHTML = content_function.page();

        if (content_function.setup()) {
            content_function.setup();
        }
    
    } else {
        app_container.innerHTML = `
            <div class = "not-found">
                <div class = "not-found-text">
                    <h1>404</h1>
                    <p>Page Not Found</p>
                </div>
            </div>
        `
    }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);