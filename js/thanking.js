// ----- Set order number -----
const URLParam = new URLSearchParams(window.location.search);
const order_id = URLParam.get("orderId");

let oreder_data = document.querySelector(".order_inform .order_id")
oreder_data.textContent = order_id;

// ----- Clean cart data -----
localStorage.removeItem("cart_data");

// ----- Keep shopping -----
let keep_shopping_btn = document.getElementById("keep_shopping");
keep_shopping_btn.addEventListener("click",(e)=>{
    e.preventDefault();
    window.location.replace(`${root_pathname}`);
})