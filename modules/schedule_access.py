import sqlite3
from werkzeug.security import check_password_hash, generate_password_hash, gen_salt
from modules.security.crypting import decrypt, set_sum, get_link, escepinator
from modules.dirs import db_path


class User(object):
    __conn = sqlite3.connect(f"{db_path}/database.db", check_same_thread=False)
    __cur = __conn.cursor()
    __exe = __cur.execute  # Создать одиночный запрос
    __scr = __cur.executescript  # Создать скрипт
    __com = __conn.commit  # Применить скрипт (коммит)
    __one = __cur.fetchone  # Получить строку данных
    __all = __cur.fetchall  # Получить все данные
    __exe("""
            CREATE TABLE IF NOT EXISTS users(
                login      VARCHAR(50), 
                email      VARCHAR(100), 
                password   VARCHAR(100), 
                theme      VARCHAR(10), 
                color      VARCHAR(10), 
                salt       VARCHAR(64),
                link       VARCHAR(64),
                hash_sum   VARCHAR(64),
                activated  BOOLEAN)
                """)
    authorisation = False

    def __init__(self, log_email):
        User.__exe("""SELECT login, email, theme, color, salt, link, hash_sum, activated FROM users
        WHERE login = ? OR email = ?""", (log_email, log_email,))
        self.log, self.email, self.theme, self.color, self.salt, self.link, self.hash_sum, self.activated = User.__one()
        self.token = gen_salt(50)
        self._restore = 0
        self._log = escepinator(self.log)

    # Возврат данных из БД #
    def ret_lists(self):
        User.__exe(f"SELECT * FROM 'list_{self._log}' GROUP BY name, number")
        lists = {}
        for name, task, number in User.__all():
            if name in lists:
                if task is not None:
                    lists[name].append(task)
            else:
                if task is not None:
                    lists[name] = [task]
                else:
                    lists[name] = []
        return lists

    def ret_day(self):
        User.__exe(f"SELECT * FROM 'day_{self._log}'")
        return list(sorted(User.__all(), key=lambda x: (x[0], x[1])))

    def ret_month(self):
        User.__exe(f"SELECT * FROM 'month_{self._log}'")
        return list(sorted(User.__all(), key=lambda x: (x[1], x[0])))

    # Изменение данных пользователя #
    def change_log(self, log):
        new_log = escepinator(log)
        User.__exe("UPDATE users SET login = ? WHERE login = ?", (log, self.log))
        User.__com()
        User.__scr(f"""
            ALTER TABLE 'month_{self._log}' RENAME TO 'month_{new_log}';
            ALTER TABLE 'day_{self._log}' RENAME TO 'day_{new_log}';
            ALTER TABLE 'list_{self._log}' RENAME TO 'list_{new_log}'
        """)
        self.log = log
        self._log = new_log

    def change_email(self, email):
        User.__exe("UPDATE users SET email = ?, link =?, activated = ? WHERE login = ?",
                   (email, get_link(email), False, self.log))
        User.__com()
        self.email, self.activated = email, 0

    def change_pass(self, pswsalt):
        psw, salt = decrypt(pswsalt)
        hash_sum = set_sum(psw)
        hashed_psw = generate_password_hash(psw + salt[:-1])
        User.__exe("UPDATE users SET password = ?, hash_sum = ? WHERE login = ?", (hashed_psw, hash_sum, self.log))
        User.__com()

    def change_theme(self, theme, color):
        self.theme, self.color = theme, color
        User.__exe("UPDATE users SET theme = ?, color = ? WHERE login = ?", (theme, color, self.log))
        User.__com()

    def del_user(self):
        User.__exe("DELETE FROM users WHERE login = ?", (self.log,))
        User.__com()
        User.__scr(f"""
            DROP TABLE IF EXISTS 'month_{self._log}';
            DROP TABLE IF EXISTS 'day_{self._log}';
            DROP TABLE IF EXISTS 'list_{self._log}'
        """)

    # Работа с данными #
    # Добавление #
    def add_list(self, name):
        User.__exe(f"SELECT name FROM 'list_{self._log}' WHERE name = ?", (name,))
        if User.__one() is not None:
            return False
        User.__exe(f"INSERT INTO 'list_{self.log}' (name, task, number) VALUES (?, ?, ?)", (name, None, None))
        User.__com()
        return True

    def add_list_task(self, name, task):
        number = 1
        User.__exe(f"SELECT name, task FROM 'list_{self._log}' WHERE name = ? AND task = ?", (name, task))
        if User.__one() is not None:
            return False
        User.__exe(f"SELECT number FROM 'list_{self._log}' WHERE name = ?", (name,))
        num_bd = User.__all()
        if num_bd != [(None,)] and num_bd:
            number = num_bd[-1][0] + 1
        User.__exe(f"INSERT INTO 'list_{self._log}' (name, task, number) VALUES (?, ?, ?)",
                   (name, task, number))
        User.__com()
        return True

    def add_day(self, hour, minute, task):
        User.__exe(f"SELECT * FROM 'day_{self._log}' WHERE hour = ? AND minute = ? AND task = ?", (hour, minute, task))
        if User.__one() is not None:
            return False
        User.__exe(f"INSERT INTO 'day_{self._log}' (hour, minute, task) VALUES (?, ?, ?)", (hour, minute, task))
        User.__com()
        return True

    def add_month(self, digit, month, task):
        User.__exe(f"SELECT * FROM 'month_{self._log}' WHERE digit = ? AND month = ? AND task = ?",
                   (digit, month, task))
        if User.__one() is not None:
            return False
        User.__exe(f"INSERT INTO 'month_{self._log}' (digit, month, task) VALUES (?, ?, ?)",
                   (digit, month, task))
        User.__com()
        return True

    # Изменение #
    def change_day(self, old, new):
        User.__exe(f"SELECT * FROM 'day_{self._log}' WHERE hour = ? AND minute = ? AND task = ?",
                   (new['hour'], new['minute'], new['task']))
        if User.__one() is not None:
            return False
        User.__exe(f"UPDATE 'day_{self._log}' SET hour = ?, minute = ?, task = ? WHERE hour = ? AND minute = ? AND task = ?",
                    (new['hour'], new['minute'], new['task'], old['hour'], old['minute'], old['task']))
        User.__com()
        return True

    def change_month(self, old, new):
        User.__exe(f"SELECT * FROM 'month_{self._log}' WHERE digit = ? AND month = ? AND task = ?",
                   (new['digit'], new['month'], new['task']))
        if User.__one() is not None:
            return False
        User.__exe(f"UPDATE 'month_{self._log}' SET digit = ?, month = ?, task = ? WHERE digit = ? AND month = ? AND task = ?",
                     (new['digit'], new['month'], new['task'], old['digit'], old['month'], old['task']))
        User.__com()
        return True

    def change_list(self, old, new):
        User.__exe(f"SELECT name FROM 'list_{self._log}' WHERE name = ?", (new,))
        if User.__one() is not None:
            return False
        User.__exe(f"UPDATE 'list_{self.log}' SET name = ? WHERE name = ?", (new, old))
        User.__com()
        return True

    def change_list_task(self, old, new):
        User.__exe(f"SELECT name, task FROM 'list_{self._log}' WHERE name = ? AND task = ?",
                   (new['name'], new['task']))
        if User.__one() is not None:
            return False
        User.__exe(f"UPDATE 'list_{self._log}' SET name = ?, task = ? WHERE name = ? AND task = ?",
                   (new['name'], new['task'], old['name'], old['task']))
        User.__com()
        return True

    def change_num(self, name, task, new_num):
        User.__exe(f"SELECT number FROM 'list_{self._log}' WHERE name = ? AND task = ?", (name, task))
        ans = User.__one()
        if ans is None:
            return False
        User.__exe(f"SELECT * FROM 'list_{self._log}'")
        lists = {}
        for name, task, number in User.__all():
            if name in lists:
                lists[name].append([task, number])
            else:
                lists[name] = [[task, number]]
        buf = lists[name].pop(lists[name].index([task, ans[0]]))
        buf[1] = new_num
        lists[name].insert(new_num - 1, buf)
        for i, value in enumerate(lists[name], 1):
            if lists[name][i - 1][0] is not None:
                lists[name][i - 1][1] = i - 1
        for el in lists[name]:
            if el[0] is not None:
                User.__exe(f"SELECT number FROM 'list_{self._log}' WHERE name = ? AND task = ?", (name, el[0]))
                if User.__one()[0] != el[1]:
                    User.__exe(f"UPDATE 'list_{self._log}' SET number = ? WHERE name = ? AND task = ?",
                               (el[1], name, el[0]))
        User.__com()
        return True

    # Удаление #
    def del_list_task(self, name, task):
        User.__exe(f"DELETE FROM 'list_{self._log}' WHERE name = ? AND task = ?", (name, task))
        User.__exe(f"SELECT * FROM 'list_{self._log}'")
        lists = {}
        for name, task, number in User.__all():
            if name in lists:
                lists[name].append([task, number])
            else:
                lists[name] = [[task, number]]
        for i, value in enumerate(lists[name], 1):
            if lists[name][i - 1][0] is not None:
                lists[name][i - 1][1] = i - 1
        for el in lists[name]:
            if el[0] is not None:
                User.__exe(f"SELECT number FROM 'list_{self._log}' WHERE name = ? AND task = ?", (name, el[0]))
                if User.__one()[0] != el[1]:
                    User.__exe(f"UPDATE 'list_{self._log}' SET number = ? WHERE name = ? AND task = ?",
                               (el[1], name, el[0]))
        User.__com()

    def del_list(self, name):
        User.__exe(f"DELETE FROM 'list_{self._log}' WHERE name = ?", (name,))
        User.__com()

    def del_day(self, hour, minute, task):
        User.__exe(f"DELETE FROM 'day_{self._log}' WHERE hour = ? AND minute = ? AND task = ?",
                   (hour, minute, task))
        User.__com()

    def del_month(self, digit, month, task):
        User.__exe(f"DELETE FROM 'month_{self._log}' WHERE digit = ? AND month = ? AND task = ?",
                   (digit, month, task))
        User.__com()

    @staticmethod
    def activate(link):
        """Выдача логина по ссылке и активация"""
        User.__exe("UPDATE users SET activated = ? WHERE link = ?", (True, link))
        User.__com()
        User.__exe("SELECT login FROM users WHERE link = ?", (link,))
        return User.__one()

    @staticmethod
    def restore(link):
        """Выдача логина и активации по ссылке"""
        User.__exe("SELECT login, activated FROM users WHERE link = ?", (link,))
        return User.__one()

    @staticmethod
    def find_link(log_email):
        """Выдача данных по логину пользователя"""
        User.__exe("SELECT login, email, color, activated FROM users WHERE login = ? OR email = ?",
                   (log_email, log_email))
        return User.__one()

    @staticmethod
    def check_user(log_email):
        """Проверка существования пользователя"""
        temp_cur = User.__conn.cursor()
        temp_cur.execute("SELECT (salt) FROM users WHERE login = ? OR email = ?", (log_email, log_email))
        return temp_cur.fetchone()

    @staticmethod
    def fast_check_psw(log_email, pswsalt):
        """Быстрая проверка пароля"""
        temp_cur = User.__conn.cursor()
        temp_cur.execute("SELECT hash_sum, login FROM users WHERE login = ? OR email = ?", (log_email, log_email))
        try:
            hash_sum, login = temp_cur.fetchone()
        except TypeError:
            return False
        return set_sum(decrypt(pswsalt)[0]) == hash_sum

    @staticmethod
    def check_psw(log_email, pswsalt):
        """Проверка правильности пароля"""
        User.__exe("SELECT (password) FROM users WHERE login = ? OR email = ?", (log_email, log_email))
        temp = User.__one()
        if len(temp) < 1:
            return False
        return check_password_hash(temp[0], ''.join(decrypt(pswsalt))[:-1])

    @staticmethod
    def registration(log, email, pswsalt, theme, color):
        """Регистрация"""
        _log = escepinator(log)
        psw, salt = decrypt(pswsalt)
        hashed_psw = generate_password_hash(psw + salt[:-1])
        User.__exe(
            """INSERT INTO users (login, email, password, theme, color, salt, link, hash_sum, activated)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (log, email, hashed_psw, theme, color, salt, get_link(email), set_sum(psw), False))
        User.__com()
        User.__scr(f"""
            CREATE TABLE IF NOT EXISTS 'month_{_log}' (digit INTEGER, month INTEGER, task TEXT);
            CREATE TABLE IF NOT EXISTS 'day_{_log}' (hour INTEGER, minute INTEGER, task TEXT);
            CREATE TABLE IF NOT EXISTS 'list_{_log}' (name TEXT, task TEXT, number INTEGER)
        """)

    @staticmethod
    def Perri_Utkonos():
        """Стирание всех пользователей"""
        User.__exe("SELECT login FROM users")
        import os
        for the_file in os.listdir('static/images/avatars'):
            file_path = os.path.join('static/images/avatars', the_file)
            if os.path.isfile(file_path):
                os.remove(file_path)
        log_list = User.__all()
        if len(log_list) > 0:
            for log in log_list:
                _log = escepinator(log[0])
                User.__scr(f"""DROP TABLE IF EXISTS 'list_{_log}';
                    DROP TABLE IF EXISTS 'month_{_log}';
                    DROP TABLE IF EXISTS 'day_{_log}'""")
        User.__exe("DELETE FROM users")
        User.__com()
        print('Очистка базы данных завершена успешно')


# User._erase()
# Создание таблицы-----------------------------------------------------------------------------------------
# __exe("""CREATE TABLE IF NOT EXISTS users
#                   (login VARCHAR(200), psw VARCHAR(200),
#                   email VARCHAR(200), theme VARCHAR(30), color VARCHAR(30), avatar BOOLEAN,
#                   salt VARCHAR(20), activated BOOLEAN)""")
# -----------------------------------------------------------------------------------------------------------
# Тесты (Артем и Дима(ахах, норм вписался)) print(inj_check('adsfghdffdsfgfdf')) User._erase()
# now_user = User("T1MON", 'T1MON@yandex.ru', 'kdfjdkffj')
# now_user2 = User("T1MON", 'asdfss') now_user1 = User("TKACH", 'sfdsd') print(
# now_user.log) now_user.change_log('ATTILENE') print(now_user.log) print(now_user.day) print(now_user.month) print(
# now_user.lists)
# now_user = User("Attilene")
# now_user.change_log("Attilene'f'")
# print(now_user.log)
# print(now_user.log)
# print(now_user.email)
# now_user.change_email('qwerty@mail.ru')
# print(now_user.email)
# print(now_user.change_avatar(False))
# print(now_user.fast_check_psw('Attilene', '726b9c5fc5baf0a6d0fc92659715757b599a77b87202fb81ce23ad7662543ace'))
# now_user.add_month(23, 1, 'dfjfkdjf')
# now_user.add_month(24, 3, 'dfjfkdjf')
# now_user.add_month(25, 9, 'dfjfkdjf')
# data = {'name': 'sa fcf', 'task': 'gg'}
# now_user.add_list('sa fcf')
# now_user.add_list('1')
# now_user.add_list('2')
# now_user.add_list_task('1', 'dfjfkdjfdsfdgf')
# now_user.add_list_task('2', 'dfjf')
# now_user.add_list_task('1', 'dfjfkdjfdsfdgfasdfgdhfgjhjrsdv')
# now_user.add_list_task('sa fcf', 'gg')
# now_user.add_list_task('1', 'werty')
# print(now_user.change_list('1', '2'))
# print(now_user.change_list_task({'name': '1', 'task': 'werty'}, {'name': '1', 'task': 'debil'}))
# print(now_user.change_num('1', 'werty', 2))
# print(now_user.ret_lists())
# now_user.del_list_task(**data)
# now_user.del_list_task('1', 'dfjfkdjfdsfdgfasdfgdhfgjhjrsdv')
# now_user.add_day(22, 33, 'jdfkjf')
# now_user.add_day(24, 33, 'jdfkjf')
# now_user.add_day(23, 33, 'jdfkjf')
# now_user.del_day(23, 33, 'jdfkjf')
# print(now_user.change_day({'hour': 22, 'minute': 33, 'task': 'jdfkjf'}, {'minute': 34}))
# print(now_user.theme)
# theme = ('light', 'green')
# now_user.change_theme(theme)
# print(*now_user.theme)
#
# User._erase()
