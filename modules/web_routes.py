import os
import sys
from threading import Thread

from flask import Flask, render_template, request, redirect, jsonify, session
from flask_mail import Mail, Message
from flask_script import Manager, Shell

from modules.schedule_access import *
from modules.security.crypting import get_link


tm = Flask(__name__, template_folder="../templates", static_folder="../../time_manager")
tm.config.from_object('config.Config')
mail = Mail(tm)
manager = Manager(tm)
users = {}


def user_req(url, img=None):
    def wrap(func):
        def wrapper():
            if session.get('login'):
                try:
                    if url == '/change_log':
                        old, new = request.get_json()
                        if users.get(old):
                            if users[old].token == session['token']:
                                users[new] = users.pop(old)
                                session['login'] = new
                                func(users[new], new)
                                return jsonify(True)
                        return jsonify('Wrong assignment')
                    elif users[session['login']].token == session['token']:
                        if img: data = request.files.get(img)
                        else: data = request.get_json()
                        if data:
                            temp = func(users[session['login']], data)
                        else: temp = func(users[session['login']])
                        if temp: return temp
                        else: return jsonify(True)
                    else: return jsonify('Wrong assignment')
                except KeyError: return redirect('/')
            else: return jsonify('Wrong assignment')
        tm.add_url_rule(url, func.__name__, wrapper, methods=['POST'])
    return wrap


# @tm.errorhandler(505)
# def handler_assignment(error):
#     return '<h1 style="text-align: center">Неверная подпись запроса</h1>'
#
#
# @tm.errorhandler(502)
# def handler_assignment(error):
#     return '<h1 style="text-align: center">Неверная подпись запроса</h1>'


col = {'red': '#ff6464', 'blue': '#6464ff', 'green': '#46aa46', 'purple': '#b450b4', 'sky': '#55c0bb', 'black': '#000', 'white': '#000'}


def shell_context(): return dict(app=tm, os=os, sys=sys)


def async_send_mail(a, m):
    with a.app_context():
        mail.send(m)


manager.add_command("shell", Shell(make_context=shell_context))


# Верифицрованные запросы
@user_req('/send_activation')
def req_send_activation(now):
    """Отправка сообщения для активации"""
    if now.activated: return jsonify('active')
    else:
        data = {
            'title': 'Подтверждение почты',
            'button': 'Активировать',
            'login': now.log,
            'link': "http://127.0.0.1:5000/activate/" + get_link(now.email),
            'color': col[now.color]
        }
        msg = Message(data['title'], recipients=[now.email])
        msg.html = render_template('mail.html', **data)
        thr = Thread(target=async_send_mail, args=[tm, msg])
        thr.start()
        return jsonify(now.email)


@user_req('/change_theme')
def req_change_theme(now, data):
    """Изменение темы"""
    now.change_theme(*data.split())


@user_req('/change_log')
def req_change_log(now, new):
    """Изменение имени пользователя"""
    now.change_log(new)
    return jsonify(True)


@user_req('/change_email')
def req_change_email(now, data):
    """Изменение имени пользователя"""
    try: os.rename(f'images/avatars/{now.email}.png', f'images/avatars/{data}.png')
    except FileNotFoundError: pass
    now.change_email(data)


@user_req('/change_pass')
def req_change_pass(now, data):
    """Изменение имени пользователя"""
    if not User.fast_check_psw(now.log, data):
        now.change_pass(data)
        session['token'] = now.token = gen_salt(50)
    now._restore = 0


@user_req('/change_avatar', 'img')
def req_change_avatar(now, file):
    """Изменение аватарки"""
    temp_path = f'images/avatars/{now.email}.png'
    open(temp_path, 'wb').write(file.read())


@user_req('/delete_avatar')
def req_delete_avatar(now):
    """Удаление аватарки"""
    try: os.unlink(f'images/avatars/{now.email}.png')
    except FileNotFoundError: pass
    try: os.mkdir('images/avatars/')
    except FileExistsError: pass


@user_req('/logout')
def req_logout(now):
    """Выход пользователя"""
    users.pop(now.log)
    session.pop('login')
    session.pop('token')
    session.pop('remember')


@user_req('/delete_user')
def req_delete_user(now):
    """Удаление учётной записи"""
    temp_path = f'images/avatars/{now.log}.png'
    if os.path.isfile(temp_path): os.remove(temp_path)
    now.del_user()
    users.pop(now.log)
    session.pop('login')
    session.pop('token')
    session.pop('remember')


@user_req('/add_day')
def req_add_day(now, data):
    """Добавление дневной задачи"""
    if not data['hour'].isdigit(): data['hour'] = '0'
    if not data['minute'].isdigit(): data['minute'] = '0'
    if now.add_day(**data): return jsonify(True)
    else: return jsonify('exist')


@user_req('/change_day')
def req_change_day(now, data):
    """Изменение дневной задачи"""
    if not data[1]['hour'].isdigit(): data[1]['hour'] = '0'
    if not data[1]['minute'].isdigit(): data[1]['minute'] = '0'
    if now.change_day(*data): return jsonify(True)
    else: return jsonify('exist')


@user_req('/del_day')
def req_del_day(now, data):
    """Удаление дневной задачи"""
    now.del_day(**data)


@user_req('/add_month')
def req_add_month(now, data):
    """Добавление дневной задачи"""
    if not data['digit'].isdigit(): data['month'] = '0'
    if not data['digit'].isdigit(): data['month'] = '0'
    if now.add_month(**data): return jsonify(True)
    else: return jsonify('exist')


@user_req('/change_month')
def req_change_month(now, data):
    """Изменение дневной задачи"""
    if not data[1]['digit'].isdigit(): data[1]['month'] = '0'
    if not data[1]['digit'].isdigit(): data[1]['month'] = '0'
    if now.change_month(*data): return jsonify(True)
    else: return jsonify('exist')


@user_req('/del_month')
def req_del_month(now, data):
    """Удаление дневной задачи"""
    now.del_month(**data)


@user_req('/add_list')
def req_add_list(now, data):
    """Добавление списка задачи"""
    if now.add_list(data): return jsonify(True)
    else: return jsonify('exist')


@user_req('/add_list_task')
def req_add_list_task(now, data):
    """Добавление списка задачи"""
    if now.add_list_task(**data): return jsonify(True)
    else: return jsonify('exist')


@user_req('/change_list')
def req_change_list(now, data):
    """Изменение дневной задачи"""
    if now.change_list(*data): return jsonify(True)
    else: return jsonify('exist')


@user_req('/change_list_task')
def req_change_list_task(now, data):
    """Изменение дневной задачи"""
    if now.change_list_task(*data): return jsonify(True)
    else: return jsonify('exist')


@user_req('/del_list')
def req_del_list(now, data):
    """Удаление дневной задачи"""
    now.del_list(data)


@user_req('/del_list_task')
def req_del_list_task(now, data):
    """Удаление дневной задачи"""
    now.del_list_task(**data)


# Запросы
@tm.route('/activate/<link>', methods=['GET'])
def req_activate(link):
    temp = User.activate(link)
    if temp:
        log = temp[0]
        now = users[log] = users.get(log, User(log))
        now.activated = 1
        session['login'] = log
        session['token'] = now.token
        session['remember'] = True
    return redirect('/')


@tm.route('/restore/<link>', methods=['GET'])
def req_restore(link):
    User.activate(link)
    temp = User.restore(link)
    if temp:
        log = temp[0]
        now = users[log] = users.get(log, User(log))
        session['login'] = log
        session['token'] = now.token
        session['remember'] = True
        now._restore = 1
    return redirect('/')


@tm.route('/check_restore', methods=['POST'])
def req_check_restore():
    """Проверка активации"""
    temp = User.find_link(request.get_json())
    if temp[3]: return req_send_restore(temp)
    else: return jsonify(False, temp[1])


@tm.route('/send_restore', methods=['POST'])
def req_send_restore(temp=None):
    """Отправка сообщения для активации"""
    if temp is None: temp = User.find_link(request.get_json())
    data = {
        'title': 'Восстановление пароля',
        'button': 'Изменить',
        'login': temp[0],
        'link': "http://127.0.0.1:5000/restore/" + get_link(temp[1]),
        'color': col[temp[2]]
    }
    msg = Message(data['title'], recipients=[temp[1]])
    msg.html = render_template('mail.html', **data)
    thr = Thread(target=async_send_mail, args=[tm, msg])
    thr.start()
    return jsonify(temp[1])


@tm.route('/login', methods=['POST'])
def req_login():
    session.permanent = True
    log, pswsalt, remember = request.get_json()
    if User.check_psw(log, pswsalt):
        now = users[log] = users.get(log, User(log))
        session['login'] = now.log
        session['token'] = now.token
        session['remember'] = remember
        return jsonify({
            "login": now.log,
            "email": now.email,
            "theme": now.theme,
            "color": now.color,
            "avatar": os.path.isfile(f'images/avatars/{now.email}.png'),
            "activated": now.activated,
            "day": render_template('day.html', table_day=now.ret_day()),
            "month": render_template('month.html', table_month=now.ret_month()),
            "lists": render_template('lists.html', lists=now.ret_lists())
        })
    else: return redirect('/')


@tm.route('/register', methods=['POST'])
def req_register():
    session.permanent = True
    temp = request.get_json()
    remember = temp.pop('remember')
    User.registration(**temp)
    users[temp['log']] = User(temp['log'])
    session['login'] = temp['log']
    session['token'] = users[temp['log']].token
    session['remember'] = remember
    return jsonify({
        "day": render_template('day.html'),
        "month": render_template('month.html'),
        "lists": render_template('lists.html')
    })


@tm.route('/get_key', methods=['POST'])
def req_get_key():
    """Отправка ключа"""
    return jsonify(open('modules/security/public_key.pem').read())


@tm.route('/check_user', methods=['POST'])
def req_check_user():
    """Проверка существования пользователя"""
    return jsonify(User.check_user(request.get_json()))


@tm.route('/check_password', methods=['POST'])
def req_fast_check_password():
    """Быстрая проверка пароля"""
    return jsonify(User.fast_check_psw(**request.get_json()))


# Главная страница
@tm.route('/')
def page_home():
    if session.get('remember') and session.get('login') and session.get('token') and users.get(session.get('login')):
        if session['token'] == users.get(session.get('login')).token:
            log = session['login']
            now = users[log]
            if now._restore:
                restore = 1
                now._restore = 0
            else: restore = 0
            if os.path.isfile(f'images/avatars/{now.email}.png'):
                avatar = f'style="background-image: url(time_manager/images/avatars/{now.email}.png)"'
            else: avatar = ''
            data = {
                'login':        log,
                'email':        now.email,
                'theme':        now.theme,
                'color':        now.color,
                'activated':    now.activated,
                'restore':      restore,
                'salt':         now.salt,
                'avatar':       avatar,
                'table_day':    now.ret_day(),
                'table_month':  now.ret_month(),
                'lists':        now.ret_lists()
            }
            return render_template("base_log.html", **data)
    if session.get('login'): session.pop('login')
    if session.get('token'): session.pop('token')
    if session.get('remember'): session.pop('remember')
    return render_template("base.html")
