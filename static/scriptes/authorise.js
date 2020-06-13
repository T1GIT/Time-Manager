jQuery(document).ready(function () {
    window.in_login = $('#form_login');
    window.in_email = $('#form_email');
    window.in_pass = $('#form_password');
    window.in_repass = $('#form_repass');
    window.labels = $('#user label')
});

function warning(field, text='', type='empty') {
    if (typeof field === "string") {field = $(field)}
    let label = field.prev();
    if (label.hasClass('empty') || label.text() !== text) {
        if (label.hasClass('empty')) {
            label.stop().text(text).css({
                    width: (30 + (text.length * 9)) + 'px'
                });
            label.removeClass('warning achive weak empty').addClass(type);
        }
        else {
            label.removeClass('warning achive weak empty').addClass(type);
            fade_change(label, function () {
                label.stop().text(text).animate({
                        width: (30 + (text.length * 9)) + 'px'
                }, 100)
            })
        }
    }
}

function validate(field) {
    if (typeof field === "string") {field = $(field)}
    let str = field.val();
    let cor_str = '';
    let chrs = ['#', ';', '(', ')', '{', '}', '\\', '/', '|', '[', ']', '\'', '\"', '%', '$'];
    for (let i = 0; i < str.length; i++) {if (!chrs.includes(str[i])) {cor_str += str[i]}}
    if (cor_str.length === 0) {field.removeClass('fill')}
    field.val(cor_str)
}

function check_empty() {
    if (in_login.val() === '' && in_email.val() === '') {
        change_auth('empty');
        return true
    }
    else return false
}

function check_cor_pass() {
    let pass = in_pass.val();
    if (pass === '') {warning(in_pass); toggle_repass('off')}
    else if (pass.length > 99) { warning(in_pass, 'Длина пароля должна быть не больше 99 символов', 'warning')}
    else if (pass.length < 8) { warning(in_pass, 'Длина пароля должна быть не меньше 8 символов', 'warning')}
    else if (!RegExp('[0-9]+').test(pass)) { warning(in_pass, 'Пароль должен содержать цифры', 'warning')}
    else if (!RegExp('[a-zA-Zа-яА-Я]+').test(pass)) { warning(in_pass, 'Пароль должен содержать буквы', 'warning')}
    else {
        let test = !RegExp('[a-zа-я0-9]+').test(in_pass.val());
        let len = in_pass.val().length;
        if (len < 11 && !test) {warning(in_pass, 'Ненадежный пароль', 'achive'); in_pass.prev('label').addClass('weak')}
        else if (len < 16 || len < 11 && test) {warning(in_pass, 'Надежный пароль', 'achive')}
        else if (len < 20 || len < 16 && test) {warning(in_pass, 'Очень надежный пароль', 'achive')}
        toggle_repass('on');
        check_repass();
        return true
    }
    toggle_repass('off');
    return false
}

function toggle_repass(toggle) {
    if (toggle === 'on') {in_repass.removeAttr('disabled')}
    else {
        if (in_repass.attr('disabled') !== 'disabled') {
            warning(in_repass);
            in_repass.removeClass('fill');
            setTimeout(function () {
                fade_change(in_repass, function () {
                    in_repass.attr('disabled', 'disabled').val('')
                })
            }, close_time(in_repass));
        }
    }
}

function try_log() {
    if (salt !== '') {
        if (in_pass.val() !== '') {
            let pswsalt = pack_psw(in_pass.val(), salt);
            receive('/check_password', function (data) {
                if (data) {
                    warning(in_pass, 'Выполняется вход', 'achive');
                    authorisation(in_login.val(), pswsalt);
                } else if ($('#form_password').val() !== '') {
                    warning(in_pass, 'Неверный пароль', 'warning');
                }
            }, {'log_email': in_login.val(), 'pswsalt': pswsalt})
        }
    }
    else {
        if (in_pass.val() === '') {warning(in_pass)}
        else {warning(in_pass, 'Проверка', 'achive')}
        setTimeout(try_log, 500)
    }
}

function try_reg() {
    if (!labels.hasClass('warning') && !labels.hasClass('empty')) {
        registration()
    }
}

function change_auth(mode) {
    let temp_menu = $('#authorisation_menu');
    if (temp_menu.hasClass(mode)) {return}
    else {$('#form_password, #form_repass').attr('type', 'password')}
    if (temp_menu.hasClass('login')) {temp_menu.addClass(mode).removeClass('login')}
    else if (temp_menu.hasClass('register')) {temp_menu.addClass(mode).removeClass('register')}
    else if (temp_menu.hasClass('empty')) {
        temp_menu.addClass(mode).removeClass('empty').css({'pointer-events': 'none'});
        setTimeout(function () {temp_menu.css({'pointer-events': ''})}, close_time(temp_menu))
    }

    $('#remember_me').prop('checked', false);
    switch (mode) {
        case 'empty':
            in_pass.val('').removeClass('fill').attr('disabled', 'disabled');
            in_repass.val('').removeClass('fill').attr('disabled', 'disabled');
            break;
        case 'login':
            in_pass.removeAttr('disabled');
            try_log();
            break;
        case 'register':
            in_pass.removeAttr('disabled');
            check_cor_pass();
            break;
    }
}

function registration() {
    salt = gen_salt();
    user_data.login = in_login.val();
    user_data.email = in_email.val();
    let temp_psw = pack_psw(in_pass.val(), salt);
    send('/register', {
        'log':     user_data.login,
        'email':   user_data.email,
        'pswsalt': temp_psw,
        'theme':   user_data.theme,
        'color':   user_data.color,
        'remember': $('#checkbox_remember_me').is(':checked')
    }, function (data) {
        // Загрузка страниц
        $('#confirm_email').addClass('nonactive');
        $('#page_day').html(data.day);
        $('#page_month').html(data.month);
        $('#page_lists').html(data.lists);
        $('#page_help').addClass('help_login');
        // Закрытие меню
        setTimeout(function () {
                $('#menu_edit_email').addClass('opened').css({display: 'block'});
            }, 100);
        // Установка имени пользователя
        $('header .right a div.nickname').text(user_data.login);
        $('#set_login').val(user_data.login);
        // Появление кнопок
        $('#authorisation').css({display: 'block'});
        $('header .center, header .right').fadeIn(0);
        $('header').removeClass('logout');
        // Сбор мусора
        setTimeout(function () {
            $('#authorisation, header .center, header .right').removeAttr('style')
        }, close_time('#authorisation'));
        sessionStorage.new_user = true;
        user_data.activated = 0;
        make_advices();
        user_logined = true;
        clear_fields();
    });
}

function authorisation(login, password) {
    // Вход пользователя
    receive('/login', function (data) {
        // Загрузка страниц
        $('#page_day').html(data.day);
        $('#page_month').html(data.month);
        $('#page_lists').html(data.lists);
        $('#page_help').addClass('help_login');
        // Установка высоты textarea
        $('header .center').one('mousedown', function sizing() {
            $('main.opened div.body form textarea').each(function (index, element) {autosize(element)});
        });
        // Синхронизация данных
        change_theme(data.theme, data.color);
        user_data = {
            'login': data.login,
            'email': data.email,
            'theme': data.theme,
            'color': data.color,
            'activated': data.activated
        };
        // Установка имени пользователя
        $('header .right a div.nickname').text(data.login);
        $('#set_login').val(data.login);
        // Загрузка аватара
        if (data.avatar) {
            $('#avatar').removeClass('none');
            $('#avatar_inside').css({'background-image': `url(static/images/avatars/${data.email}.png)`});
            $('header .right picture').css({'background-image': `url(static/images/avatars/${data.email}.png)`})
        }
        // Появление кнопок
        $('#authorisation').css({display: 'block'});
        $('header .center, header .right').fadeIn(0);
        $('header').removeClass('logout');
        if (!data.activated) {
                $('#confirm_email').addClass('nonactive');
                $('#menu_edit_email').addClass('opened').css({display: 'block'});
            }
        // Сбор мусора
        setTimeout(function () {
            $('#authorisation, header .center, header .right').removeAttr('style')
        }, close_time('#authorisation'));
        remove_advices();
        user_logined = true;
        clear_fields();
    }, [login, password, $('#checkbox_remember_me').is(':checked')]);
}


// Кнопки в инпутах
function click_erase(field) {
    fade_change(field, function () {
        field.val('').removeClass('fill').css({pointerEvents: 'none'});
        setTimeout(function () { field.css({pointerEvents: ''}) }, close_time(field));
        warning(field);
        if ($('#user').has(field)) check_empty()
    });
}

function click_show_repsw(field) {
    let passes = $('#form_password, #form_repass');
    if (field.hasClass('show_psw')) {
        field.removeClass('show_psw');
        field.off('mouseleave');
        fade_change(passes, function () {
            passes.attr('type', 'password')
        })
    }
    else {
        field.addClass('show_psw');
        field.one('mouseleave', function () {click_show_repsw(field)});
        fade_change(passes, function () {
            if (field.hasClass('show_psw')) {passes.attr('type', 'text')}
        });
    }
}

// Поля ввода
 function input_login() {
    if (in_login.val().length <= 33) {
        receive('/check_user', function (data) {
            if (data) {
                warning(in_login, 'Пользователь существует', 'achive');
                change_auth('login');
                in_email.val('');
                in_email.removeClass('fill');
                salt = data[0];
                in_pass.focus();
            } else {
                change_auth('register');
                warning(in_login, 'Никнейм свободен', 'achive');
                try_reg()
            }
        }, in_login.val())
    }
    else {warning(in_login, 'Длина никнейма не может превышать 33 символа', 'warning')}
}

function input_email() {
    validate(in_email);
    let temp = in_email.val();
    if (/[a-zA-Z0-9]+@([a-zA-Z]{2,10}[.]){1,3}(com|by|ru|cc|net|ws)$/.test(temp) && temp.length < 100) {
        warning(in_email, 'Корректный формат почты', 'achive');
        receive('/check_user', function (data) {
            if (data) {
                in_pass.focus();
                warning(in_login, 'Пользователь существует', 'achive');
                in_login.addClass('change');
                in_email.val('').removeClass('fill');
                setTimeout(function () {
                    in_login.val(temp).removeClass('change')
                }, 200);
                change_auth('login');
                salt = data[0];
            } else {
                try_reg()
            }
        }, temp)
    } else if (temp) {
        warning(in_email, 'Некорректный формат почты', 'warning');
    } else {
        warning(in_email)
    }
}

function input_pass() {
    let menu = $('#authorisation_menu');
    if (menu.hasClass('login')) try_log();
    else if (menu.hasClass('register')) check_cor_pass();
}

function empty_pass() {
    toggle_repass('off');
}

function check_repass() {
    if (in_pass.val() === in_repass.val()) {
        warning(in_repass, 'Пароли совпадают', 'achive');
        try_reg()
    }
    else if (in_repass.val() === '') {warning(in_repass)}
    else {warning(in_repass, 'Пароли не совпадают', 'warning')}
}