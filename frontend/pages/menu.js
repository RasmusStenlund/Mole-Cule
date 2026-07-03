export function setup_menu() {
    const button = document.getElementById("menu-button");
    const menu = document.getElementById("side-menu");
    const links = document.querySelectorAll(".side-menu a")

    button.addEventListener("click", function () {
        menu.classList.toggle("open");
    })

    window.addEventListener("resize", function () {
        if (window.innerWidth > 700) {
            menu.classList.remove("open");
        }
    })

    for (const link of links) {
        link.addEventListener("click", function () {
            menu.classList.remove("open");
        })
    }

    document.addEventListener("click", function () {
        const is_menu = menu.contains(event.target);
        const is_button = button.contains(event.target);

        if (!(is_menu) && !(is_button)) {
            menu.classList.remove("open");
        }
    })
}