function get_day_data(form) {
    let a = {
        "hour": form.children('.time').children('.hour').val(),
        "minute": form.children('.time').children('.minute').val(),
        "task": form.children('.task').val()
    };
    if (!form.hasClass('new')) {
        if (form.children('.task').val() === '') {
            a.task = form.data('old').task
        }
    }
    return a
}

function save_day(form) {form.data('old', get_day_data(form))}

function del_day_task(form) {
    if (user_data.login !== undefined) {
        if (!form.hasClass('new')) {
            if (form.find(':focus').length === 0) {
                receive('/del_day', null, get_day_data(form))
            } else {
                receive('/del_day', null, form.data('old'))
            }
        }
    }
    form.addClass('del');
    form.prev().prev('button').removeClass('new');
    setTimeout(function () {
        form.slideUp(200, function () {
            $(this).remove()
        })
    }, close_time(form))
}

function click_add_day(btn) {
    let obj = $('<form class="item day new" style="margin: 0; height: 0; opacity: 0; pointer-events: none">\n' +
        '            <span class="time"\n' +
        '                  onmouseenter="save_day($(this).parent())"\n' +
        '                  onmouseleave="blur_input_day($(this).parent())"\n' +
        '            >\n' +
        '            <input class="hour" type="text" max="23" min="0" placeholder="?" \n' +
        '                   onfocus="$(this).parent().addClass(\'input\'); save_day($(this).parent())"\n' +
        '                   onblur="$(this).parent().removeClass(\'input\');\n' +
        '                       if ($(this).val() === \'\' && !$(this).closest(\'.item\').hasClass(\'new\')) $(this).val(\'00\');\n' +
        '                       blur_input_day($(this).closest(\'.item\'))"\n' +
        '                   onkeydown="key_func(event)"\n' +
        '                   oninput="input_time($(this))"\n' +
        '            >\n' +
        '            <span>:</span>\n' +
        '            <input class="minute" type="text" max="59" min="0" placeholder="?"\n' +
        '                   onfocus="$(this).parent().addClass(\'input\'); save_day($(this).parent())"\n' +
        '                   onblur="$(this).parent().removeClass(\'input\');\n' +
        '                       if ($(this).val() === \'\' && !$(this).closest(\'.item\').hasClass(\'new\')) $(this).val(\'00\');\n' +
        '                       blur_input_day($(this).closest(\'.item\'))"\n' +
        '                   onkeydown="key_func(event)"\n' +
        '                   oninput="input_time($(this))"\n' +
        '            >\n' +
        '            </span>\n' +
        '            <textarea class="task" placeholder="Задача" rows=1\n' +
        '                      oninput="autosize(this)"\n' +
        '                      onfocus="save_day($(this).parent())"\n' +
        '                      onblur="blur_input_day($(this).closest(\'.item\'))"\n' +
        '                      onkeydown="key_func(event)"\n' +
        '            ></textarea>\n' +
        '            <button type="button" class="del_day" onmousedown="del_day_task($(this).parent())">\n' +
        '                <svg id="email_btn_del_task">\n' +
        '                    <use xlink:href="static/images/sprites.svg#sprite_btn_del_task"></use>\n' +
        '                </svg>\n' +
        '            </button>\n' +
        '        </form>');
    btn.addClass('new').next().after(obj);
    obj.animate({height: '40px', margin: '3vh 0 0', opacity: 1}, 200, 'swing', function () {
        $(this).removeAttr('style').children('.task').focus();
    });
}

function blur_input_day(form) {
    if (user_data.login === undefined) {
        if (form.find('.hour').val() !== '' &&
        form.find('.minute').val() !== '' &&
        form.find('.task').val() !== '') {
            form.removeClass('new');
            form.find('input').removeAttr('placeholder');
            form.prev().prev('button').removeClass('new');
        }
    }
    else {
        let old = form.data('old');
        let new_day_data = get_day_data(form);
        form.data('old', new_day_data);
        if (form.hasClass('new')) {
            if (new_day_data.hour !== '' && new_day_data.minute !== '' && new_day_data.task !== '') {
                receive('/add_day', function (data) {
                    if (data === 'exist') {
                        del_day_task(form);
                    } else {
                        form.removeClass('new');
                        form.prev().prev('button').removeClass('new');
                        form.find('input').removeAttr('placeholder')
                    }
                }, new_day_data)
            }
        } else if (
            new_day_data.hour !== old.hour ||
            new_day_data.minute !== old.minute ||
            new_day_data.task !== old.task) {
            receive('/change_day', function (data) {
                if (data === 'exist') {
                    del_day_task(form);
                }
            }, [old, new_day_data]);
        }
    }
}

function key_func(event) {
    let key = event.keyCode;
    if (key === 13 && event.target.tagName === 'INPUT') {
        event.preventDefault();
        event.stopPropagation();
        $(event.target).blur();
    }
    // else if (key === 8 && event.target.selectionStart === 0 && event.target.selectionEnd === 0) {event.preventDefault(); to_prev($(event.target))}
    else if ((key === 38 && event.target.selectionStart === 0) ||
        (key === 40 && event.target.selectionStart === $(event.target).val().length) ||
        (key === 37 && !(event.target.tagName === 'TEXTAREA' && event.target.selectionStart > 0)) ||
        (key === 39 && !(event.target.tagName === 'TEXTAREA'))
        ) {
        event.preventDefault();
        let input = $(event.target);
        let int = parseInt(input.val());
        if (key === 37) to_prev(input);
        else if (key === 39) to_next(input);
        else if (input[0].tagName === 'INPUT') {
            if (key === 38) {
                if (int < event.target.max) {set_val(input, int + 1)}
                else {input.val(event.target.min)}
                if (isNaN(int)) {set_val(input, event.target.min)}
            }
            else if (key === 40) {
                if (int > event.target.min) {set_val(input, int - 1)}
                else {input.val(event.target.max)}
                if (isNaN(int)) {set_val(input, event.target.max)}
            }
        }
        else if (input[0].tagName === 'TEXTAREA') {
            let form = input.closest('.item');
            if (key === 38 && form.prev('.item').length > 0) {
                form.prev().children('textarea')[0].focus()
            } else if (key === 40 && form.next('.item').length > 0) {
                form.next().children('textarea')[0].focus()
            }
        }
    }
}

function to_next(input) {
    if (input.next().next('input').length > 0 || input.prev().prev('input').length > 0) {
        let next_el;
        if (input.next().next('input').length > 0) {
            next_el = input.next().next()[0];
            next_el.selectionStart = -1
        }
        else {next_el = input.parent().next()[0]}
        next_el.focus();
    }
}

function to_prev(input) {
    if (input.prev().length > 0) {
        let prev_el;
        if (input.prev().hasClass('time')) {prev_el = input.prev().children('input')[1]}
        else {prev_el = input.prev().prev()[0]}
        prev_el.focus();
        prev_el.selectionStart = -1
    }
}

function input_time(input) {
    let val = input.val();
    let new_val = 0;
    if (val === '') {input.val(0)}
    else if (/^[0-9]+$/.test(val)) {new_val = val}
    else if (/^[0-9].[0-9]$/.test(val)) {new_val = val[0] + val[2]}
    else if (/^[0-9]+$/.test(val.slice(0, 2))) {new_val = val.slice(0, 2)}
    else if (/^[0-9]+$/.test(val.slice(1))) {new_val = val.slice(1)}
    else if (/^[0-9]+$/.test(val[0])) {new_val = val[0]}
    if (set_val(input, new_val)) to_next(input)
}

function set_val(input, val) {
    let int = parseInt(val);
    let max = input[0].max;
    let min = input[0].min;
    let new_val = int;
    if (isNaN(int)) {new_val = 0}
    else if (int > max) {new_val = parseInt(val[input[0].selectionStart - 1])}
    else if (int < min) {new_val = min}
    if (new_val < 10) {new_val = '0' + new_val}
    input.val(new_val);
    if (Math.floor(max / 10) < new_val) return true
}

function autosize(el) {
    let temp = $(el);
    temp.height(0).height(el.scrollHeight - 10);

}