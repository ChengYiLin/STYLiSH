const Host = "https://api.appworks-school.tw/api/1.0";
// const root_pathname = "/";
const root_pathname = "/STYLiSH/";

// -- for all
let logo = document.querySelector(".logo");
let navbar_menu = document.querySelector("header .menu");
let search_bar = document.getElementById("search");
let slide_container = document.querySelector(".slide_container");
let main = document.querySelector("main");
let main_content = document.querySelector("main .container");
let member_BTN = document.querySelector(".inform .member");
//  -- for product only
let product_main = document.querySelector("main .product_container");
let choosed_color;
let choosed_size;
let productStockData;
let productStockNum;
let submitProductState = false;
let wholeProductInform;
let cart_data = JSON.parse(localStorage.getItem("cart_data")) || [];
// -- Global variables
let Image_index = 0;
let needCampaigns = true;
let Campaigns_num;
let Ajax_Loading = false;
let Now_service_open;
let Next_paging;

//                Helper functions
// --------------------------------------------------

// Reset Root route
let navbarMenuA;
Array.from(navbar_menu.children).forEach(element => {
    navbarMenuA = element.querySelector('a');
    navbarMenuA.setAttribute("href", `${root_pathname}?tag=${navbarMenuA.id}`);
})

function setAttributes(el, attrs) {
    for (let key in attrs) {
        el.setAttribute(key, attrs[key]);
    }
}

function createElementBetter(elementType, attributes, appendWhere, innerText = null) {
    let element = document.createElement(elementType);
    setAttributes(element, attributes);
    if (innerText !== null) { element.innerText = innerText; }

    appendWhere.appendChild(element);

    return element;
}

function get_parameters(url = document.location) {
    let params = (new URL(url)).searchParams;
    return params.get("tag");
}

function create_product_elements(product_data) {
    if (main_content === null) {
        // Reset main
        let whole_page_main = document.querySelector("main");
        whole_page_main.innerHTML = "";
        // add container
        createElementBetter("div", { "class": "container" }, whole_page_main);
        main_content = document.querySelector("main .container");
    }

    product_data.forEach(element => {
        // outer-product
        let product = document.createElement('div');
        setAttributes(product, { "id": element.id, "class": "product" });
        // --inner-image
        let image = document.createElement("img");
        setAttributes(image, { "src": element.main_image, "alt": "product_image" })
        product.appendChild(image)
        // --inner-color-image
        let color_menu = document.createElement("ul");
        setAttributes(color_menu, { "class": "color_menu" });
        // ----color-image-element
        element.colors.forEach(element => {
            let color_element = document.createElement("li");
            setAttributes(color_element, { "class": "color", "style": `background:#${element.code}` });
            color_menu.appendChild(color_element);
        });
        product.appendChild(color_menu);
        // --inner-title
        let title = document.createElement('h3');
        setAttributes(title, { "class": "product_name" });
        title.innerText = element.title;
        product.appendChild(title);
        // --inner-price
        let price = document.createElement('p');
        setAttributes(price, { "class": "price" });
        price.innerText = `TWD.${element.price}`;
        product.appendChild(price);

        main_content.appendChild(product);
    })
}

function create_campaigns_elements(Campaigns_data) {
    // Check Need Slide or Not
    if (slide_container === null) {
        let slide_container_reset = createElementBetter("div", { "class": "slide_container" }, document.querySelector("header"));
        slide_container = document.querySelector(".slide_container");
    }

    // outer - slide wrapper
    let slide_wrapper = document.createElement("div");
    setAttributes(slide_wrapper, { "class": "slide_wrapper" });

    Campaigns_data.forEach((element) => {
        let product_id = element.product_id;
        let element_img = `https://api.appworks-school.tw${element.picture}`;
        let element_story = element.story;

        // -- inner - slide
        let slide = document.createElement("div");
        setAttributes(slide, { "class": "slide", "style": `background-image: url(${element_img});`, "id": product_id })
        slide_wrapper.appendChild(slide);
        // -- -- inner - slide_text
        let slide_text = document.createElement("pre");
        setAttributes(slide_text, { "class": "slide_text" });
        slide_text.innerText = element_story;
        slide.appendChild(slide_text);
    })

    slide_container.appendChild(slide_wrapper);
}

function create_campaigns_circle(Campaigns_num) {
    // Check Need Slide or Not
    if (slide_container === null) {
        let slide_container_reset = createElementBetter("div", { "class": "slide_container" }, document.querySelector("header"));
        slide_container = document.querySelector(".slide_container");
    }
    // outer - slide circle
    let slide_circle = document.createElement("ul");
    setAttributes(slide_circle, { "class": "slide_circle" });

    // -- inner - circle
    for (let i = 0; i < Campaigns_num; i++) {
        let circle = document.createElement("li");
        setAttributes(circle, { "class": "circle", "id": `circle_${i}` });
        if (Image_index === i) { setAttributes(circle, { "class": "circle active", "id": `circle_${i}` }); }
        slide_circle.appendChild(circle);
    }

    slide_container.appendChild(slide_circle);
}

function add_service_query(Now_service_open, query_string) {
    if (Now_service_open.includes("search")) {
        return `&paging=${query_string}`;
    }
    else {
        return `?paging=${query_string}`;
    }
}

function Change_Campaigns_Circle() {
    slide_circles = document.querySelectorAll(".circle");

    slide_circles.forEach(elements => {
        if (elements.id[elements.id.length - 1] == Image_index) {
            setAttributes(elements, { "class": "circle active" });
        }
        else {
            setAttributes(elements, { "class": "circle" });
        }
    })
}

function Campaigns_Circle_Click() {
    let slide_circles = document.querySelector(".slide_circle");

    slide_circles.addEventListener("click", (e) => {
        let campaigns_wrapper = document.querySelector(".slide_wrapper");

        if (e.target.tagName !== "LI") { return }

        Image_index = e.target.id[e.target.id.length - 1]
        campaigns_wrapper.style.setProperty("--i", Image_index);
        Change_Campaigns_Circle();
    })
}

function changeSiblingsActive(target, active_class) {
    let active_index = target.dataset.index;
    let node = target.parentNode.children;
    let running_index = 0;

    Array.from(node).forEach(elements => {
        if (elements.tagName === "INPUT") {
            if (running_index != active_index) {
                setAttributes(elements, { "class": "" })
            }
            else {
                setAttributes(elements, { "class": active_class })
            }
            running_index++;
        }
    })
}

function createProductDetail(ajax_data) {
    // Reset Page
    main.innerHTML = ""
    createElementBetter("div", { "class": "product_container" }, main);
    let product_main = document.querySelector("main .product_container");

    // Set Data
    let pd_data = {
        "pd_main_img": ajax_data.main_image,
        "pd_title": ajax_data.title,
        "pd_id": ajax_data.id,
        "pd_price": `TWD.${ajax_data.price}`,
        "pd_note": ajax_data.note,
        "pd_texture": ajax_data.texture,
        "pd_description": ajax_data.description,
        "pd_madefrom": `加工產地 / ${ajax_data.place}`,
        "pd_colors": ajax_data.colors,
        "pd_sizes": ajax_data.sizes,
        "pd_story": ajax_data.story,
        "pd_images": ajax_data.images,
        "pd_stock": ajax_data.variants
    }

    // -- outer - main part
    let main_part = createElementBetter("div", { "class": "main_part" }, product_main);
    // -- -- inner - lv1
    let product_img = createElementBetter("div", { "class": "product_img" }, main_part);
    let short_inform = createElementBetter("div", { "class": "short_inform" }, main_part);
    // -- -- -- inner - lv2 (product_img)
    let image = createElementBetter("img", { "src": pd_data.pd_main_img, "alt": "main" }, product_img);
    // -- -- -- inner - lv2 (short_inform)
    let pd_title = createElementBetter("h1", { "class": "pd_title" }, short_inform, pd_data.pd_title);
    let pd_id = createElementBetter("p", { "class": "pd_id" }, short_inform, pd_data.pd_id);
    let pd_price = createElementBetter("p", { "class": "pd_price" }, short_inform, pd_data.pd_price);
    //  -- -- -- -- inner - lv3 (form)
    let pd_form = createElementBetter("form", { "action": "#" }, short_inform);
    let pd_form_color = createElementBetter("div", { "class": "form_radio_group" }, pd_form);
    let pd_form_size = createElementBetter("div", { "class": "form_size_group" }, pd_form);
    let pd_form_number = createElementBetter("div", { "class": "form_number_group" }, pd_form);
    let pd_form_submit = createElementBetter("div", { "class": "form_submit_group" }, pd_form);
    // -- -- -- -- -- inner - lv4 (color))
    let pd_color_label = createElementBetter("label", {}, pd_form_color, "顏色");
    let pd_color_index = 0;
    let pd_color_attibutes;
    pd_data.pd_colors.forEach(element => {
        pd_color_attibutes = { "type": "radio", "name": "color", "value": element.code, "style": `--color:#${element.code}`, "data-colorname": element.name, "data-index": pd_color_index }
        createElementBetter("input", pd_color_attibutes, pd_form_color);
        pd_color_index++;
    })
    // -- -- -- -- -- inner - lv4 (size)
    let pd_size_label = createElementBetter("label", {}, pd_form_size, "尺寸");
    let pd_size_index = 0;
    let pd_size_attibutes;
    pd_data.pd_sizes.forEach(element => {
        pd_size_attibutes = { "type": "radio", "name": "size", "value": element, "data-index": pd_size_index };
        createElementBetter("input", pd_size_attibutes, pd_form_size);
        pd_size_index++;
    })
    // -- -- -- -- -- inner - lv4 (number)
    let pd_number_label = createElementBetter("label", { "for": "pd_num" }, pd_form_number, "數量");
    let pd_number_choose = createElementBetter("div", { "class": "number_input" }, pd_form_number);
    let pd_number_value = createElementBetter("input", { "type": "number", "name": "pd_num", "value": 0, "id": "pd_num", "disabled": "" }, pd_number_choose);
    let pd_number_add = createElementBetter("button", { "class": "pd_number_add" }, pd_number_choose, "+");
    let pd_number_sub = createElementBetter("button", { "class": "pd_number_sub" }, pd_number_choose, "-");
    // -- -- -- -- -- inner - lv4 (submit btn)
    let pd_submit_btn = createElementBetter("input", { "type": "submit", "value": "請選擇商品", "disabled": "" }, pd_form_submit);
    // -- -- -- inner - lv2 (short_inform)
    let pd_note = createElementBetter("p", { "class": "pd_note pd_smalltext" }, short_inform, pd_data.pd_note);
    let pd_texture = createElementBetter("p", { "class": "pd_texture pd_smalltext" }, short_inform, pd_data.pd_texture);
    let pd_description = createElementBetter("pre", { "class": "pd_description pd_smalltext" }, short_inform, pd_data.pd_description);
    let pd_madefrom = createElementBetter("p", { "class": "pd_madefrom pd_smalltext" }, short_inform, pd_data.pd_madefrom);

    // -- outer - detail infor
    let detail_inform = createElementBetter("div", { "class": "detail_inform" }, product_main);
    // -- -- inner - title
    let detail_title = createElementBetter("div", { "class": "title" }, detail_inform);
    let detail_title_text = createElementBetter("div", { "class": "text" }, detail_title, "細部說明");
    let detail_title_line = createElementBetter("div", { "class": "line" }, detail_title);
    // -- -- inner - story & images
    let pd_detail_images;
    pd_data.pd_images.forEach(element => {
        createElementBetter("div", { "class": "pd_story" }, detail_inform, pd_data.pd_story);
        pd_detail_images = createElementBetter("div", { "class": "pd_images" }, detail_inform);
        createElementBetter("img", { "src": element, "alt": "product image" }, pd_detail_images);
    })

    // Set Data
    wholeProductInform = pd_data;
    productStockData = wholeProductInform.pd_stock;

    // click event
    let color_form_group = document.querySelector(".form_radio_group");
    let size_form_group = document.querySelector(".form_size_group");
    let producqt_number_group = document.querySelector(".number_input");
    let product_Submit_btn = document.querySelector(".form_submit_group input");

    color_form_group.addEventListener("click", changeColorActive);
    size_form_group.addEventListener("click", changeSizeActive);
    producqt_number_group.addEventListener("click", clickProductNum);
    product_Submit_btn.addEventListener("click", checkSubmitStatus);
}

function settingSubmitForm() {
    let product_choose_num = document.getElementById("pd_num");
    let cart_pd_num = 0;

    choosed_color = document.querySelector(".color_active");
    choosed_size = document.querySelector(".size_active");
    if (choosed_color === null || choosed_size === null) { return }

    // Get cart data
    cart_data.forEach(element => {
        if (element.id === wholeProductInform.pd_id && element.color.code === choosed_color.value && element.size === choosed_size.value) {
            cart_pd_num = element.qty;
            // console.log(cart_pd_num);
        }
    })

    productStockData.forEach(element => {
        if (element.color_code === choosed_color.value && element.size === choosed_size.value) {
            productStockNum = element.stock - cart_pd_num;
            // Save product real stock num

        }
    })

    let product_Submit_btn = document.querySelector(".form_submit_group input");
    // No Product
    if (productStockNum === 0) {
        setAttributes(product_Submit_btn, { "class": "noProduct", "value": "產品缺貨中", "disabled": "" });
        setAttributes(product_choose_num, { "value": 0 })
        return;
    }
    // Button Active
    setAttributes(product_Submit_btn, { "class": "active", "value": "加入購物車" });
    product_Submit_btn.removeAttribute("disabled");

    // Reset Number
    setAttributes(product_choose_num, { "value": 1 });
}

function showCartNumber() {
    let cart_icon = document.querySelector(".cart");

    // if user has added product
    if (cart_data.length > 0) {
        setAttributes(cart_icon, { "data-cartnum": cart_data.length });
        cart_icon.classList.add("cart_active");
    }
}

function calProductTotalPrice(element) {
    let price = parseInt(element.price.split("TWD.")[1]) * parseInt(element.qty);
    return `TWD.${price}`;
}

function addsubProductNum(e) {
    e.preventDefault();
    if (e.target.tagName !== "BUTTON") { return }

    let pd_dataset = e.target.parentNode;
    let pd_choosed_num = e.target.parentNode.querySelector(".pd_cart_value");
    let pd_unit_price = e.target.parentNode.parentNode.parentNode.querySelector(".pd_unit_price");
    let pd_total_price = e.target.parentNode.parentNode.parentNode.querySelector(".pd_total_price");

    if (e.target.className === "add_pd_num") {
        if (parseInt(pd_choosed_num.value) < parseInt(e.target.dataset.stock)) {
            setAttributes(pd_choosed_num, { "value": parseInt(pd_choosed_num.value) + 1 });

            // Change price data in cart
            update_data = { "price": pd_unit_price.innerText, "qty": pd_choosed_num.value }
            pd_total_price.innerText = calProductTotalPrice(update_data);
            // -- Save into Localstorage
            cart_data.forEach(element => {
                if (element.id == pd_dataset.dataset.pdid && element.color.code == pd_dataset.dataset.pdcolor && element.size == pd_dataset.dataset.pdsize) {
                    element.qty = pd_choosed_num.value;
                    localStorage.setItem("cart_data", JSON.stringify(cart_data));
                }
            })

            setTotalPayment();
        }
    }
    else if (e.target.className === "sub_pd_num") {
        if (parseInt(pd_choosed_num.value) > 1) {
            setAttributes(pd_choosed_num, { "value": parseInt(pd_choosed_num.value) - 1 });

            // Change price data in cart
            update_data = { "price": pd_unit_price.innerText, "qty": pd_choosed_num.value }
            pd_total_price.innerText = calProductTotalPrice(update_data);
            // -- Save into Localstorage
            cart_data.forEach(element => {
                if (element.id == pd_dataset.dataset.pdid && element.color.code == pd_dataset.dataset.pdcolor && element.size == pd_dataset.dataset.pdsize) {
                    element.qty = pd_choosed_num.value;
                    localStorage.setItem("cart_data", JSON.stringify(cart_data));
                }
            })

            setTotalPayment();
        }
    }
}

function setTotalPayment() {
    let pd_total_money = document.querySelector(".pd_total_money");
    let whole_pay_money = document.querySelector(".whole_pay_money");
    let shipping_money = document.querySelector(".pd_shipping_money")
    let getProductsMoney = document.querySelectorAll(".product .pd_total_price");
    let sum = 0;

    getProductsMoney.forEach(element => {
        sum += parseInt(element.innerText.split("TWD.")[1]);
    })

    pd_total_money.innerText = sum;
    whole_pay_money.innerText = (sum == 0) ? 0 : sum + parseInt(shipping_money.innerText);
}

function removeProduct(e) {
    e.preventDefault();

    let products = document.querySelectorAll(".Cart .product_list .product");

    products.forEach(element => {
        if (element.dataset.index == e.target.dataset.index) {
            // Remove on html
            element.remove();
            // Remove on localStorage
            cart_data.splice(e.target.dataset.index, 1);
            localStorage.setItem("cart_data", JSON.stringify(cart_data));
        }
    })

    setTotalPayment();
    updateIndex();
    showCartNumber();
}

function updateIndex() {
    // Update product index
    let garbage_list = document.querySelectorAll(".Cart .product_list .garbage_icon");
    let products = document.querySelectorAll(".Cart .product_list .product");
    let product_list = document.querySelector(".product_list");

    products.forEach((element, index) => {
        setAttributes(element, { "data-index": index })
    })
    garbage_list.forEach((element, index) => {
        setAttributes(element, { "data-index": index })
    })

    // If after Remove no data
    if (cart_data.length === 0) {
        createElementBetter("p", { "class": "noproduct" }, product_list, "還等什麼, 快去下單吧~");
    }
}

function getSignInData(ajax_data, savehere){
    savehere.name = ajax_data.data.user.name;
    savehere.email = ajax_data.data.user.email;
    savehere.picture = ajax_data.data.user.picture;

    localStorage.setItem("member", JSON.stringify(savehere));
}

function statusChangeCallback(response) {
    if (response.status === "connected") {
        console.log("You have been logged in");
        return true;
    }
    else {
        console.log("You need to log into your Facebook");
        FB.login(function (response) {
            if (response.status === 'connected') {
                // Save access token
                let member_data = { accessToken: response.authResponse.accessToken };
                // Send request to our BackEnd API to get user profile data
                fetch("https://api.appworks-school.tw/api/1.0/user/signin", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ "provider": "facebook", "access_token": member_data.accessToken })
                })
                    .then(response => response.json())
                    .then(data => getSignInData(data, member_data))
                    .catch(error => console.log(`Looks somethinh wrong : ${error}`))

            } else {
                console.log(response);
            }
        }, { scope: 'email' });
        return false;
    }
}

function facebookLogOut(){
    FB.getLoginStatus(function (response){
        if(response.status==="connected"){
            FB.logout(function (response) {
                // Restyle the page
                let mainContainer = document.querySelector("main .container_member");
                mainContainer.innerHTML = "";
                createElementBetter("p", { "class": "logout_inform" }, mainContainer, "您已經登出啦～");
                // Clean localStorage
                localStorage.removeItem("member");
            });
        }
    })
}

//                  Main Function
// --------------------------------------------------
function Product(HostAddress, product = "", params = "") {
    Ajax_Loading = true;

    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            Ajax_Loading = false;

            // Ajax Get Data
            let next_paging_data = JSON.parse(xhr.responseText).next_paging;
            let product_data = JSON.parse(xhr.responseText).data;

            // Save Now service open & Next paging data
            Now_service_open = product;
            Next_paging = (next_paging_data === undefined) ? (false) : (next_paging_data);

            if (product_data.length === 0) {
                let no_result = document.createElement('p');
                no_result.innerText = "您所找的商品沒有結果";
                setAttributes(no_result, { "class": "no_result" });
                main_content.appendChild(no_result);
            }
            else {
                create_product_elements(product_data);
            }
        }
    }
    xhr.open("GET", HostAddress + product + params);
    xhr.send();
}

function Product_Detail(params) {
    Ajax_Loading = true;

    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            Ajax_Loading = false;

            let ajax_data = JSON.parse(xhr.responseText).data;
            createProductDetail(ajax_data);
        }
    }
    xhr.open("GET", `${Host}/products/details?id=` + params);
    xhr.send();
}

function Search_Product(e) {
    e.preventDefault();
    if (e.target.tagName !== "A") { return }
    else {
        let search_content = document.getElementById("search_bar").value;
        let search_input = document.querySelector(".search form input");
        let logo = document.querySelector(".navbar .logo");

        // Using in Mb to show input
        if (search_content === "") {
            search_input.classList.toggle("active");
            logo.classList.toggle("active");
            return
        }

        window.location.href = `${root_pathname}?keyword=${search_content}`;
    }
}

function Infinite_Page() {
    // If not on index.html
    if (main_content === null) { return };

    // Scroll height
    let sroll_bar_Height = window.innerHeight * (window.innerHeight / document.body.offsetHeight);
    let window_y_position = window.scrollY + sroll_bar_Height / 2;
    // Activate height
    let header_height = document.querySelector("header").offsetHeight;
    let container_height = main_content.offsetHeight;
    let activate_height = header_height + container_height / 2;

    if (window_y_position > activate_height && Next_paging !== false && Ajax_Loading === false) {
        Product(Host, Now_service_open, add_service_query(Now_service_open, Next_paging));
    }
}

//  ---------  Campaigns    ------------

function Get_campaigns_data(Campaigns_animation, Auto_slide_show) {
    if (!needCampaigns) { return }

    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let Campaigns_data = JSON.parse(xhr.responseText).data
            Campaigns_num = Campaigns_data.length;

            create_campaigns_elements(Campaigns_data);
            create_campaigns_circle(Campaigns_num);

            // Add animation for slider
            Campaigns_animation();
            Auto_slide_show();
            Campaigns_Circle_Click();
        }
    }
    xhr.open("GET", Host + "/marketing/campaigns");
    xhr.send();
}

function Auto_slide_show() {
    let campaigns_wrapper = document.querySelector(".slide_wrapper");

    if (Image_index < Campaigns_num && Image_index != 0) {
        campaigns_wrapper.style.setProperty("--i", Image_index);
        Change_Campaigns_Circle();
    }
    else if (Image_index >= Campaigns_num) {
        Image_index = 0;
        campaigns_wrapper.style.setProperty("--i", Image_index);
        Change_Campaigns_Circle();
    }
    Image_index++;
    setTimeout(Auto_slide_show, 10000);
}

function Campaigns_animation() {
    let campaigns_wrapper = document.querySelector(".slide_wrapper");
    campaigns_wrapper.style.setProperty("--n", Campaigns_num);
    let x_coordinate = null;

    // Unify the touch and click cases
    function unify(e) {
        return e.changedTouches ? e.changedTouches[0] : e;
    }

    function lock(e) {
        x_coordinate = unify(e).clientX;
    }

    function move(e) {
        if (x_coordinate || x_coordinate === 0) {
            let delta_x = unify(e).clientX - x_coordinate;
            let move_sign = Math.sign(delta_x);

            // Change i and make sense ( <-- || --> )
            if (move_sign < 0) {
                if (Image_index < Campaigns_num - 1) {
                    campaigns_wrapper.style.setProperty("--i", Image_index -= move_sign);
                    Change_Campaigns_Circle();
                }
            }
            else {
                if (Image_index > 0) {
                    campaigns_wrapper.style.setProperty("--i", Image_index -= move_sign);
                    Change_Campaigns_Circle();
                }
            }
            // console.log(`Image Index : ${Image_index} ; Move_sign : ${move_sign}`);
            console.log(Image_index);
            x_coordinate = null;
        }
    }

    // Mouse down & up for PC ; Touch down & up for Mb 
    campaigns_wrapper.addEventListener("mousedown", lock);
    campaigns_wrapper.addEventListener("touchstart", lock);

    campaigns_wrapper.addEventListener("mouseup", move);
    campaigns_wrapper.addEventListener("touchend", move);
}

//  ----- click Main Page Product ------

function clickProductLink(e) {
    let clickProductId;
    if (e.target.parentNode.className === "product") {
        clickProductId = e.target.parentNode.id
    }
    else if (e.target.parentNode.parentNode.className == "product") {
        clickProductId = e.target.parentNode.parentNode.id;
    }
    else if (e.target.parentNode.className !== "product") {
        return
    }

    slide_container.innerHTML = "";
    window.location.href = `${root_pathname}product.html?id=${clickProductId}`;
}

//  ------ Product Page Form   ---------

function changeColorActive(e) {
    if (e.target.tagName !== "INPUT") { return }
    changeSiblingsActive(e.target, "color_active");

    if (document.querySelector(".color_active").value === "FFFFFF") {
        document.querySelector(".color_active").style.setProperty("--border_color", "#DCDCDC");
    }

    settingSubmitForm();
}

function changeSizeActive(e) {
    if (e.target.tagName !== "INPUT") { return }
    changeSiblingsActive(e.target, "size_active");
    settingSubmitForm();
}

function clickProductNum(e) {
    e.preventDefault();
    if (e.target.tagName !== "BUTTON") { return }

    if (choosed_color === undefined || choosed_size === undefined) {
        alert("請選擇產品 顏色 及 尺寸")
        return;
    }

    let max = productStockNum;

    let product_choose_num = document.getElementById("pd_num");

    if (e.target.className === "pd_number_add") {
        if (parseInt(product_choose_num.value) >= max) {
            setAttributes(product_choose_num, { "value": max });
            return;
        }
        else {
            setAttributes(product_choose_num, { "value": parseInt(product_choose_num.value) + 1 });
        }
    }
    else if (e.target.className === "pd_number_sub") {
        if (parseInt(product_choose_num.value) <= 0) {
            setAttributes(product_choose_num, { "value": 0 });
            return;
        }
        setAttributes(product_choose_num, { "value": parseInt(product_choose_num.value) - 1 });
    }
}

function checkSubmitStatus(e) {
    e.preventDefault();
    let productNum = document.getElementById("pd_num");

    //  When Product num == 0
    if (productNum.value === "0") {
        alert("請選擇產品數量");
        return;
    }
    else {
        let choosed_num = document.getElementById("pd_num");

        let addToCart = {
            "id": wholeProductInform.pd_id,
            "name": wholeProductInform.pd_title,
            "main_img": wholeProductInform.pd_main_img,
            "price": wholeProductInform.pd_price,
            "color": {
                "code": choosed_color.value,
                "name": choosed_color.dataset.colorname,
            },
            "size": choosed_size.value,
            "qty": choosed_num.value,
            "stock": wholeProductInform.pd_stock
        }

        // Modify Real Stock Num
        addToCart.stock.forEach(element => {
            if (element.color_code === addToCart.color.code && element.size === addToCart.size) {
                addToCart.stock = element.stock;
            }
        });

        // Check cart data
        for (let i = 0; i < cart_data.length; i++) {
            let element = cart_data[i];

            // When we have same data
            if (element.id === addToCart.id && element.color.code === addToCart.color.code && element.size === addToCart.size) {
                element.qty = parseInt(element.qty) + parseInt(addToCart.qty);
                localStorage.setItem("cart_data", JSON.stringify(cart_data));

                showCartNumber();
                settingSubmitForm();
                return;
            }
        }

        cart_data.push(addToCart);
        localStorage.setItem("cart_data", JSON.stringify(cart_data));

        // submit and show data
        showCartNumber();
        // setting product stock number after add to cart
        settingSubmitForm();
    }
}

//  --------- Cart Page  ---------
function createProductCart() {
    let product_list = document.querySelector(".product_list");

    // if Cart does not have any product
    if (cart_data.length === 0) {
        createElementBetter("p", { "class": "noproduct" }, product_list, "還等什麼, 快去下單吧~");
        // Set Total Payment
        setTotalPayment();
        return;
    }

    // if Cart has any product
    cart_data.forEach((element, index) => {
        // --outer
        let product_outer = createElementBetter("div", { "class": "product", "data-index": index }, product_list);
        // -- inner lev-1
        let pd_main_inform = createElementBetter("div", { "class": "pd_main_inform" }, product_outer);
        let item_title_mb = createElementBetter("div", { "class": "item_title_mb" }, product_outer);
        let pd_qty_price = createElementBetter("div", { "class": "pd_qty_price" }, product_outer);
        let garbage = createElementBetter("div", { "class": "garbage" }, product_outer);
        // -- -- inner lev-2 (to pd_main_inform)
        let cart_pd_img = createElementBetter("div", { "class": "pd_img" }, pd_main_inform);
        let cart_pd_inform = createElementBetter("div", { "class": "pd_inform" }, pd_main_inform);
        // -- -- -- inner lev-3 (to pd_main_inform lev-2)
        let cart_pd_main_img = createElementBetter("img", { "src": `${element.main_img}` }, cart_pd_img);
        let cart_pd_title = createElementBetter("p", { "class": "pd_title" }, cart_pd_inform, element.name);
        let cart_pd_id = createElementBetter("p", { "class": "pd_id" }, cart_pd_inform, element.id);
        let cart_choosed_color = createElementBetter("p", { "class": "choosed" }, cart_pd_inform, "顏色");
        let cart_pd_color = createElementBetter("span", { "class": "pd_color" }, cart_choosed_color, element.color.name);
        let cart_choosed_size = createElementBetter("p", { "class": "choosed" }, cart_pd_inform, "尺寸");
        let cart_pd_size = createElementBetter("span", { "class": "pd_size" }, cart_choosed_size, element.size);
        // -- -- inner lev-2 (to item_title_mb)
        let cart_items_name = createElementBetter("div", { "class": "items" }, item_title_mb);
        // -- -- -- inner lev-3 (to item_title_mb lev-2)
        let cart_items_num = createElementBetter("p", {}, cart_items_name, "數量");
        let cart_pd_unitprice = createElementBetter("p", {}, cart_items_name, "單價");
        let cart_pd_totalprice = createElementBetter("p", {}, cart_items_name, "小計");
        // -- -- inner lev-2 (to pd_qty_price)
        let pd_cart_num = createElementBetter("div", { "class": "pd_cart_num" }, pd_qty_price);
        let pd_unit_price = createElementBetter("div", { "class": "pd_unit_price" }, pd_qty_price, element.price);
        let pd_total_price = createElementBetter("div", { "class": "pd_total_price" }, pd_qty_price, calProductTotalPrice(element));
        // -- -- -- inner lev-3 (to pd_qty_price)
        let num_btn = createElementBetter("div", { "class": "num_btn", "data-pdId": element.id, "data-pdColor": element.color.code, "data-pdSize": element.size }, pd_cart_num);
        let pd_cart_value = createElementBetter("input", { "class": "pd_cart_value", "type": "number", "value": element.qty, "disabled": "" }, num_btn);
        let add_pd_num = createElementBetter("button", { "class": "add_pd_num", "data-stock": element.stock }, num_btn, "+");
        let sub_pd_num = createElementBetter("button", { "class": "sub_pd_num" }, num_btn, "-");
        // -- -- inner lev-2 (to garbage)
        let garbage_icon = createElementBetter("a", { "class": "garbage_icon", "data-index": index }, garbage);
    })

    // Set Total Payment
    setTotalPayment();

    // add Listen
    let num_btn = document.querySelectorAll(".product .num_btn");
    let garbage = document.querySelectorAll(".garbage_icon");

    num_btn.forEach(element => { element.addEventListener("click", addsubProductNum) });
    garbage.forEach(element => { element.addEventListener("click", removeProduct) });
}

//  -------- Profile Page  --------
function styleProfilePage(){
    let member_data = JSON.parse(localStorage.getItem("member"));
    let memberProfile = {
        name : member_data.name,
        email : member_data.email,
        picture : member_data.picture
    } 
    let profile_name = document.querySelector(".profile_data .name");
    let profile_email = document.querySelector(".profile_data .email");
    let profile_img = document.querySelector(".profile_img");

    profile_name.textContent = memberProfile.name;
    profile_email.textContent = memberProfile.email;
    setAttributes(profile_img, { "style": `background-image:url(${memberProfile.picture})` });
}

//                   Main action
// -------------------------------------------------- 
logo.addEventListener("click", () => { window.location.href = root_pathname });

if (location.pathname === root_pathname) {
    // Create Slide
    Get_campaigns_data(Campaigns_animation, Auto_slide_show);
    
    let urlParams = new URLSearchParams(window.location.search);
    let product_tag = urlParams.get("tag");
    let product_search = urlParams.get("keyword");

    if (product_tag !== null) {
        Product(Host, `/products/${product_tag}`);
    }
    else if (product_search !== null) {
        Product(Host, `/products/search?keyword=${product_search}`);
    }
    else {
        Product(Host, "/products/all");
    }

    window.addEventListener("scroll", Infinite_Page);
    main.addEventListener("click", clickProductLink);
}
else if (location.pathname === `${root_pathname}product.html`) {
    let urlParams = new URLSearchParams(window.location.search);
    let product_id = urlParams.get("id");

    Product_Detail(product_id);
}
else if (location.pathname === `${root_pathname}cartpage.html`) {
    // Show Cart Num on Cart Detail
    document.querySelector(".cart_pd_num").innerText = cart_data.length;

    // Show Products in the cart
    createProductCart();
}
else if (location.pathname === `${root_pathname}profile.html`) {
    let logout = document.getElementById("logout");

    styleProfilePage();

    // Logout BTN
    logout.addEventListener("click", facebookLogOut);
}

// Show Cart Num
showCartNumber();

search_bar.addEventListener("click", Search_Product);

member_BTN.addEventListener("click", (e) => {
    e.preventDefault();

    FB.getLoginStatus(function (response) {
        // Check login or not
        if (!statusChangeCallback(response)) { return }
        // Redirect to Profile Page
        if (location.pathname !== `${root_pathname}profile.html`) {
            window.location.replace(`${root_pathname}profile.html`)
        }
    });
})
//                      Test
// -------------------------------------------------- 
