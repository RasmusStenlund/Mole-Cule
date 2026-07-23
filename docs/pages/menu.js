export function setup_menu() {
    const button = document.getElementById("menu-button");
    const icon = document.getElementById("menu-icon")
    const menu = document.getElementById("side-menu");
    const links = document.querySelectorAll(".side-menu a")

    function close_menu() {
        menu.classList.remove("open")
        icon.classList.remove("fa-xmark")
        icon.classList.add("fa-bars")
    }

    button.addEventListener("click", function () {
        menu.classList.toggle("open");

        if (menu.classList.contains("open")) {
            icon.classList.remove("fa-bars")
            icon.classList.add("fa-xmark")
        } else {
            icon.classList.remove("fa-xmark")
            icon.classList.add("fa-bars")
        }
    })

    window.addEventListener("resize", function () {
        if (window.innerWidth > 700) {
            close_menu()
        }
    })

    for (const link of links) {
        link.addEventListener("click", function () {
            close_menu()
        })
    }

    document.addEventListener("click", function () {
        const is_menu = menu.contains(event.target);
        const is_button = button.contains(event.target);

        if (!(is_menu) && !(is_button)) {
            close_menu()
        }
    })
}