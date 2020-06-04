// Вычисление задержки
function close_time(selector) {
    if (typeof selector === "string") {selector = $(selector)}
    try {
        return (parseFloat(selector.css("transition-duration").slice(0, -1)) * 1000)
    }
    catch (e) {
        return 200
    }
}

// Форма при нажатии Enter
function submit_warn(form) {
    let warn_inputs = form.children('label.warning, label.empty').next('input');
    warn_inputs.addClass('warning');
    setTimeout(function () {
        warn_inputs.removeClass('warning');
    }, 300);
    return false
}

// Анимированная смена
function fade_change(field, func) {
    if (typeof field === "string") {field = $(field)}
    field.addClass('change');
    setTimeout(function () {
        func();
        field.removeClass('change');
    }, close_time(field))
}

// Смена тем
function change_theme(theme, color) {
    if ((theme !== user_data.theme) || (color !== user_data.color)) {
        let temp_theme = user_data.theme;
        let temp_color = user_data.color;
        let temp_obj = $('svg, body, header, header *, footer, footer *, aside, aside menu, ' +
            'div.theme, input, #developers *, .time *, textarea, main *' +
            '.clock_load, .man_card');
        temp_obj.addClass('change_theme');
        setTimeout(function () {
            temp_obj.removeClass('change_theme');
        }, close_time('.change_theme'));
        if (theme !== user_data.theme) {
            $('#theme_choice').attr('href', `time_manager/styles/themes/${theme}.css`);
            $('#help_body').css({'background-image': `url(${background[theme].src})`})
        }
        if (color !== user_data.color) {
            $('#color_choice').attr('href', `time_manager/styles/colors/${color}.css`);
            $('#favicon_choice').attr('href', `time_manager/images/favicons/${color}.svg`);
        }
        $(`aside menu .theme button[data-theme="${temp_theme}"][data-color="${temp_color}"]`).removeClass('choice');
        $(`aside menu .theme button[data-theme="${theme}"][data-color="${color}`).addClass('choice');
        if (user_data.login !== undefined) {send('/change_theme', `${theme} ${color}`)}
        user_data.theme = theme;
        user_data.color = color;
    }
}

// Смена страницы
function change_page(page) {
    let temp = sessionStorage.page;
    if (page !== temp) {
        $(`#page_${temp}`).addClass('closed');
        $(`#page_${page}`).fadeIn(0, function () {
            $(this).addClass('opened')
        });
        // Сбор мусора
        setTimeout(function () {
            $(`#page_${temp}`).removeAttr('style').removeClass('opened closed');
            $(`#page_${page}`).fadeIn(0, function () {
                $(this).addClass('opened')
            });
        }, close_time('main.closed'));
        sessionStorage.page = page;
    }
}

// Вход тестового пользователя
function guest_auth() {
    // Появление кнопок
    $('#authorisation').css({display: 'block'});
    $('header .center, header .right').fadeIn(0);
    $('header').removeClass('logout');
    // Установка имени
    $('header .right a div.nickname').text('Guest');
    $('#set_login').val('Guest');
    // Вставка страниц
    $('#page_day')[0].innerHTML = '<div class="body">\n' +
        '<button id="add_day_task" onmousedown="click_add_day($(this))">\n' +
        '        <svg>\n' +
        '            <use xlink:href="time_manager/images/sprites.svg#sprite_btn_add"></use>\n' +
        '        </svg>\n' +
        '    </button>\n' +
        '    <a class="alert"\n' +
        '       onmouseenter="if ($(this).prev().hasClass(\'new\')) {blur_input_day($(this).siblings(\'.item.new\'))}"\n' +
        '    >Введите данные</a>\n' +
        '</div>';
    $('#page_month')[0].innerHTML = '<div class="body">\n' +
        '    <button id="add_month_task" onmousedown="click_add_month($(this))">\n' +
        '        <svg>\n' +
        '            <use xlink:href="time_manager/images/sprites.svg#sprite_btn_add"></use>\n' +
        '        </svg>\n' +
        '    </button>\n' +
        '    <a class="alert"\n' +
        '       onmouseenter="if ($(this).prev().hasClass(\'new\')) {blur_input_month($(this).siblings(\'.item.new\'))}"\n' +
        '    >Введите данные</a>\n' +
        '</div>';
    $('#page_lists')[0].innerHTML = '<div class="body lists">\n' +
        '    <button id="add_list" onmousedown="click_add_list($(this))">\n' +
        '        <svg>\n' +
        '            <use xlink:href="time_manager/images/sprites.svg#sprite_btn_add"></use>\n' +
        '        </svg>\n' +
        '    </button>\n' +
        '    <a class="alert"\n' +
        '       onmouseenter="if ($(this).prev().hasClass(\'new\')) {blur_list_name($(this).siblings(\'.back_back.new\').find(\'.title\'))}"\n' +
        '    >Напишите имя списка</a>\n' +
        '</div>';
    $('#page_help').addClass('help_login');
    // Сбор мусора
    setTimeout(function () {
        $('#authorisation, header .center, header .right').removeAttr('style')
    }, close_time('#authorisation'));
    user_logined = true;
    clear_fields()
}

function make_advices() {
    $('footer span.right').attr('title', 'Здесь мы можете больше узнать о создателях сайта');
    $('header .left').attr('title', 'Здесь вы можете посмотреть инструкцию');
    $('#button_lists').attr('title', 'Здесь мы можете добавить именованные списки дел');
    $('#button_day').attr('title', 'Здесь мы можете создать список дел на сегодня');
    $('#button_month').attr('title', 'Здесь мы можете записать сроки выполнения долговременных задач');
    $('#button_profile').attr('title', 'Здесь мы можете изменить настройки своего профиля');
    $('#set_login').attr('title', 'Здесь мы можете изменить никнейм');
    $('#change_avatar').attr('title', 'Нажмите, чтобы изменить аватар');
    $('#remove_avatar').attr('title', 'Нажмите, чтобы удалить аватар');
    $('#btn_change_email').attr('title', 'Здесь мы можете изменить привязанный почтовый адресс');
    $('#btn_change_pass').attr('title', 'Здесь мы можете изменить пароль');
    $('#btn_delete_profile').attr('title', 'Здесь мы можете удалить ваш аккаунт');
    $('#btn_exit').attr('title', 'Нажмите, чтобы выйти из аккаунта');
    $('#set_email').attr('title', 'Для изменения почтового адреса просто наберите здесь новый');
    $('#set_psw').attr('title', 'Для изменения пароля просто наберите здесь новый');
    $('#settings').attr('title', 'Нажмите на кружок для того, чтобы изменить тему');
    $('#add_day_task, #add_month_task').attr('title', 'Нажмите, чтобы создать задачу');
    $('#add_list').attr('title', 'Нажмите, чтобы создать список');
    $('#page_day .alert').attr('title', 'Чтобы создать новую задачу, введите время и задачу для прошлой');
    $('#page_month .alert').attr('title', 'Чтобы создать новую задачу, введите дату и задачу для прошлой');
    $('#page_lists .alert').attr('title', 'Чтобы создать новый список, введите название для прошлого');
}

function remove_advices() {
    $('footer span.right').removeAttr('title');
    $('header .left').removeAttr('title');
    $('#button_lists').removeAttr('title');
    $('#button_day').removeAttr('title');
    $('#button_month').removeAttr('title');
    $('#button_profile').removeAttr('title');
    $('#set_login').removeAttr('title');
    $('#change_avatar').removeAttr('title');
    $('#remove_avatar').removeAttr('title');
    $('#btn_change_email').removeAttr('title');
    $('#btn_change_pass').removeAttr('title');
    $('#btn_delete_profile').removeAttr('title');
    $('#btn_exit').removeAttr('title');
    $('#set_email').removeAttr('title');
    $('#set_psw').removeAttr('title');
    $('#settings').removeAttr('title');
    $('#add_day_task, #add_month_task').removeAttr('title');
    $('#add_list').removeAttr('title');
    $('#page_day .alert').removeAttr('title');
    $('#page_month .alert').removeAttr('title');
    $('#page_lists .alert').removeAttr('title');
}
