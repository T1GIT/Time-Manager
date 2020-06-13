// Показ и скрытие меню
function toggle_aside(menu) {
    if (menu.hasClass('opened')) {
        $('body').off('mousedown');
        menu.addClass('closed');
        // Сбор мусора
        setTimeout(function () {
            menu.removeClass('opened closed').css({display: ''})
        }, close_time(menu));
        toggle_set_menu($('#menu.opened'))
    } else {
        menu.fadeIn(0, function () {
            menu.addClass('opened');
            if (menu.attr('id') === 'authorisation_menu') {
                setTimeout(function () {$('#form_login').focus()}, 1)
            }
        });
        $('body').off('mousedown');
        hide_click(menu);
    }
}

// Сворачивание при клике в другой зоне
function hide_click (menu) {
    $('body').one('mousedown', function hide_menu(event){
        if (menu.hasClass('opened')) {
            let temp_al = $('#alert_back');
            if ($('header .right').has(event.target).length === 0 &&
                !$('#button_authorisation').is(event.target) &&
                menu.has(event.target).length === 0 &&
                temp_al.has(event.target).length === 0 &&
                !menu.is(event.target) &&
                !temp_al.is(event.target)
            ) {
                toggle_aside(menu)
            } else hide_click(menu)
        }
        else {$('body').off('mousedown')}
    });
}

function toggle_set_menu(set_menu) {
    if (typeof set_menu === "string") {set_menu = $(set_menu)}
    let time = close_time($('#profile_menu menu'));
    if (set_menu.hasClass('opened')) {
        set_menu.removeClass('opened').stop().slideUp(time, function () {
            set_menu.removeAttr('style')
        });
        let temp = set_menu.find('input');
        fade_change(temp, function () {temp.removeClass('fill').val('')});
    }
    else {
        let temp = $('#profile_menu menu.opened');
        if (temp.length > 0) {
            temp.stop().slideUp(200, function () {
                temp.removeAttr('style').find('input').removeClass('fill').val('');
                set_menu.stop().slideDown(time, function () {
                    set_menu.removeAttr('style').css({display: 'block'});
                });
                set_menu.addClass('opened')
            }).removeClass('opened');
        }
        else {
            set_menu.stop().slideDown(time, function () {
                set_menu.removeAttr('style').css({display: 'block'})}).addClass('opened')
        }
        setTimeout(function () {
            if (set_menu.children('.nonactive').length === 0) {
                set_menu.find('input').focus()
            }
        }, close_time(set_menu));
    }
}

function clear_fields() {
    let inputs = $('#user input, #set_psw, #set_email');
    inputs.prev('label').removeClass('show');
    warning(inputs);
    $('#authorisation span, header .right').click();
    inputs.removeClass('fill').val('');
    change_auth('empty');
    toggle_aside($('aside.opened'));
}

function act_field(field, func, empty_func=null) {
    if (field.val() !== '') {
        if ($('#alert_back').length === 0) {
            field.addClass('fill');
            func(field)
        }
        else {field.val('')}
    }
    else {
        field.removeClass('fill');
        warning(field);
        if (empty_func !== null) {empty_func()}
        if ($('#user').has(field)) check_empty()
    }
}

function logout() {
    // Закрытие меню
    let menu = $('#profile_menu');
    if (menu.hasClass('opened')) {
        menu.addClass('closed');
        // Сбор мусора
        setTimeout(function () {
            menu.removeClass('opened closed').css({display: ''})
        }, close_time(menu))
    }
    let set_menu = $('aside menu.opened');
    set_menu.stop().slideUp(200, function () {
        set_menu.removeAttr('style')
    });
    // Сброс данных
    user_data = {'theme': user_data.theme, 'color': user_data.color};
    set_menu.removeClass('opened');
    // Очистка страниц
    $('#page_lists')[0].innerHTML = '';
    $('#page_day')[0].innerHTML = '';
    $('#page_month')[0].innerHTML = '';
    $('#page_help').removeClass('help_login');
    // Восстанавление темы
    change_theme('light', 'blue');
    // Восстанавление страницы
    change_page('help');
    // Сброс аватара
    $('#avatar_inside').css({background: ''});
    $('header .right picture').css({background: ''});
    // Исчезновение кнопок
    $('header .center, header .right').css({display: 'block'});
    $('#authorisation').fadeIn(0);
    $('header').addClass('logout');
    // Сбор мусора
    $('#confirm_email').removeClass('nonactive');
    setTimeout(function () {
        $('#authorisation, header .center, header .right').removeAttr('style')
    }, close_time('#authorisation'));
    if (sessionStorage.new_user) {
        sessionStorage.new_user = false;
        remove_advices()
    }
    user_logined = false;
    clear_fields()
}

// Изменение никнейма
function input_set_login(in_set_log) {
    let temp = in_set_log.val();
    $('div.nickname').text(temp);
    in_set_log.data('new', temp);
    if (temp === '') {warning(in_set_log, 'Введите никнейм')}
    else if (temp === user_data.login) {warning(in_set_log, 'Ваш никнейм', 'achive')}
    else if (temp.length <= 33) {
        if (user_data.login !== undefined) {
            receive('/check_user', function (data) {
                if (data) {warning(in_set_log, 'Никнейм занят', 'warning')}
                else {warning(in_set_log, 'Никнейм свободен', 'achive')}
            })
        }
        else {warning(in_set_log, 'Никнейм свободен', 'achive')}
    }
    else {warning(in_set_log, 'Длина никнейма не может превышать 33 символа', 'warning')}
}

function onblur_set_login(field) {
    let temp = field.data('new');
    if (!field.prev().hasClass('warning') &&
        !field.prev().hasClass('empty') &&
        !user_data.login !== temp &&
        user_data.login !== undefined &&
        temp
    )
    {
        send('/change_log', [user_data.login, temp]);
        user_data.login = temp
    }
    else {
        $('div.nickname').text(user_data.login);
    }
    warning(field);
}

// Добавление/смена аватара
function drop(area, event) {
    onchange_get_file(event.dataTransfer.files[0]);
    $(area).removeClass('drop');
}

function onchange_get_file(file) {
    if (file) {
        let size = ((file.size) / 1024 / 1024).toFixed(1);
        if (size > 50) {al_warn(`Объем данного файла (${size} МБ) превышает допустимый объём в 50 МБ`)}
        else if (file.type.slice(0, 5) !== 'image') {al_warn(`Файл ${file.name} не является изображением`)}
        else {
            reduceFileSize(file, 110, function (blob) {
                let img = new FormData();
                img.set('img', blob, `${user_data.email}.png`);
                if (user_data.login !== undefined) {send_image(img)}
                $('#avatar_inside').css({'background-image': `url(${URL.createObjectURL(blob)})`});
                $('header .right picture').css({'background-image': `url(${URL.createObjectURL(blob)})`});
                $('#avatar').removeClass('none');
                $('#get_file').val('');
            });
        }
    }
}

// Удаление аватара
function click_remove_avatar() {
    $('#avatar').addClass('none');
    $('#avatar_inside').css({'background-image': ''});
    $('header .right picture').css({'background-image': ''});
    if (user_data.login !== undefined) {receive('/delete_avatar')}
}

// Кнопки
function click_active() {
    receive('/send_activation', function(data) {
        if (data === 'active') {
            $('#confirm_email').removeClass('nonactive');
            toggle_set_menu($('#menu_edit_email'))
        }
        else {al_sent('На почту ' + data + ' выслано письмо для активации')}
    })
}

function click_restore() {
    receive('/check_restore', function(data) {
        if (data[0]) {
            receive('/send_restore', function (email) {
                    al_sent('На почту ' + email + ' выслано письмо для изменения пароля');
                }, $('#form_login').val())
        }
        else {
            al_ask('Почта ' + data[1] + ' не подтверждена.\n' +
                'Запросить восстановление пароля?', 'Отправить', function () {
                receive('/send_restore', function (data) {
                    al_sent('На почту ' + data + ' выслано письмо для изменения пароля');
                }, $('#form_login').val())
            });
        }
    }, $('#form_login').val());
}

function click_show_psw(field) {
    if (field.hasClass('show_psw')) {
        field.removeClass('show_psw');
        field.off('mouseleave');
        fade_change(field, function () {
            field.attr('type', 'password')
        })
    }
    else {
        field.addClass('show_psw');
        field.one('mouseleave', function () {
            click_show_psw(field)
        });
        fade_change(field, function () {
            if (field.hasClass('show_psw')) field.attr('type', 'text')
        });
    }
}

// Смена почты
function input_set_email(in_set_email) {
    validate(in_set_email);
    let temp = in_set_email.val();
    if (/[a-zA-Z0-9-]+@([a-zA-Z]{2,10}[.]){1,3}(com|by|ru|cc|net|ws})$/.test(temp) && temp.length < 100) {
        receive('/check_user', function (data) {
            if (user_data.email === temp) {
                if ($('#confirm_email').hasClass('nonactive')) {
                    warning(in_set_email, 'Почта не подтверждена', 'warning');
                }
                else {
                    warning(in_set_email, 'Почта подтверждена', 'achive');
                }
            }
            else if (data) {
                warning(in_set_email, 'Почта занята', 'warning');
            }
            else {
                in_set_email.data('new', temp);
                warning(in_set_email, 'Почта свободна', 'achive');
            }
        }, temp)
    } else if (temp) {
        warning(in_set_email, 'Некорректный формат почты', 'warning');
    } else {
        warning(in_set_email)
    }
}

function onblur_set_email(field) {
    let temp = field.data('new');
    field.data('new', undefined);
    if (!field.prev().hasClass('warning') &&
        !field.prev().hasClass('empty') &&
        user_data.login !== undefined &&
        temp !== user_data.email &&
        temp)
    {
        receive('/change_email', null, temp);
        warning(field, 'Почта изменена', 'achive');
        $('#menu_edit_email, #confirm_email').addClass('nonactive');
        user_data.email = temp
    }
}

// Смена пароля
function input_set_psw(in_set_psw) {
    let temp = in_set_psw.val();
    if (temp === '') {warning(in_set_psw); toggle_repass('off')}
    else if (temp.length > 99) { warning(in_set_psw, 'Длина пароля должна быть не больше 99 символов', 'warning')}
    else if (temp.length < 8) { warning(in_set_psw, 'Длина пароля должна быть не меньше 8 символов', 'warning')}
    else if (!RegExp('[0-9]+').test(temp)) { warning(in_set_psw, 'Пароль должен содержать цифры', 'warning')}
    else if (!RegExp('[a-zA-Zа-яА-Я]+').test(temp)) { warning(in_set_psw, 'Пароль должен содержать буквы', 'warning')}
    else {
        in_set_psw.data('new', temp);
        let test = !RegExp('[a-zа-я0-9]+').test(temp);
        let len = temp.length;
        if (len < 11 && !test) {warning(in_set_psw, 'Ненадежный пароль', 'achive'); in_set_psw.prev('label').addClass('weak')}
        else if (len < 16 || len < 11 && test) {warning(in_set_psw, 'Надежный пароль', 'achive')}
        else if (len < 20 || len < 16 && test) {warning(in_set_psw, 'Очень надежный пароль', 'achive')}
    }
}

function onblur_set_psw(field) {
    let temp = field.data('new');
    field.data('new', undefined);
    if (!field.prev().hasClass('warning') &&
        !field.prev().hasClass('empty') &&
        user_data.login !== undefined &&
        temp)
    {
        receive('/check_user', function (data) {
            if (data) {
                receive('/change_pass', function () {
                    warning(field, 'Пароль изменен', 'achive')
                }, pack_psw(temp, salt))
            }
        }, user_data.login);
    }
    warning(field);
}
