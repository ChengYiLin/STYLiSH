const APP_ID = 12348;
const APP_KEY = "app_pa1pQcKoY22IlnSXq5m5WP5jFKzoRG58VEXpT7wU62ud7mMbDOGzCYIlzzLF";

let submitButton = document.querySelector(".submit_btn");

// Build the SDK
TPDirect.setupSDK(APP_ID, APP_KEY, 'sandbox');

// Build the input form
TPDirect.card.setup({
    fields: {
        number: {
            // css selector
            element: '#card-number',
            placeholder: '**** **** **** ****'
        },
        expirationDate: {
            // DOM object
            element: document.getElementById('card-expiration-date'),
            placeholder: 'MM / YY'
        },
        ccv: {
            element: '#card-ccv',
            placeholder: '後三碼'
        }
    },
    styles: {
        // Style all elements
        'input': {
            'color': 'gray',
            'font-size': '1.2rem'
        },
        // Styling ccv field
        'input.cvc': {
            // 'font-size': '16px'
        },
        // Styling expiration-date field
        'input.expiration-date': {
            // 'font-size': '16px'
        },
        // Styling card-number field
        'input.card-number': {
            // 'font-size': '16px'
        },
        // style focus state
        ':focus': {
            // 'color': 'black'
        },
        // style valid state
        '.valid': {
            'color': 'green'
        },
        // style invalid state
        '.invalid': {
            'color': 'red'
        },
        // Media queries
        // Note that these apply to the iframe, not the root window.
        '@media screen and (max-width: 400px)': {
            'input': {
                'color': 'blue',
                'font-size': '1rem'
            }
        }
    }
})

// Check the form When user input data
TPDirect.card.onUpdate(function (update) {
    // number 欄位是錯誤的
    if (update.status.number === 2) {
    }
    else if (update.status.number === 0) {
        if (update.cardType === 'visa') {
            let card_number = document.getElementById("card_logo");
            card_number.classList.add("visa")
        }
    }
})

submitButton.addEventListener("click", submitCartInform)

// ------ Main Function --------
function submitCartInform(e){
    e.preventDefault();
    
    const taypatStatus = TPDirect.card.getTappayFieldsStatus();
    
    if(!taypatStatus.canGetPrime){
        alert("你的信用卡資訊有誤 ！")
        return;
    }

    TPDirect.card.getPrime((result) => {
        // If can not get prime
        if (result.status !== 0) {
            alert('get prime error ' + result.msg);
            return;
        }

        // --- Get the Primel ---
        let sendAjaxData = prepareAjaxData(result);

        if(sendAjaxData===false){
            alert("您的輸入資料有缺失！");
            return;
        }

        // ---  Show Loading  ---
        showLoadingIcon();

        // --- Use Ajax ---
        sendPrime(sendAjaxData);
    })
}

// ------ Help Function --------
function showLoadingIcon(){
    let loading = createElementBetter("div", {"class":"loading"}, document.querySelector("body"));
    createElementBetter("img", {"src":"./images/loading.gif", "alt":"Loading"}, loading);
}

// Prepare data to API
function prepareAjaxData(result){
    let Recipient_Payment = document.querySelector(".Calculate");
    let cart_data = JSON.parse(localStorage.getItem("cart_data"));
    let get_check = document.querySelector('input[name="rec_time"]:checked');
    let ajaxProductList = [];
    let sendAjaxData ={};

    const subtotal = parseInt(Recipient_Payment.querySelector(".pd_total_money").innerText);
    const freight = parseInt(Recipient_Payment.querySelector(".pd_shipping_money").innerText);
    const total = parseInt(Recipient_Payment.querySelector(".whole_pay_money").innerText);
    const rec_name = document.getElementById("rec_name").value;
    const rec_phone = document.getElementById("rec_phone").value;
    const rec_email = document.getElementById("rec_email").value;
    const rec_addr = document.getElementById("rec_addr").value;
    const rec_time = (get_check===null)?(""):(get_check.value);
    
    // Check form
    if(rec_name==="" || rec_phone==="" || rec_email==="" || rec_addr==="" || rec_time===""){
        return false;
    }

    cart_data.forEach(element=>{
        let temp = {};
        temp.id = element.id.toString();
        temp.name = element.name;
        temp.price = parseInt(element.price.split("TWD.")[1]);
        temp.color = {"code":element.color.code, "name":element.color.name}
        temp.size = element.size;
        temp.qty = element.qty;

        ajaxProductList.push(temp);
    })

    sendAjaxData.prime = result.card.prime;
    sendAjaxData.order ={
        "shipping": "delivery",
        "payment": "credit_card",
        "subtotal": subtotal,
        "freight": freight,
        "total": total,
        "recipient": {
          "name": rec_name,
          "phone": rec_phone,
          "email": rec_email,
          "address": rec_addr,
          "time": rec_time,
        },
        "list" : ajaxProductList
    }

    return sendAjaxData;
}

// Send Prime
function sendPrime(data_to_send){
    let requestHeader = { "Content-Type": "application/json" };
    let memberProfile = JSON.parse(localStorage.getItem("member"));

    FB.getLoginStatus(function (response) {
        requestHeader = (response.status === 'connected')?(requestHeader.Authorization=`Bearer ${memberProfile.accessToken}`):requestHeader;
    })

    fetch("https://api.appworks-school.tw/api/1.0/order/checkout",{
        method : "POST",
        headers : requestHeader,
        body : JSON.stringify(data_to_send)
    })
        .then(response => response.json())
        .then(data => redirectThankPage(data))
        .catch(error => console.log(`Something Wraong : ${error}`))
}

// Redirect to Thankyou Page
function redirectThankPage(order_data){
    window.location.href = `${root_pathname}thanking.html?orderId=${order_data.data.number}`
}