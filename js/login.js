// ****************************************隐藏或显示密码*******************************************
const passwordInput = document.getElementById('password');
const toggle_button = document.querySelector('button[type="button"]');

toggle_button.addEventListener('click', function () {
    const eye_icon = this.querySelector("i")
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eye_icon.classList.remove('icon-visibility_off')
        eye_icon.classList.add('icon-remove_red_eye')
    } else {
        passwordInput.type = 'password';
        eye_icon.classList.remove('icon-remove_red_eye')
        eye_icon.classList.add('icon-visibility_off')
    }
})

// ****************************************账号提交*******************************************
const form = document.querySelector('form');
const usernameInput = document.querySelector('#username');
const tip = document.querySelector('.tip');

form.addEventListener('submit', async function (event) {
    event.preventDefault();

    let username = usernameInput.value;
    let password = passwordInput.value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'username': username,
                'password': password
            })
        });
        const result = await response.json();
        if (result.status === 1) {
            tip.textContent = result.error;
        } else if (result.status === 2) {
            tip.textContent = result.error;
        }
        else if (result.status === 0) {
            window.location.href = '/index';
        }
    } catch (error) {
        tip.textContent = '网络错误，请重试';
    }
});

// ****************************************图标的显示*******************************************
const us_icon = document.querySelector('.input-group .icon-account_circle')
const pd_icon = document.querySelector('.input-group .icon-vpn_key')

function checkInputContent(input) {
    return input.value.trim() !== '';
}

// 对用户名的绑定
usernameInput.addEventListener('focus', function () {
    us_icon.style.display = 'block'
})
usernameInput.addEventListener('blur', function () {
    if (!checkInputContent(this)) {
        us_icon.style.display = 'none'
    }
})

usernameInput.addEventListener('input', function () {
    if (checkInputContent(this)) {
        us_icon.style.display = 'block'
    }
})
// 对密码框的绑定
passwordInput.addEventListener('focus', function () {
    pd_icon.style.display = 'block'
})
passwordInput.addEventListener('blur', function () {
    if (!checkInputContent(this)) {
        pd_icon.style.display = 'none'
        toggle_button.style.display = 'none'
    }
})
passwordInput.addEventListener('input', function () {
    if (checkInputContent(this)) {
        pd_icon.style.display = 'block'
        toggle_button.style.display = 'block'
    }
    else {
        toggle_button.style.display = 'none'
    }
})