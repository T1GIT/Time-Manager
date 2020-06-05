from os import system as con

from modules.security import crypting
from modules.web_routes import *

crypting.create_keys()  # Обновление RSA ключей

if __name__ == "__main__":
    con('start http://127.0.0.1:5000/')
    tm.run(host='127.0.0.1', port=5000)
